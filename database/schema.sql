-- ============================================================================
-- PULSE NEWS — PRODUCTION POSTGRESQL + POSTGIS DATABASE SCHEMA
-- Supports Citizen Journalism, 3D Geospatial Feeds, Community Fact-Notes,
-- Super-Admin White-Label Theme Engine, Audit Logs & V8 Heap Telemetry
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 1. ENUMS
CREATE TYPE verification_tier_enum AS ENUM ('standard', 'verified_citizen', 'journalist', 'news_organization');
CREATE TYPE user_role_enum AS ENUM ('user', 'moderator', 'admin');
CREATE TYPE account_status_enum AS ENUM ('active', 'warned', 'suspended', 'banned');

CREATE TYPE post_category_enum AS ENUM (
    'breaking', 'local', 'politics', 'tech', 'science', 'business', 'weather_disaster', 'culture'
);
CREATE TYPE post_status_enum AS ENUM ('draft', 'published', 'pinned_breaking', 'disputed', 'removed');
CREATE TYPE media_type_enum AS ENUM ('image', 'video', 'panorama_360', 'spatial_3d');
CREATE TYPE vote_direction_enum AS ENUM ('up', 'down');
CREATE TYPE note_status_enum AS ENUM ('under_review', 'rated_helpful', 'rated_misleading', 'rejected');
CREATE TYPE report_reason_enum AS ENUM ('fake_news', 'old_recycled_media', 'spam', 'violence_hate', 'copyright');

-- 2. USERS & REPUTATION
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    location VARCHAR(120),
    role user_role_enum DEFAULT 'user',
    status account_status_enum DEFAULT 'active',
    verification_tier verification_tier_enum DEFAULT 'standard',
    trust_score NUMERIC(3, 2) DEFAULT 0.50 CHECK (trust_score BETWEEN 0.00 AND 1.00),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. NEWS POSTS
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    headline VARCHAR(200) NOT NULL,
    body_text TEXT,
    ai_summary TEXT[] DEFAULT '{}',
    category post_category_enum NOT NULL,
    status post_status_enum DEFAULT 'published',
    tags TEXT[] DEFAULT '{}',
    is_eyewitness BOOLEAN DEFAULT FALSE,
    is_breaking_pinned BOOLEAN DEFAULT FALSE,
    external_source_url TEXT,
    
    -- Geospatial Point (Longitude, Latitude)
    location_name VARCHAR(150),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    geom GEOGRAPHY(Point, 4326),
    
    -- Live Engagement Counters
    upvote_count INT DEFAULT 0,
    downvote_count INT DEFAULT 0,
    comment_count INT DEFAULT 0,
    view_count INT DEFAULT 0,
    share_count INT DEFAULT 0,
    
    -- Algorithmic Ranking Score
    hot_score DOUBLE PRECISION DEFAULT 0.0,
    ai_forensics_score NUMERIC(3, 2) DEFAULT 0.95,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. POST MEDIA ATTACHMENTS (4K Video, Photo Carousels, 360/3D Scenes)
CREATE TABLE post_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    media_type media_type_enum NOT NULL,
    media_url TEXT NOT NULL,
    thumbnail_url TEXT,
    caption TEXT,
    width INT,
    height INT,
    duration_seconds INT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. THREADED COMMENTS
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    upvotes INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. UPVOTES & DOWNVOTES
CREATE TABLE votes (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    direction vote_direction_enum NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, post_id)
);

-- 7. COMMUNITY NOTES / CROWD FACT-CHECKS
CREATE TABLE community_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    note_text TEXT NOT NULL,
    sources_cited TEXT[] NOT NULL,
    status note_status_enum DEFAULT 'under_review',
    helpful_votes INT DEFAULT 0,
    unhelpful_votes INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. MODERATION REPORTS & VERIFICATION REQUESTS
CREATE TABLE post_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason report_reason_enum NOT NULL,
    details TEXT,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE verification_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    requested_tier verification_tier_enum NOT NULL,
    portfolio_links TEXT[],
    credentials_note TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    reviewed_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. SUPER-ADMIN WHITE-LABEL BRANDING, THEME & ALGORITHM CONFIG
CREATE TABLE site_settings (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    site_name VARCHAR(100) DEFAULT 'PULSE NEWS',
    site_tagline VARCHAR(200) DEFAULT 'The Citizen Journalism & 3D Social News Network',
    logo_type VARCHAR(40) DEFAULT 'globe_3d',
    breaking_banner_text TEXT DEFAULT 'LIVE: Global Climate & Tech Summit opens in Tokyo with 40+ citizen streams active',
    theme_config JSONB NOT NULL DEFAULT '{}',
    algorithm_weights JSONB NOT NULL DEFAULT '{}',
    features_config JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES users(id)
);

-- 10. ADMIN GOD-MODE AUDIT LOGS (WITH 1-CLICK UNDO)
CREATE TABLE admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES users(id),
    action_type VARCHAR(100) NOT NULL,
    target_table VARCHAR(50),
    target_id TEXT,
    description TEXT,
    previous_state JSONB,
    new_state JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. SYSTEM TELEMETRY & V8 HEAP SNAPSHOTS
CREATE TABLE system_telemetry (
    id BIGSERIAL PRIMARY KEY,
    heap_used_mb NUMERIC(8,2),
    heap_total_mb NUMERIC(8,2),
    rss_mb NUMERIC(8,2),
    cpu_usage_percent NUMERIC(5,2),
    active_connections INT,
    api_p95_latency_ms NUMERIC(8,2),
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX idx_posts_hot_score ON posts(hot_score DESC);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_category ON posts(category);
CREATE INDEX idx_posts_geom ON posts USING GIST(geom);

