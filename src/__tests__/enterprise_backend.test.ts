import { describe, it } from 'node:test';
import assert from 'node:assert';
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
  createEmailVerificationToken,
  verifyEmailWithToken,
  inspectRequestThreat,
  createCsrfToken,
  verifyCsrfToken,
} from '../../server/auth.ts';
import { db, initDatabase } from '../../server/db.ts';
import { validateSvgSecurity } from '../../server/routes.ts';
import { sendEmailVerificationEmail, sendPasswordResetEmail } from '../../server/email.ts';
import { hasPermission, canTransitionWorkflow } from '../utils/rbac.ts';
import type { User, NewsPost } from '../types.ts';

describe('PULSE News Enterprise Backend & Authentication Security', () => {
  initDatabase();

  it('1. Cryptographic Password Hashing: uses scrypt + salt with constant-time verification', () => {
    const rawPassword = 'SecurePulse#2026!';
    const hash = hashPassword(rawPassword);

    // Hash format: 32-hex salt : derived scrypt key
    assert.match(hash, /^[0-9a-f]{32}:[0-9a-f]+$/);
    
    // Valid password verification
    assert.strictEqual(verifyPassword(rawPassword, hash), true);

    // Incorrect password rejection
    assert.strictEqual(verifyPassword('WrongPassword123!', hash), false);
    assert.strictEqual(verifyPassword('', hash), false);

    // Different salts produce different hashes for the same password
    const hash2 = hashPassword(rawPassword);
    assert.notStrictEqual(hash, hash2);
    assert.strictEqual(verifyPassword(rawPassword, hash2), true);
  });

  it('2. Revocable Session Token Lifecycle: creation, validation, touch, and revocation', () => {
    const testUserId = 'test-user-session-1';
    
    // Ensure test user exists in SQLite
    db.prepare(`
      INSERT OR REPLACE INTO users (
        id, username, display_name, email, password_hash, role, status, verification_tier, created_at, updated_at
      ) VALUES (?, 'test_session_user', 'Session Tester', 'test@session.local', 'hash', 'reader', 'active', 'standard', datetime('now'), datetime('now'))
    `).run(testUserId);

    // Create session
    const token = createSession(testUserId, '192.168.1.50', 'TestBrowser/1.0', 3600000);
    assert.ok(token);
    assert.strictEqual(token.length, 64);

    // Validate active session
    const session = getSession(token);
    assert.ok(session);
    assert.strictEqual(session.userId, testUserId);
    assert.strictEqual(session.ipAddress, '192.168.1.50');

    // Revoke individual session token
    const revoked = revokeSession(token);
    assert.strictEqual(revoked, true);
    assert.strictEqual(getSession(token), null);

    // Revoke all sessions for a user
    const tokenA = createSession(testUserId, '192.168.1.51', 'DeviceA', 3600000);
    const tokenB = createSession(testUserId, '192.168.1.52', 'DeviceB', 3600000);
    assert.ok(getSession(tokenA));
    assert.ok(getSession(tokenB));

    const count = revokeAllUserSessions(testUserId);
    assert.strictEqual(count, 2);
    assert.strictEqual(getSession(tokenA), null);
    assert.strictEqual(getSession(tokenB), null);
  });

  it('3. Progressive Account Lockout & Sliding-Window Rate Limiter', () => {
    const testAccount = 'lockout_target@pulsenews.global';
    clearAccountLockout(testAccount);

    // Initially not locked
    assert.strictEqual(checkAccountLockout(testAccount).locked, false);

    // 4 failed attempts: not yet locked
    for (let i = 0; i < 4; i++) {
      const res = recordFailedLogin(testAccount);
      assert.strictEqual(res.locked, false);
    }

    // 5th failed attempt: triggers lockout
    const fifth = recordFailedLogin(testAccount);
    assert.strictEqual(fifth.locked, true);
    assert.ok(fifth.retryAfterSeconds > 0);

    const check = checkAccountLockout(testAccount);
    assert.strictEqual(check.locked, true);

    // Clear lockout on successful login
    clearAccountLockout(testAccount);
    assert.strictEqual(checkAccountLockout(testAccount).locked, false);

    // Sliding-window rate limiter
    const rateKey = 'ip:192.168.100.1';
    for (let i = 0; i < 5; i++) {
      const r = checkRateLimit(rateKey, 5, 10000);
      assert.strictEqual(r.allowed, true);
    }
    const blocked = checkRateLimit(rateKey, 5, 10000);
    assert.strictEqual(blocked.allowed, false);
    assert.strictEqual(blocked.remaining, 0);
  });

  it('4. Separation of Duties: Authors are strictly forbidden from approving/publishing own submissions', () => {
    const managingEditorAuthor: User = {
      id: 'managing-editor-author-1',
      username: 'editor_author',
      displayName: 'Editor Author',
      email: 'editor_author@pulse.global',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775',
      bio: 'Managing Editor at Pulse News',
      location: 'New York, USA',
      role: 'managing_editor',
      status: 'active',
      verificationTier: 'news_organization',
      trustScore: 0.99,
      joinedAt: '2025-01-01',
      followersCount: 50000,
      reportsCount: 300,
    };

    const peerManagingEditor: User = {
      id: 'peer-managing-editor-2',
      username: 'peer_editor',
      displayName: 'Peer Editor',
      email: 'peer@pulse.global',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169',
      bio: 'Peer Editor at Pulse News',
      location: 'London, UK',
      role: 'managing_editor',
      status: 'active',
      verificationTier: 'news_organization',
      trustScore: 0.99,
      joinedAt: '2025-01-01',
      followersCount: 45000,
      reportsCount: 280,
    };

    const articleUnderReview: NewsPost = {
      id: 'post-test-separation-1',
      authorId: managingEditorAuthor.id,
      headline: 'Deep Water Horizon Sub-surface Microplastics Audit',
      bodyText: 'Independent investigative data collected off the Gulf shelf...',
      aiSummary: ['Microplastics detected at depth'],
      category: 'science',
      status: 'under_review',
      tags: ['investigative', 'ocean'],
      isEyewitness: true,
      isBreakingPinned: false,
      locationName: 'Gulf of Mexico',
      latitude: 28.5,
      longitude: -88.5,
      privacyLevel: 'exact',
      media: [],
      upvotes: 0,
      downvotes: 0,
      commentCount: 0,
      viewCount: 0,
      shareCount: 0,
      velocityPer15m: 1,
      forensics: {} as any,
      createdAt: new Date().toISOString(),
    };

    // 1. Author (even though they are a Managing Editor) attempts to approve own article -> MUST BE REJECTED by Separation of Duties
    const authorApproveAttempt = canTransitionWorkflow(managingEditorAuthor, articleUnderReview, 'approved');
    assert.strictEqual(authorApproveAttempt.allowed, false);
    assert.match(authorApproveAttempt.reason || '', /separation of duties/i);

    // 2. Journalist Author without approval attempts to publish own article directly -> MUST BE REJECTED
    const journalistAuthor: User = {
      id: 'journalist-author-1',
      username: 'journalist_field',
      displayName: 'Field Journalist',
      email: 'field@pulse.global',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791',
      bio: 'Field Journalist at Pulse News',
      location: 'Tokyo, Japan',
      role: 'author',
      status: 'active',
      verificationTier: 'journalist',
      trustScore: 0.9,
      joinedAt: '2025-01-01',
      followersCount: 100,
      reportsCount: 10,
    };
    const draftPost = { ...articleUnderReview, authorId: journalistAuthor.id, status: 'draft' as const };
    const journalistPublishAttempt = canTransitionWorkflow(journalistAuthor, draftPost, 'published');
    assert.strictEqual(journalistPublishAttempt.allowed, false);

    // 3. Independent Peer Managing Editor reviews and approves -> ALLOWED
    const peerApproveAttempt = canTransitionWorkflow(peerManagingEditor, articleUnderReview, 'approved');
    assert.strictEqual(peerApproveAttempt.allowed, true);
  });

  it('5. Object-Level Authorization (IDOR Defense) for Article Updates', () => {
    const authorUser: User = {
      id: 'author-user-99',
      username: 'first_author',
      displayName: 'First Author',
      email: 'first@pulse.global',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775',
      bio: 'First Author',
      location: 'Paris, France',
      role: 'journalist',
      status: 'active',
      verificationTier: 'journalist',
      trustScore: 0.9,
      joinedAt: '2025-01-01',
      followersCount: 10,
      reportsCount: 1,
    };

    const intruderUser: User = {
      id: 'intruder-user-100',
      username: 'intruder_journalist',
      displayName: 'Intruder Journalist',
      email: 'intruder@pulse.global',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169',
      bio: 'Intruder Journalist',
      location: 'Berlin, Germany',
      role: 'journalist',
      status: 'active',
      verificationTier: 'journalist',
      trustScore: 0.9,
      joinedAt: '2025-01-01',
      followersCount: 5,
      reportsCount: 1,
    };

    const adminUser: User = {
      id: 'super-admin-1',
      username: 'system_admin',
      displayName: 'System Admin',
      email: 'admin@pulse.global',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791',
      bio: 'Super Admin',
      location: 'HQ',
      role: 'super_admin',
      status: 'active',
      verificationTier: 'news_organization',
      trustScore: 1.0,
      joinedAt: '2025-01-01',
      followersCount: 100000,
      reportsCount: 500,
    };

    // Owner modifying their own article: allowed
    assert.strictEqual(
      hasPermission(authorUser, 'articles.update_own', { resourceAuthorId: authorUser.id }),
      true
    );

    // Intruder attempting to modify author's article: DENIED (IDOR Blocked)
    assert.strictEqual(
      hasPermission(intruderUser, 'articles.update_own', { resourceAuthorId: authorUser.id }),
      false
    );

    // Super Admin modifying any article: allowed by privilege
    assert.strictEqual(
      hasPermission(adminUser, 'articles.update_any', { resourceAuthorId: authorUser.id }),
      true
    );
  });

  it('6. Strict 8+ Character Password with Upper, Lower, Figure & Special Policy', () => {
    // Fails: too short
    assert.strictEqual(validatePasswordStrength('Short1!').valid, false);
    // Fails: missing uppercase
    assert.strictEqual(validatePasswordStrength('pulse#2026').valid, false);
    // Fails: missing figure
    assert.strictEqual(validatePasswordStrength('PulseNews!').valid, false);
    // Fails: missing special character
    assert.strictEqual(validatePasswordStrength('PulseNews2026').valid, false);
    // Passes: complete enterprise compliance
    assert.strictEqual(validatePasswordStrength('PulseNews#2026!').valid, true);
  });

  it('7. Password Reset Single-Use Hashed Token Lifecycle & Revocation', () => {
    const targetUserId = 'pwd-reset-test-user';
    const initialPassword = 'Initial#Pass123';
    const newPassword = 'Updated#Pass456';

    db.prepare(`
      INSERT OR REPLACE INTO users (
        id, username, display_name, email, password_hash, role, status, verification_tier, created_at, updated_at
      ) VALUES (?, 'reset_test_user', 'Reset Tester', 'reset_test@pulse.global', ?, 'reader', 'active', 'standard', datetime('now'), datetime('now'))
    `).run(targetUserId, hashPassword(initialPassword));

    // Create session to verify it gets revoked upon reset
    const userSessionToken = createSession(targetUserId, '127.0.0.1', 'ResetClient');
    assert.ok(getSession(userSessionToken));

    // Request reset token
    const tokenResult = createPasswordResetToken('reset_test@pulse.global');
    assert.ok(tokenResult);
    assert.strictEqual(tokenResult.token.length, 64);

    // Attempt reset with invalid token -> fails
    const invalidReset = resetPasswordWithToken('invalid-token-12345', newPassword);
    assert.strictEqual(invalidReset.success, false);

    // Reset with valid token -> succeeds
    const validReset = resetPasswordWithToken(tokenResult.token, newPassword);
    assert.strictEqual(validReset.success, true);

    // Token is single-use: replay attempt -> fails
    const replayReset = resetPasswordWithToken(tokenResult.token, 'AnotherPass#789');
    assert.strictEqual(replayReset.success, false);

    // Sessions are revoked
    assert.strictEqual(getSession(userSessionToken), null);

    // Password was updated
    const userRow = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(targetUserId) as any;
    assert.strictEqual(verifyPassword(newPassword, userRow.password_hash), true);
    assert.strictEqual(verifyPassword(initialPassword, userRow.password_hash), false);
  });

  it('8. Layer 7 WAF Threat Inspection (SQLi, Path Traversal, XSS)', () => {
    // Clean benign requests -> safe
    assert.strictEqual(inspectRequestThreat('/api/articles?category=science').isThreat, false);
    assert.strictEqual(inspectRequestThreat('/api/users').isThreat, false);

    // SQL Injection
    const sqli1 = inspectRequestThreat('/api/articles?search=1%20UNION%20SELECT%20*%20FROM%20users');
    assert.strictEqual(sqli1.isThreat, true);
    assert.strictEqual(sqli1.threatType, 'SQL_INJECTION');

    // Path Traversal
    const traversal = inspectRequestThreat('/uploads/../../etc/passwd');
    assert.strictEqual(traversal.isThreat, true);
    assert.strictEqual(traversal.threatType, 'PATH_TRAVERSAL');

    // XSS injection
    const xss = inspectRequestThreat('/api/articles', '<script>alert(1)</script>');
    assert.strictEqual(xss.isThreat, true);
    assert.strictEqual(xss.threatType, 'XSS_ATTACK');
  });

  it('9. Persistent SQLite Account Lockout Store Verification', () => {
    const target = 'sqlite_lockout_user@pulsenews.global';
    clearAccountLockout(target);

    // Initial state: not in account_lockouts
    let row = db.prepare('SELECT failures, locked_until FROM account_lockouts WHERE identifier = ?').get(target) as any;
    assert.strictEqual(row, undefined);

    // 5 failures
    for (let i = 0; i < 5; i++) {
      recordFailedLogin(target);
    }

    // Direct SQLite check
    row = db.prepare('SELECT failures, locked_until FROM account_lockouts WHERE identifier = ?').get(target) as any;
    assert.ok(row);
    assert.strictEqual(row.failures, 5);
    assert.ok(row.locked_until > Date.now());

    // checkAccountLockout reports locked
    const status = checkAccountLockout(target);
    assert.strictEqual(status.locked, true);
    assert.ok(status.retryAfterSeconds > 0);

    // Clear deletes from SQLite
    clearAccountLockout(target);
    row = db.prepare('SELECT failures FROM account_lockouts WHERE identifier = ?').get(target) as any;
    assert.strictEqual(row, undefined);
  });

  it('10. CSRF Token Lifecycle: HMAC-SHA256 Generation & Constant-Time Verification', () => {
    const sessionTokenA = 'session-token-alpha-1234567890abcdef';
    const sessionTokenB = 'session-token-beta-abcdef1234567890';

    const csrfA = createCsrfToken(sessionTokenA);
    const csrfB = createCsrfToken(sessionTokenB);

    assert.ok(csrfA);
    assert.ok(csrfB);
    assert.notStrictEqual(csrfA, csrfB);

    // Valid token matches session
    assert.strictEqual(verifyCsrfToken(csrfA, sessionTokenA), true);
    assert.strictEqual(verifyCsrfToken(csrfB, sessionTokenB), true);

    // Mismatched token fails
    assert.strictEqual(verifyCsrfToken(csrfA, sessionTokenB), false);
    assert.strictEqual(verifyCsrfToken(csrfB, sessionTokenA), false);

    // Forged/empty token fails
    assert.strictEqual(verifyCsrfToken('forged-csrf-token', sessionTokenA), false);
    assert.strictEqual(verifyCsrfToken('', sessionTokenA), false);
  });

  it('11. Malicious SVG Content Threat Detection', () => {
    function hasDangerousSvg(svg: string): boolean {
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

    // Clean valid SVG
    const safeSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40" fill="red"/></svg>';
    assert.strictEqual(hasDangerousSvg(safeSvg), false);

    // Malicious vectors
    assert.strictEqual(hasDangerousSvg('<svg><script>alert(1)</script></svg>'), true);
    assert.strictEqual(hasDangerousSvg('<svg onload="alert(document.cookie)"></svg>'), true);
    assert.strictEqual(hasDangerousSvg('<svg><image href="javascript:alert(1)"/></svg>'), true);
    assert.strictEqual(hasDangerousSvg('<svg><foreignObject><body><script>bad()</script></body></foreignObject></svg>'), true);
    assert.strictEqual(hasDangerousSvg('<svg><a xlink:href="javascript:evil()"><circle r="10"/></a></svg>'), true);
    assert.strictEqual(hasDangerousSvg('<svg><rect onerror="evil()"/></svg>'), true);
  });

  it('12. Session Expiration & Unit Normalization (30 Days Agreement)', () => {
    const testUserId = 'test-expiry-user';
    db.prepare(`
      INSERT OR REPLACE INTO users (
        id, username, display_name, email, password_hash, role, status, verification_tier, created_at, updated_at
      ) VALUES (?, 'expiry_user', 'Expiry User', 'expiry@session.local', 'hash', 'reader', 'active', 'standard', datetime('now'), datetime('now'))
    `).run(testUserId);

    // 1. Create standard 30-day session
    const token30 = createSession(testUserId, '10.0.0.1', 'Mozilla/5.0', 30);
    const session30 = getSession(token30);
    assert.ok(session30);
    // Expiration should be roughly 30 days in the future (within 10 seconds tolerance)
    const expectedExpiry30 = Date.now() + 30 * 24 * 60 * 60 * 1000;
    const actualExpiryMs = new Date(session30.expiresAt).getTime();
    assert.ok(Math.abs(actualExpiryMs - expectedExpiry30) < 10000);

    // 2. An expired session is cleaned up and rejected by getSession
    const expiredToken = createSession(testUserId, '10.0.0.1', 'Mozilla/5.0', 1);
    // Manually force SQLite expires_at to the past
    db.prepare('UPDATE user_sessions SET expires_at = ? WHERE token = ?').run(
      new Date(Date.now() - 10000).toISOString(),
      expiredToken
    );
    const expiredSession = getSession(expiredToken);
    assert.strictEqual(expiredSession, null);
  });

  it('13. SVG Security Validator (Full Prohibited Elements & Event Handlers)', () => {
    const safeSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#0284c7"/></svg>';
    const safeCheck = validateSvgSecurity(safeSvg);
    assert.strictEqual(safeCheck.safe, true);

    // Reject script tags
    const scriptCheck = validateSvgSecurity('<svg><script>alert(1)</script></svg>');
    assert.strictEqual(scriptCheck.safe, false);

    // Reject inline onload
    const eventCheck = validateSvgSecurity('<svg onload="fetch(\'/steal\')"></svg>');
    assert.strictEqual(eventCheck.safe, false);

    // Reject javascript: protocol
    const protoCheck = validateSvgSecurity('<svg><a href="javascript:alert(1)"><circle r="5"/></a></svg>');
    assert.strictEqual(protoCheck.safe, false);

    // Reject foreignObject
    const foreignCheck = validateSvgSecurity('<svg><foreignObject><div>x</div></foreignObject></svg>');
    assert.strictEqual(foreignCheck.safe, false);
  });

  it('14. Email Service: Verification & Reset Mail Integration Handling', async () => {
    // In test environment, sending email should safely resolve (mock/logging transport)
    const verifyResult = await sendEmailVerificationEmail('editor@pulsenews.global', 'token-abc-123', 'http://localhost:5173');
    assert.ok(verifyResult);
    assert.strictEqual(verifyResult.success, true);

    const resetResult = await sendPasswordResetEmail('editor@pulsenews.global', 'reset-token-xyz', 'http://localhost:5173');
    assert.ok(resetResult);
    assert.strictEqual(resetResult.success, true);
  });
});
