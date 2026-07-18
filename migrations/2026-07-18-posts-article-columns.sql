-- Add missing columns expected by the current admin/API code.
ALTER TABLE posts ADD COLUMN article_key TEXT;
ALTER TABLE posts ADD COLUMN price_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE posts ADD COLUMN gallery_image_keys TEXT NOT NULL DEFAULT '[]';

-- Backfill article keys for existing rows.
UPDATE posts
SET article_key = 'art_' || lower(hex(randomblob(8)))
WHERE article_key IS NULL OR article_key = '';

-- Ensure uniqueness for routing/internal linkage.
CREATE UNIQUE INDEX IF NOT EXISTS idx_posts_article_key ON posts(article_key);
