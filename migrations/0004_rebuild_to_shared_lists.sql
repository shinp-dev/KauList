-- Migration: Rebuild to Shared Shopper schema (Destructive)
-- This migration drops existing tables and creates the new shared lists schema.

DROP TABLE IF EXISTS rate_limits;
DROP TABLE IF EXISTS uploaded_images;
DROP TABLE IF EXISTS items;
DROP TABLE IF EXISTS invite_codes;
DROP TABLE IF EXISTS list_members;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS shopping_lists;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS families;

-- 1. users
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  login_id TEXT NOT NULL COLLATE NOCASE UNIQUE,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. sessions
CREATE TABLE sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token_hash TEXT NOT NULL UNIQUE,
  user_id INTEGER NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. shopping_lists
CREATE TABLE shopping_lists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  created_by_user_id INTEGER NOT NULL,
  deleted_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

-- 4. list_members
CREATE TABLE list_members (
  list_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'member')),
  joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (list_id, user_id),
  FOREIGN KEY (list_id) REFERENCES shopping_lists(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX idx_list_single_owner ON list_members(list_id) WHERE role = 'owner';

-- 5. invite_codes
CREATE TABLE invite_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  list_id INTEGER NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  created_by_user_id INTEGER NOT NULL,
  expires_at DATETIME NOT NULL,
  max_uses INTEGER NOT NULL DEFAULT 1,
  use_count INTEGER NOT NULL DEFAULT 0,
  revoked_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (list_id) REFERENCES shopping_lists(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

-- 6. items
CREATE TABLE items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  list_id INTEGER NOT NULL,
  created_by_user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT '個',
  category TEXT NOT NULL DEFAULT 'other' CHECK (category IN ('food', 'daily', 'medicine', 'other')),
  bought INTEGER NOT NULL DEFAULT 0,
  bought_by_user_id INTEGER,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (list_id) REFERENCES shopping_lists(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by_user_id) REFERENCES users(id),
  FOREIGN KEY (bought_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 7. uploaded_images
CREATE TABLE uploaded_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  public_id TEXT NOT NULL UNIQUE,
  secure_url TEXT NOT NULL DEFAULT '',
  list_id INTEGER NOT NULL,
  uploaded_by_user_id INTEGER,
  status TEXT NOT NULL CHECK (status IN ('reserved', 'temporary', 'attached', 'deletion_pending')),
  item_id INTEGER,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  retry_count INTEGER NOT NULL DEFAULT 0,
  next_retry_at DATETIME,
  last_error TEXT,
  FOREIGN KEY (list_id) REFERENCES shopping_lists(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX idx_uploaded_images_item ON uploaded_images(item_id) WHERE item_id IS NOT NULL;

-- 8. rate_limits
CREATE TABLE rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 1,
  reset_at INTEGER NOT NULL
);
