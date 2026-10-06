ALTER TABLE `Movie` ADD COLUMN `categories` JSON NULL;
UPDATE `Movie` SET `categories` = JSON_ARRAY(`category`);
ALTER TABLE `SiteBanner` ADD COLUMN `backgroundUrl` VARCHAR(2048) NOT NULL DEFAULT '';
