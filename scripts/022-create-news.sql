-- Public club news managed from the admin panel.
CREATE TABLE IF NOT EXISTS news (
  id SERIAL PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  image_url TEXT NOT NULL DEFAULT '',
  description VARCHAR(400) NOT NULL DEFAULT '',
  content TEXT NOT NULL,
  published BOOLEAN NOT NULL DEFAULT TRUE,
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE news
  ADD COLUMN IF NOT EXISTS image_url TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_news_published_created_at
ON news(published, created_at DESC);
