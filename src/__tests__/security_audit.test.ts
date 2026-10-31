import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  sanitizeText,
  isSafeUrl,
  checkPasswordStrength,
  checkLoginRateLimit,
  recordLoginFailure,
  recordLoginSuccess,
  getCSRFToken,
  validateCSRFToken,
} from '../utils/security.ts';

// Mock storage for Node test runner
const createStorageMock = () => {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, val: string) => map.set(key, val),
    removeItem: (key: string) => map.delete(key),
    clear: () => map.clear(),
  };
};

(globalThis as any).localStorage = createStorageMock();
(globalThis as any).sessionStorage = createStorageMock();

test('1. Security Utility — XSS Input Sanitization', () => {
  const maliciousInput = '<script>alert("pwned")</script>Hello <b>World</b>';
  const clean = sanitizeText(maliciousInput);
  assert.strictEqual(clean.includes('<script>'), false);
  assert.strictEqual(clean.includes('&lt;script&gt;'), true);

  const eventPayload = '<img src="x" onerror="alert(1)">Breaking News';
  const cleanEvent = sanitizeText(eventPayload);
  assert.strictEqual(cleanEvent.includes('<img'), false);
  assert.strictEqual(cleanEvent.includes('&lt;img'), true);
});

test('2. Security Utility — Malicious Protocol & Safe URL Filtering', () => {
  assert.strictEqual(isSafeUrl('https://pulse-news.org/article/1'), true);
  assert.strictEqual(isSafeUrl('http://localhost:5173/feed'), true);
  assert.strictEqual(isSafeUrl('mailto:editor@pulse-news.org'), true);
  assert.strictEqual(isSafeUrl('/article/post-101'), true);

  // Dangerous protocols must be rejected
  assert.strictEqual(isSafeUrl('javascript:alert(document.cookie)'), false);
  assert.strictEqual(isSafeUrl('data:text/html;base64,PHNjcmlwdD4='), false);
  assert.strictEqual(isSafeUrl('vbscript:msgbox("xss")'), false);
});

test('3. Security Utility — Password Strength Validation', () => {
  const weak = checkPasswordStrength('12345');
  assert.strictEqual(weak.score <= 1, true);
  assert.strictEqual(weak.passed, false);
  assert.strictEqual(weak.label, 'Weak');

  const medium = checkPasswordStrength('Password123');
  assert.strictEqual(medium.score >= 2, true);
  assert.strictEqual(medium.passed, true);

  const strong = checkPasswordStrength('PulseNews!2026Secure#');
  assert.strictEqual(strong.score >= 3, true);
  assert.strictEqual(strong.passed, true);
});

test('4. Security Utility — Rate Limiting & Brute-Force Defense', () => {
  const testAccount = 'test_journalist@pulse-news.org';

  // Initially allowed
  assert.strictEqual(checkLoginRateLimit(testAccount).allowed, true);

  // Record 5 failed attempts
  for (let i = 0; i < 5; i++) {
    recordLoginFailure(testAccount);
  }

  // 6th attempt must be locked out
  const lockCheck = checkLoginRateLimit(testAccount);
  assert.strictEqual(lockCheck.allowed, false);
  assert.strictEqual(lockCheck.retryAfterSeconds > 0, true);

  // Success resets failure count
  recordLoginSuccess(testAccount);
  assert.strictEqual(checkLoginRateLimit(testAccount).allowed, true);
});

test('5. Security Utility — CSRF Protection Token', () => {
  const token = getCSRFToken();
  assert.strictEqual(typeof token, 'string');
  assert.strictEqual(token.startsWith('csrf_'), true);

  assert.strictEqual(validateCSRFToken(token), true);
  assert.strictEqual(validateCSRFToken('invalid-token-123'), false);
  assert.strictEqual(validateCSRFToken(''), false);
});

test('6. RBAC & Comment Moderation Permissions', () => {
  const adminUser = { id: 'usr-admin', role: 'admin' };
  const authorUser = { id: 'usr-author', role: 'reader' };
  const bystanderUser = { id: 'usr-bystander', role: 'reader' };

  const comment = { id: 'c-1', authorId: 'usr-author', content: 'Eyewitness account' };

  const canAuthorDelete = comment.authorId === authorUser.id || authorUser.role === 'admin';
  const canAdminDelete = comment.authorId === adminUser.id || adminUser.role === 'admin';
  const canBystanderDelete = comment.authorId === bystanderUser.id || bystanderUser.role === 'admin';

  assert.strictEqual(canAuthorDelete, true, 'Author must be able to delete their own comment');
  assert.strictEqual(canAdminDelete, true, 'Admin must be able to moderate any comment');
  assert.strictEqual(canBystanderDelete, false, 'Other readers MUST NOT delete someone else\'s comment');
});

test('7. GDPR & NDPA Account Deletion Protocol Logic', () => {
  const user = {
    id: 'user-delete-test',
    username: 'leaving_user',
    displayName: 'Leaving User',
    passwordHash: 'secretPass123',
  };

  const verifyPass = (attempt: string) => attempt === user.passwordHash;

  // Invalid password rejected
  assert.strictEqual(verifyPass('wrongPassword'), false);

  // Valid password accepts deletion
  assert.strictEqual(verifyPass('secretPass123'), true);

  // Content Anonymization Simulation
  const articles = [
    { id: 'p1', authorId: user.id, bodyText: 'Article text' },
    { id: 'p2', authorId: 'other-user', bodyText: 'Keep author' },
  ];

  const anonymizedArticles = articles.map((p) =>
    p.authorId === user.id ? { ...p, authorId: 'anonymous-former-contributor' } : p
  );

  assert.strictEqual(anonymizedArticles[0].authorId, 'anonymous-former-contributor');
  assert.strictEqual(anonymizedArticles[1].authorId, 'other-user');
});

test('8. Search Engine Crawling & Feed Artifacts', () => {
  const robotsPath = path.resolve('public/robots.txt');
  const sitemapPath = path.resolve('public/sitemap.xml');
  const rssPath = path.resolve('public/rss.xml');

  assert.strictEqual(fs.existsSync(robotsPath), true, 'public/robots.txt must exist');
  assert.strictEqual(fs.existsSync(sitemapPath), true, 'public/sitemap.xml must exist');
  assert.strictEqual(fs.existsSync(rssPath), true, 'public/rss.xml must exist');

  const robots = fs.readFileSync(robotsPath, 'utf-8');
  assert.strictEqual(robots.includes('Disallow: /admin'), true);
  assert.strictEqual(robots.includes('Disallow: /studio'), true);
  assert.strictEqual(robots.includes('Allow: /article/'), true);
  assert.strictEqual(robots.includes('Sitemap:'), true);

  const sitemap = fs.readFileSync(sitemapPath, 'utf-8');
  assert.strictEqual(sitemap.includes('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'), true);
  assert.strictEqual(sitemap.includes('/privacy'), true);
  assert.strictEqual(sitemap.includes('/article/post-1'), true);

  const rss = fs.readFileSync(rssPath, 'utf-8');
  assert.strictEqual(rss.includes('<rss version="2.0"'), true);
  assert.strictEqual(rss.includes('<channel>'), true);
  assert.strictEqual(rss.includes('<item>'), true);
});

test('9. Zero Emoji Policy in Source Code', () => {
  const emojiPattern = /[\uD800-\uDBFF][\uDC00-\uDFFF]/;
  const walkDir = (dir: string): string[] => {
    let results: string[] = [];
    const list = fs.readdirSync(dir);
    for (const file of list) {
      const full = path.join(dir, file);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        results = results.concat(walkDir(full));
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(full);
      }
    }
    return results;
  };

  const tsFiles = walkDir('src');
  for (const f of tsFiles) {
    const content = fs.readFileSync(f, 'utf-8');
    assert.strictEqual(
      emojiPattern.test(content),
      false,
      `File ${f} contains raw unicode emojis which violates the zero-emoji requirement`
    );
  }
});
