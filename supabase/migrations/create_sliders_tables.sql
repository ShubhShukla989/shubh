-- Create sliders table
CREATE TABLE IF NOT EXISTS sliders (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  alias VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create slides table
CREATE TABLE IF NOT EXISTS slides (
  id SERIAL PRIMARY KEY,
  slider_id INTEGER NOT NULL REFERENCES sliders(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  alt VARCHAR(255) DEFAULT '',
  link TEXT,
  position INTEGER DEFAULT 0,
  visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sliders_alias ON sliders(alias);
CREATE INDEX IF NOT EXISTS idx_sliders_status ON sliders(status);
CREATE INDEX IF NOT EXISTS idx_slides_slider_id ON slides(slider_id);
CREATE INDEX IF NOT EXISTS idx_slides_position ON slides(position);
CREATE INDEX IF NOT EXISTS idx_slides_visible ON slides(visible);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_sliders_updated_at
  BEFORE UPDATE ON sliders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_slides_updated_at
  BEFORE UPDATE ON slides
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO sliders (title, alias, description, status, config) VALUES
('Homepage Slider', 'homepage-slider', 'Main slideshow for homepage', 'Active', 
 '{"autoplay": true, "interval": 5000, "transition": "slide", "pauseOnHover": true, "showArrows": true, "showDots": true, "lazyLoad": true, "lazyLoadDistance": 200, "order": "manual", "slidesPerView": {"desktop": 1, "tablet": 1, "mobile": 1}}'),
('Featured News', 'featured-news', 'Featured news articles slider', 'Active',
 '{"autoplay": true, "interval": 4000, "transition": "fade", "pauseOnHover": true, "showArrows": true, "showDots": true, "lazyLoad": true, "lazyLoadDistance": 200, "order": "manual", "slidesPerView": {"desktop": 3, "tablet": 2, "mobile": 1}}');

-- Grant permissions (adjust based on your RLS policies)
-- ALTER TABLE sliders ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE slides ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE sliders IS 'Stores slideshow configurations';
COMMENT ON TABLE slides IS 'Stores individual slides for each slideshow';
COMMENT ON COLUMN sliders.config IS 'JSON configuration for slider behavior (autoplay, interval, etc.)';
COMMENT ON COLUMN slides.position IS 'Order position of the slide (0-based index)';
COMMENT ON COLUMN slides.visible IS 'Whether the slide is visible in the slideshow';
