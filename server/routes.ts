import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { db } from './db.ts';
import {
  hashPassword,
  verifyPassword,
  createSession,
  getSession,
  revokeSession,
  revokeAllUserSessions,
  checkRateLimit,
  checkAccountLockout,
  recordFailedLogin,
  clearAccountLockout,
  validatePasswordStrength,
  createPasswordResetToken,
  resetPasswordWithToken,
  verifyEmailWithToken,
  inspectRequestThreat,
  createCsrfToken,
  verifyCsrfToken,
} from './auth.ts';
import { sendPasswordResetEmail, sendEmailVerificationEmail } from './email.ts';
import { hasPermission, getRoleDefinition } from '../src/utils/rbac.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.resolve(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function defaultAvatarSvg(name: string = 'User'): string {
  const initial = (name.trim().charAt(0) || 'U').toUpperCase();
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect width="100%" height="100%" fill="%230284c7"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="%23ffffff" font-family="sans-serif" font-size="52" font-weight="700">${encodeURIComponent(initial)}</text></svg>`;
}

function hasDangerousSvgContent(svg: string): boolean {
  const normalized = svg.toLowerCase();
  const dangerousPatterns = [
    /<script[\s>]/i,
    /<\/script>/i,
    /javascript:/i,
    /data:\s*text\/html/i,
    /<foreignobject[\s>]/i,
    /<iframe[\s>]/i,
    /<object[\s>]/i,
    /<embed[\s>]/i,
    /\bon\w+\s*=/i,
    /<set[\s>]/i,
    /<animate[\s>]/i,
    /xlink:href\s*=\s*['"]\s*javascript:/i,
  ];
  return dangerousPatterns.some((pattern) => pattern.test(normalized));
}

function getSecureCookieHeader(sessionToken: string, maxAgeDays = 30): string {
  const isProd = process.env.NODE_ENV === 'production';
  const secureFlag = isProd ? '; Secure' : '';
  const maxAge = maxAgeDays > 0 ? maxAgeDays * 86400 : 0;
  return `pulse_session=${encodeURIComponent(sessionToken)}; Path=/; HttpOnly; SameSite=Lax${secureFlag}; Max-Age=${maxAge}`;
}

// Helper to parse JSON request body
async function parseJsonBody(req: IncomingMessage, maxBytes = 10 * 1024 * 1024): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > maxBytes) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Invalid JSON format'));
      }
    });
    req.on('error', reject);
  });
}

// Helper to send JSON responses
function sendJson(res: ServerResponse, status: number, data: any, headers?: Record<string, string>) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Cache-Control': 'no-store, max-age=0',
    ...(headers || {}),
  });
  res.end(JSON.stringify(data));
}

// Helper to extract session token from header or cookie
function getSessionToken(req: IncomingMessage): string | null {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }

  const cookieHeader = req.headers['cookie'];
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').map((c) => c.trim());
    const sessionCookie = cookies.find((c) => c.startsWith('pulse_session='));
    if (sessionCookie) {
      return decodeURIComponent(sessionCookie.split('=')[1]);
    }
  }

  return null;
}

// Helper to get authenticated user from request
function getAuthUser(req: IncomingMessage): { user: any; session: any } | null {
  const token = getSessionToken(req);
  if (!token) return null;

  const session = getSession(token);
  if (!session) return null;

  const user = db.prepare(`
    SELECT id, username, display_name as displayName, email, role, status,
           verification_tier as verificationTier, trust_score as trustScore,
           avatar_url as avatarUrl, bio, location, followers_count as followersCount,
           reports_count as reportsCount, created_at as createdAt
    FROM users
    WHERE id = ? AND status = 'active'
  `).get(session.userId) as any;

  if (!user) {
    revokeSession(token);
    return null;
  }

  return { user, session };
}

// Helper to record an administrative audit log in SQLite
function logAudit(
  adminId: string,
  actionType: string,
  description: string,
  targetResourceId?: string,
  resourceType?: string,
  ipAddress?: string
) {
  const stmt = db.prepare(`
    INSERT INTO audit_logs (id, admin_id, action_type, target_resource_id, resource_type, description, timestamp, ip_address, outcome)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'SUCCESS')
  `);
  stmt.run(
    `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    adminId,
    actionType,
    targetResourceId || null,
    resourceType || null,
    description,
    new Date().toISOString(),
    ipAddress || '127.0.0.1'
  );
}

/**
 * Handle API & SEO requests
 */
export async function handleApiRequest(
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;
  const method = req.method?.toUpperCase() || 'GET';
  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.socket?.remoteAddress || '127.0.0.1';

  // 1. DYNAMIC SEO: robots.txt
  if (pathname === '/robots.txt' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`User-agent: *
Disallow: /admin
Disallow: /dashboard
Disallow: /api/
Allow: /
Allow: /article/
Allow: /profile/

Sitemap: http://${req.headers.host || 'localhost'}/sitemap.xml
`);
    return true;
  }

  // 2. DYNAMIC SEO: sitemap.xml
  if (pathname === '/sitemap.xml' && method === 'GET') {
    const posts = db.prepare(`SELECT id, updated_at FROM posts WHERE status = 'published' ORDER BY updated_at DESC LIMIT 500`).all() as any[];
    const host = req.headers.host || 'localhost:5173';
    const proto = host.includes('localhost') ? 'http' : 'https';

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    xml += `  <url><loc>${proto}://${host}/</loc><changefreq>always</changefreq><priority>1.0</priority></url>\n`;
    xml += `  <url><loc>${proto}://${host}/explore</loc><changefreq>hourly</changefreq><priority>0.8</priority></url>\n`;
    xml += `  <url><loc>${proto}://${host}/privacy</loc><changefreq>monthly</changefreq><priority>0.4</priority></url>\n`;

    for (const p of posts) {
      xml += `  <url><loc>${proto}://${host}/article/${p.id}</loc><lastmod>${p.updated_at.split('T')[0]}</lastmod><priority>0.9</priority></url>\n`;
    }
    xml += `</urlset>`;

    res.writeHead(200, { 'Content-Type': 'application/xml; charset=utf-8' });
    res.end(xml);
    return true;
  }

  // 3. DYNAMIC RSS: rss.xml
  if (pathname === '/rss.xml' && method === 'GET') {
    const posts = db.prepare(`
      SELECT p.id, p.headline, p.body_text, p.created_at, u.display_name, u.username
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE p.status = 'published'
      ORDER BY p.created_at DESC
      LIMIT 30
    `).all() as any[];
    const host = req.headers.host || 'localhost:5173';
    const proto = host.includes('localhost') ? 'http' : 'https';

    let rss = `<?xml version="1.0" encoding="UTF-8" ?>\n<rss version="2.0">\n<channel>\n`;
    rss += `  <title>PULSE News Network Wire</title>\n`;
    rss += `  <link>${proto}://${host}/</link>\n`;
    rss += `  <description>Real-Time Global Dispatches and Eyewitness Journalism</description>\n`;
    rss += `  <language>en</language>\n`;

    for (const p of posts) {
      rss += `  <item>\n`;
      rss += `    <title><![CDATA[${p.headline}]]></title>\n`;
      rss += `    <link>${proto}://${host}/article/${p.id}</link>\n`;
      rss += `    <description><![CDATA[${p.body_text.slice(0, 300)}...]]></description>\n`;
      rss += `    <author>${p.username}@pulsenews.global (${p.display_name})</author>\n`;
      rss += `    <pubDate>${new Date(p.created_at).toUTCString()}</pubDate>\n`;
      rss += `  </item>\n`;
    }
    rss += `</channel>\n</rss>`;

    res.writeHead(200, { 'Content-Type': 'application/rss+xml; charset=utf-8' });
    res.end(rss);
    return true;
  }

  // 4. STATIC UPLOADS SERVING (with path traversal defense)
  if (pathname.startsWith('/uploads/') && method === 'GET') {
    const filename = path.basename(pathname);
    const filePath = path.join(UPLOADS_DIR, filename);

    if (fs.existsSync(filePath)) {
      const ext = path.extname(filename).toLowerCase();
      const mimeMap: Record<string, string> = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.webp': 'image/webp',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.mp4': 'video/mp4',
      };
      const contentType = mimeMap[ext] || 'application/octet-stream';
      res.writeHead(200, {
        'Content-Type': contentType,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'public, max-age=31536000, immutable',
      });
      fs.createReadStream(filePath).pipe(res);
      return true;
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('File Not Found');
      return true;
    }
  }

  // Only route /api paths from here
  if (!pathname.startsWith('/api')) {
    return false;
  }

  // Layer 7 Web Application Firewall (WAF) & IDS Threat Inspection
  const threatCheck = inspectRequestThreat(req.url || '');
  if (threatCheck.isThreat) {
    db.prepare(`
      INSERT INTO security_events (id, event_type, severity, ip_address, details, created_at)
      VALUES (?, ?, 'CRITICAL', ?, ?, ?)
    `).run(
      `sec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      threatCheck.threatType || 'WAF_BLOCK',
      clientIp,
      threatCheck.details || 'Blocked malicious request pattern',
      new Date().toISOString()
    );
    sendJson(res, 403, { error: 'Request blocked by PULSE Web Application Firewall (WAF).' });
    return true;
  }

  // Global API Rate Limiter: 180 requests / minute per IP
  const globalLimit = checkRateLimit(`ip:${clientIp}`, 180, 60000);
  if (!globalLimit.allowed) {
    sendJson(res, 429, {
      error: 'Rate limit exceeded. Please wait before making more requests.',
      retryAfterSeconds: globalLimit.retryAfterSeconds,
    });
    return true;
  }

  // 0. CSRF TOKEN DISCOVERY ENDPOINT
  if (pathname === '/api/csrf-token' && method === 'GET') {
    const sessionToken = getSessionToken(req) || '';
    const csrfToken = createCsrfToken(sessionToken);
    sendJson(res, 200, { csrfToken });
    return true;
  }

  // 0.1 STATE-CHANGING CSRF & ORIGIN SECURITY ENFORCEMENT
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const publicCsrfExemptions = [
      '/api/auth/login',
      '/api/auth/register',
      '/api/bootstrap',
      '/api/auth/forgot-password',
      '/api/auth/reset-password',
      '/api/auth/verify-email',
      '/api/consent',
      '/api/newsletter/subscribe',
    ];

    if (!publicCsrfExemptions.includes(pathname)) {
      const sessionToken = getSessionToken(req) || '';
      const csrfHeader = (req.headers['x-csrf-token'] as string) || '';

      if (sessionToken && !verifyCsrfToken(csrfHeader, sessionToken)) {
        sendJson(res, 403, {
          error: 'Invalid or missing CSRF token (X-CSRF-Token). Request rejected.',
        });
        return true;
      }
    }
  }

  /* =========================================================================
     1. ONE-TIME FIRST-ADMINISTRATOR BOOTSTRAP PROTOCOL
  ========================================================================= */

  // POST /api/bootstrap (Atomic Concurrency-Safe One-Time Super Admin Initialization)
  if (pathname === '/api/bootstrap' && method === 'POST') {
    db.exec('BEGIN IMMEDIATE');
    try {
      const existingAdmins = db.prepare(`
        SELECT count(*) as count FROM users WHERE role IN ('admin', 'super_admin') AND status = 'active'
      `).get() as { count: number | bigint };

      if (Number(existingAdmins?.count || 0) > 0) {
        db.exec('ROLLBACK');
        sendJson(res, 403, {
          error: 'System has already been bootstrapped. Super Administrator already exists. Bootstrap endpoint is permanently locked down.',
        });
        return true;
      }

      const body = await parseJsonBody(req);
      const displayName = String(body.displayName || '').trim();
      const rawUsername = String(body.username || '').trim().toLowerCase().replace(/^@/, '');
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');
      const bootstrapSecret = String(body.bootstrapSecret || '');

      // If an environment BOOTSTRAP_SECRET is configured, enforce matching
      const envSecret = process.env.BOOTSTRAP_SECRET;
      if (envSecret && bootstrapSecret !== envSecret) {
        db.exec('ROLLBACK');
        sendJson(res, 401, { error: 'Invalid bootstrap secret.' });
        return true;
      }

      if (!displayName || !rawUsername || !email || !password) {
        db.exec('ROLLBACK');
        sendJson(res, 400, { error: 'Display name, username, email, and password are required to bootstrap.' });
        return true;
      }

      const passCheck = validatePasswordStrength(password);
      if (!passCheck.valid) {
        db.exec('ROLLBACK');
        sendJson(res, 400, { error: passCheck.reason });
        return true;
      }

      const adminId = `admin-bootstrap-${Date.now()}`;
      const pHash = hashPassword(password);
      const now = new Date().toISOString();
      const avatar = body.avatarUrl || defaultAvatarSvg(displayName);

      db.prepare(`
        INSERT INTO users (
          id, username, display_name, email, password_hash, avatar_url, bio,
          location, role, status, verification_tier, trust_score, followers_count,
          reports_count, email_verified, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'super_admin', 'active', 'journalist', 1.0, 0, 0, 1, ?, ?)
      `).run(
        adminId,
        rawUsername,
        displayName,
        email,
        pHash,
        avatar,
        'System Super Administrator • Initialized via PULSE Secure Bootstrap Protocol',
        body.location || 'Headquarters Desk',
        now,
        now
      );

      db.exec('COMMIT');

      logAudit(
        adminId,
        'SYSTEM_BOOTSTRAP',
        `Super Administrator @${rawUsername} initialized successfully. Bootstrap permanently closed.`,
        adminId,
        'USER',
        clientIp
      );

      const sessionToken = createSession(
        adminId,
        clientIp,
        req.headers['user-agent'] || 'Bootstrap Client',
        30 * 24 * 3600 * 1000
      );

      const csrfToken = createCsrfToken(sessionToken);

      const safeUser = {
        id: adminId,
        username: rawUsername,
        displayName,
        email,
        avatarUrl: avatar,
        bio: 'System Super Administrator • Initialized via PULSE Secure Bootstrap Protocol',
        location: body.location || 'Headquarters Desk',
        role: 'super_admin',
        status: 'active',
        verificationTier: 'journalist',
        trustScore: 1.0,
        followersCount: 0,
        reportsCount: 0,
        createdAt: now,
      };

      const cookieHeader = getSecureCookieHeader(sessionToken, 30);
      sendJson(
        res,
        201,
        {
          success: true,
          message: 'Super Administrator initialized successfully.',
          user: safeUser,
          token: sessionToken,
          csrfToken,
        },
        { 'Set-Cookie': cookieHeader }
      );
      return true;
    } catch (err: any) {
      try { db.exec('ROLLBACK'); } catch {}
      sendJson(res, 500, { error: 'Bootstrap transaction failure: ' + err.message });
      return true;
    }
  }

  /* =========================================================================
     AUTH ENDPOINTS
  ========================================================================= */

  // POST /api/auth/login
  if (pathname === '/api/auth/login' && method === 'POST') {
    const body = await parseJsonBody(req);
    const identifier = String(body.identifier || body.email || body.username || '').trim().toLowerCase();
    const password = String(body.password || '');

    if (!identifier || !password) {
      sendJson(res, 400, { error: 'Username/Email and password are required.' });
      return true;
    }

    // Account Lockout check
    const lockout = checkAccountLockout(identifier);
    if (lockout.locked) {
      sendJson(res, 423, {
        error: `Account is temporarily locked due to repeated failed login attempts. Please retry in ${lockout.retryAfterSeconds} seconds.`,
        retryAfterSeconds: lockout.retryAfterSeconds,
      });
      return true;
    }

    // Lookup user by email or clean username
    const cleanHandle = identifier.replace(/^@/, '');
    const userRow = db.prepare(`
      SELECT id, username, display_name as displayName, email, password_hash as passwordHash,
             role, status, verification_tier as verificationTier, trust_score as trustScore,
             avatar_url as avatarUrl, bio, location, followers_count as followersCount,
             reports_count as reportsCount, created_at as createdAt
      FROM users
      WHERE (LOWER(email) = ? OR LOWER(username) = ?)
    `).get(identifier, cleanHandle) as any;

    if (!userRow || userRow.status !== 'active') {
      const lockRes = recordFailedLogin(identifier);
      sendJson(res, 401, {
        error: 'Invalid credentials or account inactive.',
        locked: lockRes.locked,
        retryAfterSeconds: lockRes.retryAfterSeconds,
      });
      return true;
    }

    // Verify Password Cryptographically
    const isValid = verifyPassword(password, userRow.passwordHash);
    if (!isValid) {
      const lockRes = recordFailedLogin(identifier);
      sendJson(res, 401, {
        error: 'Invalid credentials or account inactive.',
        locked: lockRes.locked,
        retryAfterSeconds: lockRes.retryAfterSeconds,
      });
      return true;
    }

    // Clear failed attempts on successful verification
    clearAccountLockout(identifier);

    // Create persistent session (30-day default)
    const sessionToken = createSession(
      userRow.id,
      clientIp,
      req.headers['user-agent'] || 'Unknown Browser',
      30 * 24 * 3600 * 1000
    );

    const roleData = getRoleDefinition(userRow.role);

    // Return sanitized user object & set secure cookie
    const safeUser = { ...userRow };
    delete safeUser.passwordHash;

    const cookieHeader = getSecureCookieHeader(sessionToken, 30);
    const csrfToken = createCsrfToken(sessionToken);

    sendJson(res, 200, {
      user: safeUser,
      token: sessionToken,
      csrfToken,
      role: roleData,
      permissions: roleData?.permissions || [],
    }, { 'Set-Cookie': cookieHeader });
    return true;
  }

  // POST /api/auth/register
  if (pathname === '/api/auth/register' && method === 'POST') {
    const body = await parseJsonBody(req);
    const displayName = String(body.displayName || '').trim();
    const rawUsername = String(body.username || '').trim().toLowerCase().replace(/^@/, '').replace(/\s+/g, '_');
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const requestedRole = body.role === 'journalist' ? 'journalist' : 'reader'; // Public users cannot register as admin

    if (!displayName || !rawUsername || !email || !password) {
      sendJson(res, 400, { error: 'All fields are required.' });
      return true;
    }

    // Strict Password Policy Enforcement: 8+ chars, figure, special character
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
    if (!passwordRegex.test(password)) {
      sendJson(res, 400, {
        error: 'Password must be at least 8 characters long and contain at least one letter, one number, and one special character.',
      });
      return true;
    }

    // Check unique username & email
    const existing = db.prepare('SELECT id FROM users WHERE LOWER(username) = ? OR LOWER(email) = ?').get(rawUsername, email);
    if (existing) {
      sendJson(res, 409, { error: 'An account with that username or email address already exists.' });
      return true;
    }

    const userId = `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const passwordHash = hashPassword(password);
    const now = new Date().toISOString();
    const avatar = body.avatarUrl || defaultAvatarSvg(displayName);

    db.prepare(`
      INSERT INTO users (
        id, username, display_name, email, password_hash, avatar_url, bio,
        location, role, status, verification_tier, trust_score, followers_count,
        reports_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, 0.85, 0, 0, ?, ?)
    `).run(
      userId,
      rawUsername,
      displayName,
      email,
      passwordHash,
      avatar,
      body.bio || `${displayName} • Contributor at Pulse News Network`,
      body.location || 'Global Desk',
      requestedRole,
      requestedRole === 'journalist' ? 'journalist' : 'standard',
      now,
      now
    );

    // Create session
    const sessionToken = createSession(
      userId,
      clientIp,
      req.headers['user-agent'] || 'Unknown Browser',
      30 * 24 * 3600 * 1000
    );

    const safeUser = {
      id: userId,
      username: rawUsername,
      displayName,
      email,
      avatarUrl: avatar,
      bio: body.bio || `${displayName} • Contributor at Pulse News Network`,
      location: body.location || 'Global Desk',
      role: requestedRole,
      status: 'active',
      verificationTier: requestedRole === 'journalist' ? 'journalist' : 'standard',
      trustScore: 0.85,
      followersCount: 0,
      reportsCount: 0,
      createdAt: now,
    };

    const roleData = getRoleDefinition(requestedRole);
    const cookieHeader = getSecureCookieHeader(sessionToken, 30);
    const csrfToken = createCsrfToken(sessionToken);

    sendJson(res, 201, {
      user: safeUser,
      token: sessionToken,
      csrfToken,
      role: roleData,
      permissions: roleData?.permissions || [],
    }, { 'Set-Cookie': cookieHeader });
    return true;
  }

  // GET /api/auth/me
  if (pathname === '/api/auth/me' && method === 'GET') {
    const auth = getAuthUser(req);
    if (!auth) {
      sendJson(res, 401, { error: 'Not authenticated or session expired.' });
      return true;
    }

    const roleData = getRoleDefinition(auth.user.role);
    const csrfToken = createCsrfToken(auth.session.token);
    sendJson(res, 200, {
      user: auth.user,
      role: roleData,
      permissions: roleData?.permissions || [],
      csrfToken,
    });
    return true;
  }

  // POST /api/auth/logout
  if (pathname === '/api/auth/logout' && method === 'POST') {
    const token = getSessionToken(req);
    if (token) {
      revokeSession(token);
    }
    const clearCookie = getSecureCookieHeader('', 0);
    sendJson(res, 200, { success: true, message: 'Logged out successfully.' }, { 'Set-Cookie': clearCookie });
    return true;
  }

  // POST /api/auth/logout-all
  if (pathname === '/api/auth/logout-all' && method === 'POST') {
    const auth = getAuthUser(req);
    if (!auth) {
      sendJson(res, 401, { error: 'Not authenticated.' });
      return true;
    }
    revokeAllUserSessions(auth.user.id);
    const clearCookie = 'pulse_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0';
    sendJson(res, 200, { success: true, message: 'All active sessions revoked.' }, { 'Set-Cookie': clearCookie });
    return true;
  }

  // POST /api/auth/change-password
  if (pathname === '/api/auth/change-password' && method === 'POST') {
    const auth = getAuthUser(req);
    if (!auth) {
      sendJson(res, 401, { error: 'Not authenticated.' });
      return true;
    }

    const body = await parseJsonBody(req);
    const currentPassword = String(body.currentPassword || '');
    const newPassword = String(body.newPassword || '');

    const userRow = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(auth.user.id) as any;
    if (!userRow || !verifyPassword(currentPassword, userRow.password_hash)) {
      sendJson(res, 403, { error: 'Current password verification failed.' });
      return true;
    }

    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      sendJson(res, 400, {
        error: 'New password must be at least 8 characters long and contain at least one letter, one number, and one special character.',
      });
      return true;
    }

    const newHash = hashPassword(newPassword);
    db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').run(
      newHash,
      new Date().toISOString(),
      auth.user.id
    );

    // Revoke other sessions for security
    db.prepare('DELETE FROM user_sessions WHERE user_id = ? AND token != ?').run(auth.user.id, auth.session.token);

    logAudit(auth.user.id, 'PASSWORD_CHANGE', `User @${auth.user.username} successfully changed account password.`, auth.user.id, 'user', clientIp);
    sendJson(res, 200, { success: true, message: 'Password updated successfully.' });
    return true;
  }

  // POST /api/auth/delete-account (GDPR Right to Erasure)
  if (pathname === '/api/auth/delete-account' && method === 'POST') {
    const auth = getAuthUser(req);
    if (!auth) {
      sendJson(res, 401, { error: 'Not authenticated.' });
      return true;
    }

    const body = await parseJsonBody(req);
    const password = String(body.password || '');

    const userRow = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(auth.user.id) as any;
    if (!userRow || !verifyPassword(password, userRow.password_hash)) {
      sendJson(res, 403, { error: 'Password verification failed. Account deletion aborted.' });
      return true;
    }

    // Safety: Protect Last Super Administrator
    if (auth.user.role === 'super_admin' || auth.user.role === 'admin') {
      const adminCount = db.prepare("SELECT count(*) as c FROM users WHERE role IN ('super_admin', 'admin')").get() as any;
      if (Number(adminCount?.c || 0) <= 1) {
        sendJson(res, 400, { error: 'Platform governance safety rule: The last active Super Administrator cannot be deleted.' });
        return true;
      }
    }

    // Anonymize user articles & purge personal record
    db.prepare(`
      UPDATE posts
      SET body_text = '[Author account deleted per privacy request] ' || body_text
      WHERE author_id = ?
    `).run(auth.user.id);

    db.prepare('DELETE FROM users WHERE id = ?').run(auth.user.id);

    const clearCookie = getSecureCookieHeader('', 0);
    sendJson(res, 200, { success: true, message: 'Account and personal data erased.' }, { 'Set-Cookie': clearCookie });
    return true;
  }

  // POST /api/auth/forgot-password (Single-use hashed token recovery)
  if (pathname === '/api/auth/forgot-password' && method === 'POST') {
    // Stricter rate limit on password reset requests: 5 per 15 minutes per IP
    const forgotLimit = checkRateLimit(`pwd_reset:${clientIp}`, 5, 15 * 60 * 1000);
    if (!forgotLimit.allowed) {
      sendJson(res, 429, {
        error: 'Too many password reset requests. Please wait before trying again.',
        retryAfterSeconds: forgotLimit.retryAfterSeconds,
      });
      return true;
    }

    const body = await parseJsonBody(req);
    const identifier = String(body.identifier || body.email || body.username || '').trim();

    if (!identifier) {
      sendJson(res, 400, { error: 'Identifier (email or username) is required.' });
      return true;
    }

    const tokenData = createPasswordResetToken(identifier);

    // If an active user matched, dispatch secure password reset email
    if (tokenData) {
      const cleanHandle = identifier.toLowerCase().replace(/^@/, '');
      const userRow = db.prepare('SELECT email FROM users WHERE (LOWER(email) = ? OR LOWER(username) = ?) AND status = ?').get(identifier.toLowerCase(), cleanHandle, 'active') as { email: string } | undefined;
      if (userRow?.email) {
        const proto = (req.headers['x-forwarded-proto'] as string) || (req.headers.host?.includes('localhost') ? 'http' : 'https');
        const appUrl = `${proto}://${req.headers.host || 'localhost:5173'}`;
        await sendPasswordResetEmail(userRow.email, tokenData.token, appUrl);
      }
    }

    // Anti-user-enumeration: always respond with identical success confirmation
    logAudit(
      'SYSTEM',
      'PASSWORD_RESET_REQUEST',
      `Password reset link requested for identifier "${identifier.slice(0, 3)}***".`,
      undefined,
      'USER',
      clientIp
    );

    sendJson(res, 200, {
      success: true,
      message: 'If an active account is registered with that identifier, a secure reset instruction has been dispatched.',
      // In development or test sandbox, provide token in response for automated testing
      ...(process.env.NODE_ENV !== 'production' && tokenData ? { devToken: tokenData.token } : {}),
    });
    return true;
  }

  // POST /api/auth/reset-password
  if (pathname === '/api/auth/reset-password' && method === 'POST') {
    const body = await parseJsonBody(req);
    const token = String(body.token || '').trim();
    const newPassword = String(body.newPassword || '');

    if (!token || !newPassword) {
      sendJson(res, 400, { error: 'Reset token and new password are required.' });
      return true;
    }

    const resetResult = resetPasswordWithToken(token, newPassword);
    if (!resetResult.success) {
      sendJson(res, 400, { error: resetResult.error || 'Failed to reset password.' });
      return true;
    }

    logAudit(
      resetResult.userId || 'SYSTEM',
      'PASSWORD_RESET_SUCCESS',
      'Account password securely reset using single-use hashed token. All other sessions invalidated.',
      resetResult.userId,
      'USER',
      clientIp
    );

    sendJson(res, 200, {
      success: true,
      message: 'Your password has been successfully reset. Please sign in with your new credentials.',
    });
    return true;
  }

  // POST /api/auth/verify-email
  if (pathname === '/api/auth/verify-email' && method === 'POST') {
    const body = await parseJsonBody(req);
    const token = String(body.token || '').trim();

    if (!token) {
      sendJson(res, 400, { error: 'Verification token is required.' });
      return true;
    }

    const verifyRes = verifyEmailWithToken(token);
    if (!verifyRes.success) {
      sendJson(res, 400, { error: verifyRes.error || 'Verification token is invalid or expired.' });
      return true;
    }

    sendJson(res, 200, { success: true, message: 'Email address verified successfully.' });
    return true;
  }

  // POST /api/upload (Secure Media Upload with Magic-Byte & Path Traversal Guards)
  if (pathname === '/api/upload' && method === 'POST') {
    const auth = getAuthUser(req);
    if (!auth) {
      sendJson(res, 401, { error: 'Authentication required to upload media.' });
      return true;
    }

    const body = await parseJsonBody(req, 10 * 1024 * 1024);
    const rawData = String(body.data || body.file || '');
    const originalName = String(body.filename || 'upload.png').trim();

    if (!rawData) {
      sendJson(res, 400, { error: 'No media data provided.' });
      return true;
    }

    // Extract base64 payload
    let base64Content = rawData;
    let declaredMime = 'image/png';

    if (rawData.startsWith('data:')) {
      const match = rawData.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        declaredMime = match[1];
        base64Content = match[2];
      }
    }

    const fileBuffer = Buffer.from(base64Content, 'base64');

    // 10MB limit guard
    if (fileBuffer.length > 10 * 1024 * 1024) {
      sendJson(res, 413, { error: 'File size exceeds 10MB limit.' });
      return true;
    }

    // Magic Bytes & Header Signature Validation
    let ext = '.png';
    let validatedMime = 'image/png';

    if (fileBuffer[0] === 0xff && fileBuffer[1] === 0xd8 && fileBuffer[2] === 0xff) {
      ext = '.jpg';
      validatedMime = 'image/jpeg';
    } else if (
      fileBuffer[0] === 0x89 &&
      fileBuffer[1] === 0x50 &&
      fileBuffer[2] === 0x4e &&
      fileBuffer[3] === 0x47
    ) {
      ext = '.png';
      validatedMime = 'image/png';
    } else if (
      fileBuffer.slice(0, 4).toString('ascii') === 'RIFF' &&
      fileBuffer.slice(8, 12).toString('ascii') === 'WEBP'
    ) {
      ext = '.webp';
      validatedMime = 'image/webp';
    } else if (fileBuffer.slice(0, 3).toString('ascii') === 'GIF') {
      ext = '.gif';
      validatedMime = 'image/gif';
    } else if (
      fileBuffer.slice(0, 100).toString('utf8').includes('<svg') ||
      fileBuffer.toString('utf8').includes('xmlns="http://www.w3.org/2000/svg"')
    ) {
      const svgText = fileBuffer.toString('utf8');
      if (hasDangerousSvgContent(svgText)) {
        sendJson(res, 400, {
          error: 'Security threat: SVG contains potentially dangerous executable content (scripts, event handlers, or embedded objects).',
        });
        return true;
      }
      ext = '.svg';
      validatedMime = 'image/svg+xml';
    } else if (fileBuffer.slice(4, 8).toString('ascii') === 'ftyp') {
      ext = '.mp4';
      validatedMime = 'video/mp4';
    } else {
      sendJson(res, 415, {
        error: 'Unsupported or unverified media type. Allowed formats: PNG, JPEG, WebP, GIF, SVG, MP4.',
      });
      return true;
    }

    // Generate safe UUID-based filename (immune to path traversal)
    const safeFilename = `media-${Date.now()}-${crypto.randomUUID()}${ext}`;
    const destinationPath = path.join(UPLOADS_DIR, safeFilename);

    fs.writeFileSync(destinationPath, fileBuffer);

    const publicUrl = `/uploads/${safeFilename}`;
    logAudit(
      auth.user.id,
      'MEDIA_UPLOAD',
      `Uploaded media "${safeFilename}" (${(fileBuffer.length / 1024).toFixed(1)} KB) - ${validatedMime}`,
      safeFilename,
      'MEDIA',
      clientIp
    );

    sendJson(res, 201, {
      success: true,
      url: publicUrl,
      filename: safeFilename,
      size: fileBuffer.length,
      mimeType: validatedMime,
    });
    return true;
  }

  /* =========================================================================
     ARTICLES & EDITORIAL WORKFLOW
  ========================================================================= */

  // GET /api/articles
  if (pathname === '/api/articles' && method === 'GET') {
    const auth = getAuthUser(req);
    const canSeeUnpublished = auth && (hasPermission(auth.user, 'articles.view_any') || hasPermission(auth.user, 'articles.review'));

    let query = `
      SELECT p.*,
             u.username as author_username, u.display_name as author_display_name,
             u.avatar_url as author_avatar_url, u.verification_tier as author_verification_tier,
             u.trust_score as author_trust_score, u.location as author_location
      FROM posts p
      JOIN users u ON p.author_id = u.id
    `;

    if (!canSeeUnpublished) {
      query += ` WHERE p.status = 'published'`;
    }
    query += ` ORDER BY p.created_at DESC`;

    const rows = db.prepare(query).all() as any[];

    // Fetch media for each post
    const mediaStmt = db.prepare('SELECT * FROM post_media WHERE post_id = ? ORDER BY sort_order ASC');
    const articles = rows.map((r) => {
      const media = mediaStmt.all(r.id) as any[];
      return {
        id: r.id,
        authorId: r.author_id,
        headline: r.headline,
        bodyText: r.body_text,
        aiSummary: JSON.parse(r.ai_summary || '[]'),
        category: r.category,
        status: r.status,
        tags: JSON.parse(r.tags || '[]'),
        isEyewitness: Boolean(r.is_eyewitness),
        isBreakingPinned: Boolean(r.is_breaking_pinned),
        externalSourceUrl: r.external_source_url,
        locationName: r.location_name,
        coordinates: { lat: r.latitude, lng: r.longitude },
        upvotes: r.upvotes,
        downvotes: r.downvotes,
        commentCount: r.comment_count,
        viewCount: r.view_count,
        shareCount: r.share_count,
        forensics: JSON.parse(r.forensics || '{}'),
        createdAt: r.created_at,
        media: media.map((m) => ({
          id: m.id,
          type: m.type,
          url: m.url,
          thumbnailUrl: m.thumbnail_url,
          caption: m.caption,
          width: m.width,
          height: m.height,
          durationSeconds: m.duration_seconds,
        })),
        author: {
          id: r.author_id,
          username: r.author_username,
          displayName: r.author_display_name,
          avatarUrl: r.author_avatar_url,
          verificationTier: r.author_verification_tier,
          trustScore: r.author_trust_score,
          location: r.author_location,
        },
      };
    });

    sendJson(res, 200, { articles });
    return true;
  }

  // POST /api/articles
  if (pathname === '/api/articles' && method === 'POST') {
    const auth = getAuthUser(req);
    if (!auth) {
      sendJson(res, 401, { error: 'Sign in required to publish dispatches.' });
      return true;
    }

    if (!hasPermission(auth.user, 'articles.create')) {
      sendJson(res, 403, { error: 'Your role does not have permission to submit articles.' });
      return true;
    }

    const body = await parseJsonBody(req);
    const headline = String(body.headline || '').trim();
    const bodyText = String(body.bodyText || '').trim();
    const category = String(body.category || 'breaking');

    if (!headline || !bodyText) {
      sendJson(res, 400, { error: 'Headline and article body text are required.' });
      return true;
    }

    const postId = `post-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();

    // Default status: If author has publish permission, can publish; otherwise goes to 'submitted'
    const status = hasPermission(auth.user, 'articles.publish') ? (body.status || 'published') : 'submitted';

    db.prepare(`
      INSERT INTO posts (
        id, author_id, headline, body_text, ai_summary, category, status,
        tags, is_eyewitness, is_breaking_pinned, external_source_url,
        location_name, latitude, longitude, upvotes, downvotes,
        comment_count, view_count, share_count, forensics, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 0, ?, ?, ?)
    `).run(
      postId,
      auth.user.id,
      headline,
      bodyText,
      JSON.stringify(body.aiSummary || []),
      category,
      status,
      JSON.stringify(body.tags || []),
      body.isEyewitness ? 1 : 0,
      body.isBreakingPinned && hasPermission(auth.user, 'articles.publish') ? 1 : 0,
      body.externalSourceUrl || null,
      body.locationName || auth.user.location || 'Global Desk',
      body.coordinates?.lat || 0,
      body.coordinates?.lng || 0,
      JSON.stringify(body.forensics || {}),
      now,
      now
    );

    // Save attached media
    if (Array.isArray(body.media)) {
      const insertMedia = db.prepare(`
        INSERT INTO post_media (id, post_id, type, url, thumbnail_url, caption, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      let order = 0;
      for (const m of body.media) {
        insertMedia.run(
          `media-${postId}-${order}`,
          postId,
          m.type || 'image',
          m.url,
          m.thumbnailUrl || null,
          m.caption || null,
          order++
        );
      }
    }

    logAudit(auth.user.id, 'ARTICLE_CREATE', `Created article "${headline.slice(0, 45)}" [${status}]`, postId, 'article', clientIp);
    sendJson(res, 201, { success: true, postId, status });
    return true;
  }

  // PUT /api/articles/:id (Update with IDOR checks)
  const articleUpdateMatch = pathname.match(/^\/api\/articles\/([^/]+)$/);
  if (articleUpdateMatch && method === 'PUT') {
    const postId = articleUpdateMatch[1];
    const auth = getAuthUser(req);
    if (!auth) {
      sendJson(res, 401, { error: 'Sign in required.' });
      return true;
    }

    const postRow = db.prepare('SELECT * FROM posts WHERE id = ?').get(postId) as any;
    if (!postRow) {
      sendJson(res, 404, { error: 'Article not found.' });
      return true;
    }

    // IDOR / Object-Level Authorization Check:
    const isOwner = postRow.author_id === auth.user.id;
    const canUpdateAny = hasPermission(auth.user, 'articles.update_any');
    const canUpdateOwn = isOwner && hasPermission(auth.user, 'articles.update_own');

    if (!canUpdateAny && !canUpdateOwn) {
      sendJson(res, 403, { error: 'Access denied: You do not have permission to modify this article.' });
      return true;
    }

    const body = await parseJsonBody(req);
    const newHeadline = body.headline !== undefined ? String(body.headline).trim() : postRow.headline;
    const newBodyText = body.bodyText !== undefined ? String(body.bodyText).trim() : postRow.body_text;
    const changeSummary = String(body.changeSummary || 'Content revision update');

    // Record Revision in article_revisions for audit & history
    db.prepare(`
      INSERT INTO article_revisions (id, post_id, editor_id, headline, body_text, change_summary, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      `rev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      postId,
      auth.user.id,
      postRow.headline,
      postRow.body_text,
      changeSummary,
      new Date().toISOString()
    );

    // Update Post
    db.prepare(`
      UPDATE posts
      SET headline = ?, body_text = ?, updated_at = ?
      WHERE id = ?
    `).run(newHeadline, newBodyText, new Date().toISOString(), postId);

    logAudit(auth.user.id, 'ARTICLE_UPDATE', `Updated article #${postId}: "${newHeadline.slice(0, 40)}"`, postId, 'article', clientIp);
    sendJson(res, 200, { success: true, message: 'Article updated successfully.' });
    return true;
  }

  // POST /api/articles/:id/workflow (Editorial Workflow with Separation of Duties)
  const workflowMatch = pathname.match(/^\/api\/articles\/([^/]+)\/workflow$/);
  if (workflowMatch && method === 'POST') {
    const postId = workflowMatch[1];
    const auth = getAuthUser(req);
    if (!auth) {
      sendJson(res, 401, { error: 'Sign in required.' });
      return true;
    }

    const postRow = db.prepare('SELECT * FROM posts WHERE id = ?').get(postId) as any;
    if (!postRow) {
      sendJson(res, 404, { error: 'Article not found.' });
      return true;
    }

    const body = await parseJsonBody(req);
    const targetStatus = String(body.targetStatus || '');
    const isAuthor = postRow.author_id === auth.user.id;

    // MANDATORY SEPARATION OF DUTIES ENFORCEMENT:
    // Authors cannot approve, reject, or publish their own submitted articles!
    if (isAuthor && (targetStatus === 'approved' || targetStatus === 'published')) {
      sendJson(res, 403, {
        error: 'Separation of Duties Violation: Authors are strictly prohibited from approving or publishing their own articles.',
      });
      return true;
    }

    // Role Permission Checks
    if (targetStatus === 'approved' && !hasPermission(auth.user, 'articles.review')) {
      sendJson(res, 403, { error: 'Permission denied: Requires editorial review permission.' });
      return true;
    }

    if (targetStatus === 'published' && !hasPermission(auth.user, 'articles.publish')) {
      sendJson(res, 403, { error: 'Permission denied: Requires editorial publish permission.' });
      return true;
    }

    db.prepare('UPDATE posts SET status = ?, updated_at = ? WHERE id = ?').run(
      targetStatus,
      new Date().toISOString(),
      postId
    );

    logAudit(auth.user.id, 'WORKFLOW_TRANSITION', `Moved article #${postId} from ${postRow.status} to ${targetStatus}`, postId, 'article', clientIp);
    sendJson(res, 200, { success: true, postId, newStatus: targetStatus });
    return true;
  }

  /* =========================================================================
     INTERACTIONS: FOLLOWS, BOOKMARKS, VOTES, COMMENTS
  ========================================================================= */

  // POST /api/follow (Toggle Follow)
  if (pathname === '/api/follow' && method === 'POST') {
    const auth = getAuthUser(req);
    if (!auth) {
      sendJson(res, 401, { error: 'Sign in required to follow correspondents.' });
      return true;
    }

    const body = await parseJsonBody(req);
    const targetUserId = String(body.targetUserId || '');

    if (!targetUserId || targetUserId === auth.user.id) {
      sendJson(res, 400, { error: 'Invalid target user ID.' });
      return true;
    }

    const existingFollow = db.prepare('SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?').get(auth.user.id, targetUserId);

    let isFollowing = false;
    if (existingFollow) {
      db.prepare('DELETE FROM follows WHERE follower_id = ? AND following_id = ?').run(auth.user.id, targetUserId);
      db.prepare('UPDATE users SET followers_count = MAX(0, followers_count - 1) WHERE id = ?').run(targetUserId);
      isFollowing = false;
    } else {
      db.prepare('INSERT INTO follows (follower_id, following_id, created_at) VALUES (?, ?, ?)').run(
        auth.user.id,
        targetUserId,
        new Date().toISOString()
      );
      db.prepare('UPDATE users SET followers_count = followers_count + 1 WHERE id = ?').run(targetUserId);
      isFollowing = true;
    }

    sendJson(res, 200, { success: true, isFollowing, targetUserId });
    return true;
  }

  // POST /api/bookmarks (Toggle Bookmark)
  if (pathname === '/api/bookmarks' && method === 'POST') {
    const auth = getAuthUser(req);
    if (!auth) {
      sendJson(res, 401, { error: 'Sign in required to bookmark stories.' });
      return true;
    }

    const body = await parseJsonBody(req);
    const postId = String(body.postId || '');

    const existing = db.prepare('SELECT 1 FROM bookmarks WHERE user_id = ? AND post_id = ?').get(auth.user.id, postId);
    let bookmarked = false;

    if (existing) {
      db.prepare('DELETE FROM bookmarks WHERE user_id = ? AND post_id = ?').run(auth.user.id, postId);
      bookmarked = false;
    } else {
      db.prepare('INSERT INTO bookmarks (user_id, post_id, created_at) VALUES (?, ?, ?)').run(
        auth.user.id,
        postId,
        new Date().toISOString()
      );
      bookmarked = true;
    }

    sendJson(res, 200, { success: true, bookmarked, postId });
    return true;
  }

  // DELETE /api/comments/:id (IDOR & Moderation Checks)
  const commentDeleteMatch = pathname.match(/^\/api\/comments\/([^/]+)$/);
  if (commentDeleteMatch && method === 'DELETE') {
    const commentId = commentDeleteMatch[1];
    const auth = getAuthUser(req);
    if (!auth) {
      sendJson(res, 401, { error: 'Sign in required.' });
      return true;
    }

    const commentRow = db.prepare('SELECT * FROM comments WHERE id = ?').get(commentId) as any;
    if (!commentRow) {
      sendJson(res, 404, { error: 'Comment not found.' });
      return true;
    }

    const isAuthor = commentRow.author_id === auth.user.id;
    const canDeleteOwn = isAuthor && hasPermission(auth.user, 'comments.delete_own');
    const canModerate = hasPermission(auth.user, 'comments.moderate');

    if (!canDeleteOwn && !canModerate) {
      sendJson(res, 403, { error: 'Access denied: You cannot delete this comment.' });
      return true;
    }

    db.prepare('DELETE FROM comments WHERE id = ?').run(commentId);
    db.prepare('UPDATE posts SET comment_count = MAX(0, comment_count - 1) WHERE id = ?').run(commentRow.post_id);

    logAudit(auth.user.id, 'COMMENT_DELETE', `Deleted comment #${commentId}`, commentId, 'comment', clientIp);
    sendJson(res, 200, { success: true, message: 'Comment deleted.' });
    return true;
  }

  // GET /api/users
  if (pathname === '/api/users' && method === 'GET') {
    const users = db.prepare(`
      SELECT id, username, display_name as displayName, avatar_url as avatarUrl,
             bio, location, role, status, verification_tier as verificationTier,
             trust_score as trustScore, followers_count as followersCount,
             reports_count as reportsCount, created_at as createdAt
      FROM users
      ORDER BY followers_count DESC
    `).all();

    sendJson(res, 200, { users });
    return true;
  }

  // GET /api/settings
  if (pathname === '/api/settings' && method === 'GET') {
    const row = db.prepare('SELECT * FROM site_settings WHERE id = 1').get() as any;
    if (!row) {
      sendJson(res, 200, { settings: null });
      return true;
    }

    sendJson(res, 200, {
      settings: {
        siteName: row.site_name,
        siteTagline: row.tagline,
        logoEmblem: row.emblem,
        breakingBannerText: row.breaking_banner,
        theme: JSON.parse(row.theme || '{}'),
        algorithm: JSON.parse(row.algorithm || '{}'),
        features: JSON.parse(row.features || '{}'),
      },
    });
    return true;
  }

  // GET /api/audit-logs
  if (pathname === '/api/audit-logs' && method === 'GET') {
    const auth = getAuthUser(req);
    if (!auth || !hasPermission(auth.user, 'audit.view')) {
      sendJson(res, 403, { error: 'Access denied: Viewing system audit logs requires administrative authorization.' });
      return true;
    }

    const logs = db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 200').all();
    sendJson(res, 200, { logs });
    return true;
  }

  // Default: unhandled API endpoint
  sendJson(res, 404, { error: `Endpoint ${method} ${pathname} not found.` });
  return true;
}
