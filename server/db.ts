import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '..', 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'pulse_news.db');
export const db = new DatabaseSync(DB_PATH);

// Enable Foreign Key Enforcement & WAL mode for high concurrency
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

/**
 * Initialize Relational Schema
 */
export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      avatar_url TEXT,
      bio TEXT,
      location TEXT,
      role TEXT NOT NULL DEFAULT 'reader',
      status TEXT NOT NULL DEFAULT 'active',
      verification_tier TEXT NOT NULL DEFAULT 'standard',
      trust_score REAL DEFAULT 0.85,
      followers_count INTEGER DEFAULT 0,
      reports_count INTEGER DEFAULT 0,
      email_verified INTEGER NOT NULL DEFAULT 0,
      email_verification_token_hash TEXT,
      email_verification_expires_at TEXT,
      password_reset_token_hash TEXT,
      password_reset_expires_at TEXT,
      mfa_enabled INTEGER NOT NULL DEFAULT 0,
      mfa_secret TEXT,
      mfa_recovery_codes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      ip_address TEXT,
      user_agent TEXT,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      last_active_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      description TEXT NOT NULL,
      priority INTEGER NOT NULL,
      is_system INTEGER NOT NULL DEFAULT 0,
      permissions TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      headline TEXT NOT NULL,
      body_text TEXT NOT NULL,
      ai_summary TEXT DEFAULT '[]',
      category TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'published',
      tags TEXT DEFAULT '[]',
      is_eyewitness INTEGER DEFAULT 0,
      is_breaking_pinned INTEGER DEFAULT 0,
      external_source_url TEXT,
      location_name TEXT,
      latitude REAL,
      longitude REAL,
      upvotes INTEGER DEFAULT 0,
      downvotes INTEGER DEFAULT 0,
      comment_count INTEGER DEFAULT 0,
      view_count INTEGER DEFAULT 0,
      share_count INTEGER DEFAULT 0,
      forensics TEXT DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS article_revisions (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      editor_id TEXT NOT NULL REFERENCES users(id),
      headline TEXT NOT NULL,
      body_text TEXT NOT NULL,
      change_summary TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS post_media (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      url TEXT NOT NULL,
      thumbnail_url TEXT,
      caption TEXT,
      width INTEGER,
      height INTEGER,
      duration_seconds INTEGER,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      parent_comment_id TEXT REFERENCES comments(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      upvotes INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS votes (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      direction TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (user_id, post_id)
    );

    CREATE TABLE IF NOT EXISTS comment_likes (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      comment_id TEXT NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      PRIMARY KEY (user_id, comment_id)
    );

    CREATE TABLE IF NOT EXISTS bookmarks (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      PRIMARY KEY (user_id, post_id)
    );

    CREATE TABLE IF NOT EXISTS follows (
      follower_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      following_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      PRIMARY KEY (follower_id, following_id)
    );

    CREATE TABLE IF NOT EXISTS community_notes (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      note_text TEXT NOT NULL,
      source_url TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'under_review',
      helpful_votes INTEGER DEFAULT 0,
      unhelpful_votes INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      admin_id TEXT NOT NULL,
      action_type TEXT NOT NULL,
      target_resource_id TEXT,
      resource_type TEXT,
      description TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      ip_address TEXT,
      outcome TEXT DEFAULT 'SUCCESS',
      previous_state TEXT,
      new_state TEXT
    );

    CREATE TABLE IF NOT EXISTS site_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      site_name TEXT NOT NULL,
      site_tagline TEXT NOT NULL,
      logo_url TEXT,
      logo_emblem TEXT DEFAULT 'globe',
      breaking_banner_text TEXT NOT NULL,
      theme_config TEXT NOT NULL,
      algorithm_weights TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS consent_records (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      ip_address TEXT NOT NULL,
      preferences TEXT NOT NULL,
      timestamp TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      email TEXT PRIMARY KEY,
      frequency TEXT DEFAULT 'weekly',
      status TEXT DEFAULT 'active',
      subscribed_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rate_limits (
      key TEXT PRIMARY KEY,
      count INTEGER NOT NULL,
      reset_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS account_lockouts (
      identifier TEXT PRIMARY KEY,
      failures INTEGER NOT NULL DEFAULT 0,
      locked_until INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS security_events (
      id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      severity TEXT NOT NULL,
      ip_address TEXT,
      user_id TEXT,
      details TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    -- Indices for high-speed news feed indexing & querying
    CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
    CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
    CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
    CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
    CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_comment_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions(expires_at);
    CREATE INDEX IF NOT EXISTS idx_rate_limits_reset ON rate_limits(reset_at);
    CREATE INDEX IF NOT EXISTS idx_account_lockouts_locked_until ON account_lockouts(locked_until);
    CREATE INDEX IF NOT EXISTS idx_security_events_time ON security_events(created_at DESC);
  `);

  // Safe migration check for existing databases
  try {
    const userCols = db.prepare("PRAGMA table_info(users)").all() as { name: string }[];
    const colNames = new Set(userCols.map((c) => c.name));
    if (!colNames.has('email_verified')) db.exec('ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0;');
    if (!colNames.has('email_verification_token_hash')) db.exec('ALTER TABLE users ADD COLUMN email_verification_token_hash TEXT;');
    if (!colNames.has('email_verification_expires_at')) db.exec('ALTER TABLE users ADD COLUMN email_verification_expires_at TEXT;');
    if (!colNames.has('password_reset_token_hash')) db.exec('ALTER TABLE users ADD COLUMN password_reset_token_hash TEXT;');
    if (!colNames.has('password_reset_expires_at')) db.exec('ALTER TABLE users ADD COLUMN password_reset_expires_at TEXT;');
    if (!colNames.has('mfa_enabled')) db.exec('ALTER TABLE users ADD COLUMN mfa_enabled INTEGER NOT NULL DEFAULT 0;');
    if (!colNames.has('mfa_secret')) db.exec('ALTER TABLE users ADD COLUMN mfa_secret TEXT;');
    if (!colNames.has('mfa_recovery_codes')) db.exec('ALTER TABLE users ADD COLUMN mfa_recovery_codes TEXT;');
  } catch (migErr) {
    console.warn('[DB Migration Warning]', migErr);
  }
}

// Automatically initialize schema on load
initDatabase();

