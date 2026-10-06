ALTER TABLE `Seat`
  MODIFY `type` ENUM('STANDARD', 'VIP', 'SWEETBOX') NOT NULL DEFAULT 'STANDARD';

UPDATE `Room`
SET `name` = CASE MOD(`id` - 120001, 5)
  WHEN 0 THEN 'Phòng 01 Standard'
  WHEN 1 THEN 'Phòng 02 Premium'
  WHEN 2 THEN 'Phòng 03 Couple'
  WHEN 3 THEN 'Phòng 04 IMAX'
  ELSE 'Phòng 05 ScreenX'
END
WHERE `id` BETWEEN 120001 AND 120015;

UPDATE `Seat`
SET `type` = CASE
  WHEN `rowLabel` IN ('A', 'B') THEN 'STANDARD'
  WHEN `rowLabel` IN ('C', 'D') THEN 'VIP'
  ELSE 'SWEETBOX'
END
WHERE `roomId` BETWEEN 120001 AND 120015
  AND `rowLabel` IN ('A', 'B', 'C', 'D', 'E');

UPDATE `Seat`
SET `isActive` = CASE
  WHEN `rowLabel` = 'E' AND `seatNumber` > 4 THEN false
  ELSE true
END
WHERE `roomId` BETWEEN 120001 AND 120015
  AND `rowLabel` IN ('A', 'B', 'C', 'D', 'E')
  AND `seatNumber` BETWEEN 1 AND 8;
