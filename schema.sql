-- Migration: Multi-tenant (Family-scoped) schema refactor

DROP TABLE IF EXISTS items;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS families;
DROP TABLE IF EXISTS rate_limits;
DROP TABLE IF EXISTS uploaded_images;

-- 1. families: ID and Name (Unique)
CREATE TABLE families (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. users: Username is unique ONLY within the same family
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  family_id INTEGER REFERENCES families(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(username, family_id)
);

-- 3. items: Associated with family
CREATE TABLE items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  count INTEGER DEFAULT 1,
  unit TEXT DEFAULT '個',
  bought INTEGER DEFAULT 0,
  category TEXT DEFAULT 'other',
  image_url TEXT,
  family_id INTEGER REFERENCES families(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. rate_limits: Table for API rate limiting
CREATE TABLE rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER DEFAULT 1,
  reset_at INTEGER NOT NULL
);

-- 5. uploaded_images
CREATE TABLE uploaded_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  public_id TEXT UNIQUE NOT NULL,
  secure_url TEXT NOT NULL,
  family_id INTEGER NOT NULL,
  uploaded_by_user_id INTEGER,
  status TEXT NOT NULL DEFAULT 'reserved',
  item_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  retry_count INTEGER DEFAULT 0,
  next_retry_at DATETIME,
  last_error TEXT,
  FOREIGN KEY (family_id) REFERENCES families(id),
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE SET NULL,
  FOREIGN KEY (uploaded_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Initialize Default Family
INSERT INTO families (id, name) VALUES (1, 'Default Family');

-- Indices for performance optimization
CREATE INDEX IF NOT EXISTS idx_items_family_created ON items(family_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_family_id ON users(family_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_reset ON rate_limits(reset_at);
CREATE INDEX IF NOT EXISTS idx_uploaded_images_family ON uploaded_images(family_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_images_status_created ON uploaded_images(status, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_uploaded_images_item_unique ON uploaded_images(item_id) WHERE item_id IS NOT NULL;