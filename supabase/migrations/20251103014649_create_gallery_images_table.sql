/*
  # Create Gallery Images Table

  1. New Tables
    - `gallery_images`
      - `id` (uuid, primary key) - Unique identifier for each image
      - `image_url` (text, not null) - Full URL of the image
      - `title` (text) - Optional title/description for the image
      - `category` (text) - Optional category/tag for grouping images
      - `display_order` (integer) - Order in which images should be displayed
      - `created_at` (timestamptz) - Timestamp when the image was added
      - `updated_at` (timestamptz) - Timestamp when the image was last updated

  2. Security
    - Enable RLS on `gallery_images` table
    - Add policy for public read access (gallery is public)
    - Add policy for authenticated users to manage images

  3. Indexes
    - Add index on display_order for efficient sorting
    - Add index on category for filtering
*/

CREATE TABLE IF NOT EXISTS gallery_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  title text,
  category text,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;

-- Public can view all gallery images
CREATE POLICY "Anyone can view gallery images"
  ON gallery_images
  FOR SELECT
  USING (true);

-- Only authenticated users can insert images
CREATE POLICY "Authenticated users can insert gallery images"
  ON gallery_images
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only authenticated users can update images
CREATE POLICY "Authenticated users can update gallery images"
  ON gallery_images
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Only authenticated users can delete images
CREATE POLICY "Authenticated users can delete gallery images"
  ON gallery_images
  FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_gallery_images_display_order ON gallery_images(display_order);
CREATE INDEX IF NOT EXISTS idx_gallery_images_category ON gallery_images(category);
CREATE INDEX IF NOT EXISTS idx_gallery_images_created_at ON gallery_images(created_at DESC);