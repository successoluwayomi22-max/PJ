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

// In-memory sliding-window rate limit store for brute-force defense
interface RateLimitBucket {
  count: number;
  resetAt: number;
}
const rateLimitMap = new Map<string, RateLimitBucket>();

interface LockoutRecord {
  failures: number;
  lockedUntil: number;
}
const lockoutMap = new Map<string, LockoutRecord>();

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
  durationDays = 7
): string {
  const token = generateSessionToken();
  const now = new Date();
  const expires = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

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
 * Server-Side Sliding-Window Rate Limiter
 */
export function checkRateLimit(
  key: string,
  maxRequests = 60,
  windowMs = 60000
): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now();
  let bucket = rateLimitMap.get(key);

  if (!bucket || bucket.resetAt < now) {
    bucket = { count: 1, resetAt: now + windowMs };
    rateLimitMap.set(key, bucket);
    return { allowed: true, remaining: maxRequests - 1, retryAfterSeconds: 0 };
  }

  bucket.count++;
  if (bucket.count > maxRequests) {
    const retryAfterSeconds = Math.ceil((bucket.resetAt - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  return { allowed: true, remaining: maxRequests - bucket.count, retryAfterSeconds: 0 };
}

/**
 * Server-Side Progressive Account Lockout
 */
export function checkAccountLockout(identifier: string): { locked: boolean; retryAfterSeconds: number } {
  const key = identifier.trim().toLowerCase();
  const record = lockoutMap.get(key);
  const now = Date.now();

  if (record && record.lockedUntil > now) {
    return { locked: true, retryAfterSeconds: Math.ceil((record.lockedUntil - now) / 1000) };
  }

  return { locked: false, retryAfterSeconds: 0 };
}

export function recordFailedLogin(identifier: string): { locked: boolean; retryAfterSeconds: number } {
  const key = identifier.trim().toLowerCase();
  const now = Date.now();
  const record = lockoutMap.get(key) || { failures: 0, lockedUntil: 0 };

  record.failures++;
  let retryAfterSeconds = 0;
  let locked = false;

  if (record.failures >= 5) {
    const multiplier = Math.min(record.failures - 4, 6);
    const lockoutDurationMs = 30000 * Math.pow(2, multiplier - 1); // 30s, 60s, 120s...
    record.lockedUntil = now + lockoutDurationMs;
    retryAfterSeconds = Math.ceil(lockoutDurationMs / 1000);
    locked = true;
  }

  lockoutMap.set(key, record);
  return { locked, retryAfterSeconds };
}

export function clearAccountLockout(identifier: string): void {
  const key = identifier.trim().toLowerCase();
  lockoutMap.delete(key);
}

export function recordSuccessfulLogin(identifier: string) {
  lockoutMap.delete(identifier.trim().toLowerCase());
}
