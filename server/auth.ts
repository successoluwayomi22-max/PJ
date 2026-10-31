import crypto from 'node:crypto';
import { db } from './db.ts';

export interface AuthSession {
  token: string;
  userId: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  expiresAt: string;
  lastActiveAt: string;
}

export interface UserRecord {
  id: string;
  username: string;
  displayName: string;
  email: string;
  passwordHash: string;
  avatarUrl: string | null;
  bio: string | null;
  location: string | null;
  role: string;
  status: string;
  verificationTier: string;
  trustScore: number;
  followersCount: number;
  reportsCount: number;
  createdAt: string;
  updatedAt: string;
}

// Stable Server-Wide CSRF Secret
function resolveCsrfSecret(): string {
  if (process.env.CSRF_SECRET?.trim()) {
    return process.env.CSRF_SECRET.trim();
  }
  if (process.env.NODE_ENV === 'production') {
    // Provide a consistent fallback if CSRF_SECRET is not explicitly injected in build environments
    return 'pulse_production_persistent_csrf_secret_key_2026_secure';
  }
  return 'pulse_development_stable_csrf_secret_key_2026';
}

const CSRF_SECRET = resolveCsrfSecret();

/**
 * Generates an HMAC-SHA256 CSRF Token bound to a session or guest token
 */
export function createCsrfToken(sessionToken: string = ''): string {
  const hmac = crypto.createHmac('sha256', CSRF_SECRET);
  hmac.update(sessionToken || 'pulse-anonymous-guest');
  return hmac.digest('hex');
}

/**
 * Validates an HMAC-SHA256 CSRF Token against a session or guest token using constant-time comparison
 */
export function verifyCsrfToken(csrfToken: string, sessionToken: string = ''): boolean {
  if (!csrfToken || typeof csrfToken !== 'string') return false;
  const expected = createCsrfToken(sessionToken);
  try {
    const bufA = Buffer.from(csrfToken, 'hex');
    const bufB = Buffer.from(expected, 'hex');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Cryptographically Secure Scrypt Password Hashing (OWASP Compliant)
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Constant-Time Timing-Safe Password Verification
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!password || !storedHash || !storedHash.includes(':')) return false;
  const [salt, key] = storedHash.split(':');
  if (!salt || !key) return false;
  try {
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

/**
 * Generate Secure Cryptographic Session Token
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create Revocable Session in Database
 */
export function createSession(
  userId: string,
  ipAddress: string | null = null,
  userAgent: string | null = null,
  durationDays = 30
): string {
  const token = generateSessionToken();
  const now = new Date();
  // Safe unit normalization: If caller passes milliseconds (> 3650 days), treat as ms; otherwise treat as days
  const durationMs = durationDays > 3650 ? durationDays : durationDays * 24 * 60 * 60 * 1000;
  const expires = new Date(now.getTime() + durationMs);

  const stmt = db.prepare(`
    INSERT INTO user_sessions (token, user_id, ip_address, user_agent, created_at, expires_at, last_active_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    token,
    userId,
    ipAddress,
    userAgent,
    now.toISOString(),
    expires.toISOString(),
    now.toISOString()
  );

  return token;
}

/**
 * Validate and Fetch Active Session
 */
export function getSession(token: string): AuthSession | null {
  if (!token) return null;
  const stmt = db.prepare(`
    SELECT token, user_id as userId, ip_address as ipAddress, user_agent as userAgent,
           created_at as createdAt, expires_at as expiresAt, last_active_at as lastActiveAt
    FROM user_sessions
    WHERE token = ?
  `);

  const row = stmt.get(token) as unknown as AuthSession | undefined;
  if (!row) return null;

  // Verify expiration
  if (new Date(row.expiresAt).getTime() < Date.now()) {
    revokeSession(token);
    return null;
  }

  // Update last active timestamp if older than 5 minutes
  if (Date.now() - new Date(row.lastActiveAt).getTime() > 300000) {
    db.prepare('UPDATE user_sessions SET last_active_at = ? WHERE token = ?').run(
      new Date().toISOString(),
      token
    );
  }

  return row;
}

/**
 * Revoke Individual Session Token (Logout)
 */
export function revokeSession(token: string): boolean {
  if (!token) return false;
  const res = db.prepare('DELETE FROM user_sessions WHERE token = ?').run(token);
  return Number(res.changes) > 0;
}

/**
 * Revoke All Sessions For A User (Logout From All Devices / Security Breach)
 */
export function revokeAllUserSessions(userId: string): number {
  if (!userId) return 0;
  const res = db.prepare('DELETE FROM user_sessions WHERE user_id = ?').run(userId);
  return Number(res.changes);
}

/**
 * Server-Side Sliding-Window Rate Limiter (Backed by Persistent SQLite Store)
 */
export function checkRateLimit(
  key: string,
  maxRequests = 60,
  windowMs = 60000
): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now();

  try {
    // Delete expired buckets periodically
    if (Math.random() < 0.05) {
      db.prepare('DELETE FROM rate_limits WHERE reset_at < ?').run(now);
    }

    const row = db.prepare('SELECT count, reset_at FROM rate_limits WHERE key = ?').get(key) as
      | { count: number; reset_at: number }
      | undefined;

    if (!row || row.reset_at < now) {
      const resetAt = now + windowMs;
      db.prepare(
        'INSERT INTO rate_limits (key, count, reset_at) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET count = 1, reset_at = ?'
      ).run(key, resetAt, resetAt);
      return { allowed: true, remaining: maxRequests - 1, retryAfterSeconds: 0 };
    }

    const newCount = row.count + 1;
    if (newCount > maxRequests) {
      const retryAfterSeconds = Math.ceil((row.reset_at - now) / 1000);
      return { allowed: false, remaining: 0, retryAfterSeconds };
    }

    db.prepare('UPDATE rate_limits SET count = ? WHERE key = ?').run(newCount, key);
    return { allowed: true, remaining: maxRequests - newCount, retryAfterSeconds: 0 };
  } catch (err: any) {
    // Security Principle: FAIL CLOSED.
    // Never fall back to in-memory bypass. If rate limit storage encounters an issue, safely reject protected traffic.
    console.error(`[RateLimiter] Database failure on rate limit key "${key}":`, err?.message || err);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 60,
    };
  }
}

/**
 * Strict Enterprise Password Validation:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one digit / figure
 * - At least one special character
 */
export function validatePasswordStrength(password: string): { valid: boolean; reason?: string } {
  if (!password || typeof password !== 'string') {
    return { valid: false, reason: 'Password is required.' };
  }
  if (password.length < 8) {
    return { valid: false, reason: 'Password must be at least 8 characters long.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, reason: 'Password must contain at least one uppercase letter.' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, reason: 'Password must contain at least one lowercase letter.' };
  }
  if (!/\d/.test(password)) {
    return { valid: false, reason: 'Password must contain at least one number / figure.' };
  }
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)) {
    return { valid: false, reason: 'Password must contain at least one special character (!@#$%^&*...).' };
  }
  return { valid: true };
}

/**
 * Hash single-use tokens (like password reset or email verification) with SHA-256
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generate 32-byte secure hex token
 */
export function generateSecureToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Create a single-use password reset token with 1-hour expiration
 */
export function createPasswordResetToken(identifier: string): { token: string; email: string } | null {
  const clean = identifier.trim().toLowerCase().replace(/^@/, '');
  const user = db.prepare(`
    SELECT id, email, username FROM users WHERE LOWER(email) = ? OR LOWER(username) = ?
  `).get(clean, clean) as { id: string; email: string; username: string } | undefined;

  if (!user) return null;

  const rawToken = generateSecureToken(32);
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

  db.prepare(`
    UPDATE users
    SET password_reset_token_hash = ?, password_reset_expires_at = ?
    WHERE id = ?
  `).run(tokenHash, expiresAt, user.id);

  return { token: rawToken, email: user.email };
}

/**
 * Verify token and securely reset password
 */
export function resetPasswordWithToken(
  token: string,
  newPassword: string
): { success: boolean; error?: string; userId?: string } {
  if (!token) return { success: false, error: 'Reset token is required.' };

  const strength = validatePasswordStrength(newPassword);
  if (!strength.valid) {
    return { success: false, error: strength.reason };
  }

  const tokenHash = hashToken(token);
  const user = db.prepare(`
    SELECT id, email, password_reset_expires_at as expiresAt
    FROM users
    WHERE password_reset_token_hash = ?
  `).get(tokenHash) as { id: string; email: string; expiresAt: string } | undefined;

  if (!user) {
    return { success: false, error: 'Invalid or expired password reset token.' };
  }

  if (new Date(user.expiresAt).getTime() < Date.now()) {
    db.prepare(`
      UPDATE users SET password_reset_token_hash = NULL, password_reset_expires_at = NULL WHERE id = ?
    `).run(user.id);
    return { success: false, error: 'Password reset token has expired. Please request a new one.' };
  }

  const newHash = hashPassword(newPassword);
  db.prepare(`
    UPDATE users
    SET password_hash = ?, password_reset_token_hash = NULL, password_reset_expires_at = NULL, updated_at = ?
    WHERE id = ?
  `).run(newHash, new Date().toISOString(), user.id);

  // Invalidate all active sessions for security
  revokeAllUserSessions(user.id);

  return { success: true, userId: user.id };
}

/**
 * Create Email Verification Token with 24-hour expiration
 */
export function createEmailVerificationToken(userId: string): string {
  const rawToken = generateSecureToken(32);
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  db.prepare(`
    UPDATE users
    SET email_verification_token_hash = ?, email_verification_expires_at = ?
    WHERE id = ?
  `).run(tokenHash, expiresAt, userId);

  return rawToken;
}

/**
 * Verify Email with Token
 */
export function verifyEmailWithToken(token: string): { success: boolean; error?: string } {
  if (!token) return { success: false, error: 'Verification token is required.' };

  const tokenHash = hashToken(token);
  const user = db.prepare(`
    SELECT id, email_verification_expires_at as expiresAt
    FROM users
    WHERE email_verification_token_hash = ?
  `).get(tokenHash) as { id: string; expiresAt: string } | undefined;

  if (!user) {
    return { success: false, error: 'Invalid verification token.' };
  }

  if (new Date(user.expiresAt).getTime() < Date.now()) {
    return { success: false, error: 'Verification token has expired. Please request a new one.' };
  }

  db.prepare(`
    UPDATE users
    SET email_verified = 1, email_verification_token_hash = NULL, email_verification_expires_at = NULL, updated_at = ?
    WHERE id = ?
  `).run(new Date().toISOString(), user.id);

  return { success: true };
}

/**
 * Layer 7 Web Application Firewall (WAF) & IDS Threat Inspector
 * Inspects URL, parameters, and payloads for injection patterns
 */
export function inspectRequestThreat(
  rawUrl: string,
  bodyString?: string
): { isThreat: boolean; threatType?: string; details?: string } {
  const decodedUrl = decodeURIComponent(rawUrl || '');
  const combined = `${decodedUrl} ${bodyString || ''}`;

  // 1. SQL Injection Signatures
  const sqliPatterns = [
    /\bunion\s+(all\s+)?select\b/i,
    /(\bor\b|\band\b)\s+['"]?1['"]?\s*=\s*['"]?1['"]?/i,
    /;\s*drop\s+table\b/i,
    /;\s*alter\s+table\b/i,
    /\bexec(\s*\(|\s+xp_)/i,
    /--\s*$/m,
  ];

  for (const pattern of sqliPatterns) {
    if (pattern.test(combined)) {
      return { isThreat: true, threatType: 'SQL_INJECTION', details: `Matched pattern: ${pattern.source}` };
    }
  }

  // 2. Directory / Path Traversal Signatures
  if (/\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e\/|\.\.%2f/i.test(combined)) {
    return { isThreat: true, threatType: 'PATH_TRAVERSAL', details: 'Relative path traversal dot-dot sequence' };
  }

  // 3. Stored/Reflected Cross-Site Scripting (XSS)
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:\s*[^\s]/i,
    /\bonerror\s*=\s*['"][^'"]+['"]/i,
    /\bonload\s*=\s*['"][^'"]+['"]/i,
  ];

  for (const pattern of xssPatterns) {
    if (pattern.test(combined)) {
      return { isThreat: true, threatType: 'XSS_ATTACK', details: `Matched pattern: ${pattern.source}` };
    }
  }

  return { isThreat: false };
}

/**
 * Server-Side Progressive Account Lockout (Backed by Persistent SQLite Store)
 */
export function checkAccountLockout(identifier: string): { locked: boolean; retryAfterSeconds: number } {
  if (!identifier) return { locked: false, retryAfterSeconds: 0 };
  const key = identifier.trim().toLowerCase();
  const now = Date.now();

  const row = db.prepare('SELECT failures, locked_until FROM account_lockouts WHERE identifier = ?').get(key) as {
    failures: number;
    locked_until: number;
  } | undefined;

  if (row && row.locked_until > now) {
    return { locked: true, retryAfterSeconds: Math.ceil((row.locked_until - now) / 1000) };
  }

  return { locked: false, retryAfterSeconds: 0 };
}

export function recordFailedLogin(identifier: string): { locked: boolean; retryAfterSeconds: number } {
  if (!identifier) return { locked: false, retryAfterSeconds: 0 };
  const key = identifier.trim().toLowerCase();
  const now = Date.now();

  const existing = db.prepare('SELECT failures, locked_until FROM account_lockouts WHERE identifier = ?').get(key) as {
    failures: number;
    locked_until: number;
  } | undefined;

  const failures = (existing?.failures || 0) + 1;
  let retryAfterSeconds = 0;
  let locked = false;
  let lockedUntil = existing?.locked_until && existing.locked_until > now ? existing.locked_until : 0;

  if (failures >= 5) {
    const multiplier = Math.min(failures - 4, 6);
    const lockoutDurationMs = 30000 * Math.pow(2, multiplier - 1); // 30s, 60s, 120s...
    lockedUntil = now + lockoutDurationMs;
    retryAfterSeconds = Math.ceil(lockoutDurationMs / 1000);
    locked = true;
  }

  db.prepare(`
    INSERT INTO account_lockouts (identifier, failures, locked_until, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(identifier) DO UPDATE SET
      failures = excluded.failures,
      locked_until = excluded.locked_until,
      updated_at = excluded.updated_at
  `).run(key, failures, lockedUntil, now);

  return { locked, retryAfterSeconds };
}

export function clearAccountLockout(identifier: string): void {
  if (!identifier) return;
  const key = identifier.trim().toLowerCase();
  db.prepare('DELETE FROM account_lockouts WHERE identifier = ?').run(key);
}

export function recordSuccessfulLogin(identifier: string): void {
  clearAccountLockout(identifier);
}
