CREATE TABLE IF NOT EXISTS uploaded_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  public_id TEXT UNIQUE NOT NULL,
  secure_url TEXT NOT NULL,
  family_id INTEGER NOT NULL,
  uploaded_by_user_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'reserved',
  item_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (family_id) REFERENCES families(id),
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_uploaded_images_family ON uploaded_images(family_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_images_status_created ON uploaded_images(status, created_at);
