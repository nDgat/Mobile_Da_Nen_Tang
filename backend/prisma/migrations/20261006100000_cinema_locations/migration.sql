ALTER TABLE Cinema
  ADD COLUMN latitude DECIMAL(10, 7) NULL,
  ADD COLUMN longitude DECIMAL(10, 7) NULL;

UPDATE Cinema SET latitude = 10.7769000, longitude = 106.7009000 WHERE id = 120001;
UPDATE Cinema SET latitude = 21.0285000, longitude = 105.8542000 WHERE id = 120002;
UPDATE Cinema SET latitude = 16.0544000, longitude = 108.2022000 WHERE id = 120003;