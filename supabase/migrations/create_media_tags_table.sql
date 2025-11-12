-- Create media_tags table
CREATE TABLE IF NOT EXISTS media_tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create media_files table to track uploaded media
CREATE TABLE IF NOT EXISTS media_files (
  id SERIAL PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  title VARCHAR(255),
  alt_text VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create media_file_tags junction table (many-to-many)
CREATE TABLE IF NOT EXISTS media_file_tags (
  id SERIAL PRIMARY KEY,
  media_file_id INTEGER REFERENCES media_files(id) ON DELETE CASCADE,
  media_tag_id INTEGER REFERENCES media_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(media_file_id, media_tag_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_media_files_filename ON media_files(filename);
CREATE INDEX IF NOT EXISTS idx_media_files_created ON media_files(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_tags_slug ON media_tags(slug);
CREATE INDEX IF NOT EXISTS idx_media_file_tags_media ON media_file_tags(media_file_id);
CREATE INDEX IF NOT EXISTS idx_media_file_tags_tag ON media_file_tags(media_tag_id);

-- Insert default tags
INSERT INTO media_tags (name, slug) VALUES
('Logo', 'logo'),
('Banner', 'banner'),
('Article Image', 'article-image'),
('Advertisement', 'advertisement')
ON CONFLICT (slug) DO NOTHING;
