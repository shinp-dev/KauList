-- Migration: Harden uploaded_images table (Table rebuild)

-- Create new table with updated constraints and columns
CREATE TABLE uploaded_images_new (
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

-- Copy data from existing table
INSERT INTO uploaded_images_new (id, public_id, secure_url, family_id, uploaded_by_user_id, status, item_id, created_at)
SELECT id, public_id, secure_url, family_id, uploaded_by_user_id, status, item_id, created_at FROM uploaded_images;

-- Drop old table
DROP TABLE uploaded_images;

-- Rename new table
ALTER TABLE uploaded_images_new RENAME TO uploaded_images;

-- Recreate indices
CREATE INDEX IF NOT EXISTS idx_uploaded_images_family ON uploaded_images(family_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_images_status_created ON uploaded_images(status, created_at);

-- Add new unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_uploaded_images_item_unique ON uploaded_images(item_id) WHERE item_id IS NOT NULL;
