ALTER TABLE `Booking`
  ADD COLUMN `seatSubtotal` DECIMAL(12, 0) NOT NULL DEFAULT 0,
  ADD COLUMN `serviceFee` DECIMAL(12, 0) NOT NULL DEFAULT 0,
  ADD COLUMN `concessionSubtotal` DECIMAL(12, 0) NOT NULL DEFAULT 0,
  ADD COLUMN `discountAmount` DECIMAL(12, 0) NOT NULL DEFAULT 0;

UPDATE `Booking`
SET `seatSubtotal` = `totalAmount`;
