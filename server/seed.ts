import { db, initDatabase } from './db.ts';
import { hashPassword } from './auth.ts';
import { INITIAL_USERS, INITIAL_POSTS, INITIAL_COMMENTS, INITIAL_COMMUNITY_NOTES, INITIAL_SITE_SETTINGS } from '../src/mockData.ts';
import { SYSTEM_ROLES } from '../src/utils/rbac.ts';

export function seedDatabase() {
  initDatabase();

  const userCountRow = db.prepare('SELECT count(*) as count FROM users').get() as { count: number | bigint };
  if (Number(userCountRow?.count || 0) > 0) {
    return; // Already seeded
  }

  console.log('[Seed] Database is empty. Seeding roles, users, articles, and settings...');

  // 1. Seed Roles
  const insertRoleStmt = db.prepare(`
    INSERT INTO roles (id, label, description, priority, is_system, permissions, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const role of SYSTEM_ROLES) {
    insertRoleStmt.run(
      role.id,
      role.label,
      role.description,
      role.priority,
      role.isSystem ? 1 : 0,
      JSON.stringify(role.permissions),
      new Date().toISOString(),
      new Date().toISOString()
    );
  }

  // 2. Seed Users
  const insertUserStmt = db.prepare(`
    INSERT INTO users (
      id, username, display_name, email, password_hash, avatar_url, bio,
      location, role, status, verification_tier, trust_score, followers_count,
      reports_count, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Default seed password for initial mock journalists/admins:
  // Elena: Admin@Pulse2026!
  // Kenji, Amina, Dr. Marcus, etc: Pulse@News2026!
  for (const u of INITIAL_USERS) {
    const rawPass = u.id === 'user-admin' ? 'Admin@Pulse2026!' : 'Pulse@News2026!';
    const hash = hashPassword(rawPass);
    insertUserStmt.run(
      u.id,
      u.username,
      u.displayName,
      u.email,
      hash,
      u.avatarUrl,
      u.bio,
      u.location,
      u.role === 'admin' ? 'super_admin' : u.role === 'moderator' ? 'editor' : 'journalist',
      u.status || 'active',
      u.verificationTier || 'standard',
      u.trustScore || 0.85,
      u.followersCount || 0,
      u.reportsCount || 0,
      new Date().toISOString(),
      new Date().toISOString()
    );
  }

  // 3. Seed Posts & Media
  const insertPostStmt = db.prepare(`
    INSERT INTO posts (
      id, author_id, headline, body_text, ai_summary, category, status,
      tags, is_eyewitness, is_breaking_pinned, external_source_url,
      location_name, latitude, longitude, upvotes, downvotes,
      comment_count, view_count, share_count, forensics, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMediaStmt = db.prepare(`
    INSERT INTO post_media (
      id, post_id, type, url, thumbnail_url, caption, width, height, duration_seconds, sort_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const p of INITIAL_POSTS) {
    insertPostStmt.run(
      p.id,
      p.authorId,
      p.headline,
      p.bodyText,
      JSON.stringify(p.aiSummary || []),
      p.category,
      p.status || 'published',
      JSON.stringify(p.tags || []),
      p.isEyewitness ? 1 : 0,
      p.isBreakingPinned ? 1 : 0,
      p.externalSourceUrl || null,
      p.locationName,
      p.latitude || 0,
      p.longitude || 0,
      p.upvotes || 0,
      p.downvotes || 0,
      p.commentCount || 0,
      p.viewCount || 0,
      p.shareCount || 0,
      JSON.stringify(p.forensics || {}),
      p.createdAt,
      new Date().toISOString()
    );

    if (p.media && p.media.length > 0) {
      let sortOrder = 0;
      for (const m of p.media) {
        insertMediaStmt.run(
          m.id || `media-${p.id}-${sortOrder}`,
          p.id,
          m.type,
          m.url,
          m.thumbnailUrl || null,
          m.caption || null,
          null,
          null,
          m.durationSeconds || null,
          sortOrder++
        );
      }
    }
  }

  // 4. Seed Comments
  const insertCommentStmt = db.prepare(`
    INSERT INTO comments (id, post_id, author_id, parent_comment_id, content, upvotes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const c of INITIAL_COMMENTS) {
    insertCommentStmt.run(
      c.id,
      c.postId,
      c.authorId,
      c.parentCommentId || null,
      c.content,
      c.upvotes || 0,
      c.createdAt
    );
  }

  // 5. Seed Community Notes
  const insertNoteStmt = db.prepare(`
    INSERT INTO community_notes (id, post_id, author_id, note_text, source_url, status, helpful_votes, unhelpful_votes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const n of INITIAL_COMMUNITY_NOTES) {
    insertNoteStmt.run(
      n.id,
      n.postId,
      n.authorId,
      n.noteText,
      n.sourcesCited?.[0] || 'https://pulsenews.global',
      n.status,
      n.helpfulVotes || 0,
      n.unhelpfulVotes || 0,
      n.createdAt
    );
  }

  // 6. Seed Site Settings
  const insertSettingsStmt = db.prepare(`
    INSERT OR REPLACE INTO site_settings (id, site_name, tagline, emblem, breaking_banner, theme, algorithm, features, updated_at)
    VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertSettingsStmt.run(
    INITIAL_SITE_SETTINGS.siteName,
    INITIAL_SITE_SETTINGS.siteTagline,
    INITIAL_SITE_SETTINGS.logoEmblem,
    INITIAL_SITE_SETTINGS.breakingBannerText,
    JSON.stringify(INITIAL_SITE_SETTINGS.theme),
    JSON.stringify(INITIAL_SITE_SETTINGS.algorithm),
    JSON.stringify(INITIAL_SITE_SETTINGS.features),
    new Date().toISOString()
  );

  // 7. Seed Initial Follows
  const insertFollowStmt = db.prepare('INSERT OR IGNORE INTO follows (follower_id, following_id, created_at) VALUES (?, ?, ?)');
  insertFollowStmt.run('user-admin', 'user-kenji', new Date().toISOString());
  insertFollowStmt.run('user-admin', 'user-amina', new Date().toISOString());

  console.log('[Seed] Database successfully seeded with production newsroom data.');
}
