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
} from '../../server/auth.ts';
import { db, initDatabase } from '../../server/db.ts';
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
});
