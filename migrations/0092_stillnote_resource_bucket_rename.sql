-- Migrate resource bucket metadata from legacy edgeever-resources to stillnote-resources.
PRAGMA foreign_keys = ON;

UPDATE resources
SET bucket_name = 'stillnote-resources'
WHERE bucket_name = 'edgeever-resources';

UPDATE resource_uploads
SET bucket_name = 'stillnote-resources'
WHERE bucket_name = 'edgeever-resources';
