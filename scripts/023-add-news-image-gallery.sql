ALTER TABLE news
  ADD COLUMN IF NOT EXISTS image_urls TEXT[] NOT NULL DEFAULT '{}';

UPDATE news
SET image_urls = ARRAY[image_url]
WHERE COALESCE(cardinality(image_urls), 0) = 0
  AND image_url IS NOT NULL
  AND image_url <> '';
