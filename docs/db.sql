-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               10.4.28-MariaDB - mariadb.org binary distribution
-- Server OS:                    Win64
-- HeidiSQL Version:             12.11.0.7065
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- Dumping structure for procedure custombid.AcceptBid
DELIMITER //
CREATE PROCEDURE `AcceptBid`(IN `bid_id` INT, IN `customer_id` INT)
BEGIN
  DECLARE bid_supplier_id INT;
  DECLARE bid_price DECIMAL(12,2);
  DECLARE commission_amount DECIMAL(12,2);
  DECLARE order_number VARCHAR(50);
  DECLARE request_id INT;
  
  -- Get bid details
  SELECT supplier_id, price, request_id INTO bid_supplier_id, bid_price, request_id
  FROM bids 
  WHERE id = bid_id AND request_id IN (SELECT id FROM requests WHERE customer_id = customer_id);
  
  -- Calculate commission
  CALL CalculateCommission(bid_price, commission_amount);
  
  -- Generate order number
  SET order_number = CONCAT('CB', YEAR(NOW()), LPAD(MONTH(NOW()), 2, '0'), LPAD(DAY(NOW()), 2, '0'), '-', LPAD(bid_id, 6, '0'));
  
  -- Start transaction
  START TRANSACTION;
  
  -- Update bid status
  UPDATE bids SET status = 'accepted', accepted_at = NOW() WHERE id = bid_id;
  
  -- Reject other bids for this request
  UPDATE bids SET status = 'cancelled' WHERE request_id = request_id AND id != bid_id AND status = 'pending';
  
  -- Create order
  INSERT INTO orders (bid_id, customer_id, supplier_id, order_number, total_amount, commission_amount, status, created_at)
  VALUES (bid_id, customer_id, bid_supplier_id, order_number, bid_price, commission_amount, 'confirmed', NOW());
  
  -- Log bid action
  INSERT INTO bid_actions (bid_id, action_type, performed_by, created_at)
  VALUES (bid_id, 'accept', customer_id, NOW());
  
  COMMIT;
  
  -- Return order details
  SELECT LAST_INSERT_ID() as order_id, order_number;
  
END//
DELIMITER ;

-- Dumping structure for table custombid.account_actions
CREATE TABLE IF NOT EXISTS `account_actions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `action_type` enum('deactivate','reactivate','suspend','unsuspend','password_change','email_change','profile_update') NOT NULL,
  `reason` text DEFAULT NULL,
  `performed_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `performed_by` (`performed_by`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_action_type` (`action_type`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `account_actions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `account_actions_ibfk_2` FOREIGN KEY (`performed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table custombid.account_actions: ~4 rows (approximately)
INSERT INTO `account_actions` (`id`, `user_id`, `action_type`, `reason`, `performed_by`, `created_at`) VALUES
	(1, 31, 'deactivate', 'Account deactivated by admin', 1, '2025-08-04 21:17:48'),
	(2, 31, 'reactivate', 'Account reactivated by admin', 1, '2025-08-04 21:18:27'),
	(3, 31, 'deactivate', 'Account deactivated by admin', 1, '2025-08-04 21:19:13'),
	(4, 31, 'reactivate', 'Account reactivated by admin', 1, '2025-08-04 21:19:17'),
	(5, 21, '', 'User details updated by admin', 1, '2025-08-05 15:35:50');

-- Dumping structure for view custombid.active_requests_with_bids
-- Creating temporary table to overcome VIEW dependency errors
CREATE TABLE `active_requests_with_bids` (
	`id` INT(11) NOT NULL,
	`customer_id` INT(11) NOT NULL,
	`title` VARCHAR(1) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`description` TEXT NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`budget_min` DECIMAL(12,2) NULL,
	`budget_max` DECIMAL(12,2) NULL,
	`currency` ENUM('EUR','USD') NULL COLLATE 'utf8mb4_unicode_ci',
	`delivery_date` DATE NULL,
	`time_flexibility` ENUM('critical','week','month') NULL COLLATE 'utf8mb4_unicode_ci',
	`priorities` LONGTEXT NULL COLLATE 'utf8mb4_unicode_ci',
	`status` ENUM('pending_categorization','open_for_bids','bids_received','in_progress','completed','cancelled','expired') NULL COLLATE 'utf8mb4_unicode_ci',
	`category_id` INT(11) NULL,
	`ai_categorized` TINYINT(1) NULL,
	`manually_categorized` TINYINT(1) NULL,
	`ai_confidence` DECIMAL(3,2) NULL,
	`ai_categories_suggested` LONGTEXT NULL COLLATE 'utf8mb4_unicode_ci',
	`ai_reasoning` TEXT NULL COLLATE 'utf8mb4_unicode_ci',
	`file_notes` TEXT NULL COLLATE 'utf8mb4_unicode_ci',
	`expires_at` TIMESTAMP NULL,
	`created_at` TIMESTAMP NOT NULL,
	`updated_at` TIMESTAMP NOT NULL,
	`category_name` VARCHAR(1) NULL COLLATE 'utf8mb4_unicode_ci',
	`customer_first_name` VARCHAR(1) NULL COLLATE 'utf8mb4_unicode_ci',
	`customer_last_name` VARCHAR(1) NULL COLLATE 'utf8mb4_unicode_ci',
	`customer_email` VARCHAR(1) NULL COLLATE 'utf8mb4_unicode_ci',
	`bid_count` BIGINT(21) NOT NULL,
	`min_bid_price` DECIMAL(10,2) NULL,
	`max_bid_price` DECIMAL(10,2) NULL,
	`avg_bid_price` DECIMAL(14,6) NULL
);

-- Dumping structure for table custombid.ai_categorization_log
CREATE TABLE IF NOT EXISTS `ai_categorization_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `request_id` int(11) NOT NULL,
  `attempt_number` int(11) DEFAULT 1,
  `ai_provider` varchar(50) DEFAULT 'openai',
  `suggested_category` varchar(255) DEFAULT NULL,
  `confidence_score` decimal(3,2) DEFAULT NULL,
  `reasoning` text DEFAULT NULL,
  `raw_response` longtext DEFAULT NULL,
  `processing_time_ms` int(11) DEFAULT NULL,
  `success` tinyint(1) DEFAULT 0,
  `error_message` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `tokens_used` int(11) DEFAULT NULL,
  `model_used` varchar(50) DEFAULT 'gpt-3.5-turbo',
  `prompt_tokens` int(11) DEFAULT NULL,
  `completion_tokens` int(11) DEFAULT NULL,
  `total_tokens` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_request_id` (`request_id`),
  KEY `idx_success` (`success`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `ai_categorization_log_ibfk_1` FOREIGN KEY (`request_id`) REFERENCES `requests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table custombid.ai_categorization_log: ~2 rows (approximately)
INSERT INTO `ai_categorization_log` (`id`, `request_id`, `attempt_number`, `ai_provider`, `suggested_category`, `confidence_score`, `reasoning`, `raw_response`, `processing_time_ms`, `success`, `error_message`, `created_at`, `tokens_used`, `model_used`, `prompt_tokens`, `completion_tokens`, `total_tokens`) VALUES
	(1, 22, 1, 'openai', 'Design', 0.90, 'The request involves designing and building an interactive exhibition stand, which falls under the category of design and creative services. The emphasis on creating engaging visitor experiences aligns with the creative aspect of design.', NULL, 1957, 1, NULL, '2025-07-09 19:21:43', 384, 'gpt-3.5-turbo', 314, 70, 384),
	(2, 23, 1, 'openai', 'Clothing', 0.90, 'The request involves creating content for a fashion brand, which falls under the clothing and fashion category. The mention of social media content for Instagram and Facebook further supports this categorization.', NULL, 3501, 1, NULL, '2025-07-09 19:25:56', 384, 'gpt-3.5-turbo', 316, 68, 384),
	(3, 24, 1, 'openai', 'Other', 0.90, 'The request involves creating a custom anti-aging serum for a luxury spa, which falls outside the traditional categories provided. Therefore, categorizing it as \'Other\' is the most appropriate choice.', NULL, 2501, 1, NULL, '2025-07-09 19:28:46', 387, 'gpt-3.5-turbo', 317, 70, 387),
	(4, 117, 1, 'openai', 'Other', 1.00, 'The request does not provide clear information about the type of product or service being sought, so it falls under the general \'Other\' category.', NULL, 8260, 1, NULL, '2025-08-05 18:40:12', 373, 'gpt-3.5-turbo', 313, 60, 373);

-- Dumping structure for table custombid.ai_categorization_queue
CREATE TABLE IF NOT EXISTS `ai_categorization_queue` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `request_id` int(11) NOT NULL,
  `priority` enum('low','normal','high','urgent') DEFAULT 'normal',
  `status` enum('pending','processing','completed','failed','cancelled') DEFAULT 'pending',
  `retry_count` int(11) DEFAULT 0,
  `max_retries` int(11) DEFAULT 3,
  `scheduled_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `started_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `error_message` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_request_id` (`request_id`),
  KEY `idx_status` (`status`),
  KEY `idx_priority` (`priority`),
  KEY `idx_scheduled_at` (`scheduled_at`),
  KEY `idx_ai_categorization_queue_status_priority` (`status`,`priority`,`scheduled_at`),
  CONSTRAINT `ai_categorization_queue_ibfk_1` FOREIGN KEY (`request_id`) REFERENCES `requests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table custombid.ai_categorization_queue: ~4 rows (approximately)
INSERT INTO `ai_categorization_queue` (`id`, `request_id`, `priority`, `status`, `retry_count`, `max_retries`, `scheduled_at`, `started_at`, `completed_at`, `error_message`, `created_at`, `updated_at`) VALUES
	(3, 22, 'normal', 'completed', 0, 3, '2025-07-09 19:21:38', '2025-07-09 19:21:41', '2025-07-09 19:21:43', NULL, '2025-07-09 19:21:38', '2025-07-09 19:21:43'),
	(5, 23, 'normal', 'completed', 0, 3, '2025-07-09 19:25:50', '2025-07-09 19:25:53', '2025-07-09 19:25:56', NULL, '2025-07-09 19:25:50', '2025-07-09 19:25:56'),
	(7, 24, 'normal', 'completed', 0, 3, '2025-07-09 19:28:38', '2025-07-09 19:28:43', '2025-07-09 19:28:46', NULL, '2025-07-09 19:28:38', '2025-07-09 19:28:46'),
	(9, 117, 'normal', 'completed', 0, 3, '2025-08-05 18:39:56', '2025-08-05 18:40:03', '2025-08-05 18:40:12', NULL, '2025-08-05 18:39:56', '2025-08-05 18:40:12');

-- Dumping structure for table custombid.ai_rate_limits
CREATE TABLE IF NOT EXISTS `ai_rate_limits` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `request_id` int(11) DEFAULT NULL,
  `error_message` text NOT NULL,
  `retry_after` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_request_id` (`request_id`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_ai_rate_limits_request_created` (`request_id`,`created_at`),
  CONSTRAINT `ai_rate_limits_ibfk_1` FOREIGN KEY (`request_id`) REFERENCES `requests` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table custombid.ai_rate_limits: ~0 rows (approximately)

-- Dumping structure for view custombid.ai_system_stats
-- Creating temporary table to overcome VIEW dependency errors
CREATE TABLE `ai_system_stats` (
	`metric_type` VARCHAR(1) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`total_count` DECIMAL(32,0) NULL,
	`last_hour` DECIMAL(32,0) NULL,
	`last_24h` DECIMAL(32,0) NULL,
	`last_occurrence` TIMESTAMP NULL
);

-- Dumping structure for table custombid.ai_usage_log
CREATE TABLE IF NOT EXISTS `ai_usage_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tokens_used` int(11) NOT NULL,
  `requests_made` int(11) NOT NULL DEFAULT 1,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_timestamp` (`timestamp`),
  KEY `idx_ai_usage_log_timestamp` (`timestamp`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table custombid.ai_usage_log: ~1 rows (approximately)
INSERT INTO `ai_usage_log` (`id`, `tokens_used`, `requests_made`, `timestamp`) VALUES
	(4, 373, 1, '2025-08-05 18:40:11');

-- Dumping structure for table custombid.anonymous_suppliers
CREATE TABLE IF NOT EXISTS `anonymous_suppliers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `supplier_id` int(11) NOT NULL,
  `request_id` int(11) NOT NULL,
  `anonymous_name` varchar(50) NOT NULL,
  `anonymous_rating` decimal(3,2) DEFAULT 0.00,
  `anonymous_review_count` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_supplier_request_anon` (`supplier_id`,`request_id`),
  KEY `idx_request_id` (`request_id`),
  KEY `idx_supplier_id` (`supplier_id`),
  KEY `idx_anonymous_name` (`anonymous_name`),
  CONSTRAINT `anonymous_suppliers_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `anonymous_suppliers_ibfk_2` FOREIGN KEY (`request_id`) REFERENCES `requests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table custombid.anonymous_suppliers: ~17 rows (approximately)
INSERT INTO `anonymous_suppliers` (`id`, `supplier_id`, `request_id`, `anonymous_name`, `anonymous_rating`, `anonymous_review_count`, `created_at`) VALUES
	(1, 3, 17, 'Supplier A', 4.50, 12, '2025-07-05 10:00:00'),
	(2, 8, 17, 'Supplier B', 4.90, 35, '2025-07-05 11:30:00'),
	(3, 5, 17, 'Supplier C', 4.80, 15, '2025-07-05 09:15:00'),
	(4, 3, 18, 'Supplier A', 4.50, 12, '2025-07-05 12:00:00'),
	(5, 8, 18, 'Supplier B', 4.90, 35, '2025-07-05 13:45:00'),
	(6, 5, 18, 'Supplier C', 4.80, 15, '2025-07-05 14:20:00'),
	(7, 6, 18, 'Supplier D', 4.60, 22, '2025-07-05 15:30:00'),
	(8, 4, 19, 'Supplier A', 4.75, 8, '2025-07-05 16:00:00'),
	(9, 9, 19, 'Supplier B', 4.70, 18, '2025-07-05 16:30:00'),
	(10, 6, 19, 'Supplier C', 4.60, 22, '2025-07-05 17:00:00'),
	(11, 3, 19, 'Supplier D', 4.50, 12, '2025-07-05 17:30:00'),
	(12, 20, 103, 'Supplier A', 4.80, 45, '2025-07-20 11:20:25'),
	(13, 23, 103, 'Supplier B', 4.70, 28, '2025-07-20 11:20:25'),
	(14, 21, 106, 'Supplier A', 4.60, 32, '2025-07-20 11:20:25'),
	(15, 22, 108, 'Supplier A', 4.90, 67, '2025-07-20 11:20:25'),
	(16, 23, 110, 'Supplier A', 4.70, 28, '2025-07-20 11:20:25'),
	(17, 25, 114, 'Supplier A', 4.90, 23, '2025-07-20 11:20:25'),
	(18, 20, 101, 'Supplier A', 4.80, 45, '2025-07-20 12:40:44'),
	(19, 20, 102, 'Supplier A', 4.80, 45, '2025-07-22 11:03:19');

-- Dumping structure for table custombid.api_performance_log
CREATE TABLE IF NOT EXISTS `api_performance_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `endpoint` varchar(255) NOT NULL,
  `method` varchar(10) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `response_time_ms` decimal(10,2) NOT NULL,
  `status_code` int(11) NOT NULL,
  `user_agent` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_endpoint_method` (`endpoint`,`method`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_response_time` (`response_time_ms`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table custombid.api_performance_log: ~0 rows (approximately)

-- Dumping structure for table custombid.auth_logs
CREATE TABLE IF NOT EXISTS `auth_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `action` enum('login','logout','login_failed','password_change','password_reset','email_verification','token_refresh','session_expired','account_locked','account_unlocked','registration') NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `success` tinyint(1) DEFAULT 1,
  `failure_reason` text DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_action` (`action`),
  KEY `idx_success` (`success`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_ip_address` (`ip_address`)
) ENGINE=InnoDB AUTO_INCREMENT=79 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table custombid.auth_logs: ~77 rows (approximately)
INSERT INTO `auth_logs` (`id`, `user_id`, `action`, `ip_address`, `user_agent`, `success`, `failure_reason`, `metadata`, `created_at`) VALUES
	(1, 34, 'registration', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 1, NULL, '{"userType":"customer"}', '2025-08-13 22:17:04'),
	(2, 35, 'registration', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 1, NULL, '{"userType":"customer"}', '2025-08-13 22:25:24'),
	(3, 36, 'registration', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 1, NULL, '{"userType":"customer"}', '2025-08-13 22:32:13'),
	(4, 34, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 1, NULL, '{"userType":"customer","sessionId":"f8fe106e1d599616678c7db1a61268fff1a6389f9014c7ddb12bbdde3c52f826"}', '2025-08-13 22:37:37'),
	(5, 34, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 1, NULL, '{"userType":"customer","sessionId":"48b2ff52260f6741410d11f30485687a88fd13348583557ecb8e553e00e9926d"}', '2025-08-13 22:39:38'),
	(6, 34, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 1, NULL, '{"userType":"customer","sessionId":"34517428f630be0d8bb0870ef87faf11a66747de309dde018fa4e24521f21da2"}', '2025-08-13 22:41:15'),
	(7, 34, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 1, NULL, '{"userType":"customer","sessionId":"bf873a286851496c08be149ebf63b61f5f2d7ef44f4e420123de10b0e2f7072e"}', '2025-08-13 22:42:20'),
	(8, 34, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 1, NULL, '{"userType":"customer","sessionId":"6b81da0f2d92f5c0ee236938bbaa7b55e5b0c3f19eb3165b793a0cb38571fbb1"}', '2025-08-13 22:59:04'),
	(9, 34, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 1, NULL, '{"userType":"customer","sessionId":"261d4077ada334e067435303754aa6aace126229a878d1965399b1251ea6b5c5"}', '2025-08-14 16:07:51'),
	(10, 7, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 1, NULL, '{"userType":"customer","sessionId":"0feaef19caa3759c9062cb3f17d139f225a4d7386f9ed4dcaf12cabb67fde4d2"}', '2025-08-14 16:12:37'),
	(11, 7, 'logout', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 1, NULL, '{}', '2025-08-14 16:12:51'),
	(12, 7, 'login_failed', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 0, 'Invalid password', '{"failureReason":"Invalid password"}', '2025-08-14 16:13:08'),
	(13, 7, 'login_failed', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 0, 'Invalid password', '{"failureReason":"Invalid password"}', '2025-08-14 16:26:19'),
	(14, 7, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 1, NULL, '{"userType":"customer","sessionId":"cdb0fcd3fd3872fd992533ac6372da45f4b7984eccc6b1461b96a62af1fe285f"}', '2025-08-14 16:35:53'),
	(15, 7, 'logout', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 1, NULL, '{}', '2025-08-14 16:36:01'),
	(16, 7, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 1, NULL, '{"userType":"customer","sessionId":"85909097f869b2b7f4b8540f53a2fecf1fda90cbc5f8f4aa8264c3c20d63fa10"}', '2025-08-15 13:41:45'),
	(17, 7, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 1, NULL, '{"userType":"customer","sessionId":"1b246832942eab1a5c227f200f97a687428d0f5b5b35c31df84fd0d1072e7db0"}', '2025-08-15 23:57:39'),
	(18, 7, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 1, NULL, '{"userType":"customer","sessionId":"cf2ea8431e9d9fedabe92e6658248ade0a4ac19600427325950df128be4629aa"}', '2025-08-18 17:24:49'),
	(19, 7, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 1, NULL, '{"userType":"customer","sessionId":"86d5af2098e8cbc76e3f6ceca0f4e18df949c928cdb372f69c5d08f962d93f44"}', '2025-08-18 17:47:43'),
	(20, 7, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 1, NULL, '{"userType":"customer","sessionId":"69bbf1baa258e78ddde87bb7f8cebcf75413108c1b4c4f3bb1030d8e6cd251b7"}', '2025-08-18 18:13:17'),
	(21, 7, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 1, NULL, '{"userType":"customer","sessionId":"c13129a2a0c1eab880b4272429b7898693bb80aa2957b4d39dd2d3995ac1a315"}', '2025-08-18 20:57:56'),
	(22, 7, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 1, NULL, '{"userType":"customer","sessionId":"26d622408c0ee8c251914e05e6c6623dd0e9fd69652d85597c00a4c8d0d78dd7"}', '2025-08-18 20:58:26'),
	(23, 7, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 1, NULL, '{"userType":"customer","sessionId":"df598df8f8ec9ca88f87c289785b8e60bb1da0f139dec0d5f1d24c056f2c94b3"}', '2025-08-19 07:41:13'),
	(24, 7, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 1, NULL, '{"userType":"customer","sessionId":"5d9e215d18773308c2652b1f8b5dfce8e23721568ab4543fe397035969b2f84c"}', '2025-08-19 10:03:55'),
	(25, 7, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 1, NULL, '{"userType":"customer","sessionId":"8b43b8c880a89e0ff73032d6ebf62b0fdf3e08d89e018df9048f96693e31a1b8"}', '2025-08-19 10:33:32'),
	(26, 7, 'logout', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 1, NULL, '{}', '2025-08-19 12:54:12'),
	(27, 20, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 1, NULL, '{"userType":"supplier","sessionId":"a68b346729988503fe74e70bd8c05c7c1e12649be5b1e8d37ec696f50b6056bb"}', '2025-08-19 12:54:22'),
	(28, 20, 'logout', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 1, NULL, '{}', '2025-08-19 12:55:52'),
	(29, 7, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 1, NULL, '{"userType":"customer","sessionId":"4da8b5adce8b4da3f74e71b0716126cda84b2d08759f6cdd60b904f352ea4327"}', '2025-08-19 12:56:04'),
	(30, 7, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 1, NULL, '{"userType":"customer","sessionId":"b789bc8313ea5afce6fc7ffec0d9158c7b529a373e6e14ab5aade343052d4b23"}', '2025-08-19 21:00:37'),
	(31, 7, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 1, NULL, '{"userType":"customer","sessionId":"321515359c4e3ac8e711298408301bdb91a117de724ad9b2332ff22df411b393"}', '2025-08-20 15:57:21'),
	(32, 7, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 1, NULL, '{"userType":"customer","sessionId":"65294a11ca5cd2a1547f53b45688123a83a4a95549a74ade3f699cb799945e87"}', '2025-08-20 16:58:00'),
	(33, 7, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 1, NULL, '{"userType":"customer","sessionId":"08cb381bb2c713efcd4ee0ecf6d487eece41394dea30aa1549a1eb758d6d6611"}', '2025-08-20 17:34:06'),
	(34, 7, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 1, NULL, '{"userType":"customer","sessionId":"540353725dc4587b3c888f7169b1c1d94050388e1a797cdc287d0a62d16b3715"}', '2025-08-20 18:12:13'),
	(35, 7, 'login_failed', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 0, 'Invalid password', '{"failureReason":"Invalid password"}', '2025-08-20 19:10:53'),
	(36, 7, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 1, NULL, '{"userType":"customer","sessionId":"9ed3e6479123dd886f02035fe111cd5c04e36dd2de480a6115545dfb296416da"}', '2025-08-20 19:49:21'),
	(37, 7, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 1, NULL, '{"userType":"customer","sessionId":"37b90bdf4660563bf1c4ec3b5bfa4c232de172c6ef266ab66152d0e9e2c035de"}', '2025-08-20 20:21:58'),
	(38, 7, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 1, NULL, '{"userType":"customer","sessionId":"a0031bbe30bf659376652dc49b9add4de7f732e722f649adcfa01681a46eb448"}', '2025-08-20 20:45:26'),
	(39, 7, 'login_failed', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 0, 'Invalid password', '{"failureReason":"Invalid password"}', '2025-08-20 21:09:12'),
	(40, 7, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 1, NULL, '{"userType":"customer","sessionId":"9f46a75058b3e68b0e0ecf31d5f82a8141d811dce622cbe38fb1970b02916ab9"}', '2025-08-20 21:09:34'),
	(41, 7, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 1, NULL, '{"userType":"customer","sessionId":"5c5b15f661209364b753eeb1429ff5af41025d954bed3acc6a61dbbcd7d275a4"}', '2025-08-20 22:31:18'),
	(42, 7, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 1, NULL, '{"userType":"customer","sessionId":"1669eb3fe23b07f2860e71769ea56108915fa46115d0f6bc62046688f5df7e5c"}', '2025-08-21 21:53:39'),
	(43, 7, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 1, NULL, '{"userType":"customer","sessionId":"9225c7a263c9be0f0a701a51ce65b9ac341c2a9ec415e7cd496935c36418a5a6"}', '2025-08-22 11:14:32'),
	(44, 7, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 1, NULL, '{"userType":"customer","sessionId":"10f946776d2da65f0da98429c32947aae461c3c2783bcffe21cdc04277f44ec1"}', '2025-08-22 12:25:17'),
	(45, 7, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 1, NULL, '{"userType":"customer","sessionId":"52c31894f3ff1dd6af8ca955b98ea3eeef1c36b2b0cfa39c1e1cd3277c285626"}', '2025-08-22 12:58:15'),
	(46, 7, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 1, NULL, '{"userType":"customer","sessionId":"71b69d74acf1e0427eb359cd18a88ac3c23a59f0b7879ae4a585dc2819244838"}', '2025-08-22 16:01:36'),
	(47, 7, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 1, NULL, '{"userType":"customer","sessionId":"37d12dce8eccccae6f2461d05c777df442e5b92211b0875f29df876b42bdfdcb"}', '2025-08-22 17:23:15'),
	(48, 7, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 1, NULL, '{"userType":"customer","sessionId":"26cea2ed0f4c4a02e81b18360b76c257083239efaa395ce17957a6bcdd705ccc"}', '2025-08-22 18:09:35'),
	(49, NULL, 'registration', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 0, 'User with this email already exists', '{"email":"aviv@mail.com","userType":"supplier","failureReason":"User with this email already exists"}', '2025-08-22 23:12:13'),
	(50, 7, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 1, NULL, '{"userType":"customer","sessionId":"f49822a27354432c42b77e3af70b9bafc50369437ccd9ce8f05b7a80a94533b1"}', '2025-08-22 23:13:22'),
	(51, 7, 'logout', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 1, NULL, '{}', '2025-08-23 08:38:02'),
	(52, 7, 'login_failed', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 0, 'Invalid password', '{"failureReason":"Invalid password"}', '2025-08-23 15:04:49'),
	(53, 7, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 1, NULL, '{"userType":"customer","sessionId":"241ef29c4575f977cf866bc0972e7da159ad34aef947d66b317e3af51059a817"}', '2025-08-23 15:05:03'),
	(54, 7, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 1, NULL, '{"userType":"customer","sessionId":"e01ba7a30f76bb554f1b08be357fdf40fab59caad783d8ea65a3eafa68a2c266"}', '2025-08-23 15:35:26'),
	(55, 20, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 1, NULL, '{"userType":"supplier","sessionId":"cd893ae7c0987b2b0559a918c47e79d279740426014ef028cc5073f9ef7d3065"}', '2025-08-23 22:57:35'),
	(56, 7, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 1, NULL, '{"userType":"customer","sessionId":"26c4dff8a960eb712e2aed3b63fcd6e509ab895845d152a81057b2fb1a55cd44"}', '2025-08-25 08:50:48'),
	(57, 20, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 1, NULL, '{"userType":"supplier","sessionId":"a45288d2dd6cc2112a79a86934ee755b49f478be6eaee749f14341c8cb470057"}', '2025-08-25 08:57:57'),
	(58, 7, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 1, NULL, '{"userType":"customer","sessionId":"fd689934d018fefffb3b59b8f158765dddebd0b5696659a8a85beff900bbb78a"}', '2025-08-26 16:32:25'),
	(59, 7, 'logout', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 1, NULL, '{}', '2025-08-26 16:33:22'),
	(60, 20, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 1, NULL, '{"userType":"supplier","sessionId":"480b93761849a99505ed0f87305697b917210c5c78cfe3ffaddf66fe867d750d"}', '2025-08-26 16:33:44'),
	(61, 20, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 1, NULL, '{"userType":"supplier","sessionId":"11c47ec94f4ba7c97fb479a5201f94e126dab2d37ced7a61f710ed29a67ea23b"}', '2025-08-26 16:58:13'),
	(62, 20, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 1, NULL, '{"userType":"supplier","sessionId":"4d568a5d1eac4396b2528798194004dc7820ec3673b1070217795a5cd6e127fb"}', '2025-08-26 17:20:23'),
	(63, 20, 'login_failed', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 0, 'Invalid password', '{"failureReason":"Invalid password"}', '2025-08-26 17:44:56'),
	(64, 20, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 1, NULL, '{"userType":"supplier","sessionId":"caebac67370d630bb5333e047804fa8149d3861ce2b25042e07e3b5012a24114"}', '2025-08-26 17:46:58'),
	(65, 7, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 1, NULL, '{"userType":"customer","sessionId":"c1755ea3bb01fb55a401f7f78aba845640bc843c6559f7338682a5580b52394f"}', '2025-08-26 20:28:56'),
	(66, 7, 'logout', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 1, NULL, '{}', '2025-08-26 20:46:09'),
	(67, 7, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 1, NULL, '{"userType":"customer","sessionId":"6397e1346305b9692efec1882a169b2d477a732a5fa80ca2aeeaf8a8117d25a2"}', '2025-08-26 20:56:15'),
	(68, 7, 'logout', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 1, NULL, '{}', '2025-08-26 20:57:08'),
	(69, 7, 'login_failed', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 0, 'Invalid password', '{"failureReason":"Invalid password"}', '2025-10-08 12:56:52'),
	(70, 7, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL, '{"userType":"customer","sessionId":"a1a441a21d3420d33f696ed4b93b092f97e7721fdfb5405041ec5c7eb49b9612"}', '2025-10-08 12:57:36'),
	(71, 7, 'logout', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL, '{}', '2025-10-08 12:58:44'),
	(72, 20, 'login_failed', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 0, 'Invalid password', '{"failureReason":"Invalid password"}', '2025-10-08 12:59:06'),
	(73, 20, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL, '{"userType":"supplier","sessionId":"615ed7e6afd1cd4d96dff288b5a1d4fce04f50f50795be3f263a7444066dc7ae"}', '2025-10-08 12:59:27'),
	(74, 7, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL, '{"userType":"customer","sessionId":"edc100a697b5e139c92ca17dbd4f2022fb686280ed444b4e1077f7c85875db8a"}', '2025-10-09 10:50:51'),
	(75, 7, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL, '{"userType":"customer","sessionId":"6bc5326c5ba5aa9175e463727851ab30ec7b2b746bf46fd6a01ad4df5e6114e6"}', '2025-10-09 11:19:34'),
	(76, 7, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL, '{"userType":"customer","sessionId":"74756d7ede90536556f303534bd04d6f5856f5a6fcd2e8622766696c671f05b8"}', '2025-10-09 11:20:03'),
	(77, 7, 'logout', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL, '{}', '2025-10-09 11:25:38'),
	(78, 20, 'login_failed', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 0, 'Invalid password', '{"failureReason":"Invalid password"}', '2025-10-09 11:27:44'),
	(79, 7, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL, '{"userType":"customer","sessionId":"a4fe11f1ab7d0237ada4e8248571576cef8580e18bdb18a47f33b719b46faad6"}', '2025-10-13 16:36:31'),
	(80, 7, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL, '{"userType":"customer","sessionId":"79e034c3bdabd22de6c34f833b108c181af047f991be2e899af0ae188a927f72"}', '2025-10-13 16:37:11'),
	(81, 7, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL, '{"userType":"customer","sessionId":"a14d2de9012d5548ca0909ec4599d73a0dfae2b1f7233b537df86b6a68fe6c67"}', '2025-10-13 16:38:19'),
	(82, 7, 'login_failed', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 0, 'Invalid password', '{"failureReason":"Invalid password"}', '2025-10-13 16:38:42'),
	(83, 7, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL, '{"userType":"customer","sessionId":"c2cbf6c02220e1ae34c34e1e36aee9bf5faf3305f242de13efd4f3bbe8de4973"}', '2025-10-13 16:38:48'),
	(84, 7, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL, '{"userType":"customer","sessionId":"caf66d7393fa4b4df2f35631cda1ee1d88f6c644e43015cafd64df07b5e345df"}', '2025-10-13 16:43:07'),
	(85, 7, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL, '{"userType":"customer","sessionId":"6fde7406c46e7f64504f3bf4900419074c77e205784ad37a2acf82cd8269c199"}', '2025-10-13 16:46:11'),
	(86, 7, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL, '{"userType":"customer","sessionId":"133eabcb02a49dd3fff99ce910deac941a1e8bb94cb445dd8713f350b21cf4d2"}', '2025-10-13 16:47:29'),
	(87, 7, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL, '{"userType":"customer","sessionId":"af7540bd0602c88d6df5ef39971a1be861c522b0cb54efc5fe5709c75431277e"}', '2025-10-13 19:15:51'),
	(88, 7, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL, '{"userType":"customer","sessionId":"ee1140d88df896065b526ea4ec2bd6ccfadc03a3d0f0236b5bcaf64851026c53"}', '2025-10-13 19:55:10'),
	(89, 7, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL, '{"userType":"customer","sessionId":"36c456b0a339a23158107fcdea07c57db3c376d9cfb786bc787ba05c319c3065"}', '2025-10-13 21:08:10'),
	(90, 7, 'login_failed', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 0, 'Invalid password', NULL, '2025-10-13 23:13:34'),
	(91, 7, 'login_failed', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 0, 'Invalid password', NULL, '2025-10-13 23:13:47'),
	(92, 7, 'login_failed', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 0, 'Invalid password', NULL, '2025-10-13 23:16:23'),
	(93, 7, 'login_failed', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 0, 'Invalid password', NULL, '2025-10-13 23:18:59'),
	(94, 7, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL, NULL, '2025-10-13 23:19:15'),
	(95, 7, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL, NULL, '2025-10-14 00:10:27'),
	(96, 7, 'login_failed', '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 0, 'Invalid password', NULL, '2025-10-14 00:13:01'),
	(97, 7, 'login', '::ffff:127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL, NULL, '2025-10-14 00:13:05'),
	(98, 7, 'login_failed', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 0, 'Invalid password', NULL, '2025-10-14 12:57:56'),
	(99, 7, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL, NULL, '2025-10-14 12:58:03'),
	(100, 7, 'login', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 1, NULL, NULL, '2025-10-14 13:58:55'),
	(101, NULL, 'login_failed', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 0, 'Invalid credentials', NULL, '2025-10-14 14:45:40'),
	(102, NULL, 'login_failed', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 0, 'Invalid credentials', NULL, '2025-10-14 14:45:43');

-- Dumping structure for table custombid.bids
CREATE TABLE IF NOT EXISTS `bids` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `request_id` int(11) NOT NULL,
  `supplier_id` int(11) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `delivery_time_days` int(11) NOT NULL,
  `description` text DEFAULT NULL,
  `proposal_details` text DEFAULT NULL,
  `materials_cost` decimal(12,2) DEFAULT NULL,
  `labor_cost` decimal(12,2) DEFAULT NULL,
  `other_costs` decimal(12,2) DEFAULT NULL,
  `status` enum('pending','accepted','rejected','cancelled','expired') DEFAULT 'pending',
  `response_time_hours` int(11) DEFAULT 0,
  `expires_at` timestamp NULL DEFAULT NULL,
  `accepted_at` timestamp NULL DEFAULT NULL,
  `rejected_at` timestamp NULL DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_supplier_request` (`supplier_id`,`request_id`),
  KEY `idx_request_id` (`request_id`),
  KEY `idx_supplier_id` (`supplier_id`),
  KEY `idx_status` (`status`),
  KEY `idx_price` (`price`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_bids_request_status_created` (`request_id`,`status`,`created_at`),
  KEY `idx_bids_request_supplier_status` (`request_id`,`supplier_id`,`status`),
  KEY `idx_bids_price_status` (`price`,`status`),
  KEY `idx_bids_supplier_status` (`supplier_id`,`status`),
  KEY `idx_bids_request_status` (`request_id`,`status`),
  CONSTRAINT `bids_ibfk_1` FOREIGN KEY (`request_id`) REFERENCES `requests` (`id`) ON DELETE CASCADE,
  CONSTRAINT `bids_ibfk_2` FOREIGN KEY (`supplier_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table custombid.bids: ~19 rows (approximately)
INSERT INTO `bids` (`id`, `request_id`, `supplier_id`, `price`, `delivery_time_days`, `description`, `proposal_details`, `materials_cost`, `labor_cost`, `other_costs`, `status`, `response_time_hours`, `expires_at`, `accepted_at`, `rejected_at`, `rejection_reason`, `created_at`, `updated_at`) VALUES
	(1, 17, 3, 32.50, 7, 'Custom electronic time device prototype', 'I can create a conceptual time machine device using advanced electronics and LED displays. This will be a prototype demonstration unit.', 15.00, 12.50, 5.00, 'pending', 2, NULL, NULL, NULL, NULL, '2025-07-05 10:00:00', '2025-07-05 10:00:00'),
	(2, 17, 8, 29.99, 10, 'Tech-based time visualization system', 'Advanced digital display system with time manipulation interface. Perfect for demonstrations and prototypes.', 10.00, 15.00, 4.99, 'pending', 3, NULL, NULL, NULL, NULL, '2025-07-05 11:30:00', '2025-07-05 11:30:00'),
	(3, 17, 5, 34.00, 5, 'Creative time machine design', 'Artistic interpretation of time travel concept with interactive elements and custom design work.', 8.00, 20.00, 6.00, 'pending', 1, NULL, NULL, NULL, NULL, '2025-07-05 09:15:00', '2025-07-05 09:15:00'),
	(4, 18, 3, 6500.00, 30, 'Custom electronics solution for project', 'Comprehensive electronics package including custom circuits, components, and assembly. Professional grade solution.', 2500.00, 3500.00, 500.00, 'pending', 4, NULL, NULL, NULL, NULL, '2025-07-05 12:00:00', '2025-07-05 12:00:00'),
	(5, 18, 8, 5800.00, 25, 'Advanced technology implementation', 'Complete tech solution with software integration, hardware development, and system testing. Includes documentation and support.', 2000.00, 3200.00, 600.00, 'pending', 6, NULL, NULL, NULL, NULL, '2025-07-05 13:45:00', '2025-07-05 13:45:00'),
	(6, 18, 5, 7200.00, 35, 'Premium design and development service', 'Full-service design and development with multiple revisions, premium materials, and extended support package.', 3000.00, 3500.00, 700.00, 'pending', 5, NULL, NULL, NULL, NULL, '2025-07-05 14:20:00', '2025-07-05 14:20:00'),
	(7, 18, 6, 6800.00, 40, 'Handcrafted custom solution', 'Artisan-quality custom work with premium materials and detailed craftsmanship. Includes maintenance and warranty.', 2800.00, 3500.00, 500.00, 'pending', 8, NULL, NULL, NULL, NULL, '2025-07-05 15:30:00', '2025-07-05 15:30:00'),
	(8, 19, 4, 85.00, 14, 'Custom metal desk fabrication', 'Professional metal desk with powder coating finish. Includes custom dimensions and sturdy construction.', 35.00, 40.00, 10.00, 'pending', 2, NULL, NULL, NULL, NULL, '2025-07-05 16:00:00', '2025-07-05 16:00:00'),
	(9, 19, 9, 78.50, 12, 'Office furniture desk solution', 'Modern office desk with metal frame and professional finish. Ergonomic design with cable management.', 30.00, 35.00, 13.50, 'pending', 3, NULL, NULL, NULL, NULL, '2025-07-05 16:30:00', '2025-07-05 16:30:00'),
	(10, 19, 6, 89.99, 18, 'Premium handcrafted metal desk', 'Artisan-quality metal desk with custom finish and premium materials. Includes assembly and delivery.', 40.00, 35.00, 14.99, 'pending', 4, NULL, NULL, NULL, NULL, '2025-07-05 17:00:00', '2025-07-05 17:00:00'),
	(11, 19, 3, 72.00, 10, 'Industrial metal desk design', 'Sturdy industrial-style metal desk with clean lines and durable construction. Perfect for office use.', 25.00, 35.00, 12.00, 'pending', 1, NULL, NULL, NULL, NULL, '2025-07-05 17:30:00', '2025-07-05 17:30:00'),
	(12, 103, 20, 1800.00, 25, 'Complete PCB design and manufacturing solution', 'Full service including schematic design, PCB layout, component sourcing, and assembly. Quality testing included.', 800.00, 800.00, 200.00, 'pending', 4, NULL, NULL, NULL, NULL, '2025-07-18 11:20:25', '2025-07-20 11:20:25'),
	(13, 103, 23, 1650.00, 30, 'Professional PCB manufacturing', 'Precision manufacturing with quality assurance. Fast turnaround with competitive pricing.', 700.00, 750.00, 200.00, 'pending', 6, NULL, NULL, NULL, NULL, '2025-07-19 11:20:25', '2025-07-20 11:20:25'),
	(14, 106, 21, 2200.00, 21, 'Custom kitchen island with premium materials', 'Solid wood construction with granite countertop. Professional installation included.', 1200.00, 800.00, 200.00, 'pending', 2, NULL, NULL, NULL, NULL, '2025-07-16 11:20:25', '2025-07-20 11:20:25'),
	(15, 108, 22, 750.00, 14, 'Eco-friendly packaging design', 'Sustainable design solutions with modern aesthetics. Complete brand alignment.', 200.00, 450.00, 100.00, 'pending', 3, NULL, NULL, NULL, NULL, '2025-07-19 11:20:25', '2025-07-20 11:20:25'),
	(16, 110, 23, 650.00, 5, 'High-quality rapid prototyping', 'Professional 3D printing with multiple material options. Fast iterations and finishing.', 250.00, 300.00, 100.00, 'pending', 1, NULL, NULL, NULL, NULL, '2025-07-19 15:20:25', '2025-07-20 11:20:25'),
	(17, 114, 25, 1250.00, 10, 'Custom trophy design and creation', 'Handcrafted trophies with premium materials and custom engraving.', 500.00, 600.00, 150.00, 'pending', 5, NULL, NULL, NULL, NULL, '2025-07-19 17:20:25', '2025-07-20 11:20:25'),
	(18, 101, 20, 899.99, 10, 'I will build for you a Custom IoT Device for Smart Home', NULL, NULL, NULL, NULL, 'pending', 0, NULL, NULL, NULL, NULL, '2025-07-20 12:40:44', '2025-07-20 12:40:44'),
	(19, 102, 20, 470.00, 7, 'Professionl LED Display Board for Store\n\n\n FOR YOU!!!', NULL, NULL, NULL, NULL, 'pending', 0, NULL, NULL, NULL, NULL, '2025-07-22 11:03:19', '2025-07-22 11:03:19');

-- Dumping structure for table custombid.bid_actions
CREATE TABLE IF NOT EXISTS `bid_actions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `bid_id` int(11) NOT NULL,
  `action_type` enum('accept','reject','cancel') NOT NULL,
  `performed_by` int(11) NOT NULL,
  `reason` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_bid_id` (`bid_id`),
  KEY `idx_action_type` (`action_type`),
  KEY `idx_performed_by` (`performed_by`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `bid_actions_ibfk_1` FOREIGN KEY (`bid_id`) REFERENCES `bids` (`id`) ON DELETE CASCADE,
  CONSTRAINT `bid_actions_ibfk_2` FOREIGN KEY (`performed_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Comprehensive bid action logging for audit and analytics';

-- Dumping data for table custombid.bid_actions: ~0 rows (approximately)

-- Dumping structure for procedure custombid.CalculateCommission
DELIMITER //
CREATE PROCEDURE `CalculateCommission`(IN `order_amount` DECIMAL(10,2), OUT `commission_amount` DECIMAL(10,2))
BEGIN
  DECLARE commission_rate DECIMAL(4,2) DEFAULT 0.05; -- 5%
  DECLARE min_commission DECIMAL(4,2) DEFAULT 1.00; -- $1 minimum
  
  SET commission_amount = GREATEST(order_amount * commission_rate, min_commission);
END//
DELIMITER ;

-- Dumping structure for table custombid.categories
CREATE TABLE IF NOT EXISTS `categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `idx_parent_active` (`parent_id`,`is_active`),
  KEY `idx_name` (`name`),
  CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table custombid.categories: ~15 rows (approximately)
INSERT INTO `categories` (`id`, `name`, `description`, `parent_id`, `is_active`, `created_at`, `updated_at`) VALUES
	(1, 'Electronics', 'Electronic devices and components', NULL, 1, '2025-06-27 19:42:14', '2025-06-27 19:42:14'),
	(2, 'Manufacturing', 'Manufacturing and production services', NULL, 1, '2025-06-27 19:42:14', '2025-06-27 19:42:14'),
	(3, 'Software', 'Software development and IT services', NULL, 1, '2025-06-27 19:42:14', '2025-08-03 11:49:08'),
	(4, 'Construction', 'Construction and building services', NULL, 1, '2025-06-27 19:42:14', '2025-06-27 19:42:14'),
	(5, 'Design', 'Design and creative services', NULL, 1, '2025-06-27 19:42:14', '2025-06-27 19:42:14'),
	(6, 'Marketing', 'Marketing and advertising services', NULL, 1, '2025-06-27 19:42:14', '2025-06-27 19:42:14'),
	(7, 'Consulting', 'Consulting and professional services', NULL, 1, '2025-06-27 19:42:14', '2025-08-03 11:51:06'),
	(8, 'Art', 'Art and creative works', NULL, 1, '2025-06-27 19:42:14', '2025-08-05 15:36:42'),
	(9, 'Furniture', 'Furniture and home furnishing', NULL, 1, '2025-06-27 19:42:14', '2025-06-27 19:42:14'),
	(10, 'Clothing', 'Clothing and fashion', NULL, 1, '2025-06-27 19:42:14', '2025-08-03 11:49:06'),
	(11, 'Jewelry', 'Jewelry and accessories', NULL, 1, '2025-06-27 19:42:14', '2025-06-27 19:42:14'),
	(12, 'Home Decor', 'Home decoration items', NULL, 1, '2025-06-27 19:42:14', '2025-06-27 19:42:14'),
	(13, 'Other', 'Other services and products', NULL, 1, '2025-06-27 19:42:14', '2025-06-27 19:42:14'),
	(14, 'Drawings', 'Drawings and sketches', 8, 1, '2025-08-05 17:15:49', '2025-08-05 17:15:49');

-- Dumping structure for event custombid.cleanup_dashboard_logs
DELIMITER //
CREATE EVENT `cleanup_dashboard_logs` ON SCHEDULE EVERY 1 DAY STARTS '2025-08-11 13:11:57' ON COMPLETION NOT PRESERVE ENABLE DO DELETE FROM dashboard_performance_log 
WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)//
DELIMITER ;

-- Dumping structure for view custombid.customer_activity_feed
-- Creating temporary table to overcome VIEW dependency errors
CREATE TABLE `customer_activity_feed` 
);

-- Dumping structure for view custombid.customer_dashboard_insights
-- Creating temporary table to overcome VIEW dependency errors
CREATE TABLE `customer_dashboard_insights` (
	`customer_id` INT(11) NOT NULL,
	`completion_rate` DECIMAL(25,1) NULL,
	`bid_acceptance_rate` DECIMAL(25,1) NULL,
	`avg_bids_per_request` DECIMAL(22,1) NULL,
	`requests_trend_pct` DECIMAL(26,1) NULL,
	`bids_trend_pct` DECIMAL(26,1) NULL,
	`health_status` VARCHAR(1) NULL COLLATE 'utf8mb4_unicode_ci',
	`potential_savings_pct` DECIMAL(20,1) NULL,
	`activity_level` VARCHAR(1) NOT NULL COLLATE 'utf8mb4_unicode_ci'
);

-- Dumping structure for view custombid.customer_dashboard_metrics
-- Creating temporary table to overcome VIEW dependency errors
CREATE TABLE `customer_dashboard_metrics` (
	`customer_id` INT(11) NOT NULL,
	`total_requests` BIGINT(21) NOT NULL,
	`active_requests` BIGINT(21) NOT NULL,
	`completed_requests` BIGINT(21) NOT NULL,
	`cancelled_requests` BIGINT(21) NOT NULL,
	`total_bids` BIGINT(21) NOT NULL,
	`pending_bids` BIGINT(21) NOT NULL,
	`accepted_bids` BIGINT(21) NOT NULL,
	`rejected_bids` BIGINT(21) NOT NULL,
	`total_orders` BIGINT(21) NOT NULL,
	`active_orders` BIGINT(21) NOT NULL,
	`completed_orders` BIGINT(21) NOT NULL,
	`total_spent` DECIMAL(32,2) NULL,
	`avg_bid_price` DECIMAL(14,6) NULL,
	`min_bid_price` DECIMAL(10,2) NULL,
	`max_bid_price` DECIMAL(10,2) NULL,
	`avg_response_time_hours` DECIMAL(24,4) NULL,
	`avg_completion_days` DECIMAL(24,4) NULL,
	`requests_last_7d` BIGINT(21) NOT NULL,
	`bids_last_7d` BIGINT(21) NOT NULL,
	`orders_last_7d` BIGINT(21) NOT NULL,
	`requests_prev_7d` BIGINT(21) NOT NULL,
	`bids_prev_7d` BIGINT(21) NOT NULL,
	`orders_prev_7d` BIGINT(21) NOT NULL,
	`top_category` VARCHAR(1) NULL COLLATE 'utf8mb4_unicode_ci',
	`last_request_date` TIMESTAMP NULL,
	`last_bid_date` TIMESTAMP NULL,
	`last_order_date` TIMESTAMP NULL
);

-- Dumping structure for view custombid.customer_dashboard_summary
-- Creating temporary table to overcome VIEW dependency errors
CREATE TABLE `customer_dashboard_summary` (
	`customer_id` INT(11) NOT NULL,
	`first_name` VARCHAR(1) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`last_name` VARCHAR(1) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`email` VARCHAR(1) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`total_requests` BIGINT(21) NOT NULL,
	`active_requests` BIGINT(21) NOT NULL,
	`completed_requests` BIGINT(21) NOT NULL,
	`total_bids_received` BIGINT(21) NOT NULL,
	`pending_bids` BIGINT(21) NOT NULL,
	`accepted_bids` BIGINT(21) NOT NULL,
	`total_orders` BIGINT(21) NOT NULL,
	`active_orders` BIGINT(21) NOT NULL,
	`completed_orders` BIGINT(21) NOT NULL,
	`total_spent` DECIMAL(32,2) NULL,
	`last_request_date` TIMESTAMP NULL,
	`last_bid_date` TIMESTAMP NULL,
	`last_order_date` TIMESTAMP NULL
);

-- Dumping structure for table custombid.customer_profiles
CREATE TABLE IF NOT EXISTS `customer_profiles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `company_name` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `postal_code` varchar(20) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `avatar_url` varchar(500) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `industry` varchar(100) DEFAULT NULL,
  `company_size` varchar(50) DEFAULT NULL COMMENT 'Size of the company (small, medium, large)',
  `preferred_currency` enum('USD','EUR','GBP','ILS') DEFAULT 'USD',
  `language` varchar(10) DEFAULT 'en',
  `date_of_birth` date DEFAULT NULL,
  `gender` enum('male','female','other','prefer_not_to_say') DEFAULT NULL,
  `two_factor_enabled` tinyint(1) DEFAULT 0,
  `email_visibility` enum('public','private','contacts_only') DEFAULT 'contacts_only',
  `profile_visibility` enum('public','private') DEFAULT 'public',
  `activity_status` enum('online','away','busy','invisible') DEFAULT 'online',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_city` (`city`),
  KEY `idx_country` (`country`),
  KEY `idx_industry` (`industry`),
  KEY `idx_company_size` (`company_size`),
  KEY `idx_preferred_currency` (`preferred_currency`),
  KEY `idx_language` (`language`),
  KEY `idx_customer_profiles_user_company` (`user_id`,`company_name`),
  CONSTRAINT `customer_profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Enhanced customer profile information with privacy and preference settings';

-- Dumping data for table custombid.customer_profiles: ~1 rows (approximately)
INSERT INTO `customer_profiles` (`id`, `user_id`, `company_name`, `address`, `city`, `country`, `postal_code`, `website`, `avatar_url`, `bio`, `industry`, `company_size`, `preferred_currency`, `language`, `date_of_birth`, `gender`, `two_factor_enabled`, `email_visibility`, `profile_visibility`, `activity_status`, `created_at`, `updated_at`) VALUES
	(1, 7, 'Aviv Inc', '', '', '', NULL, '', 'uploads\\images\\7\\1754830819457-2909e20475d43c19.jpeg', '', '', '', 'USD', 'en', NULL, NULL, 0, 'contacts_only', 'public', 'online', '2025-07-26 11:27:57', '2025-10-14 14:30:03'),
	(2, 37, 'Test Corp International', '456 Innovation Drive', 'New York', 'USA', '10001', 'https://testcorp.example.com', NULL, 'Leading provider of innovative business solutions. We help companies transform digitally and achieve operational excellence.', 'Consulting', '51-200', 'USD', 'en', NULL, NULL, 0, 'contacts_only', 'public', 'online', '2025-07-16 14:44:54', '2025-10-14 14:44:54');

-- Dumping structure for view custombid.customer_recent_activity
-- Creating temporary table to overcome VIEW dependency errors
CREATE TABLE `customer_recent_activity` (
	`activity_type` VARCHAR(1) NOT NULL COLLATE 'utf8mb4_general_ci',
	`customer_id` INT(11) NOT NULL,
	`item_id` INT(11) NOT NULL,
	`title` VARCHAR(1) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`status` VARCHAR(1) NULL COLLATE 'utf8mb4_unicode_ci',
	`created_at` TIMESTAMP NOT NULL,
	`updated_at` TIMESTAMP NOT NULL,
	`amount` DECIMAL(10,2) NULL,
	`supplier_name` VARCHAR(1) NULL COLLATE 'utf8mb4_unicode_ci'
);

-- Dumping structure for view custombid.customer_requests_with_bids
-- Creating temporary table to overcome VIEW dependency errors
CREATE TABLE `customer_requests_with_bids` (
	`id` INT(11) NOT NULL,
	`customer_id` INT(11) NOT NULL,
	`title` VARCHAR(1) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`description` TEXT NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`budget_min` DECIMAL(12,2) NULL,
	`budget_max` DECIMAL(12,2) NULL,
	`currency` ENUM('EUR','USD') NULL COLLATE 'utf8mb4_unicode_ci',
	`delivery_date` DATE NULL,
	`time_flexibility` ENUM('critical','week','month') NULL COLLATE 'utf8mb4_unicode_ci',
	`priorities` LONGTEXT NULL COLLATE 'utf8mb4_unicode_ci',
	`status` ENUM('pending_categorization','open_for_bids','bids_received','in_progress','completed','cancelled','expired') NULL COLLATE 'utf8mb4_unicode_ci',
	`category_id` INT(11) NULL,
	`ai_categorized` TINYINT(1) NULL,
	`manually_categorized` TINYINT(1) NULL,
	`ai_confidence` DECIMAL(3,2) NULL,
	`ai_categories_suggested` LONGTEXT NULL COLLATE 'utf8mb4_unicode_ci',
	`ai_reasoning` TEXT NULL COLLATE 'utf8mb4_unicode_ci',
	`file_notes` TEXT NULL COLLATE 'utf8mb4_unicode_ci',
	`expires_at` TIMESTAMP NULL,
	`created_at` TIMESTAMP NOT NULL,
	`updated_at` TIMESTAMP NOT NULL,
	`category_name` VARCHAR(1) NULL COLLATE 'utf8mb4_unicode_ci',
	`bid_count` BIGINT(21) NOT NULL,
	`min_bid_price` DECIMAL(10,2) NULL,
	`max_bid_price` DECIMAL(10,2) NULL,
	`avg_bid_price` DECIMAL(14,6) NULL,
	`pending_bids` BIGINT(21) NOT NULL,
	`accepted_bids` BIGINT(21) NOT NULL,
	`rejected_bids` BIGINT(21) NOT NULL
);

-- Dumping structure for table custombid.dashboard_performance_log
CREATE TABLE IF NOT EXISTS `dashboard_performance_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `query_type` varchar(50) NOT NULL,
  `execution_time_ms` int(11) NOT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_performance_query_type` (`query_type`),
  KEY `idx_performance_customer` (`customer_id`),
  KEY `idx_performance_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table custombid.dashboard_performance_log: ~0 rows (approximately)
INSERT INTO `dashboard_performance_log` (`id`, `query_type`, `execution_time_ms`, `customer_id`, `created_at`) VALUES
	(1, 'status_change_trigger', 0, 7, '2025-10-14 00:38:57');

-- Dumping structure for procedure custombid.GetCustomerBids
DELIMITER //
CREATE PROCEDURE `GetCustomerBids`(IN `customer_id` INT)
BEGIN
  SELECT 
    r.id as request_id,
    r.title,
    r.description,
    r.budget_min,
    r.budget_max,
    r.currency,
    r.delivery_date,
    r.status as request_status,
    r.created_at as request_created_at,
    c.name as category_name,
    COUNT(b.id) as bid_count,
    JSON_ARRAYAGG(
      CASE WHEN b.id IS NOT NULL THEN
        JSON_OBJECT(
          'id', b.id,
          'price', b.price,
          'delivery_time_days', b.delivery_time_days,
          'description', b.description,
          'status', b.status,
          'created_at', b.created_at,
          'anonymous_name', ans.anonymous_name,
          'anonymous_rating', ans.anonymous_rating,
          'anonymous_review_count', ans.anonymous_review_count
        )
      END
    ) as bids
  FROM requests r
  LEFT JOIN categories c ON r.category_id = c.id
  LEFT JOIN bids b ON r.id = b.request_id AND b.status = 'pending'
  LEFT JOIN anonymous_suppliers ans ON b.supplier_id = ans.supplier_id AND b.request_id = ans.request_id
  WHERE r.customer_id = customer_id 
    AND r.status IN ('bids_received', 'open_for_bids')
  GROUP BY r.id
  HAVING COUNT(b.id) > 0
  ORDER BY r.created_at DESC;
END//
DELIMITER ;

-- Dumping structure for procedure custombid.GetCustomerDashboard
DELIMITER //
CREATE PROCEDURE `GetCustomerDashboard`(IN `customer_id` INT)
BEGIN
  -- Statistics
  SELECT 
    'statistics' as data_type,
    JSON_OBJECT(
      'activeRequests', (SELECT COUNT(*) FROM requests WHERE customer_id = customer_id AND status IN ('open_for_bids', 'bids_received')),
      'receivedBids', (SELECT COUNT(*) FROM bids b JOIN requests r ON b.request_id = r.id WHERE r.customer_id = customer_id AND b.status = 'pending'),
      'ordersInProgress', (SELECT COUNT(*) FROM orders WHERE customer_id = customer_id AND status IN ('confirmed', 'in_production', 'shipped')),
      'totalSpent', (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE customer_id = customer_id AND status IN ('completed', 'delivered'))
    ) as data;
  
  -- Recent requests
  SELECT 
    'recentRequests' as data_type,
    JSON_ARRAYAGG(
      JSON_OBJECT(
        'id', r.id,
        'title', r.title,
        'status', r.status,
        'created_at', r.created_at,
        'bids_count', COALESCE(bid_counts.count, 0)
      )
    ) as data
  FROM requests r
  LEFT JOIN (
    SELECT request_id, COUNT(*) as count 
    FROM bids 
    GROUP BY request_id
  ) bid_counts ON r.id = bid_counts.request_id
  WHERE r.customer_id = customer_id
  ORDER BY r.created_at DESC
  LIMIT 5;
  
  -- Recent bids
  SELECT 
    'recentBids' as data_type,
    JSON_ARRAYAGG(
      JSON_OBJECT(
        'id', b.id,
        'price', b.price,
        'delivery_time_days', b.delivery_time_days,
        'created_at', b.created_at,
        'request_title', r.title,
        'supplier_name', COALESCE(sp.company_name, CONCAT(u.first_name, ' ', u.last_name)),
        'is_new', CASE WHEN b.created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 ELSE 0 END
      )
    ) as data
  FROM bids b
  JOIN requests r ON b.request_id = r.id
  JOIN users u ON b.supplier_id = u.id
  LEFT JOIN supplier_profiles sp ON u.id = sp.user_id
  WHERE r.customer_id = customer_id AND b.status = 'pending'
  ORDER BY b.created_at DESC
  LIMIT 5;
  
  -- Active orders
  SELECT 
    'activeOrders' as data_type,
    JSON_ARRAYAGG(
      JSON_OBJECT(
        'id', o.order_number,
        'title', r.title,
        'status', o.status,
        'delivery_date', o.delivery_date,
        'created_at', o.created_at,
        'supplier_name', COALESCE(sp.company_name, CONCAT(u.first_name, ' ', u.last_name)),
        'unread_messages', COALESCE(msg_counts.count, 0)
      )
    ) as data
  FROM orders o
  JOIN bids b ON o.bid_id = b.id
  JOIN requests r ON b.request_id = r.id
  JOIN users u ON o.supplier_id = u.id
  LEFT JOIN supplier_profiles sp ON u.id = sp.user_id
  LEFT JOIN (
    SELECT request_id, COUNT(*) as count 
    FROM messages 
    WHERE receiver_id = customer_id AND is_read = 0
    GROUP BY request_id
  ) msg_counts ON r.id = msg_counts.request_id
  WHERE o.customer_id = customer_id AND o.status IN ('confirmed', 'in_production', 'shipped')
  ORDER BY o.created_at DESC
  LIMIT 5;
END//
DELIMITER ;

-- Dumping structure for procedure custombid.GetCustomerDashboardStats
DELIMITER //
CREATE PROCEDURE `GetCustomerDashboardStats`(IN `customer_id` INT)
BEGIN
  SELECT 
    -- Current month stats
    (SELECT COUNT(*) FROM requests WHERE customer_id = customer_id AND status IN ('open_for_bids', 'bids_received')) as current_active_requests,
    (SELECT COUNT(*) FROM bids b JOIN requests r ON b.request_id = r.id WHERE r.customer_id = customer_id AND b.status = 'pending') as current_received_bids,
    (SELECT COUNT(*) FROM orders WHERE customer_id = customer_id AND status IN ('confirmed', 'in_production', 'shipped')) as current_orders_in_progress,
    (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE customer_id = customer_id AND status IN ('completed', 'delivered')) as current_total_spent,
    
    -- Previous month stats for comparison
    (SELECT COUNT(*) FROM requests WHERE customer_id = customer_id AND created_at >= DATE_SUB(DATE_SUB(NOW(), INTERVAL 1 MONTH), INTERVAL 1 MONTH) AND created_at < DATE_SUB(NOW(), INTERVAL 1 MONTH)) as prev_active_requests,
    (SELECT COUNT(*) FROM bids b JOIN requests r ON b.request_id = r.id WHERE r.customer_id = customer_id AND b.created_at >= DATE_SUB(DATE_SUB(NOW(), INTERVAL 1 MONTH), INTERVAL 1 MONTH) AND b.created_at < DATE_SUB(NOW(), INTERVAL 1 MONTH)) as prev_received_bids,
    (SELECT COUNT(*) FROM orders WHERE customer_id = customer_id AND created_at >= DATE_SUB(DATE_SUB(NOW(), INTERVAL 1 MONTH), INTERVAL 1 MONTH) AND created_at < DATE_SUB(NOW(), INTERVAL 1 MONTH)) as prev_orders_in_progress,
    (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE customer_id = customer_id AND status IN ('completed', 'delivered') AND created_at >= DATE_SUB(DATE_SUB(NOW(), INTERVAL 1 MONTH), INTERVAL 1 MONTH) AND created_at < DATE_SUB(NOW(), INTERVAL 1 MONTH)) as prev_total_spent;
END//
DELIMITER ;

-- Dumping structure for procedure custombid.GetEnhancedCustomerDashboard
DELIMITER //
CREATE PROCEDURE `GetEnhancedCustomerDashboard`(IN customer_id INT)
BEGIN
    -- Dashboard metrics
    SELECT 
        'metrics' as data_type,
        JSON_OBJECT(
            'total_requests', total_requests,
            'active_requests', active_requests,
            'completed_requests', completed_requests,
            'cancelled_requests', cancelled_requests,
            'total_bids', total_bids,
            'pending_bids', pending_bids,
            'accepted_bids', accepted_bids,
            'rejected_bids', rejected_bids,
            'total_orders', total_orders,
            'active_orders', active_orders,
            'completed_orders', completed_orders,
            'total_spent', total_spent,
            'avg_bid_price', avg_bid_price,
            'min_bid_price', min_bid_price,
            'max_bid_price', max_bid_price,
            'avg_response_time_hours', avg_response_time_hours,
            'avg_completion_days', avg_completion_days,
            'requests_last_7d', requests_last_7d,
            'bids_last_7d', bids_last_7d,
            'orders_last_7d', orders_last_7d,
            'requests_trend_pct', (SELECT requests_trend_pct FROM customer_dashboard_insights WHERE customer_dashboard_insights.customer_id = customer_id),
            'bids_trend_pct', (SELECT bids_trend_pct FROM customer_dashboard_insights WHERE customer_dashboard_insights.customer_id = customer_id),
            'top_category', top_category,
            'last_request_date', last_request_date,
            'last_bid_date', last_bid_date,
            'last_order_date', last_order_date
        ) as data
    FROM customer_dashboard_metrics 
    WHERE customer_dashboard_metrics.customer_id = customer_id;
    
    -- Business insights
    SELECT 
        'insights' as data_type,
        JSON_OBJECT(
            'completion_rate', completion_rate,
            'bid_acceptance_rate', bid_acceptance_rate,
            'avg_bids_per_request', avg_bids_per_request,
            'requests_trend_pct', requests_trend_pct,
            'bids_trend_pct', bids_trend_pct,
            'health_status', health_status,
            'potential_savings_pct', potential_savings_pct,
            'activity_level', activity_level
        ) as data
    FROM customer_dashboard_insights 
    WHERE customer_dashboard_insights.customer_id = customer_id;
    
    -- Recent activity feed
    SELECT 
        'activity_feed' as data_type,
        JSON_ARRAYAGG(
            JSON_OBJECT(
                'type', activity_type,
                'entity_id', entity_id,
                'title', entity_title,
                'secondary_info', secondary_info,
                'time', activity_time,
                'description', activity_description,
                'icon', icon_type,
                'priority', priority
            )
        ) as data
    FROM customer_activity_feed 
    WHERE customer_activity_feed.customer_id = customer_id 
    ORDER BY activity_time DESC 
    LIMIT 10;
    
    -- Recent requests with enhanced data
    SELECT 
        'recent_requests' as data_type,
        JSON_ARRAYAGG(
            JSON_OBJECT(
                'id', r.id,
                'title', r.title,
                'description', LEFT(r.description, 100),
                'status', r.status,
                'category', c.name,
                'budget_min', r.budget_min,
                'budget_max', r.budget_max,
                'currency', r.currency,
                'created_at', r.created_at,
                'updated_at', r.updated_at,
                'bids_count', COALESCE(bc.bid_count, 0),
                'avg_bid_price', COALESCE(bc.avg_price, 0),
                'time_since_creation', TIMESTAMPDIFF(HOUR, r.created_at, NOW()),
                'urgency_score', CASE 
                    WHEN r.delivery_date IS NOT NULL AND r.delivery_date <= DATE_ADD(NOW(), INTERVAL 7 DAY) THEN 'high'
                    WHEN r.delivery_date IS NOT NULL AND r.delivery_date <= DATE_ADD(NOW(), INTERVAL 30 DAY) THEN 'medium'
                    ELSE 'low'
                END
            )
        ) as data
    FROM requests r
    LEFT JOIN categories c ON r.category_id = c.id
    LEFT JOIN (
        SELECT 
            request_id, 
            COUNT(*) as bid_count, 
            AVG(price) as avg_price 
        FROM bids 
        GROUP BY request_id
    ) bc ON r.id = bc.request_id
    WHERE r.customer_id = customer_id
    ORDER BY r.created_at DESC
    LIMIT 5;
    
    -- Recent bids with supplier analytics
    SELECT 
        'recent_bids' as data_type,
        JSON_ARRAYAGG(
            JSON_OBJECT(
                'id', b.id,
                'request_id', b.request_id,
                'request_title', r.title,
                'price', b.price,
                'delivery_time_days', b.delivery_time_days,
                'description', b.description,
                'status', b.status,
                'created_at', b.created_at,
                'supplier_anonymous_name', COALESCE(ans.anonymous_name, CONCAT('Supplier #', b.supplier_id)),
                'supplier_rating', ans.anonymous_rating,
                'supplier_review_count', ans.anonymous_review_count,
                'response_time_hours', TIMESTAMPDIFF(HOUR, r.created_at, b.created_at),
                'price_competitiveness', CASE 
                    WHEN avg_prices.avg_price IS NULL THEN 'unknown'
                    WHEN b.price <= avg_prices.avg_price * 0.8 THEN 'excellent'
                    WHEN b.price <= avg_prices.avg_price * 0.9 THEN 'good'
                    WHEN b.price <= avg_prices.avg_price * 1.1 THEN 'average'
                    ELSE 'high'
                END,
                'is_new', CASE WHEN b.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN true ELSE false END
            )
        ) as data
    FROM bids b
    JOIN requests r ON b.request_id = r.id
    LEFT JOIN anonymous_suppliers ans ON b.supplier_id = ans.supplier_id AND b.request_id = ans.request_id
    LEFT JOIN (
        SELECT 
            r2.category_id, 
            AVG(b2.price) as avg_price 
        FROM bids b2 
        JOIN requests r2 ON b2.request_id = r2.id 
        WHERE b2.status = 'pending' 
        GROUP BY r2.category_id
    ) avg_prices ON r.category_id = avg_prices.category_id
    WHERE r.customer_id = customer_id
    ORDER BY b.created_at DESC
    LIMIT 10;
    
    -- Active orders with detailed tracking
    SELECT 
        'active_orders' as data_type,
        JSON_ARRAYAGG(
            JSON_OBJECT(
                'id', o.id,
                'order_number', o.order_number,
                'request_title', r.title,
                'supplier_name', COALESCE(ans.anonymous_name, CONCAT('Supplier #', o.supplier_id)),
                'status', o.status,
                'total_amount', o.total_amount,
                'created_at', o.created_at,
                'updated_at', o.updated_at,
                'delivery_date', o.delivery_date,
                'progress_percentage', CASE 
                    WHEN o.status = 'confirmed' THEN 20
                    WHEN o.status = 'in_production' THEN 60
                    WHEN o.status = 'shipped' THEN 90
                    WHEN o.status = 'delivered' THEN 100
                    ELSE 10
                END,
                'estimated_completion', CASE 
                    WHEN o.delivery_date IS NULL THEN 'TBD'
                    WHEN o.delivery_date <= NOW() THEN 'Overdue'
                    ELSE CONCAT(TIMESTAMPDIFF(DAY, NOW(), o.delivery_date), ' days')
                END,
                'days_since_order', TIMESTAMPDIFF(DAY, o.created_at, NOW()),
                'has_recent_update', CASE WHEN o.updated_at >= DATE_SUB(NOW(), INTERVAL 3 DAY) THEN true ELSE false END
            )
        ) as data
    FROM orders o
    JOIN bids b ON o.bid_id = b.id
    JOIN requests r ON b.request_id = r.id
    LEFT JOIN anonymous_suppliers ans ON b.supplier_id = ans.supplier_id AND b.request_id = ans.request_id
    WHERE r.customer_id = customer_id 
    AND o.status IN ('confirmed', 'in_production', 'shipped')
    ORDER BY o.updated_at DESC
    LIMIT 5;
    
END//
DELIMITER ;

-- Dumping structure for procedure custombid.GetUserStatistics
DELIMITER //
CREATE PROCEDURE `GetUserStatistics`(IN `user_id` INT, IN `user_type` VARCHAR(20))
BEGIN
  IF user_type = 'customer' THEN
    SELECT 
      (SELECT COUNT(*) FROM requests WHERE customer_id = user_id) as total_requests,
      (SELECT COUNT(*) FROM requests WHERE customer_id = user_id AND status IN ('open_for_bids', 'bids_received')) as active_requests,
      (SELECT COUNT(*) FROM orders WHERE customer_id = user_id) as total_orders,
      (SELECT COUNT(*) FROM orders WHERE customer_id = user_id AND status = 'completed') as completed_orders,
      (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE customer_id = user_id) as total_spent,
      (SELECT COUNT(*) FROM notifications WHERE user_id = user_id AND is_read = FALSE) as unread_notifications;
  ELSEIF user_type = 'supplier' THEN
    SELECT 
      (SELECT COUNT(*) FROM bids WHERE supplier_id = user_id) as total_bids,
      (SELECT COUNT(*) FROM bids WHERE supplier_id = user_id AND status = 'accepted') as accepted_bids,
      (SELECT COUNT(*) FROM orders WHERE supplier_id = user_id) as total_orders,
      (SELECT COUNT(*) FROM orders WHERE supplier_id = user_id AND status = 'completed') as completed_orders,
      (SELECT COALESCE(SUM(total_amount - commission_amount), 0) FROM orders WHERE supplier_id = user_id) as total_earned,
      (SELECT COUNT(*) FROM notifications WHERE user_id = user_id AND is_read = FALSE) as unread_notifications,
      (SELECT COALESCE(AVG(rating), 0) FROM reviews r JOIN orders o ON r.order_id = o.id WHERE o.supplier_id = user_id) as avg_rating;
  END IF;
END//
DELIMITER ;

-- Dumping structure for table custombid.messages
CREATE TABLE IF NOT EXISTS `messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `request_id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `receiver_id` int(11) NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `message_type` enum('text','image','document','system') DEFAULT 'text',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_request_id` (`request_id`),
  KEY `idx_sender_id` (`sender_id`),
  KEY `idx_receiver_id` (`receiver_id`),
  KEY `idx_is_read` (`is_read`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`request_id`) REFERENCES `requests` (`id`) ON DELETE CASCADE,
  CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `messages_ibfk_3` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table custombid.messages: ~0 rows (approximately)

-- Dumping structure for table custombid.notifications
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `type` enum('bid_received','bid_accepted','bid_rejected','order_update','payment_received','message_received','system_alert') NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `related_id` int(11) DEFAULT NULL,
  `related_type` enum('bid','order','request','message','payment') DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `is_pushed` tinyint(1) DEFAULT 0,
  `priority` enum('low','normal','high','urgent') DEFAULT 'normal',
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `read_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_unread` (`user_id`,`is_read`),
  KEY `idx_type` (`type`),
  KEY `idx_priority` (`priority`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_notifications_user_type_created` (`user_id`,`type`,`created_at`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table custombid.notifications: ~8 rows (approximately)
INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `message`, `related_id`, `related_type`, `is_read`, `is_pushed`, `priority`, `expires_at`, `created_at`, `read_at`) VALUES
	(1, 32, 'bid_received', 'New Bid Received!', 'You have received a new bid for your request.', 12, 'bid', 0, 0, 'high', NULL, '2025-07-20 11:20:25', NULL),
	(2, 32, 'bid_received', 'New Bid Received!', 'You have received a new bid for your request.', 13, 'bid', 0, 0, 'high', NULL, '2025-07-20 11:20:25', NULL),
	(3, 31, 'bid_received', 'New Bid Received!', 'You have received a new bid for your request.', 14, 'bid', 0, 0, 'high', NULL, '2025-07-20 11:20:25', NULL),
	(4, 30, 'bid_received', 'New Bid Received!', 'You have received a new bid for your request.', 15, 'bid', 0, 0, 'high', NULL, '2025-07-20 11:20:25', NULL),
	(5, 31, 'bid_received', 'New Bid Received!', 'You have received a new bid for your request.', 16, 'bid', 0, 0, 'high', NULL, '2025-07-20 11:20:25', NULL),
	(6, 31, 'bid_received', 'New Bid Received!', 'You have received a new bid for your request.', 17, 'bid', 0, 0, 'high', NULL, '2025-07-20 11:20:25', NULL),
	(7, 30, 'bid_received', 'New Bid Received!', 'You have received a new bid for your request.', 18, 'bid', 0, 0, 'high', NULL, '2025-07-20 12:40:44', NULL),
	(8, 31, 'bid_received', 'New Bid Received!', 'You have received a new bid for your request.', 19, 'bid', 0, 0, 'high', NULL, '2025-07-22 11:03:19', NULL);

-- Dumping structure for table custombid.notification_settings
CREATE TABLE IF NOT EXISTS `notification_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `email_new_bids` tinyint(1) DEFAULT 1,
  `email_order_updates` tinyint(1) DEFAULT 1,
  `email_messages` tinyint(1) DEFAULT 1,
  `email_promotions` tinyint(1) DEFAULT 0,
  `sms_order_updates` tinyint(1) DEFAULT 0,
  `sms_messages` tinyint(1) DEFAULT 0,
  `push_notifications` tinyint(1) DEFAULT 1,
  `real_time_notifications` tinyint(1) DEFAULT 1,
  `frequency` enum('immediate','daily','weekly','never') DEFAULT 'immediate',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_notifications` (`user_id`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `notification_settings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table custombid.notification_settings: ~9 rows (approximately)
INSERT INTO `notification_settings` (`id`, `user_id`, `email_new_bids`, `email_order_updates`, `email_messages`, `email_promotions`, `sms_order_updates`, `sms_messages`, `push_notifications`, `real_time_notifications`, `frequency`, `created_at`, `updated_at`) VALUES
	(1, 2, 1, 1, 1, 0, 0, 0, 1, 1, 'immediate', '2025-08-16 00:00:45', '2025-08-16 00:00:45'),
	(2, 7, 0, 1, 1, 0, 0, 0, 1, 1, 'immediate', '2025-08-16 00:00:45', '2025-10-14 14:33:25'),
	(3, 30, 1, 1, 1, 0, 0, 0, 1, 1, 'immediate', '2025-08-16 00:00:45', '2025-08-16 00:00:45'),
	(4, 31, 1, 1, 1, 0, 0, 0, 1, 1, 'immediate', '2025-08-16 00:00:45', '2025-08-16 00:00:45'),
	(5, 32, 1, 1, 1, 0, 0, 0, 1, 1, 'immediate', '2025-08-16 00:00:45', '2025-08-16 00:00:45'),
	(6, 33, 1, 1, 1, 0, 0, 0, 1, 1, 'immediate', '2025-08-16 00:00:45', '2025-08-16 00:00:45'),
	(7, 34, 1, 1, 1, 0, 0, 0, 1, 1, 'immediate', '2025-08-16 00:00:45', '2025-08-16 00:00:45'),
	(8, 35, 1, 1, 1, 0, 0, 0, 1, 1, 'immediate', '2025-08-16 00:00:45', '2025-08-16 00:00:45'),
	(9, 36, 1, 1, 1, 0, 0, 0, 1, 1, 'immediate', '2025-08-16 00:00:45', '2025-08-16 00:00:45'),
	(10, 37, 1, 1, 1, 0, 0, 0, 1, 1, 'immediate', '2025-07-16 14:44:54', '2025-10-14 14:44:54');

-- Dumping structure for table custombid.orders
CREATE TABLE IF NOT EXISTS `orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `bid_id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `supplier_id` int(11) NOT NULL,
  `order_number` varchar(50) NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `commission_amount` decimal(10,2) DEFAULT 0.00,
  `commission_rate` decimal(4,2) DEFAULT 0.05,
  `status` enum('confirmed','in_production','shipped','delivered','completed','cancelled','disputed') DEFAULT 'confirmed',
  `delivery_date` date DEFAULT NULL,
  `actual_delivery_date` date DEFAULT NULL,
  `tracking_number` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `customer_notes` text DEFAULT NULL,
  `supplier_notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_number` (`order_number`),
  KEY `idx_bid_id` (`bid_id`),
  KEY `idx_customer_id` (`customer_id`),
  KEY `idx_supplier_id` (`supplier_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_orders_customer_status_updated` (`customer_id`,`status`,`updated_at`),
  KEY `idx_orders_customer_status_created` (`customer_id`,`status`,`created_at`),
  KEY `idx_orders_amount_status` (`total_amount`,`status`),
  KEY `idx_orders_supplier_status` (`supplier_id`,`status`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`bid_id`) REFERENCES `bids` (`id`),
  CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`),
  CONSTRAINT `orders_ibfk_3` FOREIGN KEY (`supplier_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Enhanced order management with tracking and communication features';

-- Dumping data for table custombid.orders: ~0 rows (approximately)

-- Dumping structure for table custombid.order_messages
CREATE TABLE IF NOT EXISTS `order_messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `receiver_id` int(11) NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `sender_id` (`sender_id`),
  KEY `receiver_id` (`receiver_id`),
  CONSTRAINT `order_messages_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_messages_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_messages_ibfk_3` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table custombid.order_messages: ~0 rows (approximately)

-- Dumping structure for table custombid.order_status_history
CREATE TABLE IF NOT EXISTS `order_status_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL,
  `status` enum('confirmed','in_production','ready_for_delivery','shipped','delivered','completed') NOT NULL,
  `notes` text DEFAULT NULL,
  `changed_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `changed_by` (`changed_by`),
  KEY `idx_order_status_history` (`order_id`,`created_at`),
  CONSTRAINT `order_status_history_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_status_history_ibfk_2` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table custombid.order_status_history: ~0 rows (approximately)

-- Dumping structure for view custombid.order_summary
-- Creating temporary table to overcome VIEW dependency errors
CREATE TABLE `order_summary` (
	`id` INT(11) NOT NULL,
	`bid_id` INT(11) NOT NULL,
	`customer_id` INT(11) NOT NULL,
	`supplier_id` INT(11) NOT NULL,
	`order_number` VARCHAR(1) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`total_amount` DECIMAL(10,2) NOT NULL,
	`commission_amount` DECIMAL(10,2) NULL,
	`commission_rate` DECIMAL(4,2) NULL,
	`status` ENUM('confirmed','in_production','shipped','delivered','completed','cancelled','disputed') NULL COLLATE 'utf8mb4_unicode_ci',
	`delivery_date` DATE NULL,
	`actual_delivery_date` DATE NULL,
	`tracking_number` VARCHAR(1) NULL COLLATE 'utf8mb4_unicode_ci',
	`notes` TEXT NULL COLLATE 'utf8mb4_unicode_ci',
	`customer_notes` TEXT NULL COLLATE 'utf8mb4_unicode_ci',
	`supplier_notes` TEXT NULL COLLATE 'utf8mb4_unicode_ci',
	`created_at` TIMESTAMP NOT NULL,
	`updated_at` TIMESTAMP NOT NULL,
	`request_title` VARCHAR(1) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`request_description` TEXT NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`customer_first_name` VARCHAR(1) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`customer_last_name` VARCHAR(1) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`customer_email` VARCHAR(1) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`supplier_first_name` VARCHAR(1) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`supplier_last_name` VARCHAR(1) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`supplier_email` VARCHAR(1) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`supplier_company` VARCHAR(1) NULL COLLATE 'utf8mb4_unicode_ci',
	`bid_price` DECIMAL(10,2) NOT NULL,
	`estimated_delivery_days` INT(11) NOT NULL
);

-- Dumping structure for table custombid.order_updates
CREATE TABLE IF NOT EXISTS `order_updates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL,
  `status` varchar(100) NOT NULL,
  `message` text DEFAULT NULL,
  `image_path` varchar(500) DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_created_by` (`created_by`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `order_updates_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_updates_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table custombid.order_updates: ~0 rows (approximately)

-- Dumping structure for table custombid.password_history
CREATE TABLE IF NOT EXISTS `password_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table custombid.password_history: ~2 rows (approximately)
INSERT INTO `password_history` (`id`, `user_id`, `password_hash`, `created_at`) VALUES
	(1, 34, '$2b$12$UP/RcyYbcdvwdeel.B0Nl.j3wSD59sSyXxSmxd3HSKCw1woxypioe', '2025-08-13 22:17:04'),
	(2, 35, '$2b$12$2fHnzZbcWHYJsj3j33fokeqlEZs.CMDhSEkXTjyyoE/zFqVrb44Ju', '2025-08-13 22:25:24'),
	(3, 36, '$2b$12$iW1BQbw6aV94Ch6a8MeYseLrva.g1YoOEdw6fmOikvJAGOP89jfHm', '2025-08-13 22:32:13');

-- Dumping structure for table custombid.rate_limit_logs
CREATE TABLE IF NOT EXISTS `rate_limit_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `identifier` varchar(255) NOT NULL,
  `identifier_type` enum('ip','user_id','email') NOT NULL,
  `action` varchar(100) NOT NULL,
  `attempts` int(11) DEFAULT 1,
  `first_attempt` timestamp NOT NULL DEFAULT current_timestamp(),
  `last_attempt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_blocked` tinyint(1) DEFAULT 0,
  `blocked_until` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_rate_limit` (`identifier`,`identifier_type`,`action`),
  KEY `idx_identifier` (`identifier`),
  KEY `idx_action` (`action`),
  KEY `idx_is_blocked` (`is_blocked`),
  KEY `idx_blocked_until` (`blocked_until`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table custombid.rate_limit_logs: ~5 rows (approximately)
INSERT INTO `rate_limit_logs` (`id`, `identifier`, `identifier_type`, `action`, `attempts`, `first_attempt`, `last_attempt`, `is_blocked`, `blocked_until`) VALUES
	(2, 'avivalonpay@gmail.com', 'email', 'register', 1, '2025-08-13 22:17:01', '2025-08-13 22:17:01', 0, NULL),
	(3, 'avivalon@gmail.com', 'email', 'register', 1, '2025-08-13 22:25:24', '2025-08-13 22:25:24', 0, NULL),
	(4, 'aviv@hotmail.com', 'email', 'register', 1, '2025-08-13 22:32:10', '2025-08-13 22:32:10', 0, NULL),
	(6, 'avivalonpay@gmail.com', 'email', 'login', 1, '2025-08-14 16:07:49', '2025-08-14 16:07:49', 0, NULL),
	(22, 'demo.electronics@supplier.com', 'email', 'login', 1, '2025-10-09 11:26:25', '2025-10-09 11:26:25', 0, NULL);

-- Dumping structure for table custombid.real_time_events
CREATE TABLE IF NOT EXISTS `real_time_events` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `event_type` enum('bid_received','bid_accepted','bid_rejected','order_update','message_sent','user_online','user_offline') NOT NULL,
  `user_id` int(11) NOT NULL,
  `target_user_id` int(11) DEFAULT NULL,
  `data` longtext DEFAULT NULL,
  `is_delivered` tinyint(1) DEFAULT 0,
  `delivery_attempts` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `delivered_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_event_type` (`event_type`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_target_user` (`target_user_id`),
  KEY `idx_is_delivered` (`is_delivered`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `real_time_events_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `real_time_events_ibfk_2` FOREIGN KEY (`target_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table custombid.real_time_events: ~8 rows (approximately)
INSERT INTO `real_time_events` (`id`, `event_type`, `user_id`, `target_user_id`, `data`, `is_delivered`, `delivery_attempts`, `created_at`, `delivered_at`) VALUES
	(1, 'bid_received', 20, 32, '{"bid_id": 12, "request_id": 103}', 0, 0, '2025-07-20 11:20:25', NULL),
	(2, 'bid_received', 23, 32, '{"bid_id": 13, "request_id": 103}', 0, 0, '2025-07-20 11:20:25', NULL),
	(3, 'bid_received', 21, 31, '{"bid_id": 14, "request_id": 106}', 0, 0, '2025-07-20 11:20:25', NULL),
	(4, 'bid_received', 22, 30, '{"bid_id": 15, "request_id": 108}', 0, 0, '2025-07-20 11:20:25', NULL),
	(5, 'bid_received', 23, 31, '{"bid_id": 16, "request_id": 110}', 0, 0, '2025-07-20 11:20:25', NULL),
	(6, 'bid_received', 25, 31, '{"bid_id": 17, "request_id": 114}', 0, 0, '2025-07-20 11:20:25', NULL),
	(7, 'bid_received', 20, 30, '{"bid_id": 18, "request_id": 101}', 0, 0, '2025-07-20 12:40:44', NULL),
	(8, 'bid_received', 20, 31, '{"bid_id": 19, "request_id": 102}', 0, 0, '2025-07-22 11:03:19', NULL);

-- Dumping structure for table custombid.refresh_tokens
CREATE TABLE IF NOT EXISTS `refresh_tokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `token_hash` varchar(255) NOT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_revoked` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `revoked_at` timestamp NULL DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `device_id` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_token_hash` (`token_hash`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_expires_at` (`expires_at`),
  KEY `idx_is_revoked` (`is_revoked`)
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table custombid.refresh_tokens: ~45 rows (approximately)
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `is_revoked`, `created_at`, `revoked_at`, `ip_address`, `user_agent`, `device_id`) VALUES
	(1, 34, '7b118d9e6865f8f0c33969e1000a85bb9f6c9cf1e7d9e9f2a16c6171f64cb28e', '1970-01-07 22:00:00', 0, '2025-08-13 22:37:37', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 'f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50'),
	(2, 34, '91bb3b49858176f0470eb69fb5f8b5f19bdf5e64b8f67f9646b3870d76498d9d', '1970-01-07 22:00:00', 0, '2025-08-13 22:39:38', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 'f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50'),
	(3, 34, 'b2a94d0d6d9078764bdf1e495b94fc41e8106eb6acc0e06353066a3c13f42b08', '1970-01-07 22:00:00', 0, '2025-08-13 22:41:15', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 'f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50'),
	(4, 34, 'f5d2890b588a06286e396b25ca8f85be62fe4c69bf992c4a3953d2cb9e390f8a', '1970-01-07 22:00:00', 0, '2025-08-13 22:42:18', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 'f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50'),
	(5, 34, '1bc3492d5dcf00de920af07f575b35704ff385cecef6158643f34f7cf3ce53c2', '1970-01-07 22:00:00', 0, '2025-08-13 22:59:04', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 'f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50'),
	(6, 34, '0a47f0464c1ac0ff9e2b914b7d04d9f0e8cbdd84fc3311457f0dbaff261970f8', '1970-01-07 22:00:00', 0, '2025-08-14 16:07:51', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 'f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50'),
	(7, 7, 'e4130444c0cdeb5389ab34f72b57309244faf3aa1df1e902e433766f44bce8e6', '1970-01-07 22:00:00', 0, '2025-08-14 16:12:37', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 'f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50'),
	(8, 7, '3b4148048d161c0ea73e4ae6745956b26ee27f8bcdc248930459c0ed17b45838', '1970-01-07 22:00:00', 0, '2025-08-14 16:35:52', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 'f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50'),
	(9, 7, '025c6392f38e4a3215e316d08eb2871b69b37cbfc8ceab017f3f86a537db9257', '1970-01-07 22:00:00', 0, '2025-08-15 13:41:45', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 'f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50'),
	(10, 7, 'd82904898f28af4c78fd93a6716debba89319ef0237425179a642b9e982bfe86', '1970-01-07 22:00:00', 0, '2025-08-15 23:57:39', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 'f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50'),
	(11, 7, '3c91669733f6ed5ed988d4ca26e8887250a9a7714a79d0a59833d124e23d8028', '1970-01-07 22:00:00', 0, '2025-08-18 17:24:49', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 'f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50'),
	(12, 7, '6b4a1aea8b8c4b8835d16db06ebd73445e1a289289560fd94134a0f3eca031b9', '1970-01-07 22:00:00', 0, '2025-08-18 17:47:43', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 'f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50'),
	(13, 7, 'ee85b773f936f39d1544fdab23d924deff7a43a1758338ff00ac1264f7527141', '1970-01-07 22:00:00', 0, '2025-08-18 18:13:17', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 'f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50'),
	(14, 7, 'bc5358e7d72619e72617fe82085ad0377b50283c69c34a374738bbdc5f2661b9', '1970-01-07 22:00:00', 0, '2025-08-18 20:57:56', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 'f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50'),
	(15, 7, '7b52f11664fea66e3c2e81ed147e55bf5fe2a06137e40d8e26b9516e649cdc0d', '1970-01-07 22:00:00', 0, '2025-08-18 20:58:26', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 'f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50'),
	(16, 7, 'e92310814dac6d6a465ab7941eeadf85e9ac929be5ea7c2f59bf8fe48bb344a2', '1970-01-07 22:00:00', 0, '2025-08-19 07:41:13', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 'f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50'),
	(17, 7, 'e4be3771c76901de53277ad47bb61a2b1396c07b36165efb2ece0603939e9f69', '1970-01-07 22:00:00', 0, '2025-08-19 10:03:55', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 'f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50'),
	(18, 7, '34bccb6cdf6556f5c985fbbc6d55b0359c2be0cc1c8e919f03d48b7128c164aa', '1970-01-07 22:00:00', 0, '2025-08-19 10:33:31', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 'f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50'),
	(19, 20, '137fc7a6bea1c4abe528f256acb1624910bc65fb11275fea2481d17117f5515e', '1970-01-07 22:00:00', 0, '2025-08-19 12:54:22', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 'f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50'),
	(20, 7, '7575082ec33517a431f3810fb65fd4a6c1038114b9e70593726dee8c18eb1dd5', '1970-01-07 22:00:00', 0, '2025-08-19 12:56:04', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 'f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50'),
	(21, 7, '20c34b6ed822df780df6f100e4d89c01b6bc5c867b37b04153c08836ef897988', '1970-01-07 22:00:00', 0, '2025-08-19 21:00:37', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 'f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50'),
	(22, 7, '6849fa2e59cf0020bd0e5f707c0bde869df02c82047f976b7929f34596954846', '1970-01-07 22:00:00', 0, '2025-08-20 15:57:21', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 'f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50'),
	(23, 7, 'd110d489d94a76ed4d6047c8bd1cbe7762debc4d782f3bc9175104502ad4cc1d', '1970-01-07 22:00:00', 0, '2025-08-20 16:57:59', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 'f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50'),
	(24, 7, '8897c92e07307ec25ced23ca2c575b6954246222f45cd9fc0ad0a760dcd0ed8b', '1970-01-07 22:00:00', 0, '2025-08-20 17:34:05', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 'f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50'),
	(25, 7, '19d4f4753cc1427e346361c09ad8b4be426c7c8b19ab6bac6ba8f4a8a7179f5c', '1970-01-07 22:00:00', 0, '2025-08-20 18:12:13', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 'f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50'),
	(26, 7, '68003a008224ecd5be0519c316c24e19ac983510a7695aa9eba462460ab13692', '1970-01-07 22:00:00', 0, '2025-08-20 19:49:21', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 'f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50'),
	(27, 7, '57634b5e86b22fc778b19c6b7d1250b3df0d3be4c17643ec17ba06c2a03ed190', '1970-01-07 22:00:00', 0, '2025-08-20 20:21:58', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 'f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50'),
	(28, 7, '71b204b10b8465666a1206e6db6dc73fe0b51e001d9b6f7d8ea2fa5dd0eeecfc', '1970-01-07 22:00:00', 0, '2025-08-20 20:45:26', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 'f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50'),
	(29, 7, '57a3e7c3f8442825ecdfd8ea31f983172aa7ae2229274c3146d4584559d86d50', '1970-01-07 22:00:00', 0, '2025-08-20 21:09:34', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 'f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50'),
	(30, 7, '1de4e5bb9385e83c2181bdb73d5f8083200bfad72f8fc5bf1046ea88c0afb70f', '1970-01-07 22:00:00', 0, '2025-08-20 22:31:18', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 'f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50'),
	(31, 7, '7658073e08b3a64c9a09273a4f951eb9cf477fcc468e886e1e663ad547a9c921', '1970-01-07 22:00:00', 0, '2025-08-21 21:53:39', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 'f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50'),
	(32, 7, '02f1c822accd96092e1f401d76fa0f2f82b718da15f26b335721336b5af5bd46', '1970-01-07 22:00:00', 0, '2025-08-22 11:14:32', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 'f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50'),
	(33, 7, '4cf11dfeeed62bc56e2974c88e6c15eb5def0fe88fda702dc4ccbed654ecaa29', '1970-01-07 22:00:00', 0, '2025-08-22 12:25:16', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 'f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50'),
	(34, 7, '633f133f465eb4423c1dfe0137e977b728f66c651c638436e07a0ce94063b4af', '1970-01-07 22:00:00', 0, '2025-08-22 12:58:15', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 'f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50'),
	(35, 7, '4468c8315f094db078d40d8d574a95ca1b37f8bbeacf1b010104bb3ed16867df', '1970-01-07 22:00:00', 0, '2025-08-22 16:01:35', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 'f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50'),
	(36, 7, 'ce1984e4d700dbc01bb6f6c0091065eaa75cb2c9a5d0506151c4d3ac67b08fb4', '1970-01-07 22:00:00', 0, '2025-08-22 17:23:14', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 'f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50'),
	(37, 7, '7e5e3d087443dd2b41c2fed0e49693a4424e359c353783be925084a22be19bf2', '1970-01-07 22:00:00', 0, '2025-08-22 18:09:35', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 'f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50'),
	(38, 7, '046492ee462130c43c531905962d35faaacd6ebbe3e2f949ff6a1395903549fd', '1970-01-07 22:00:00', 0, '2025-08-22 23:13:22', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 'f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50'),
	(39, 7, 'e500657f6066663b526c54d4bdf1301d61ccaebfb8248452bda3e8ca316e7685', '1970-01-07 22:00:00', 0, '2025-08-23 15:05:02', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 'f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50'),
	(40, 7, '14436e283f6d6e000812ebf178397bb10b946db3c04a0d98eada2176cea3bc30', '1970-01-07 22:00:00', 0, '2025-08-23 15:35:26', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 'f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50'),
	(41, 20, 'd3c3e4f2794af9e1fdce72d03269370fd4d5cae793a947da98f9bdfccfd9c4aa', '1970-01-07 22:00:00', 0, '2025-08-23 22:57:35', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 'f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50'),
	(42, 7, '715ce9880860dd465dab39ffb1ed09a1792703104fd541dd4cd6c04b6eb99f99', '1970-01-07 22:00:00', 0, '2025-08-25 08:50:48', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 'f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50'),
	(43, 20, 'cf6b9a7f3b77ef63ac41ed4ad45ad99372433f9d172a6d0642181423d6d85980', '1970-01-07 22:00:00', 0, '2025-08-25 08:57:57', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 'f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50'),
	(44, 7, '9e1481c842aa06a2442eae9b20df06047e9ee95c1ab70a9b7c183f65f71f8fbe', '1970-01-07 22:00:00', 0, '2025-08-26 16:32:25', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 'f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50'),
	(45, 20, 'bf2e1ae265d1f9daa29ccbcc60a20574b93b5f06ec0ec4eefcbbe241b3488a39', '1970-01-07 22:00:00', 0, '2025-08-26 16:33:44', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 'f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50'),
	(46, 20, '6a6868fef4df3e7d87b620a244050802cfbbfe3de7fe6fd43992c65ca9673d4f', '1970-01-07 22:00:00', 0, '2025-08-26 16:58:13', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 'f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50'),
	(47, 20, '6cbdb9eee139cb485f71e3dc70d7f863607a431cd79669bc0e677756cbe0c48f', '1970-01-07 22:00:00', 0, '2025-08-26 17:20:23', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 'f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50'),
	(48, 20, 'bf9ecc6f194d3292e39c4a94d903d6421e85a15773b6fc0c2993d23ede5a7ee1', '1970-01-07 22:00:00', 0, '2025-08-26 17:46:58', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 'f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50'),
	(49, 7, '36da407b10e1ab9c1c7ecc8bcb38f44ee2867c0018cdbe2c03aa604c7053cfda', '1970-01-07 22:00:00', 0, '2025-08-26 20:28:56', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 'f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50'),
	(50, 7, '6e4dd890e06f457cb8d5cabdba89f7ecb92b27e99acb21118ce1a51489f40731', '1970-01-07 22:00:00', 0, '2025-08-26 20:56:15', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', 'f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50'),
	(51, 7, '356c08ebc2b0119447ba84f30d0e5b50e599854a78227019ea5892adf8f3f67c', '1970-01-07 22:00:00', 0, '2025-10-08 12:57:36', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '6694a6d9a10c733eecf2e25afad2d7ae9a5616b8b10f6d8e80c2684e3618f4d4'),
	(52, 20, '7c2827dbedab1dc8826008ea8c3a62217c386e4890d904bb7e90e1f2ae934c96', '1970-01-07 22:00:00', 0, '2025-10-08 12:59:26', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '6694a6d9a10c733eecf2e25afad2d7ae9a5616b8b10f6d8e80c2684e3618f4d4'),
	(53, 7, 'b25de70b76f4b1b8c647f6930ffb3d7c0ee1b5844f6b2cb841f81407215b4344', '1970-01-07 22:00:00', 0, '2025-10-09 10:50:51', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '6694a6d9a10c733eecf2e25afad2d7ae9a5616b8b10f6d8e80c2684e3618f4d4'),
	(54, 7, 'a6dcab0ebcf5b9113d5662d98bce0028155486aee686f038ffa995d45006fef5', '1970-01-07 22:00:00', 0, '2025-10-09 11:19:34', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '6694a6d9a10c733eecf2e25afad2d7ae9a5616b8b10f6d8e80c2684e3618f4d4'),
	(55, 7, 'cad6150562262101241cad03b040edbff0c0032314b3bfcec33dc147fe224c89', '1970-01-07 22:00:00', 0, '2025-10-09 11:20:03', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '6694a6d9a10c733eecf2e25afad2d7ae9a5616b8b10f6d8e80c2684e3618f4d4'),
	(56, 7, '1313905bc37907198daf80074fa88c5f855f55bfaf3180dfd90b2713bf947c57', '2025-10-13 16:36:44', 1, '2025-10-13 16:36:31', '2025-10-13 16:36:44', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '6694a6d9a10c733eecf2e25afad2d7ae9a5616b8b10f6d8e80c2684e3618f4d4'),
	(57, 7, '4df1ea2525fd7fe2a8feaa69d8cbaae1b5f6389e2c910d95e6e2530642fb10f6', '2025-10-13 16:36:46', 1, '2025-10-13 16:36:44', '2025-10-13 16:36:46', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '6694a6d9a10c733eecf2e25afad2d7ae9a5616b8b10f6d8e80c2684e3618f4d4'),
	(59, 7, '1500f16c756a561a40ce97ec8203667ed89efd2d7d5c4fe135c27592ff4cc6ba', '2025-10-13 16:36:49', 1, '2025-10-13 16:36:46', '2025-10-13 16:36:49', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '6694a6d9a10c733eecf2e25afad2d7ae9a5616b8b10f6d8e80c2684e3618f4d4'),
	(60, 7, '2576942b53d6852ad940033f8b646fa3d31fa525422adc63036fe03c9246048c', '2025-10-20 13:36:49', 0, '2025-10-13 16:36:49', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '6694a6d9a10c733eecf2e25afad2d7ae9a5616b8b10f6d8e80c2684e3618f4d4'),
	(61, 7, '53eb599ecaa829fe580ee914f065c6cd4696115c285d6dffe50a0947c80b4d2b', '2025-10-20 13:37:11', 0, '2025-10-13 16:37:11', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '6694a6d9a10c733eecf2e25afad2d7ae9a5616b8b10f6d8e80c2684e3618f4d4'),
	(62, 7, '7e56b225a26e1c628a8f0dadbc768bc7a503ef3066b8f99d2c51056448e7c9cf', '2025-10-13 16:38:24', 1, '2025-10-13 16:38:19', '2025-10-13 16:38:24', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '6694a6d9a10c733eecf2e25afad2d7ae9a5616b8b10f6d8e80c2684e3618f4d4'),
	(63, 7, '55c917c2851c30cbfefee331464c67c27316aa5801cbf510cd5222bbdfe367af', '2025-10-20 13:38:24', 0, '2025-10-13 16:38:24', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '6694a6d9a10c733eecf2e25afad2d7ae9a5616b8b10f6d8e80c2684e3618f4d4'),
	(64, 7, '79294d9ff0983557ffacd812c48acfe41e2e4bb80309f12970173246b7e32d17', '2025-10-13 16:39:05', 1, '2025-10-13 16:38:48', '2025-10-13 16:39:05', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '6694a6d9a10c733eecf2e25afad2d7ae9a5616b8b10f6d8e80c2684e3618f4d4'),
	(65, 7, 'cea10e3ed31de6884c8bffbb1322272257a3ed91d6bdea36189470da9fd7df5f', '2025-10-20 13:39:05', 0, '2025-10-13 16:39:05', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '6694a6d9a10c733eecf2e25afad2d7ae9a5616b8b10f6d8e80c2684e3618f4d4'),
	(66, 7, 'd030d55901adc37d8c3e14c7371a70f88735368c447046e5bfe5e34295229f59', '2025-10-13 16:43:19', 1, '2025-10-13 16:43:07', '2025-10-13 16:43:19', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '6694a6d9a10c733eecf2e25afad2d7ae9a5616b8b10f6d8e80c2684e3618f4d4'),
	(67, 7, '4f69928307af08f3f173b55d1c86d8547f17131b1028b0af714fa9f53cdb6ce2', '2025-10-13 16:46:02', 1, '2025-10-13 16:43:19', '2025-10-13 16:46:02', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '6694a6d9a10c733eecf2e25afad2d7ae9a5616b8b10f6d8e80c2684e3618f4d4'),
	(68, 7, 'fc9abaae325a00dc5fec08ae8d0905988489a8e406408a43dbe2f6a934d1e94f', '2025-10-20 13:46:02', 0, '2025-10-13 16:46:02', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '6694a6d9a10c733eecf2e25afad2d7ae9a5616b8b10f6d8e80c2684e3618f4d4'),
	(69, 7, '477ffd9a4029e36c888b1b702240b5e914e5fb6a4c6cdc1337098545bca90a00', '2025-10-13 16:46:42', 1, '2025-10-13 16:46:11', '2025-10-13 16:46:42', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '6694a6d9a10c733eecf2e25afad2d7ae9a5616b8b10f6d8e80c2684e3618f4d4'),
	(70, 7, '703eb201169183a7acc8c6e6639eb9f8fc12b1b52c574e2d545e142855773479', '2025-10-13 16:46:43', 1, '2025-10-13 16:46:42', '2025-10-13 16:46:43', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '6694a6d9a10c733eecf2e25afad2d7ae9a5616b8b10f6d8e80c2684e3618f4d4'),
	(71, 7, '0e95c76ca6e21cd7fa15d52042985e4ed937d402daebd2126659944fcac93bdf', '1970-01-07 22:00:00', 0, '2025-10-13 16:46:43', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '6694a6d9a10c733eecf2e25afad2d7ae9a5616b8b10f6d8e80c2684e3618f4d4'),
	(72, 7, '11b5e2232180ef9624a873ed4749eb3208608efca8da80f8275feb86df7e87f8', '1970-01-07 22:00:00', 0, '2025-10-13 16:47:29', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '6694a6d9a10c733eecf2e25afad2d7ae9a5616b8b10f6d8e80c2684e3618f4d4'),
	(73, 7, 'f78ada04ff067550f04aa2721885cfa5e5a34108ecbc18620ff678999158aa46', '1970-01-07 22:00:00', 0, '2025-10-13 19:15:51', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '6694a6d9a10c733eecf2e25afad2d7ae9a5616b8b10f6d8e80c2684e3618f4d4'),
	(74, 7, 'a91fde2a73173287d37c89b2005115c034f001415899529c73c8509a3fa12086', '1970-01-07 22:00:00', 0, '2025-10-13 19:55:10', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '6694a6d9a10c733eecf2e25afad2d7ae9a5616b8b10f6d8e80c2684e3618f4d4'),
	(75, 7, '9bc0d6bbec73e05b3fa76bce223cde3175b004b7f02c96bc85c1570c85cb07f9', '1970-01-07 22:00:00', 0, '2025-10-13 21:08:10', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '6694a6d9a10c733eecf2e25afad2d7ae9a5616b8b10f6d8e80c2684e3618f4d4');

-- Dumping structure for procedure custombid.RejectBid
DELIMITER //
CREATE PROCEDURE `RejectBid`(IN `bid_id` INT, IN `customer_id` INT, IN `reason` TEXT)
BEGIN
  DECLARE request_id INT;
  
  -- Get request ID
  SELECT b.request_id INTO request_id
  FROM bids b
  JOIN requests r ON b.request_id = r.id
  WHERE b.id = bid_id AND r.customer_id = customer_id;
  
  -- Update bid status
  UPDATE bids SET status = 'rejected', rejected_at = NOW(), rejection_reason = reason WHERE id = bid_id;
  
  -- Log bid action
  INSERT INTO bid_actions (bid_id, action_type, performed_by, reason, created_at)
  VALUES (bid_id, 'reject', customer_id, reason, NOW());
  
END//
DELIMITER ;

-- Dumping structure for table custombid.requests
CREATE TABLE IF NOT EXISTS `requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `budget_min` decimal(12,2) DEFAULT NULL,
  `budget_max` decimal(12,2) DEFAULT NULL,
  `currency` enum('EUR','USD') DEFAULT 'EUR',
  `delivery_date` date DEFAULT NULL,
  `time_flexibility` enum('critical','week','month') DEFAULT 'critical',
  `priorities` longtext DEFAULT NULL,
  `status` enum('pending_categorization','open_for_bids','bids_received','in_progress','completed','cancelled','expired') DEFAULT 'pending_categorization',
  `category_id` int(11) DEFAULT NULL,
  `ai_categorized` tinyint(1) DEFAULT 0,
  `manually_categorized` tinyint(1) DEFAULT 0,
  `ai_confidence` decimal(3,2) DEFAULT NULL,
  `ai_categories_suggested` longtext DEFAULT NULL,
  `ai_reasoning` text DEFAULT NULL,
  `file_notes` text DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`),
  KEY `idx_customer_status` (`customer_id`,`status`),
  KEY `idx_status_category` (`status`,`category_id`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_requests_customer_status_created` (`customer_id`,`status`,`created_at`),
  KEY `idx_dashboard_analytics` (`customer_id`,`status`,`created_at`,`category_id`),
  KEY `idx_requests_category_status` (`category_id`,`status`),
  CONSTRAINT `requests_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `requests_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=121 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table custombid.requests: ~25 rows (approximately)
INSERT INTO `requests` (`id`, `customer_id`, `title`, `description`, `budget_min`, `budget_max`, `currency`, `delivery_date`, `time_flexibility`, `priorities`, `status`, `category_id`, `ai_categorized`, `manually_categorized`, `ai_confidence`, `ai_categories_suggested`, `ai_reasoning`, `file_notes`, `expires_at`, `created_at`, `updated_at`) VALUES
	(17, 7, 'Time machine', 'Time machine Time machine Time machine Time machine', 29.00, 34.00, 'EUR', '2025-07-23', 'critical', '{"price":5,"quality":5,"delivery":5}', 'cancelled', NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, '2025-06-27 22:24:55', '2025-07-08 21:49:34'),
	(18, 7, 'I am Aviv Alon aa3adfasf', 'I am Aviv Alon I am 18 years old and I am serving in the miliitary asfd\nasdfamf', 5000.00, 7700.00, 'USD', NULL, 'critical', '{"price":4,"quality":8,"delivery":10}', 'open_for_bids', 5, 0, 0, NULL, NULL, NULL, NULL, NULL, '2025-06-27 23:21:28', '2025-06-30 21:00:05'),
	(19, 7, 'Metal desk', 'I need ultra durable metal desk. 50 meters long, 10 meters tall.', 70.00, 90.00, 'USD', NULL, 'critical', '{"price":5,"quality":5,"delivery":2}', 'pending_categorization', NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, '2025-07-05 11:33:10', '2025-07-05 13:05:32'),
	(20, 7, 'an israel flag', 'an israel flag an israel flag an israel flag an israel flag', 5.00, 100.00, 'USD', '2025-07-24', 'critical', '{"price":4,"quality":5,"delivery":5}', 'pending_categorization', NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, '2025-07-09 18:31:21', '2025-07-09 18:32:16'),
	(22, 7, 'Interactive Exhibition Stand for Medical Device Company', 'Design and build interactive trade show booth with digital displays, product demonstrations, and engaging visitor experience.', 2000.00, 6000.00, 'USD', '2025-07-29', 'critical', '{"price":4,"quality":5,"delivery":5}', 'open_for_bids', 5, 1, 0, 0.90, NULL, 'The request involves designing and building an interactive exhibition stand, which falls under the category of design and creative services. The emphasis on creating engaging visitor experiences aligns with the creative aspect of design.', NULL, NULL, '2025-07-09 19:21:38', '2025-07-09 19:21:43'),
	(23, 7, '3-Month Content Calendar for Fashion Brand', 'Create comprehensive social media content including photography, graphics, captions, and posting schedule for Instagram and Facebook.', 6000.00, 34000.00, 'EUR', NULL, 'critical', '{"price":4,"quality":5,"delivery":5}', 'pending_categorization', 10, 1, 0, 0.90, NULL, 'The request involves creating content for a fashion brand, which falls under the clothing and fashion category. The mention of social media content for Instagram and Facebook further supports this categorization.', NULL, NULL, '2025-07-09 19:25:50', '2025-08-03 06:05:19'),
	(24, 7, 'Natural Anti Aging Serum for Spa', 'Develop custom anti-aging serum using natural ingredients for luxury spa. Need formulation, testing, and packaging design.', 50.00, 100.00, 'EUR', '2025-07-29', 'critical', '{"price":5,"quality":5,"delivery":5}', 'open_for_bids', 13, 1, 0, 0.90, NULL, 'The request involves creating a custom anti-aging serum for a luxury spa, which falls outside the traditional categories provided. Therefore, categorizing it as \'Other\' is the most appropriate choice.', NULL, NULL, '2025-07-09 19:28:38', '2025-08-23 15:36:29'),
	(101, 30, 'Custom IoT Device for Smart Home', 'Need a custom IoT device that can control lights, temperature, and security systems. Should include mobile app integration and voice control capabilities.', 800.00, 1500.00, 'USD', '2025-08-15', 'month', '{"price":7,"quality":9,"delivery":6}', 'open_for_bids', 1, 0, 1, NULL, NULL, NULL, NULL, NULL, '2025-07-18 11:20:24', '2025-07-20 11:20:24'),
	(102, 31, 'LED Display Board for Store', 'Looking for a programmable LED display board for storefront advertising. Size: 4x2 feet. Should be weather-resistant and remotely controllable.', 300.00, 600.00, 'USD', '2025-08-01', 'week', '{"price":8,"quality":8,"delivery":7}', 'open_for_bids', 1, 0, 1, NULL, NULL, NULL, NULL, NULL, '2025-07-19 11:20:24', '2025-07-20 11:20:24'),
	(103, 32, 'Custom PCB Design and Manufacturing', 'Need custom PCB design and small batch manufacturing (50 units) for a prototype device. Includes sensors, microcontroller, and wireless connectivity.', 1200.00, 2000.00, 'USD', '2025-09-01', 'month', '{"price":6,"quality":10,"delivery":5}', 'bids_received', 1, 0, 1, NULL, NULL, NULL, NULL, NULL, '2025-07-17 11:20:24', '2025-07-20 11:20:24'),
	(104, 30, 'Executive Office Desk with Storage', 'Custom executive desk made from solid wood with built-in cable management, drawers, and filing cabinet. Dimensions: 6x3 feet.', 800.00, 1500.00, 'USD', '2025-08-20', 'month', '{"price":6,"quality":9,"delivery":7}', 'open_for_bids', 9, 0, 1, NULL, NULL, NULL, NULL, NULL, '2025-07-19 11:20:24', '2025-07-20 11:20:24'),
	(105, 33, 'Modern Living Room Set', 'Contemporary living room furniture set including sofa, coffee table, and side tables. Minimalist design with neutral colors.', 2000.00, 3500.00, 'USD', '2025-09-15', 'month', '{"price":5,"quality":8,"delivery":6}', 'open_for_bids', 9, 0, 1, NULL, NULL, NULL, NULL, NULL, '2025-07-20 07:20:24', '2025-07-20 11:20:24'),
	(106, 31, 'Custom Kitchen Island', 'Kitchen island with granite countertop, storage cabinets, and breakfast bar seating for 3. Size: 8x4 feet.', 1500.00, 2500.00, 'USD', '2025-08-30', 'week', '{"price":7,"quality":9,"delivery":8}', 'bids_received', 9, 0, 1, NULL, NULL, NULL, NULL, NULL, '2025-07-15 11:20:24', '2025-07-20 11:20:24'),
	(107, 32, 'Complete Brand Identity Package', 'Need complete branding including logo design, business cards, letterhead, website mockups, and brand guidelines for a tech startup.', 1000.00, 2000.00, 'USD', '2025-08-10', 'week', '{"price":6,"quality":10,"delivery":8}', 'open_for_bids', 5, 0, 1, NULL, NULL, NULL, NULL, NULL, '2025-07-19 23:20:24', '2025-07-20 11:20:24'),
	(108, 30, 'Product Packaging Design', 'Packaging design for eco-friendly cleaning products. Need 3 different product lines with sustainable packaging solutions.', 500.00, 1000.00, 'USD', '2025-08-25', 'month', '{"price":7,"quality":9,"delivery":6}', 'bids_received', 5, 0, 1, NULL, NULL, NULL, NULL, NULL, '2025-07-18 11:20:24', '2025-07-20 11:20:24'),
	(109, 33, 'Custom Metal Parts Production', 'Small batch production of custom aluminum parts for machinery. Need precision CNC machining for 100 units with tight tolerances.', 800.00, 1200.00, 'USD', '2025-08-18', 'week', '{"price":8,"quality":10,"delivery":7}', 'open_for_bids', 2, 0, 1, NULL, NULL, NULL, NULL, NULL, '2025-07-20 05:20:24', '2025-07-20 11:20:24'),
	(110, 31, 'Prototype 3D Printing Service', 'Need rapid prototyping service for product development. Multiple iterations expected, high-quality finish required for client presentations.', 300.00, 800.00, 'USD', '2025-07-30', 'critical', '{"price":6,"quality":9,"delivery":10}', 'bids_received', 2, 0, 1, NULL, NULL, NULL, NULL, NULL, '2025-07-19 11:20:24', '2025-07-20 11:20:24'),
	(111, 30, 'E-commerce Website Development', 'Custom e-commerce platform with payment integration, inventory management, and mobile-responsive design. Need full-stack development.', 3000.00, 6000.00, 'USD', '2025-09-30', 'month', '{"price":6,"quality":9,"delivery":5}', 'open_for_bids', 3, 0, 1, NULL, NULL, NULL, NULL, NULL, '2025-07-20 03:20:24', '2025-07-20 11:20:24'),
	(112, 32, 'Mobile App for Fitness Tracking', 'iOS and Android app for fitness tracking with social features, workout plans, and progress analytics. Include backend API development.', 2500.00, 5000.00, 'USD', '2025-10-15', 'month', '{"price":5,"quality":10,"delivery":6}', 'open_for_bids', 3, 0, 1, NULL, NULL, NULL, NULL, NULL, '2025-07-20 08:20:24', '2025-07-20 11:20:24'),
	(113, 33, 'Custom Wedding Ring Set', 'Handcrafted wedding ring set in white gold with custom engraving. Unique design with matching bands for bride and groom.', 1200.00, 2000.00, 'USD', '2025-08-14', 'week', '{"price":5,"quality":10,"delivery":9}', 'open_for_bids', 11, 0, 1, NULL, NULL, NULL, NULL, NULL, '2025-07-20 09:20:24', '2025-07-20 11:20:24'),
	(114, 31, 'Corporate Award Trophies', 'Custom designed trophies for annual corporate awards. Need 15 unique pieces with company branding and personalized engraving.', 800.00, 1500.00, 'USD', '2025-08-05', 'week', '{"price":7,"quality":9,"delivery":8}', 'bids_received', 11, 0, 1, NULL, NULL, NULL, NULL, NULL, '2025-07-19 11:20:24', '2025-07-20 11:20:24'),
	(115, 30, 'Custom Wall Art Installation', 'Large-scale wall art installation for office lobby. Mixed media sculpture with company theme and modern aesthetic.', 1500.00, 3000.00, 'USD', '2025-09-10', 'month', '{"price":6,"quality":10,"delivery":5}', 'open_for_bids', 12, 0, 1, NULL, NULL, NULL, NULL, NULL, '2025-07-20 06:20:24', '2025-07-20 11:20:24'),
	(116, 32, 'Social Media Campaign Strategy', 'Comprehensive social media marketing campaign for product launch. Include content creation, ad design, and campaign management for 3 months.', 1000.00, 2500.00, 'USD', '2025-08-08', 'week', '{"price":7,"quality":8,"delivery":8}', 'open_for_bids', 6, 0, 1, NULL, NULL, NULL, NULL, NULL, '2025-07-19 17:20:24', '2025-07-20 11:20:24'),
	(117, 7, 'hello', 'hi i want to buy hello! this is very nice! please!', 50.00, 200.00, 'USD', '2025-08-13', 'week', '{"price":4,"quality":6,"delivery":8}', 'open_for_bids', 13, 1, 0, 1.00, NULL, 'The request does not provide clear information about the type of product or service being sought, so it falls under the general \'Other\' category.', NULL, NULL, '2025-08-05 18:39:54', '2025-08-05 18:40:12'),
	(118, 7, 'iphone 17 with wings', 'i want iphone 17 with wings, to help it and to enhance it.', 40.00, 200.00, 'USD', '2025-08-28', 'critical', '{"0":"{","1":"\\"","2":"p","3":"r","4":"i","5":"c","6":"e","7":"\\"","8":":","9":"7","10":",","11":"\\"","12":"q","13":"u","14":"a","15":"l","16":"i","17":"t","18":"y","19":"\\"","20":":","21":"5","22":",","23":"\\"","24":"d","25":"e","26":"l","27":"i","28":"v","29":"e","30":"r","31":"y","32":"\\"","33":":","34":"5","35":"}","price":7}', 'pending_categorization', 1, 0, 0, NULL, NULL, NULL, NULL, NULL, '2025-08-23 15:57:45', '2025-08-23 15:59:15'),
	(119, 7, 'Samsung S38', 'I want a brand new samsung s38 with 2 folding cameras', 0.01, 99.98, 'USD', '2025-11-05', 'critical', '{"0":"{","1":"\\"","2":"p","3":"r","4":"i","5":"c","6":"e","7":"\\"","8":":","9":"4","10":",","11":"\\"","12":"q","13":"u","14":"a","15":"l","16":"i","17":"t","18":"y","19":"\\"","20":":","21":"6","22":",","23":"\\"","24":"d","25":"e","26":"l","27":"i","28":"v","29":"e","30":"r","31":"y","32":"\\"","33":":","34":"4","35":"}","price":55}', 'pending_categorization', NULL, 0, 0, NULL, NULL, NULL, '', NULL, '2025-08-23 16:15:19', '2025-10-14 00:40:12'),
	(120, 7, 'asdfjdklsajfasdlkfjdsalkfjsalkfjasdf', 'asdfasdfsafasdfasdfasdf', 500.00, 1500.00, 'USD', '2025-11-08', 'critical', '"{\\"price\\":7,\\"quality\\":6,\\"delivery\\":8}"', 'cancelled', 1, 0, 0, NULL, NULL, NULL, NULL, NULL, '2025-10-09 11:24:05', '2025-10-14 00:38:57'),
	(121, 7, 'iPhone 17 pro max', 'I am searching for a brand new  iphone 17', NULL, NULL, 'USD', '2026-10-02', 'month', '{"quality":53,"price":50,"speed":50,"features":50}', 'open_for_bids', 3, 0, 0, NULL, NULL, NULL, '', '2025-11-13 01:41:36', '2025-10-14 00:41:36', '2025-10-14 00:41:52'),
	(122, 37, 'Corporate Website Redesign', 'Complete redesign of our corporate website. Need modern responsive design, CMS integration, and improved SEO. Must support multiple languages and have analytics integration.', 12000.00, 18000.00, 'USD', '2025-09-24', 'month', '["SEO optimized", "Mobile responsive", "Fast loading", "Modern design"]', 'completed', 1, 1, 0, 0.93, NULL, NULL, 'Attached current sitemap and brand guidelines', NULL, '2025-07-26 14:44:55', '2025-09-29 14:44:55'),
	(123, 37, 'Professional Logo Design', 'Need a modern, professional logo for our brand. Should work well in both digital and print formats. Require multiple concepts and revisions.', 2000.00, 3500.00, 'USD', '2025-08-30', 'week', '["Unique design", "Scalable", "Multiple formats"]', 'completed', 2, 1, 0, 0.88, NULL, NULL, NULL, NULL, '2025-08-05 14:44:55', '2025-09-09 14:44:55'),
	(124, 37, 'iOS and Android Mobile App', 'Build native mobile apps for both iOS and Android. Features include user authentication, real-time notifications, payment integration, and offline mode support.', 35000.00, 50000.00, 'USD', '2025-11-28', 'month', '["Native apps", "Push notifications", "Payment gateway", "Offline support"]', 'in_progress', 1, 1, 0, 0.91, NULL, NULL, NULL, NULL, '2025-08-25 14:44:55', '2025-10-11 14:44:55'),
	(125, 37, 'Enterprise Cloud Migration', 'Migrate our on-premise infrastructure to AWS. Need complete migration strategy, implementation, and post-migration support. Zero downtime required.', 25000.00, 40000.00, 'USD', '2025-12-13', 'month', '["Zero downtime", "AWS expertise", "Security compliance", "Backup strategy"]', 'in_progress', 1, 1, 0, 0.95, NULL, NULL, NULL, NULL, '2025-09-09 14:44:55', '2025-10-12 14:44:55'),
	(126, 37, 'RESTful API Development', 'Develop comprehensive RESTful API for our platform. Need authentication, rate limiting, documentation, and testing. Must be scalable and well-documented.', 15000.00, 22000.00, 'USD', '2025-12-03', 'week', '["RESTful standards", "Documentation", "Testing", "Scalable"]', 'bids_received', 1, 1, 0, 0.89, NULL, NULL, NULL, NULL, '2025-09-26 14:44:55', '2025-10-13 14:44:55'),
	(127, 37, 'DevOps Pipeline Setup', 'Set up complete CI/CD pipeline with automated testing, deployment, and monitoring. Need Docker, Kubernetes, and Jenkins configuration.', 10000.00, 15000.00, 'USD', '2025-11-23', 'month', '["CI/CD", "Docker", "Kubernetes", "Monitoring"]', 'open_for_bids', 1, 1, 0, 0.87, NULL, NULL, NULL, NULL, '2025-10-06 14:44:55', '2025-10-06 14:44:55'),
	(128, 37, 'Machine Learning Model Development', 'Develop ML model for customer behavior prediction. Need data analysis, model training, deployment, and monitoring dashboard.', 20000.00, 30000.00, 'USD', '2025-12-23', 'month', '["Python", "TensorFlow", "Model accuracy", "Dashboard"]', 'open_for_bids', 1, 1, 0, 0.92, NULL, NULL, NULL, NULL, '2025-10-11 14:44:55', '2025-10-11 14:44:55');

-- Dumping structure for table custombid.request_files
CREATE TABLE IF NOT EXISTS `request_files` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `request_id` int(11) NOT NULL,
  `filename` varchar(255) NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_type` varchar(100) NOT NULL,
  `file_size` int(11) NOT NULL,
  `file_category` enum('image','document','other') DEFAULT 'other',
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_request_id` (`request_id`),
  KEY `idx_file_type` (`file_type`),
  KEY `idx_file_category` (`file_category`),
  CONSTRAINT `request_files_ibfk_1` FOREIGN KEY (`request_id`) REFERENCES `requests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table custombid.request_files: ~13 rows (approximately)
INSERT INTO `request_files` (`id`, `request_id`, `filename`, `original_name`, `file_path`, `file_type`, `file_size`, `file_category`, `uploaded_at`) VALUES
	(1, 20, '1752085881852-imslfixm8.png', 'Flag_of_Israel.svg.png', '/uploads/requests/1752085881852-imslfixm8.png', 'image/png', 14161, 'image', '2025-07-09 18:31:21'),
	(2, 20, '1752085881919-46130c2f2.pdf', 'Site File Structure.pdf', '/uploads/requests/1752085881919-46130c2f2.pdf', 'application/pdf', 156715, 'document', '2025-07-09 18:31:21'),
	(4, 22, '1752088898657-v1ds1qloi.jpg', 'jm-medical-device.jpg', '/uploads/requests/1752088898657-v1ds1qloi.jpg', 'image/jpeg', 108601, 'image', '2025-07-09 19:21:38'),
	(5, 23, '1752089150754-yu0imig0g.png', 'Social_media_collection_2020s.png', '/uploads/requests/1752089150754-yu0imig0g.png', 'image/png', 138244, 'image', '2025-07-09 19:25:50'),
	(6, 24, '1752089318520-ktmk476hn.jpeg', 'Massage-Relaxing.jpeg', '/uploads/requests/1752089318520-ktmk476hn.jpeg', 'image/jpeg', 124215, 'image', '2025-07-09 19:28:38'),
	(7, 101, 'iot-device-sketch.jpg', 'Smart Home Device Sketch.jpg', '/uploads/requests/iot-device-sketch.jpg', 'image/jpeg', 245760, 'image', '2025-07-18 11:20:25'),
	(8, 104, 'office-desk-reference.png', 'Executive Desk Reference.png', '/uploads/requests/office-desk-reference.png', 'image/png', 189440, 'image', '2025-07-19 11:20:25'),
	(9, 107, 'brand-inspiration.pdf', 'Brand Inspiration Board.pdf', '/uploads/requests/brand-inspiration.pdf', 'application/pdf', 512000, 'document', '2025-07-19 23:20:25'),
	(10, 111, 'ecommerce-wireframes.pdf', 'Website Wireframes.pdf', '/uploads/requests/ecommerce-wireframes.pdf', 'application/pdf', 756800, 'document', '2025-07-20 03:20:25'),
	(11, 113, 'ring-inspiration.jpg', 'Wedding Ring Inspiration.jpg', '/uploads/requests/ring-inspiration.jpg', 'image/jpeg', 156720, 'image', '2025-07-20 09:20:25'),
	(12, 117, '1754419194407-1l5mbmtbz.jpg', 'plans-1867745_1920.jpg', '/uploads/requests/1754419194407-1l5mbmtbz.jpg', 'image/jpeg', 469113, 'image', '2025-08-05 18:39:54'),
	(13, 117, '1754419194904-lnpqhlxxm.jpg', '473671058_1169582291243583_7198861683779550694_n.jpg', '/uploads/requests/1754419194904-lnpqhlxxm.jpg', 'image/jpeg', 70901, 'image', '2025-08-05 18:39:55'),
	(14, 117, '1754419196772-qqp4fu1gr.pdf', 'Global files.pdf', '/uploads/requests/1754419196772-qqp4fu1gr.pdf', 'application/pdf', 150061, 'document', '2025-08-05 18:39:56');

-- Dumping structure for table custombid.request_status_history
CREATE TABLE IF NOT EXISTS `request_status_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `request_id` int(11) NOT NULL,
  `old_status` enum('pending_categorization','open_for_bids','bids_received','in_progress','completed','cancelled','expired') DEFAULT NULL,
  `new_status` enum('pending_categorization','open_for_bids','bids_received','in_progress','completed','cancelled','expired') NOT NULL,
  `changed_by` int(11) NOT NULL COMMENT 'User ID who made the change',
  `change_type` enum('automatic','manual','system') DEFAULT 'manual' COMMENT 'Type of status change',
  `reason` varchar(500) DEFAULT NULL COMMENT 'Reason for the status change',
  `notes` text DEFAULT NULL COMMENT 'Additional notes about the change',
  `metadata` longtext DEFAULT NULL COMMENT 'Additional metadata as JSON',
  `changed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_request_id` (`request_id`),
  KEY `idx_changed_by` (`changed_by`),
  KEY `idx_old_status` (`old_status`),
  KEY `idx_new_status` (`new_status`),
  KEY `idx_change_type` (`change_type`),
  KEY `idx_changed_at` (`changed_at`),
  KEY `idx_request_status` (`request_id`,`new_status`),
  KEY `idx_user_changes` (`changed_by`,`changed_at`),
  CONSTRAINT `request_status_history_ibfk_1` FOREIGN KEY (`request_id`) REFERENCES `requests` (`id`) ON DELETE CASCADE,
  CONSTRAINT `request_status_history_ibfk_2` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table custombid.request_status_history: ~0 rows (approximately)
INSERT INTO `request_status_history` (`id`, `request_id`, `old_status`, `new_status`, `changed_by`, `change_type`, `reason`, `notes`, `metadata`, `changed_at`) VALUES
	(1, 17, 'open_for_bids', 'cancelled', 7, 'manual', 'Request deleted by customer', NULL, NULL, '2025-07-08 21:49:34'),
	(2, 120, 'pending_categorization', 'cancelled', 7, 'manual', 'Request cancelled by customer', NULL, NULL, '2025-10-14 00:38:57'),
	(3, 121, NULL, 'open_for_bids', 7, 'automatic', NULL, NULL, NULL, '2025-10-14 00:41:36');

-- Dumping structure for table custombid.reviews
CREATE TABLE IF NOT EXISTS `reviews` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL,
  `reviewer_id` int(11) NOT NULL,
  `reviewed_id` int(11) NOT NULL,
  `rating` int(11) NOT NULL CHECK (`rating` >= 1 and `rating` <= 5),
  `comment` text DEFAULT NULL,
  `review_type` enum('customer_to_supplier','supplier_to_customer') NOT NULL,
  `is_anonymous` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_reviewer_order` (`reviewer_id`,`order_id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_reviewer_id` (`reviewer_id`),
  KEY `idx_reviewed_id` (`reviewed_id`),
  KEY `idx_rating` (`rating`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`reviewer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reviews_ibfk_3` FOREIGN KEY (`reviewed_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table custombid.reviews: ~0 rows (approximately)

-- Dumping structure for view custombid.security_monitoring
-- Creating temporary table to overcome VIEW dependency errors
CREATE TABLE `security_monitoring` (
	`metric_type` VARCHAR(1) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`count` BIGINT(21) NOT NULL,
	`date` DATE NULL
);

-- Dumping structure for table custombid.supplier_activity_log
CREATE TABLE IF NOT EXISTS `supplier_activity_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `supplier_id` int(11) NOT NULL,
  `activity_type` enum('login','bid_submitted','bid_updated','bid_withdrawn','order_status_changed','message_sent','profile_updated') NOT NULL,
  `entity_type` enum('bid','order','request','profile','system') DEFAULT NULL,
  `entity_id` int(11) DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_supplier_activity_date` (`supplier_id`,`created_at`),
  KEY `idx_activity_type` (`activity_type`),
  KEY `idx_entity` (`entity_type`,`entity_id`),
  CONSTRAINT `supplier_activity_log_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table custombid.supplier_activity_log: ~0 rows (approximately)

-- Dumping structure for table custombid.supplier_availability
CREATE TABLE IF NOT EXISTS `supplier_availability` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `supplier_id` int(11) NOT NULL,
  `available_from` date NOT NULL,
  `available_until` date DEFAULT NULL,
  `capacity_percentage` int(11) DEFAULT 100 CHECK (`capacity_percentage` >= 0 and `capacity_percentage` <= 100),
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_supplier_availability_dates` (`supplier_id`,`available_from`,`available_until`),
  CONSTRAINT `supplier_availability_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table custombid.supplier_availability: ~0 rows (approximately)

-- Dumping structure for table custombid.supplier_categories
CREATE TABLE IF NOT EXISTS `supplier_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `supplier_id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `expertise_level` enum('beginner','intermediate','expert') DEFAULT 'beginner',
  `experience_years` int(11) DEFAULT 0,
  `portfolio_items` text DEFAULT NULL,
  `certifications` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_supplier_category` (`supplier_id`,`category_id`),
  KEY `idx_supplier_id` (`supplier_id`),
  KEY `idx_category_id` (`category_id`),
  KEY `idx_supplier_categories_supplier` (`supplier_id`),
  KEY `idx_expertise_level` (`expertise_level`),
  KEY `idx_experience_years` (`experience_years`),
  CONSTRAINT `supplier_categories_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `supplier_categories_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table custombid.supplier_categories: ~9 rows (approximately)
INSERT INTO `supplier_categories` (`id`, `supplier_id`, `category_id`, `expertise_level`, `experience_years`, `portfolio_items`, `certifications`, `created_at`) VALUES
	(2, 21, 9, 'beginner', 0, NULL, NULL, '2025-07-20 11:20:24'),
	(3, 21, 12, 'beginner', 0, NULL, NULL, '2025-07-20 11:20:24'),
	(4, 22, 5, 'beginner', 0, NULL, NULL, '2025-07-20 11:20:24'),
	(5, 22, 6, 'beginner', 0, NULL, NULL, '2025-07-20 11:20:24'),
	(6, 23, 2, 'beginner', 0, NULL, NULL, '2025-07-20 11:20:24'),
	(7, 23, 1, 'beginner', 0, NULL, NULL, '2025-07-20 11:20:24'),
	(8, 24, 3, 'beginner', 0, NULL, NULL, '2025-07-20 11:20:24'),
	(9, 25, 11, 'beginner', 0, NULL, NULL, '2025-07-20 11:20:24'),
	(10, 25, 8, 'beginner', 0, NULL, NULL, '2025-07-20 11:20:24'),
	(13, 20, 1, 'beginner', 0, NULL, NULL, '2025-08-26 17:53:37'),
	(14, 20, 9, 'beginner', 0, NULL, NULL, '2025-08-26 17:53:37');

-- Dumping structure for table custombid.supplier_files
CREATE TABLE IF NOT EXISTS `supplier_files` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `supplier_id` int(11) NOT NULL,
  `file_category` enum('business_documents','portfolio','company_assets','certifications') NOT NULL DEFAULT 'business_documents',
  `original_name` varchar(255) NOT NULL,
  `filename` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_type` varchar(100) NOT NULL,
  `file_size` int(11) NOT NULL,
  `description` text DEFAULT NULL,
  `is_public` tinyint(1) DEFAULT 0,
  `sort_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_supplier_files_supplier` (`supplier_id`),
  KEY `idx_supplier_files_category` (`file_category`),
  CONSTRAINT `fk_supplier_files_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `supplier_profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table custombid.supplier_files: ~0 rows (approximately)

-- Dumping structure for table custombid.supplier_notifications
CREATE TABLE IF NOT EXISTS `supplier_notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `supplier_id` int(11) NOT NULL,
  `request_id` int(11) NOT NULL,
  `notification_type` enum('new_request','request_update','request_cancelled') DEFAULT 'new_request',
  `is_read` tinyint(1) DEFAULT 0,
  `sent_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `read_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_supplier_request_type` (`supplier_id`,`request_id`,`notification_type`),
  KEY `idx_supplier_unread` (`supplier_id`,`is_read`),
  KEY `idx_request_notifications` (`request_id`),
  KEY `idx_sent_at` (`sent_at`),
  CONSTRAINT `supplier_notifications_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `supplier_notifications_ibfk_2` FOREIGN KEY (`request_id`) REFERENCES `requests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table custombid.supplier_notifications: ~8 rows (approximately)
INSERT INTO `supplier_notifications` (`id`, `supplier_id`, `request_id`, `notification_type`, `is_read`, `sent_at`, `read_at`) VALUES
	(1, 20, 101, 'new_request', 0, '2025-07-18 11:20:25', NULL),
	(2, 20, 102, 'new_request', 0, '2025-07-19 11:20:25', NULL),
	(3, 21, 104, 'new_request', 0, '2025-07-19 11:20:25', NULL),
	(4, 21, 105, 'new_request', 0, '2025-07-20 07:20:25', NULL),
	(5, 22, 107, 'new_request', 0, '2025-07-19 23:20:25', NULL),
	(6, 24, 111, 'new_request', 0, '2025-07-20 03:20:25', NULL),
	(7, 24, 112, 'new_request', 0, '2025-07-20 08:20:25', NULL),
	(8, 25, 113, 'new_request', 0, '2025-07-20 09:20:25', NULL);

-- Dumping structure for table custombid.supplier_notification_preferences
CREATE TABLE IF NOT EXISTS `supplier_notification_preferences` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `supplier_id` int(11) NOT NULL,
  `email_new_requests` tinyint(1) DEFAULT 1,
  `email_bid_updates` tinyint(1) DEFAULT 1,
  `email_order_updates` tinyint(1) DEFAULT 1,
  `sms_notifications` tinyint(1) DEFAULT 0,
  `push_notifications` tinyint(1) DEFAULT 1,
  `notification_frequency` enum('immediate','daily','weekly') DEFAULT 'immediate',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unq_supplier_notification_prefs` (`supplier_id`),
  CONSTRAINT `fk_notification_prefs_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `supplier_profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=57 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table custombid.supplier_notification_preferences: ~27 rows (approximately)
INSERT INTO `supplier_notification_preferences` (`id`, `supplier_id`, `email_new_requests`, `email_bid_updates`, `email_order_updates`, `sms_notifications`, `push_notifications`, `notification_frequency`, `created_at`, `updated_at`) VALUES
	(1, 1, 1, 1, 1, 0, 1, 'immediate', '2025-07-22 11:46:51', '2025-07-22 11:46:51'),
	(2, 2, 1, 1, 1, 0, 1, 'immediate', '2025-07-22 11:46:51', '2025-07-22 11:46:51'),
	(3, 3, 1, 1, 1, 0, 1, 'immediate', '2025-07-22 11:46:51', '2025-07-22 11:46:51'),
	(4, 4, 1, 1, 1, 0, 1, 'immediate', '2025-07-22 11:46:51', '2025-07-22 11:46:51'),
	(5, 5, 1, 1, 1, 0, 1, 'immediate', '2025-07-22 11:46:51', '2025-07-22 11:46:51'),
	(6, 6, 1, 1, 1, 0, 1, 'immediate', '2025-07-22 11:46:51', '2025-07-22 11:46:51'),
	(7, 7, 1, 1, 1, 0, 1, 'immediate', '2025-07-22 11:46:51', '2025-07-22 11:46:51'),
	(8, 8, 1, 1, 1, 0, 1, 'immediate', '2025-07-22 11:46:51', '2025-07-22 11:46:51'),
	(10, 10, 1, 1, 1, 0, 1, 'immediate', '2025-07-22 11:46:51', '2025-07-22 11:46:51'),
	(11, 11, 1, 1, 1, 0, 1, 'immediate', '2025-07-22 11:46:51', '2025-07-22 11:46:51'),
	(12, 12, 1, 1, 1, 0, 1, 'immediate', '2025-07-22 11:46:51', '2025-07-22 11:46:51'),
	(13, 13, 1, 1, 1, 0, 1, 'immediate', '2025-07-22 11:46:51', '2025-07-22 11:46:51'),
	(14, 14, 1, 1, 1, 0, 1, 'immediate', '2025-07-22 11:46:51', '2025-07-22 11:46:51'),
	(43, 47, 1, 1, 1, 0, 1, 'immediate', '2025-07-26 09:20:52', '2025-07-26 09:20:52'),
	(44, 48, 1, 1, 1, 0, 1, 'immediate', '2025-07-26 09:20:53', '2025-07-26 09:20:53'),
	(45, 49, 1, 1, 1, 0, 1, 'immediate', '2025-07-26 09:24:10', '2025-07-26 09:24:10'),
	(46, 50, 1, 1, 1, 0, 1, 'immediate', '2025-07-26 09:31:38', '2025-07-26 09:31:38'),
	(47, 51, 1, 1, 1, 0, 1, 'immediate', '2025-07-26 09:31:39', '2025-07-26 09:31:39'),
	(48, 52, 1, 1, 1, 0, 1, 'immediate', '2025-07-26 09:32:10', '2025-07-26 09:32:10'),
	(49, 53, 1, 1, 1, 0, 1, 'immediate', '2025-07-26 09:32:11', '2025-07-26 09:32:11'),
	(50, 54, 1, 1, 1, 0, 1, 'immediate', '2025-07-26 09:35:01', '2025-07-26 09:35:01'),
	(51, 55, 1, 1, 1, 0, 1, 'immediate', '2025-07-26 09:35:02', '2025-07-26 09:35:02'),
	(52, 56, 1, 1, 1, 0, 1, 'immediate', '2025-07-26 09:38:49', '2025-07-26 09:38:49'),
	(53, 57, 1, 1, 1, 0, 1, 'immediate', '2025-07-26 09:38:50', '2025-07-26 09:38:50'),
	(54, 58, 1, 1, 1, 0, 1, 'immediate', '2025-07-26 10:07:23', '2025-07-26 10:07:23'),
	(55, 59, 1, 1, 1, 0, 1, 'immediate', '2025-07-26 10:12:11', '2025-07-26 10:12:11'),
	(56, 60, 1, 1, 1, 0, 1, 'immediate', '2025-07-26 10:12:11', '2025-07-26 10:12:11');

-- Dumping structure for table custombid.supplier_performance_metrics
CREATE TABLE IF NOT EXISTS `supplier_performance_metrics` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `supplier_id` int(11) NOT NULL,
  `metric_date` date NOT NULL,
  `bids_submitted` int(11) DEFAULT 0,
  `bids_won` int(11) DEFAULT 0,
  `bids_lost` int(11) DEFAULT 0,
  `avg_response_time_hours` decimal(5,2) DEFAULT NULL,
  `total_revenue` decimal(12,2) DEFAULT 0.00,
  `avg_rating` decimal(3,2) DEFAULT NULL,
  `completion_rate` decimal(5,2) DEFAULT NULL,
  `on_time_delivery_rate` decimal(5,2) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_supplier_date` (`supplier_id`,`metric_date`),
  CONSTRAINT `supplier_performance_metrics_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table custombid.supplier_performance_metrics: ~0 rows (approximately)

-- Dumping structure for table custombid.supplier_portfolio
CREATE TABLE IF NOT EXISTS `supplier_portfolio` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `supplier_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `category_id` int(11) DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `project_url` varchar(500) DEFAULT NULL,
  `completion_date` date DEFAULT NULL,
  `client_name` varchar(255) DEFAULT NULL,
  `project_value` decimal(12,2) DEFAULT NULL,
  `technologies` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`technologies`)),
  `is_featured` tinyint(1) DEFAULT 0,
  `display_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`),
  KEY `idx_supplier_portfolio` (`supplier_id`,`is_featured`,`display_order`),
  CONSTRAINT `supplier_portfolio_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `supplier_portfolio_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table custombid.supplier_portfolio: ~0 rows (approximately)

-- Dumping structure for table custombid.supplier_privacy_settings
CREATE TABLE IF NOT EXISTS `supplier_privacy_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `supplier_id` int(11) NOT NULL,
  `profile_visibility` enum('public','private','verified_only') DEFAULT 'public',
  `show_contact_info` tinyint(1) DEFAULT 1,
  `show_portfolio` tinyint(1) DEFAULT 1,
  `show_reviews` tinyint(1) DEFAULT 1,
  `allow_messages` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unq_supplier_privacy_settings` (`supplier_id`),
  CONSTRAINT `fk_privacy_settings_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `supplier_profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=57 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table custombid.supplier_privacy_settings: ~27 rows (approximately)
INSERT INTO `supplier_privacy_settings` (`id`, `supplier_id`, `profile_visibility`, `show_contact_info`, `show_portfolio`, `show_reviews`, `allow_messages`, `created_at`, `updated_at`) VALUES
	(1, 1, 'public', 1, 1, 1, 1, '2025-07-22 11:46:51', '2025-07-22 11:46:51'),
	(2, 2, 'public', 1, 1, 1, 1, '2025-07-22 11:46:51', '2025-07-22 11:46:51'),
	(3, 3, 'public', 1, 1, 1, 1, '2025-07-22 11:46:51', '2025-07-22 11:46:51'),
	(4, 4, 'public', 1, 1, 1, 1, '2025-07-22 11:46:51', '2025-07-22 11:46:51'),
	(5, 5, 'public', 1, 1, 1, 1, '2025-07-22 11:46:51', '2025-07-22 11:46:51'),
	(6, 6, 'public', 1, 1, 1, 1, '2025-07-22 11:46:51', '2025-07-22 11:46:51'),
	(7, 7, 'public', 1, 1, 1, 1, '2025-07-22 11:46:51', '2025-07-22 11:46:51'),
	(8, 8, 'public', 1, 1, 1, 1, '2025-07-22 11:46:51', '2025-07-22 11:46:51'),
	(10, 10, 'public', 1, 1, 1, 1, '2025-07-22 11:46:51', '2025-07-22 11:46:51'),
	(11, 11, 'public', 1, 1, 1, 1, '2025-07-22 11:46:51', '2025-07-22 11:46:51'),
	(12, 12, 'public', 1, 1, 1, 1, '2025-07-22 11:46:51', '2025-07-22 11:46:51'),
	(13, 13, 'public', 1, 1, 1, 1, '2025-07-22 11:46:51', '2025-07-22 11:46:51'),
	(14, 14, 'public', 1, 1, 1, 1, '2025-07-22 11:46:51', '2025-07-22 11:46:51'),
	(43, 47, 'public', 1, 1, 1, 1, '2025-07-26 09:20:52', '2025-07-26 09:20:52'),
	(44, 48, 'public', 1, 1, 1, 1, '2025-07-26 09:20:53', '2025-07-26 09:20:53'),
	(45, 49, 'public', 1, 1, 1, 1, '2025-07-26 09:24:10', '2025-07-26 09:24:10'),
	(46, 50, 'public', 1, 1, 1, 1, '2025-07-26 09:31:38', '2025-07-26 09:31:38'),
	(47, 51, 'public', 1, 1, 1, 1, '2025-07-26 09:31:39', '2025-07-26 09:31:39'),
	(48, 52, 'public', 1, 1, 1, 1, '2025-07-26 09:32:10', '2025-07-26 09:32:10'),
	(49, 53, 'public', 1, 1, 1, 1, '2025-07-26 09:32:11', '2025-07-26 09:32:11'),
	(50, 54, 'public', 1, 1, 1, 1, '2025-07-26 09:35:01', '2025-07-26 09:35:01'),
	(51, 55, 'public', 1, 1, 1, 1, '2025-07-26 09:35:02', '2025-07-26 09:35:02'),
	(52, 56, 'public', 1, 1, 1, 1, '2025-07-26 09:38:49', '2025-07-26 09:38:49'),
	(53, 57, 'public', 1, 1, 1, 1, '2025-07-26 09:38:50', '2025-07-26 09:38:50'),
	(54, 58, 'public', 1, 1, 1, 1, '2025-07-26 10:07:23', '2025-07-26 10:07:23'),
	(55, 59, 'public', 1, 1, 1, 1, '2025-07-26 10:12:11', '2025-07-26 10:12:11'),
	(56, 60, 'public', 1, 1, 1, 1, '2025-07-26 10:12:11', '2025-07-26 10:12:11');

-- Dumping structure for table custombid.supplier_profiles
CREATE TABLE IF NOT EXISTS `supplier_profiles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `company_name` varchar(255) NOT NULL,
  `business_license` varchar(255) DEFAULT NULL,
  `tax_id` varchar(100) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `is_approved` tinyint(1) DEFAULT 0,
  `rating` decimal(3,2) DEFAULT 0.00,
  `review_count` int(11) DEFAULT 0,
  `approval_date` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `profile_completion` int(11) DEFAULT 0 COMMENT 'Profile completion percentage',
  `last_profile_update` timestamp NULL DEFAULT NULL COMMENT 'Last time profile was updated',
  `avatar_url` varchar(500) DEFAULT NULL COMMENT 'Profile avatar image URL',
  `operating_hours` text DEFAULT NULL COMMENT 'Business operating hours in JSON format',
  `service_areas` text DEFAULT NULL COMMENT 'Service coverage areas in JSON format',
  `company_size` varchar(50) DEFAULT NULL COMMENT 'Size of the company (small, medium, large)',
  `year_established` int(4) DEFAULT NULL COMMENT 'Year company was established',
  `subscription_plan` enum('basic','premium','enterprise') DEFAULT 'basic',
  `subscription_expires_at` timestamp NULL DEFAULT NULL,
  `featured_supplier` tinyint(1) DEFAULT 0,
  `premium_status` tinyint(1) DEFAULT 0,
  `verification_status` enum('pending','verified','rejected') DEFAULT 'pending',
  `verification_date` timestamp NULL DEFAULT NULL,
  `verification_notes` text DEFAULT NULL,
  `profile_completion_score` int(11) DEFAULT 0 CHECK (`profile_completion_score` >= 0 and `profile_completion_score` <= 100),
  `visibility_status` enum('public','private','limited') DEFAULT 'public',
  `business_hours` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`business_hours`)),
  `timezone` varchar(50) DEFAULT NULL,
  `portfolio_description` text DEFAULT NULL,
  `awards_recognitions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`awards_recognitions`)),
  `insurance_coverage` varchar(255) DEFAULT NULL,
  `environmental_certifications` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`environmental_certifications`)),
  `social_media_links` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`social_media_links`)),
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_company_name` (`company_name`),
  KEY `idx_is_approved` (`is_approved`),
  KEY `idx_city` (`city`),
  KEY `idx_country` (`country`),
  KEY `idx_rating` (`rating`),
  KEY `idx_profile_completion` (`profile_completion`),
  CONSTRAINT `supplier_profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_company_name_not_empty` CHECK (`company_name` is not null and trim(`company_name`) <> '')
) ENGINE=InnoDB AUTO_INCREMENT=66 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table custombid.supplier_profiles: ~33 rows (approximately)
INSERT INTO `supplier_profiles` (`id`, `user_id`, `company_name`, `business_license`, `tax_id`, `address`, `city`, `country`, `website`, `description`, `is_approved`, `rating`, `review_count`, `approval_date`, `created_at`, `updated_at`, `profile_completion`, `last_profile_update`, `avatar_url`, `operating_hours`, `service_areas`, `company_size`, `year_established`, `subscription_plan`, `subscription_expires_at`, `featured_supplier`, `premium_status`, `verification_status`, `verification_date`, `verification_notes`, `profile_completion_score`, `visibility_status`, `business_hours`, `timezone`, `portfolio_description`, `awards_recognitions`, `insurance_coverage`, `environmental_certifications`, `social_media_links`) VALUES
	(1, 3, 'Smith Electronics Co.', NULL, NULL, NULL, NULL, NULL, NULL, 'Premium electronic components supplier', 1, 4.50, 12, '2025-06-27 22:42:17', '2025-06-27 19:42:17', '2025-07-22 11:46:51', 40, NULL, NULL, NULL, NULL, NULL, NULL, 'basic', NULL, 0, 0, 'pending', NULL, NULL, 0, 'public', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	(2, 4, 'Premium MetalWorks', 'BL-2023-001', 'TX-789456123', '123 Industrial Ave', 'Pittsburgh', 'USA', 'https://metalworks.com', 'Specialized in custom metal fabrication and desk manufacturing', 1, 4.75, 8, '2025-06-27 22:45:00', '2025-06-27 20:00:00', '2025-07-25 21:36:04', 70, NULL, NULL, NULL, NULL, NULL, NULL, 'basic', NULL, 0, 0, 'pending', NULL, NULL, 0, 'public', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	(3, 5, 'DesignPro Studio', 'BL-2023-002', 'TX-987654321', '456 Design District', 'Austin', 'USA', 'https://designpro.com', 'Creative design solutions for custom products and prototypes', 1, 4.80, 15, '2025-06-27 22:50:00', '2025-06-27 20:15:00', '2025-07-25 21:36:04', 70, NULL, NULL, NULL, NULL, NULL, NULL, 'basic', NULL, 0, 0, 'pending', NULL, NULL, 0, 'public', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	(4, 6, 'Craftsman Workshop', 'BL-2023-003', 'TX-456789012', '789 Workshop Lane', 'Dallas', 'USA', 'https://craftsman.com', 'Handcrafted furniture and custom woodwork specialists', 1, 4.60, 22, '2025-06-27 23:00:00', '2025-06-27 20:30:00', '2025-07-25 21:36:04', 70, NULL, NULL, NULL, NULL, NULL, NULL, 'basic', NULL, 0, 0, 'pending', NULL, NULL, 0, 'public', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	(5, 8, 'TechSolutions Inc.', 'BL-2023-004', 'TX-123456789', '321 Tech Plaza', 'San Jose', 'USA', 'https://techsolutions.com', 'Advanced technology solutions and custom development', 1, 4.90, 35, '2025-06-27 23:15:00', '2025-06-27 21:00:00', '2025-07-25 21:36:04', 70, NULL, NULL, NULL, NULL, NULL, NULL, 'basic', NULL, 0, 0, 'pending', NULL, NULL, 0, 'public', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	(6, 9, 'Elite Furniture Co.', 'BL-2023-005', 'TX-654321098', '654 Furniture Row', 'Houston', 'USA', 'https://elitefurniture.com', 'High-end office furniture and custom desk solutions', 1, 4.70, 18, '2025-06-27 23:30:00', '2025-06-27 21:15:00', '2025-07-25 21:36:04', 70, NULL, NULL, NULL, NULL, NULL, NULL, 'basic', NULL, 0, 0, 'pending', NULL, NULL, 0, 'public', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	(7, 10, 'Aviv Inc', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, 0.00, 0, NULL, '2025-07-09 20:41:54', '2025-07-22 11:46:51', 20, NULL, NULL, NULL, NULL, NULL, NULL, 'basic', NULL, 0, 0, 'pending', NULL, NULL, 0, 'public', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	(8, 11, 'aviv', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, 0.00, 0, NULL, '2025-07-13 21:34:16', '2025-07-22 11:46:51', 20, NULL, NULL, NULL, NULL, NULL, NULL, 'basic', NULL, 0, 0, 'pending', NULL, NULL, 0, 'public', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	(10, 21, 'CraftWood Furniture', 'FU-2024-002', NULL, NULL, NULL, NULL, NULL, 'Custom furniture design and manufacturing specialists', 1, 4.60, 32, '2025-07-20 14:20:24', '2025-07-20 11:20:24', '2025-07-25 21:36:04', 70, NULL, NULL, NULL, NULL, NULL, NULL, 'basic', NULL, 0, 0, 'pending', NULL, NULL, 0, 'public', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	(11, 22, 'Creative Design Studio', 'DS-2024-003', NULL, NULL, NULL, NULL, NULL, 'Professional design services for branding, web, and print', 1, 4.90, 67, '2025-07-20 14:20:24', '2025-07-20 11:20:24', '2025-07-25 21:36:04', 70, NULL, NULL, NULL, NULL, NULL, NULL, 'basic', NULL, 0, 0, 'pending', NULL, NULL, 0, 'public', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	(12, 23, 'Precision Manufacturing Co.', 'MF-2024-004', NULL, NULL, NULL, NULL, NULL, 'High-quality manufacturing solutions for custom products', 1, 4.70, 28, '2025-07-20 14:20:24', '2025-07-20 11:20:24', '2025-07-25 21:36:04', 70, NULL, NULL, NULL, NULL, NULL, NULL, 'basic', NULL, 0, 0, 'pending', NULL, NULL, 0, 'public', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	(13, 24, 'CodeCraft Software', 'SW-2024-005', NULL, NULL, NULL, NULL, NULL, 'Full-stack software development and web applications', 1, 4.80, 54, '2025-07-20 14:20:24', '2025-07-20 11:20:24', '2025-07-25 21:36:04', 70, NULL, NULL, NULL, NULL, NULL, NULL, 'basic', NULL, 0, 0, 'pending', NULL, NULL, 0, 'public', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	(14, 25, 'Artisan Jewelry Workshop', 'JW-2024-006', NULL, NULL, NULL, NULL, NULL, 'Handcrafted jewelry and custom pieces', 1, 4.90, 23, '2025-07-20 14:20:24', '2025-07-20 11:20:24', '2025-07-25 21:36:04', 70, NULL, NULL, NULL, NULL, NULL, NULL, 'basic', NULL, 0, 0, 'pending', NULL, NULL, 0, 'public', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	(45, 20, 'Alex Inc', NULL, NULL, 'HaHashmonaim 36', 'Haifa', 'Israel', 'https://avivalon.co.il/', NULL, 1, 0.00, 0, NULL, '2025-07-26 09:20:24', '2025-08-26 17:51:02', 65, '2025-07-26 10:49:24', '/uploads/avatars/1753530259178-rr7h5c2r3y.jpg', NULL, '[]', 'large', NULL, 'basic', NULL, 0, 0, 'pending', NULL, NULL, 0, 'public', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	(47, 20, 'Alex Inc', NULL, NULL, 'HaHashmonaim 36', 'Haifa', 'Israel', 'https://avivalon.co.il/', NULL, 1, 0.00, 0, NULL, '2025-07-26 09:20:52', '2025-08-26 17:51:02', 65, '2025-07-26 10:49:24', '/uploads/avatars/1753530259178-rr7h5c2r3y.jpg', NULL, '[]', 'large', NULL, 'basic', NULL, 0, 0, 'pending', NULL, NULL, 0, 'public', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	(48, 20, 'Alex Inc', NULL, NULL, 'HaHashmonaim 36', 'Haifa', 'Israel', 'https://avivalon.co.il/', NULL, 1, 0.00, 0, NULL, '2025-07-26 09:20:53', '2025-08-26 17:51:02', 65, '2025-07-26 10:49:24', '/uploads/avatars/1753530259178-rr7h5c2r3y.jpg', NULL, '[]', 'large', NULL, 'basic', NULL, 0, 0, 'pending', NULL, NULL, 0, 'public', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	(49, 20, 'Alex Inc', NULL, NULL, 'HaHashmonaim 36', 'Haifa', 'Israel', 'https://avivalon.co.il/', NULL, 1, 0.00, 0, NULL, '2025-07-26 09:24:10', '2025-08-26 17:51:02', 65, '2025-07-26 10:49:24', '/uploads/avatars/1753530259178-rr7h5c2r3y.jpg', NULL, '[]', 'large', NULL, 'basic', NULL, 0, 0, 'pending', NULL, NULL, 0, 'public', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	(50, 20, 'Alex Inc', NULL, NULL, 'HaHashmonaim 36', 'Haifa', 'Israel', 'https://avivalon.co.il/', NULL, 1, 0.00, 0, NULL, '2025-07-26 09:31:38', '2025-08-26 17:51:02', 65, '2025-07-26 10:49:24', '/uploads/avatars/1753530259178-rr7h5c2r3y.jpg', NULL, '[]', 'large', NULL, 'basic', NULL, 0, 0, 'pending', NULL, NULL, 0, 'public', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	(51, 20, 'Alex Inc', NULL, NULL, 'HaHashmonaim 36', 'Haifa', 'Israel', 'https://avivalon.co.il/', NULL, 1, 0.00, 0, NULL, '2025-07-26 09:31:38', '2025-08-26 17:51:02', 65, '2025-07-26 10:49:24', '/uploads/avatars/1753530259178-rr7h5c2r3y.jpg', NULL, '[]', 'large', NULL, 'basic', NULL, 0, 0, 'pending', NULL, NULL, 0, 'public', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	(52, 20, 'Alex Inc', NULL, NULL, 'HaHashmonaim 36', 'Haifa', 'Israel', 'https://avivalon.co.il/', NULL, 1, 0.00, 0, NULL, '2025-07-26 09:32:10', '2025-08-26 17:51:02', 65, '2025-07-26 10:49:24', '/uploads/avatars/1753530259178-rr7h5c2r3y.jpg', NULL, '[]', 'large', NULL, 'basic', NULL, 0, 0, 'pending', NULL, NULL, 0, 'public', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	(53, 20, 'Alex Inc', NULL, NULL, 'HaHashmonaim 36', 'Haifa', 'Israel', 'https://avivalon.co.il/', NULL, 1, 0.00, 0, NULL, '2025-07-26 09:32:11', '2025-08-26 17:51:02', 65, '2025-07-26 10:49:24', '/uploads/avatars/1753530259178-rr7h5c2r3y.jpg', NULL, '[]', 'large', NULL, 'basic', NULL, 0, 0, 'pending', NULL, NULL, 0, 'public', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	(54, 20, 'Alex Inc', NULL, NULL, 'HaHashmonaim 36', 'Haifa', 'Israel', 'https://avivalon.co.il/', NULL, 1, 0.00, 0, NULL, '2025-07-26 09:35:01', '2025-08-26 17:51:02', 65, '2025-07-26 10:49:24', '/uploads/avatars/1753530259178-rr7h5c2r3y.jpg', NULL, '[]', 'large', NULL, 'basic', NULL, 0, 0, 'pending', NULL, NULL, 0, 'public', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	(55, 20, 'Alex Inc', NULL, NULL, 'HaHashmonaim 36', 'Haifa', 'Israel', 'https://avivalon.co.il/', NULL, 1, 0.00, 0, NULL, '2025-07-26 09:35:01', '2025-08-26 17:51:02', 65, '2025-07-26 10:49:24', '/uploads/avatars/1753530259178-rr7h5c2r3y.jpg', NULL, '[]', 'large', NULL, 'basic', NULL, 0, 0, 'pending', NULL, NULL, 0, 'public', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	(56, 20, 'Alex Inc', NULL, NULL, 'HaHashmonaim 36', 'Haifa', 'Israel', 'https://avivalon.co.il/', NULL, 1, 0.00, 0, NULL, '2025-07-26 09:38:49', '2025-08-26 17:51:02', 65, '2025-07-26 10:49:24', '/uploads/avatars/1753530259178-rr7h5c2r3y.jpg', NULL, '[]', 'large', NULL, 'basic', NULL, 0, 0, 'pending', NULL, NULL, 0, 'public', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	(57, 20, 'Alex Inc', NULL, NULL, 'HaHashmonaim 36', 'Haifa', 'Israel', 'https://avivalon.co.il/', NULL, 1, 0.00, 0, NULL, '2025-07-26 09:38:50', '2025-08-26 17:51:02', 65, '2025-07-26 10:49:24', '/uploads/avatars/1753530259178-rr7h5c2r3y.jpg', NULL, '[]', 'large', NULL, 'basic', NULL, 0, 0, 'pending', NULL, NULL, 0, 'public', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	(58, 20, 'Alex Inc', NULL, NULL, 'HaHashmonaim 36', 'Haifa', 'Israel', 'https://avivalon.co.il/', NULL, 1, 0.00, 0, NULL, '2025-07-26 10:07:23', '2025-08-26 17:51:02', 65, '2025-07-26 10:49:24', '/uploads/avatars/1753530259178-rr7h5c2r3y.jpg', NULL, '[]', 'large', NULL, 'basic', NULL, 0, 0, 'pending', NULL, NULL, 0, 'public', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	(59, 20, 'Alex Inc', NULL, NULL, 'HaHashmonaim 36', 'Haifa', 'Israel', 'https://avivalon.co.il/', NULL, 1, 0.00, 0, NULL, '2025-07-26 10:12:11', '2025-08-26 17:51:02', 65, '2025-07-26 10:49:24', '/uploads/avatars/1753530259178-rr7h5c2r3y.jpg', NULL, '[]', 'large', NULL, 'basic', NULL, 0, 0, 'pending', NULL, NULL, 0, 'public', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	(60, 20, 'Alex Inc', NULL, NULL, 'HaHashmonaim 36', 'Haifa', 'Israel', 'https://avivalon.co.il/', NULL, 1, 0.00, 0, NULL, '2025-07-26 10:12:11', '2025-08-26 17:51:02', 65, '2025-07-26 10:49:24', '/uploads/avatars/1753530259178-rr7h5c2r3y.jpg', NULL, '[]', 'large', NULL, 'basic', NULL, 0, 0, 'pending', NULL, NULL, 0, 'public', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	(61, 21, 'CraftWood Furniture', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, 0.00, 0, NULL, '2025-08-05 15:35:49', '2025-08-05 15:35:49', 0, NULL, NULL, NULL, NULL, NULL, NULL, 'basic', NULL, 0, 0, 'pending', NULL, NULL, 0, 'public', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	(62, 20, 'Alex Inc', NULL, NULL, 'HaHashmonaim 36', 'Haifa', 'Israel', 'https://avivalon.co.il/', NULL, 0, 0.00, 0, NULL, '2025-08-26 17:51:02', '2025-08-26 17:51:02', 65, NULL, NULL, NULL, NULL, NULL, NULL, 'basic', NULL, 0, 0, 'pending', NULL, NULL, 0, 'public', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	(63, 20, 'Alex Inc', NULL, NULL, 'HaHashmonaim 36', 'Haifa', 'Israel', 'https://avivalon.co.il/', NULL, 0, 0.00, 0, NULL, '2025-08-26 17:51:37', '2025-08-26 17:51:37', 65, NULL, NULL, NULL, NULL, NULL, NULL, 'basic', NULL, 0, 0, 'pending', NULL, NULL, 0, 'public', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	(64, 20, 'Alex Inc', NULL, NULL, 'HaHashmonaim 36', 'Haifa', 'Israel', 'https://avivalon.co.il/', NULL, 0, 0.00, 0, NULL, '2025-08-26 17:52:55', '2025-08-26 17:52:55', 65, NULL, NULL, NULL, NULL, NULL, NULL, 'basic', NULL, 0, 0, 'pending', NULL, NULL, 0, 'public', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	(65, 20, 'Alex Inc', NULL, NULL, 'HaHashmonaim 36', 'Haifa', 'Israel', 'https://avivalon.co.il/', NULL, 0, 0.00, 0, NULL, '2025-08-26 17:53:37', '2025-08-26 17:53:37', 65, NULL, NULL, NULL, NULL, NULL, NULL, 'basic', NULL, 0, 0, 'pending', NULL, NULL, 0, 'public', NULL, NULL, NULL, NULL, NULL, NULL, NULL);

-- Dumping structure for view custombid.supplier_profiles_with_ratings
-- Creating temporary table to overcome VIEW dependency errors
CREATE TABLE `supplier_profiles_with_ratings` (
	`id` INT(11) NOT NULL,
	`user_id` INT(11) NOT NULL,
	`company_name` VARCHAR(1) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`business_license` VARCHAR(1) NULL COLLATE 'utf8mb4_unicode_ci',
	`tax_id` VARCHAR(1) NULL COLLATE 'utf8mb4_unicode_ci',
	`address` TEXT NULL COLLATE 'utf8mb4_unicode_ci',
	`city` VARCHAR(1) NULL COLLATE 'utf8mb4_unicode_ci',
	`country` VARCHAR(1) NULL COLLATE 'utf8mb4_unicode_ci',
	`website` VARCHAR(1) NULL COLLATE 'utf8mb4_unicode_ci',
	`description` TEXT NULL COLLATE 'utf8mb4_unicode_ci',
	`is_approved` TINYINT(1) NULL,
	`rating` DECIMAL(3,2) NULL,
	`review_count` INT(11) NULL,
	`approval_date` DATETIME NULL,
	`created_at` TIMESTAMP NOT NULL,
	`updated_at` TIMESTAMP NOT NULL,
	`email` VARCHAR(1) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`first_name` VARCHAR(1) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`last_name` VARCHAR(1) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`phone` VARCHAR(1) NULL COLLATE 'utf8mb4_unicode_ci',
	`is_verified` TINYINT(1) NULL,
	`is_active` TINYINT(1) NULL,
	`last_login` TIMESTAMP NULL,
	`completed_orders` BIGINT(21) NOT NULL,
	`total_bids` BIGINT(21) NOT NULL,
	`accepted_bids` BIGINT(21) NOT NULL,
	`acceptance_rate` DECIMAL(26,2) NULL
);

-- Dumping structure for table custombid.supplier_profile_audit
CREATE TABLE IF NOT EXISTS `supplier_profile_audit` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `supplier_id` int(11) NOT NULL,
  `change_type` enum('info','categories','files','settings') NOT NULL,
  `change_description` text NOT NULL,
  `changed_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_audit_supplier` (`supplier_id`),
  KEY `idx_audit_change_type` (`change_type`),
  KEY `fk_audit_user` (`changed_by`),
  CONSTRAINT `fk_audit_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `supplier_profiles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_audit_user` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=125 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table custombid.supplier_profile_audit: ~59 rows (approximately)
INSERT INTO `supplier_profile_audit` (`id`, `supplier_id`, `change_type`, `change_description`, `changed_by`, `created_at`) VALUES
	(60, 45, 'info', 'Profile created', 20, '2025-07-26 09:20:24'),
	(62, 47, 'info', 'Profile created', 20, '2025-07-26 09:20:52'),
	(63, 48, 'info', 'Profile created', 20, '2025-07-26 09:20:53'),
	(64, 49, 'info', 'Profile created', 20, '2025-07-26 09:24:10'),
	(65, 50, 'info', 'Profile created', 20, '2025-07-26 09:31:38'),
	(66, 51, 'info', 'Profile created', 20, '2025-07-26 09:31:38'),
	(67, 52, 'info', 'Profile created', 20, '2025-07-26 09:32:10'),
	(68, 53, 'info', 'Profile created', 20, '2025-07-26 09:32:11'),
	(69, 54, 'info', 'Profile created', 20, '2025-07-26 09:35:01'),
	(70, 55, 'info', 'Profile created', 20, '2025-07-26 09:35:01'),
	(71, 56, 'info', 'Profile created', 20, '2025-07-26 09:38:49'),
	(72, 57, 'info', 'Profile created', 20, '2025-07-26 09:38:50'),
	(73, 58, 'info', 'Profile created', 20, '2025-07-26 10:07:23'),
	(74, 59, 'info', 'Profile created', 20, '2025-07-26 10:12:11'),
	(75, 60, 'info', 'Profile created', 20, '2025-07-26 10:12:11'),
	(76, 47, 'info', 'Profile information updated', 20, '2025-07-26 10:41:27'),
	(77, 48, 'info', 'Profile information updated', 20, '2025-07-26 10:41:27'),
	(78, 49, 'info', 'Profile information updated', 20, '2025-07-26 10:41:27'),
	(79, 50, 'info', 'Profile information updated', 20, '2025-07-26 10:41:27'),
	(80, 51, 'info', 'Profile information updated', 20, '2025-07-26 10:41:27'),
	(81, 52, 'info', 'Profile information updated', 20, '2025-07-26 10:41:27'),
	(82, 53, 'info', 'Profile information updated', 20, '2025-07-26 10:41:27'),
	(83, 54, 'info', 'Profile information updated', 20, '2025-07-26 10:41:27'),
	(84, 55, 'info', 'Profile information updated', 20, '2025-07-26 10:41:27'),
	(85, 56, 'info', 'Profile information updated', 20, '2025-07-26 10:41:27'),
	(86, 57, 'info', 'Profile information updated', 20, '2025-07-26 10:41:27'),
	(87, 58, 'info', 'Profile information updated', 20, '2025-07-26 10:41:27'),
	(88, 59, 'info', 'Profile information updated', 20, '2025-07-26 10:41:27'),
	(89, 60, 'info', 'Profile information updated', 20, '2025-07-26 10:41:27'),
	(90, 45, 'info', 'Profile information updated', 20, '2025-07-26 10:41:46'),
	(91, 47, 'info', 'Profile information updated', 20, '2025-07-26 10:41:46'),
	(92, 48, 'info', 'Profile information updated', 20, '2025-07-26 10:41:46'),
	(93, 49, 'info', 'Profile information updated', 20, '2025-07-26 10:41:46'),
	(94, 50, 'info', 'Profile information updated', 20, '2025-07-26 10:41:46'),
	(95, 51, 'info', 'Profile information updated', 20, '2025-07-26 10:41:46'),
	(96, 52, 'info', 'Profile information updated', 20, '2025-07-26 10:41:46'),
	(97, 53, 'info', 'Profile information updated', 20, '2025-07-26 10:41:46'),
	(98, 54, 'info', 'Profile information updated', 20, '2025-07-26 10:41:46'),
	(99, 55, 'info', 'Profile information updated', 20, '2025-07-26 10:41:46'),
	(100, 56, 'info', 'Profile information updated', 20, '2025-07-26 10:41:46'),
	(101, 57, 'info', 'Profile information updated', 20, '2025-07-26 10:41:46'),
	(102, 58, 'info', 'Profile information updated', 20, '2025-07-26 10:41:46'),
	(103, 59, 'info', 'Profile information updated', 20, '2025-07-26 10:41:46'),
	(104, 60, 'info', 'Profile information updated', 20, '2025-07-26 10:41:46'),
	(105, 45, 'info', 'Profile information updated', 20, '2025-07-26 10:47:45'),
	(106, 47, 'info', 'Profile information updated', 20, '2025-07-26 10:47:45'),
	(107, 48, 'info', 'Profile information updated', 20, '2025-07-26 10:47:45'),
	(108, 49, 'info', 'Profile information updated', 20, '2025-07-26 10:47:45'),
	(109, 50, 'info', 'Profile information updated', 20, '2025-07-26 10:47:45'),
	(110, 51, 'info', 'Profile information updated', 20, '2025-07-26 10:47:45'),
	(111, 52, 'info', 'Profile information updated', 20, '2025-07-26 10:47:45'),
	(112, 53, 'info', 'Profile information updated', 20, '2025-07-26 10:47:45'),
	(113, 54, 'info', 'Profile information updated', 20, '2025-07-26 10:47:45'),
	(114, 55, 'info', 'Profile information updated', 20, '2025-07-26 10:47:45'),
	(115, 56, 'info', 'Profile information updated', 20, '2025-07-26 10:47:45'),
	(116, 57, 'info', 'Profile information updated', 20, '2025-07-26 10:47:45'),
	(117, 58, 'info', 'Profile information updated', 20, '2025-07-26 10:47:45'),
	(118, 59, 'info', 'Profile information updated', 20, '2025-07-26 10:47:45'),
	(119, 60, 'info', 'Profile information updated', 20, '2025-07-26 10:47:45'),
	(120, 61, 'info', 'Profile created', 21, '2025-08-05 15:35:49'),
	(121, 62, 'info', 'Profile created', 20, '2025-08-26 17:51:02'),
	(122, 63, 'info', 'Profile created', 20, '2025-08-26 17:51:37'),
	(123, 64, 'info', 'Profile created', 20, '2025-08-26 17:52:55'),
	(124, 65, 'info', 'Profile created', 20, '2025-08-26 17:53:37');

-- Dumping structure for table custombid.supplier_saved_searches
CREATE TABLE IF NOT EXISTS `supplier_saved_searches` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `supplier_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `search_criteria` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`search_criteria`)),
  `notification_enabled` tinyint(1) DEFAULT 1,
  `last_checked` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_supplier_saved_searches` (`supplier_id`),
  CONSTRAINT `supplier_saved_searches_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table custombid.supplier_saved_searches: ~0 rows (approximately)

-- Dumping structure for table custombid.users
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `user_type` enum('customer','supplier','admin') NOT NULL,
  `is_verified` tinyint(1) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `verification_token` varchar(255) DEFAULT NULL,
  `reset_password_token` varchar(255) DEFAULT NULL,
  `reset_password_expires` datetime DEFAULT NULL,
  `last_login` timestamp NULL DEFAULT NULL,
  `account_status` enum('active','inactive','suspended','deleted') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_email` (`email`),
  KEY `idx_user_type` (`user_type`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_is_verified` (`is_verified`),
  KEY `idx_last_login` (`last_login`),
  KEY `idx_account_status` (`account_status`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_verification_token` (`verification_token`),
  KEY `idx_reset_password_token` (`reset_password_token`),
  KEY `idx_account_status_active` (`account_status`,`is_active`),
  KEY `idx_email_verified_active` (`email`,`is_verified`,`is_active`),
  KEY `idx_user_type_status` (`user_type`,`account_status`)
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table custombid.users: ~25 rows (approximately)
INSERT INTO `users` (`id`, `email`, `password`, `first_name`, `last_name`, `phone`, `user_type`, `is_verified`, `is_active`, `verification_token`, `reset_password_token`, `reset_password_expires`, `last_login`, `account_status`, `created_at`, `updated_at`) VALUES
	(1, 'admin@custombid.com', '$2b$12$6KiXeW/F.z9ZA4f6J4NJUeaUZWF2/xSZQuEKf0LHapNSp.dBzF1Vm', 'Admin', 'User', NULL, 'admin', 1, 1, NULL, NULL, NULL, '2025-08-08 11:57:03', 'active', '2025-06-27 19:42:15', '2025-08-08 11:57:03'),
	(2, 'customer@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LhWdTlJlYUzXB7L/G', 'John', 'Doe', NULL, 'customer', 1, 1, NULL, NULL, NULL, NULL, 'active', '2025-06-27 19:42:17', '2025-06-27 19:42:17'),
	(3, 'supplier@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LhWdTlJlYUzXB7L/G', 'Jane', 'Smith', NULL, 'supplier', 1, 1, NULL, NULL, NULL, NULL, 'active', '2025-06-27 19:42:17', '2025-06-27 19:42:17'),
	(4, 'metalworks@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LhWdTlJlYUzXB7L/G', 'Mike', 'Johnson', '+1-555-0101', 'supplier', 1, 1, NULL, NULL, NULL, NULL, 'active', '2025-06-27 20:00:00', '2025-06-27 20:00:00'),
	(5, 'designpro@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LhWdTlJlYUzXB7L/G', 'Sarah', 'Wilson', '+1-555-0102', 'supplier', 1, 1, NULL, NULL, NULL, NULL, 'active', '2025-06-27 20:15:00', '2025-06-27 20:15:00'),
	(6, 'craftsman@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LhWdTlJlYUzXB7L/G', 'Robert', 'Brown', '+1-555-0103', 'supplier', 1, 1, NULL, NULL, NULL, NULL, 'active', '2025-06-27 20:30:00', '2025-06-27 20:30:00'),
	(7, 'aviv@mail.com', '$2b$12$6KiXeW/F.z9ZA4f6J4NJUeaUZWF2/xSZQuEKf0LHapNSp.dBzF1Vm', 'Aviv', 'Alon', '+972584822148', 'customer', 1, 1, 'dcaa8608a1d34e348a153b5b133ef9eb5559d2248c87d10ed618a49c178f5cad', NULL, NULL, '2025-10-14 13:58:55', 'active', '2025-06-27 19:44:15', '2025-10-14 13:58:55'),
	(8, 'techsolutions@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LhWdTlJlYUzXB7L/G', 'Emily', 'Davis', '+1-555-0104', 'supplier', 1, 1, NULL, NULL, NULL, NULL, 'active', '2025-06-27 21:00:00', '2025-06-27 21:00:00'),
	(9, 'furniture@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LhWdTlJlYUzXB7L/G', 'David', 'Miller', '+1-555-0105', 'supplier', 1, 1, NULL, NULL, NULL, NULL, 'active', '2025-06-27 21:15:00', '2025-06-27 21:15:00'),
	(10, 'avivs@mail.com', '$2b$12$jXmenYxYIxF6SMgBO72pBeh91C0DYB6xSPHEDYWHWBr2FgbHVp8ku', 'Aviv', 'Alon', '+972584822148', 'supplier', 1, 1, '01eb79a10b4545560d738a7a30807758deb50e9b5717bb00c85f1185e0d379a8', NULL, NULL, '2025-07-09 20:49:31', 'active', '2025-07-09 20:41:54', '2025-07-09 20:49:31'),
	(11, 'a@e.com', '$2b$12$..CWjyO1PtzGsVV349IutuNGmwSvZdZH3JnFKld8wFdrlvlCgcPtW', 'Aviv', 'Alon', '+972584822148', 'supplier', 1, 1, '4cddee9fefaccaf864a2369ecee0a63c82f4962267f7ff91048bd57a93e7ba23', NULL, NULL, '2025-07-19 22:08:04', 'active', '2025-07-13 21:34:16', '2025-07-19 22:08:04'),
	(20, 'demo.electronics@supplier.com', '$2b$12$6KiXeW/F.z9ZA4f6J4NJUeaUZWF2/xSZQuEKf0LHapNSp.dBzF1Vm', 'Alex', 'Electronics', '+1-555-0201', 'supplier', 1, 1, NULL, NULL, NULL, '2025-10-08 12:59:26', 'active', '2025-07-20 11:20:24', '2025-10-08 12:59:26'),
	(21, 'demo.furniture@supplier.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LhWdTlJlYUzXB7L/G', 'Maria 2', 'Furniture', '+1-555-0202', 'supplier', 1, 1, NULL, NULL, NULL, NULL, 'active', '2025-07-20 11:20:24', '2025-08-05 15:35:49'),
	(22, 'demo.design@supplier.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LhWdTlJlYUzXB7L/G', 'David', 'Designer', '+1-555-0203', 'supplier', 1, 1, NULL, NULL, NULL, NULL, 'active', '2025-07-20 11:20:24', '2025-07-20 11:20:24'),
	(23, 'demo.manufacturing@supplier.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LhWdTlJlYUzXB7L/G', 'Sarah', 'Manufacturing', '+1-555-0204', 'supplier', 1, 1, NULL, NULL, NULL, NULL, 'active', '2025-07-20 11:20:24', '2025-07-20 11:20:24'),
	(24, 'demo.software@supplier.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LhWdTlJlYUzXB7L/G', 'Tech', 'Solutions', '+1-555-0205', 'supplier', 1, 1, NULL, NULL, NULL, NULL, 'active', '2025-07-20 11:20:24', '2025-07-20 11:20:24'),
	(25, 'demo.jewelry@supplier.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LhWdTlJlYUzXB7L/G', 'Emma', 'Jewelry', '+1-555-0206', 'supplier', 1, 1, NULL, NULL, NULL, NULL, 'active', '2025-07-20 11:20:24', '2025-07-20 11:20:24'),
	(30, 'customer1@demo.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LhWdTlJlYUzXB7L/G', 'John', 'Smith', '+1-555-0301', 'customer', 1, 1, NULL, NULL, NULL, NULL, 'active', '2025-07-20 11:20:24', '2025-07-20 11:20:24'),
	(31, 'customer2@demo.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LhWdTlJlYUzXB7L/G', 'Lisa', 'Johnson', '+1-555-0302', 'customer', NULL, 1, NULL, NULL, NULL, NULL, 'active', '2025-07-20 11:20:24', '2025-08-04 21:19:17'),
	(32, 'customer3@demo.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LhWdTlJlYUzXB7L/G', 'Michael', 'Brown', '+1-555-0303', 'customer', 1, 1, NULL, NULL, NULL, NULL, 'active', '2025-07-20 11:20:24', '2025-07-20 11:20:24'),
	(33, 'customer4@demo.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LhWdTlJlYUzXB7L/G', 'Jennifer', 'Davis', '+1-555-0304', 'customer', 1, 1, NULL, NULL, NULL, NULL, 'active', '2025-07-20 11:20:24', '2025-07-20 11:20:24'),
	(34, 'avivalonpay@gmail.com', '$2b$12$UP/RcyYbcdvwdeel.B0Nl.j3wSD59sSyXxSmxd3HSKCw1woxypioe', 'Aviv', 'Alon', '0584822148', 'customer', 0, 1, '1a0a3e6bd1de084a04be6ca723e8a486eadfee83c7c09dace7696ac3dff4bd98', NULL, NULL, '2025-08-14 16:07:50', 'active', '2025-08-13 22:17:04', '2025-08-14 16:07:50'),
	(35, 'avivalon@gmail.com', '$2b$12$2fHnzZbcWHYJsj3j33fokeqlEZs.CMDhSEkXTjyyoE/zFqVrb44Ju', 'אביב', 'אלון', '+972584822148', 'customer', 0, 1, 'fca44bf2d95d5ae4d4d6897ba80b780e1107954ea3403cf4b9a1c6a9559569a4', NULL, NULL, NULL, 'active', '2025-08-13 22:25:24', '2025-08-13 22:25:24'),
	(36, 'aviv@hotmail.com', '$2b$12$iW1BQbw6aV94Ch6a8MeYseLrva.g1YoOEdw6fmOikvJAGOP89jfHm', 'Aviv', 'Alon', '+972584822148', 'customer', 0, 1, '8b607bc0283b2ffbd49fea87a47689fe22b10c57334b4fe6df9d75b30e9516c7', NULL, NULL, NULL, 'active', '2025-08-13 22:32:13', '2025-08-13 22:32:13'),
	(37, 'test@gmail.com', '$2b$12$6KiXeW/F.z9ZA4f6J4NJUeaUZWF2/xSZQuEKf0LHapNSp.dBzF1Vm', 'John', 'Tester', '+1234567890', 'customer', 1, 1, NULL, NULL, NULL, NULL, 'active', '2025-07-16 14:44:54', '2025-10-14 14:53:44');

-- Dumping structure for table custombid.user_security_settings
CREATE TABLE IF NOT EXISTS `user_security_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `two_factor_enabled` tinyint(1) DEFAULT 0,
  `two_factor_method` enum('totp','sms','email') DEFAULT 'totp',
  `login_notifications` tinyint(1) DEFAULT 1,
  `suspicious_activity_alerts` tinyint(1) DEFAULT 1,
  `max_concurrent_sessions` int(11) DEFAULT 5,
  `session_timeout_minutes` int(11) DEFAULT 1440,
  `password_history_count` int(11) DEFAULT 5,
  `require_password_change_days` int(11) DEFAULT 90,
  `last_password_change` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_security` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table custombid.user_security_settings: ~24 rows (approximately)
INSERT INTO `user_security_settings` (`id`, `user_id`, `two_factor_enabled`, `two_factor_method`, `login_notifications`, `suspicious_activity_alerts`, `max_concurrent_sessions`, `session_timeout_minutes`, `password_history_count`, `require_password_change_days`, `last_password_change`, `created_at`, `updated_at`) VALUES
	(1, 2, 0, 'totp', 1, 1, 5, 1440, 5, 90, NULL, '2025-08-13 22:15:43', '2025-08-13 22:15:43'),
	(2, 7, 0, 'totp', 1, 1, 5, 1440, 5, 90, NULL, '2025-08-13 22:15:43', '2025-08-13 22:15:43'),
	(3, 30, 0, 'totp', 1, 1, 5, 1440, 5, 90, NULL, '2025-08-13 22:15:43', '2025-08-13 22:15:43'),
	(4, 31, 0, 'totp', 1, 1, 5, 1440, 5, 90, NULL, '2025-08-13 22:15:43', '2025-08-13 22:15:43'),
	(5, 32, 0, 'totp', 1, 1, 5, 1440, 5, 90, NULL, '2025-08-13 22:15:43', '2025-08-13 22:15:43'),
	(6, 33, 0, 'totp', 1, 1, 5, 1440, 5, 90, NULL, '2025-08-13 22:15:43', '2025-08-13 22:15:43'),
	(7, 3, 0, 'totp', 1, 1, 5, 1440, 5, 90, NULL, '2025-08-13 22:15:43', '2025-08-13 22:15:43'),
	(8, 4, 0, 'totp', 1, 1, 5, 1440, 5, 90, NULL, '2025-08-13 22:15:43', '2025-08-13 22:15:43'),
	(9, 5, 0, 'totp', 1, 1, 5, 1440, 5, 90, NULL, '2025-08-13 22:15:43', '2025-08-13 22:15:43'),
	(10, 6, 0, 'totp', 1, 1, 5, 1440, 5, 90, NULL, '2025-08-13 22:15:43', '2025-08-13 22:15:43'),
	(11, 8, 0, 'totp', 1, 1, 5, 1440, 5, 90, NULL, '2025-08-13 22:15:43', '2025-08-13 22:15:43'),
	(12, 9, 0, 'totp', 1, 1, 5, 1440, 5, 90, NULL, '2025-08-13 22:15:43', '2025-08-13 22:15:43'),
	(13, 10, 0, 'totp', 1, 1, 5, 1440, 5, 90, NULL, '2025-08-13 22:15:43', '2025-08-13 22:15:43'),
	(14, 11, 0, 'totp', 1, 1, 5, 1440, 5, 90, NULL, '2025-08-13 22:15:43', '2025-08-13 22:15:43'),
	(15, 20, 0, 'totp', 1, 1, 5, 1440, 5, 90, NULL, '2025-08-13 22:15:43', '2025-08-13 22:15:43'),
	(16, 21, 0, 'totp', 1, 1, 5, 1440, 5, 90, NULL, '2025-08-13 22:15:43', '2025-08-13 22:15:43'),
	(17, 22, 0, 'totp', 1, 1, 5, 1440, 5, 90, NULL, '2025-08-13 22:15:43', '2025-08-13 22:15:43'),
	(18, 23, 0, 'totp', 1, 1, 5, 1440, 5, 90, NULL, '2025-08-13 22:15:43', '2025-08-13 22:15:43'),
	(19, 24, 0, 'totp', 1, 1, 5, 1440, 5, 90, NULL, '2025-08-13 22:15:43', '2025-08-13 22:15:43'),
	(20, 25, 0, 'totp', 1, 1, 5, 1440, 5, 90, NULL, '2025-08-13 22:15:43', '2025-08-13 22:15:43'),
	(21, 1, 0, 'totp', 1, 1, 5, 1440, 5, 90, NULL, '2025-08-13 22:15:43', '2025-08-13 22:15:43'),
	(32, 34, 0, 'totp', 1, 1, 5, 1440, 5, 90, '2025-08-13 22:17:04', '2025-08-13 22:17:04', '2025-08-13 22:17:04'),
	(33, 35, 0, 'totp', 1, 1, 5, 1440, 5, 90, '2025-08-13 22:25:24', '2025-08-13 22:25:24', '2025-08-13 22:25:24'),
	(34, 36, 0, 'totp', 1, 1, 5, 1440, 5, 90, '2025-08-13 22:32:13', '2025-08-13 22:32:13', '2025-08-13 22:32:13');

-- Dumping structure for table custombid.user_sessions
CREATE TABLE IF NOT EXISTS `user_sessions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `session_id` varchar(255) NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `device_info` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`device_info`)),
  `last_activity` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `expires_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_session_id` (`session_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_last_activity` (`last_activity`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table custombid.user_sessions: ~55 rows (approximately)
INSERT INTO `user_sessions` (`id`, `user_id`, `session_id`, `ip_address`, `user_agent`, `device_info`, `last_activity`, `is_active`, `created_at`, `expires_at`) VALUES
	(1, 34, 'f8fe106e1d599616678c7db1a61268fff1a6389f9014c7ddb12bbdde3c52f826', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '{"fingerprint":"f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36","ip":"::1","acceptLanguage":"he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6","acceptEncoding":"gzip, deflate, br, zstd"}', '2025-08-13 22:37:37', 1, '2025-08-13 22:37:37', '2025-08-14 19:37:37'),
	(2, 34, '48b2ff52260f6741410d11f30485687a88fd13348583557ecb8e553e00e9926d', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '{"fingerprint":"f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36","ip":"::1","acceptLanguage":"he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6","acceptEncoding":"gzip, deflate, br, zstd"}', '2025-08-13 22:39:38', 1, '2025-08-13 22:39:38', '2025-08-14 19:39:38'),
	(3, 34, '34517428f630be0d8bb0870ef87faf11a66747de309dde018fa4e24521f21da2', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '{"fingerprint":"f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36","ip":"::1","acceptLanguage":"he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6","acceptEncoding":"gzip, deflate, br, zstd"}', '2025-08-13 22:41:15', 1, '2025-08-13 22:41:15', '2025-08-14 19:41:15'),
	(4, 34, 'bf873a286851496c08be149ebf63b61f5f2d7ef44f4e420123de10b0e2f7072e', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '{"fingerprint":"f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36","ip":"::1","acceptLanguage":"he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6","acceptEncoding":"gzip, deflate, br, zstd"}', '2025-08-13 22:42:20', 1, '2025-08-13 22:42:20', '2025-08-14 19:42:18'),
	(5, 34, '6b81da0f2d92f5c0ee236938bbaa7b55e5b0c3f19eb3165b793a0cb38571fbb1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '{"fingerprint":"f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36","ip":"::1","acceptLanguage":"he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6","acceptEncoding":"gzip, deflate, br, zstd"}', '2025-08-13 22:59:04', 1, '2025-08-13 22:59:04', '2025-08-14 19:59:04'),
	(6, 34, '261d4077ada334e067435303754aa6aace126229a878d1965399b1251ea6b5c5', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '{"fingerprint":"f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36","ip":"::1","acceptLanguage":"he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6","acceptEncoding":"gzip, deflate, br, zstd"}', '2025-08-14 16:07:51', 1, '2025-08-14 16:07:51', '2025-08-15 13:07:51'),
	(7, 7, '0feaef19caa3759c9062cb3f17d139f225a4d7386f9ed4dcaf12cabb67fde4d2', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '{"fingerprint":"f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36","ip":"::1","acceptLanguage":"he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6","acceptEncoding":"gzip, deflate, br, zstd"}', '2025-08-14 16:12:51', 0, '2025-08-14 16:12:37', '2025-08-15 13:12:37'),
	(8, 7, 'cdb0fcd3fd3872fd992533ac6372da45f4b7984eccc6b1461b96a62af1fe285f', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '{"fingerprint":"f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36","ip":"::1","acceptLanguage":"he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6","acceptEncoding":"gzip, deflate, br, zstd"}', '2025-08-14 16:36:01', 0, '2025-08-14 16:35:52', '2025-08-15 13:35:52'),
	(9, 7, '85909097f869b2b7f4b8540f53a2fecf1fda90cbc5f8f4aa8264c3c20d63fa10', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '{"fingerprint":"f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36","ip":"::1","acceptLanguage":"he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6","acceptEncoding":"gzip, deflate, br, zstd"}', '2025-08-18 17:25:00', 0, '2025-08-15 13:41:45', '2025-08-16 10:41:45'),
	(10, 7, '1b246832942eab1a5c227f200f97a687428d0f5b5b35c31df84fd0d1072e7db0', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '{"fingerprint":"f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36","ip":"::1","acceptLanguage":"he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6","acceptEncoding":"gzip, deflate, br, zstd"}', '2025-08-18 17:25:00', 0, '2025-08-15 23:57:39', '2025-08-16 20:57:39'),
	(11, 7, 'cf2ea8431e9d9fedabe92e6658248ade0a4ac19600427325950df128be4629aa', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '{"fingerprint":"f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36","ip":"::1","acceptLanguage":"he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6","acceptEncoding":"gzip, deflate, br, zstd"}', '2025-08-18 20:58:40', 0, '2025-08-18 17:24:49', '2025-08-19 14:24:49'),
	(12, 7, '86d5af2098e8cbc76e3f6ceca0f4e18df949c928cdb372f69c5d08f962d93f44', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '{"fingerprint":"f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36","ip":"::1","acceptLanguage":"he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6","acceptEncoding":"gzip, deflate, br, zstd"}', '2025-08-19 07:41:19', 0, '2025-08-18 17:47:43', '2025-08-19 14:47:43'),
	(13, 7, '69bbf1baa258e78ddde87bb7f8cebcf75413108c1b4c4f3bb1030d8e6cd251b7', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '{"fingerprint":"f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36","ip":"::1","acceptLanguage":"he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6","acceptEncoding":"gzip, deflate, br, zstd"}', '2025-08-19 10:04:09', 0, '2025-08-18 18:13:17', '2025-08-19 15:13:17'),
	(14, 7, 'c13129a2a0c1eab880b4272429b7898693bb80aa2957b4d39dd2d3995ac1a315', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '{"fingerprint":"f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36","ip":"::1","acceptLanguage":"he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6","acceptEncoding":"gzip, deflate, br, zstd"}', '2025-08-19 10:33:40', 0, '2025-08-18 20:57:56', '2025-08-19 17:57:56'),
	(15, 7, '26d622408c0ee8c251914e05e6c6623dd0e9fd69652d85597c00a4c8d0d78dd7', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '{"fingerprint":"f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36","ip":"::1","acceptLanguage":"he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6","acceptEncoding":"gzip, deflate, br, zstd"}', '2025-08-19 12:54:12', 0, '2025-08-18 20:58:26', '2025-08-19 17:58:26'),
	(16, 7, 'df598df8f8ec9ca88f87c289785b8e60bb1da0f139dec0d5f1d24c056f2c94b3', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '{"fingerprint":"f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36","ip":"::1","acceptLanguage":"he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6","acceptEncoding":"gzip, deflate, br, zstd"}', '2025-08-19 12:54:12', 0, '2025-08-19 07:41:13', '2025-08-20 04:41:13'),
	(17, 7, '5d9e215d18773308c2652b1f8b5dfce8e23721568ab4543fe397035969b2f84c', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '{"fingerprint":"f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36","ip":"::1","acceptLanguage":"he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6","acceptEncoding":"gzip, deflate, br, zstd"}', '2025-08-19 12:54:12', 0, '2025-08-19 10:03:55', '2025-08-20 07:03:55'),
	(18, 7, '8b43b8c880a89e0ff73032d6ebf62b0fdf3e08d89e018df9048f96693e31a1b8', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '{"fingerprint":"f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36","ip":"::1","acceptLanguage":"he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6","acceptEncoding":"gzip, deflate, br, zstd"}', '2025-08-19 12:54:12', 0, '2025-08-19 10:33:31', '2025-08-20 07:33:31'),
	(19, 20, 'a68b346729988503fe74e70bd8c05c7c1e12649be5b1e8d37ec696f50b6056bb', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '{"fingerprint":"f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36","ip":"::1","acceptLanguage":"he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6","acceptEncoding":"gzip, deflate, br, zstd"}', '2025-08-19 12:55:52', 0, '2025-08-19 12:54:22', '2025-08-20 09:54:22'),
	(20, 7, '4da8b5adce8b4da3f74e71b0716126cda84b2d08759f6cdd60b904f352ea4327', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '{"fingerprint":"f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36","ip":"::1","acceptLanguage":"he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6","acceptEncoding":"gzip, deflate, br, zstd"}', '2025-08-20 15:57:30', 0, '2025-08-19 12:56:04', '2025-08-20 09:56:04'),
	(21, 7, 'b789bc8313ea5afce6fc7ffec0d9158c7b529a373e6e14ab5aade343052d4b23', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '{"fingerprint":"f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36","ip":"::1","acceptLanguage":"he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6","acceptEncoding":"gzip, deflate, br, zstd"}', '2025-08-20 18:12:24', 0, '2025-08-19 21:00:37', '2025-08-20 18:00:37'),
	(22, 7, '321515359c4e3ac8e711298408301bdb91a117de724ad9b2332ff22df411b393', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '{"fingerprint":"f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36","ip":"::1","acceptLanguage":"he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6","acceptEncoding":"gzip, deflate, br, zstd"}', '2025-08-20 19:49:33', 0, '2025-08-20 15:57:21', '2025-08-21 12:57:21'),
	(23, 7, '65294a11ca5cd2a1547f53b45688123a83a4a95549a74ade3f699cb799945e87', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '{"fingerprint":"f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36","ip":"::1","acceptLanguage":"he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6","acceptEncoding":"gzip, deflate, br, zstd"}', '2025-08-20 20:22:13', 0, '2025-08-20 16:57:59', '2025-08-21 13:57:59'),
	(24, 7, '08cb381bb2c713efcd4ee0ecf6d487eece41394dea30aa1549a1eb758d6d6611', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '{"fingerprint":"f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36","ip":"::1","acceptLanguage":"he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6","acceptEncoding":"gzip, deflate, br, zstd"}', '2025-08-20 20:47:23', 0, '2025-08-20 17:34:05', '2025-08-21 14:34:05'),
	(25, 7, '540353725dc4587b3c888f7169b1c1d94050388e1a797cdc287d0a62d16b3715', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '{"fingerprint":"f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36","ip":"::1","acceptLanguage":"he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6","acceptEncoding":"gzip, deflate, br, zstd"}', '2025-08-20 21:09:46', 0, '2025-08-20 18:12:13', '2025-08-21 15:12:13'),
	(26, 7, '9ed3e6479123dd886f02035fe111cd5c04e36dd2de480a6115545dfb296416da', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '{"fingerprint":"f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36","ip":"::1","acceptLanguage":"he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6","acceptEncoding":"gzip, deflate, br, zstd"}', '2025-08-20 22:31:29', 0, '2025-08-20 19:49:21', '2025-08-21 16:49:21'),
	(27, 7, '37b90bdf4660563bf1c4ec3b5bfa4c232de172c6ef266ab66152d0e9e2c035de', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '{"fingerprint":"f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36","ip":"::1","acceptLanguage":"he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6","acceptEncoding":"gzip, deflate, br, zstd"}', '2025-08-21 21:53:44', 0, '2025-08-20 20:21:58', '2025-08-21 17:21:58'),
	(28, 7, 'a0031bbe30bf659376652dc49b9add4de7f732e722f649adcfa01681a46eb448', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '{"fingerprint":"f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36","ip":"::1","acceptLanguage":"he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6","acceptEncoding":"gzip, deflate, br, zstd"}', '2025-08-21 21:53:44', 0, '2025-08-20 20:45:26', '2025-08-21 17:45:26'),
	(29, 7, '9f46a75058b3e68b0e0ecf31d5f82a8141d811dce622cbe38fb1970b02916ab9', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '{"fingerprint":"f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36","ip":"::1","acceptLanguage":"he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6","acceptEncoding":"gzip, deflate, br, zstd"}', '2025-08-21 21:53:44', 0, '2025-08-20 21:09:34', '2025-08-21 18:09:34'),
	(30, 7, '5c5b15f661209364b753eeb1429ff5af41025d954bed3acc6a61dbbcd7d275a4', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '{"fingerprint":"f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36","ip":"::1","acceptLanguage":"he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6","acceptEncoding":"gzip, deflate, br, zstd"}', '2025-08-21 21:53:44', 0, '2025-08-20 22:31:18', '2025-08-21 19:31:18'),
	(31, 7, '1669eb3fe23b07f2860e71769ea56108915fa46115d0f6bc62046688f5df7e5c', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '{"fingerprint":"f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36","ip":"::1","acceptLanguage":"he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6","acceptEncoding":"gzip, deflate, br, zstd"}', '2025-08-22 16:01:42', 0, '2025-08-21 21:53:39', '2025-08-22 18:53:39'),
	(32, 7, '9225c7a263c9be0f0a701a51ce65b9ac341c2a9ec415e7cd496935c36418a5a6', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '{"fingerprint":"f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36","ip":"::1","acceptLanguage":"he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6","acceptEncoding":"gzip, deflate, br, zstd"}', '2025-08-22 17:23:56', 0, '2025-08-22 11:14:32', '2025-08-23 08:14:32'),
	(33, 7, '10f946776d2da65f0da98429c32947aae461c3c2783bcffe21cdc04277f44ec1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '{"fingerprint":"f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36","ip":"::1","acceptLanguage":"he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6","acceptEncoding":"gzip, deflate, br, zstd"}', '2025-08-22 18:09:41', 0, '2025-08-22 12:25:16', '2025-08-23 09:25:16'),
	(34, 7, '52c31894f3ff1dd6af8ca955b98ea3eeef1c36b2b0cfa39c1e1cd3277c285626', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '{"fingerprint":"f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36","ip":"::1","acceptLanguage":"he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6","acceptEncoding":"gzip, deflate, br, zstd"}', '2025-08-23 08:38:02', 0, '2025-08-22 12:58:15', '2025-08-23 09:58:15'),
	(35, 7, '71b69d74acf1e0427eb359cd18a88ac3c23a59f0b7879ae4a585dc2819244838', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '{"fingerprint":"f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36","ip":"::1","acceptLanguage":"he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6","acceptEncoding":"gzip, deflate, br, zstd"}', '2025-08-23 08:38:02', 0, '2025-08-22 16:01:35', '2025-08-23 13:01:35'),
	(36, 7, '37d12dce8eccccae6f2461d05c777df442e5b92211b0875f29df876b42bdfdcb', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '{"fingerprint":"f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36","ip":"::1","acceptLanguage":"he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6","acceptEncoding":"gzip, deflate, br, zstd"}', '2025-08-23 08:38:02', 0, '2025-08-22 17:23:14', '2025-08-23 14:23:14'),
	(37, 7, '26cea2ed0f4c4a02e81b18360b76c257083239efaa395ce17957a6bcdd705ccc', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '{"fingerprint":"f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36","ip":"::1","acceptLanguage":"he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6","acceptEncoding":"gzip, deflate, br, zstd"}', '2025-08-23 08:38:02', 0, '2025-08-22 18:09:35', '2025-08-23 15:09:35'),
	(38, 7, 'f49822a27354432c42b77e3af70b9bafc50369437ccd9ce8f05b7a80a94533b1', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '{"fingerprint":"f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36","ip":"::1","acceptLanguage":"he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6","acceptEncoding":"gzip, deflate, br, zstd"}', '2025-08-23 08:38:02', 0, '2025-08-22 23:13:22', '2025-08-23 20:13:22'),
	(39, 7, '241ef29c4575f977cf866bc0972e7da159ad34aef947d66b317e3af51059a817', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '{"fingerprint":"f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36","ip":"::1","acceptLanguage":"he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6","acceptEncoding":"gzip, deflate, br, zstd"}', '2025-08-25 08:51:14', 0, '2025-08-23 15:05:03', '2025-08-24 12:05:03'),
	(40, 7, 'e01ba7a30f76bb554f1b08be357fdf40fab59caad783d8ea65a3eafa68a2c266', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '{"fingerprint":"f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36","ip":"::1","acceptLanguage":"he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6","acceptEncoding":"gzip, deflate, br, zstd"}', '2025-08-25 08:51:14', 0, '2025-08-23 15:35:26', '2025-08-24 12:35:26'),
	(41, 20, 'cd893ae7c0987b2b0559a918c47e79d279740426014ef028cc5073f9ef7d3065', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '{"fingerprint":"f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36","ip":"::1","acceptLanguage":"he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6","acceptEncoding":"gzip, deflate, br, zstd"}', '2025-08-25 08:58:03', 0, '2025-08-23 22:57:35', '2025-08-24 19:57:35'),
	(42, 7, '26c4dff8a960eb712e2aed3b63fcd6e509ab895845d152a81057b2fb1a55cd44', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '{"fingerprint":"f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36","ip":"::1","acceptLanguage":"he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6","acceptEncoding":"gzip, deflate, br, zstd"}', '2025-08-26 16:32:36', 0, '2025-08-25 08:50:48', '2025-08-26 05:50:48'),
	(43, 20, 'a45288d2dd6cc2112a79a86934ee755b49f478be6eaee749f14341c8cb470057', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '{"fingerprint":"f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36","ip":"::1","acceptLanguage":"he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6","acceptEncoding":"gzip, deflate, br, zstd"}', '2025-08-26 16:33:50', 0, '2025-08-25 08:57:57', '2025-08-26 05:57:57'),
	(44, 7, 'fd689934d018fefffb3b59b8f158765dddebd0b5696659a8a85beff900bbb78a', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '{"fingerprint":"f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36","ip":"::1","acceptLanguage":"he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6","acceptEncoding":"gzip, deflate, br, zstd"}', '2025-08-26 16:33:22', 0, '2025-08-26 16:32:25', '2025-08-27 13:32:25'),
	(45, 20, '480b93761849a99505ed0f87305697b917210c5c78cfe3ffaddf66fe867d750d', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '{"fingerprint":"f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36","ip":"::1","acceptLanguage":"he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6","acceptEncoding":"gzip, deflate, br, zstd"}', '2025-10-08 12:59:35', 0, '2025-08-26 16:33:44', '2025-08-27 13:33:44'),
	(46, 20, '11c47ec94f4ba7c97fb479a5201f94e126dab2d37ced7a61f710ed29a67ea23b', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '{"fingerprint":"f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36","ip":"::1","acceptLanguage":"he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6","acceptEncoding":"gzip, deflate, br, zstd"}', '2025-10-08 12:59:35', 0, '2025-08-26 16:58:13', '2025-08-27 13:58:13'),
	(47, 20, '4d568a5d1eac4396b2528798194004dc7820ec3673b1070217795a5cd6e127fb', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '{"fingerprint":"f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36","ip":"::1","acceptLanguage":"he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6","acceptEncoding":"gzip, deflate, br, zstd"}', '2025-10-08 12:59:35', 0, '2025-08-26 17:20:23', '2025-08-27 14:20:23'),
	(48, 20, 'caebac67370d630bb5333e047804fa8149d3861ce2b25042e07e3b5012a24114', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '{"fingerprint":"f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36","ip":"::1","acceptLanguage":"he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6","acceptEncoding":"gzip, deflate, br, zstd"}', '2025-10-08 12:59:35', 0, '2025-08-26 17:46:58', '2025-08-27 14:46:58'),
	(49, 7, 'c1755ea3bb01fb55a401f7f78aba845640bc843c6559f7338682a5580b52394f', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '{"fingerprint":"f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36","ip":"::1","acceptLanguage":"he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6","acceptEncoding":"gzip, deflate, br, zstd"}', '2025-08-26 20:46:09', 0, '2025-08-26 20:28:56', '2025-08-27 17:28:56'),
	(50, 7, '6397e1346305b9692efec1882a169b2d477a732a5fa80ca2aeeaf8a8117d25a2', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', '{"fingerprint":"f046ced70c100901f7722fb1fb8911a425f58f7d32b9006fd0f589ab9cacad50","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36","ip":"::1","acceptLanguage":"he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6","acceptEncoding":"gzip, deflate, br, zstd"}', '2025-08-26 20:57:08', 0, '2025-08-26 20:56:15', '2025-08-27 17:56:15'),
	(51, 7, 'a1a441a21d3420d33f696ed4b93b092f97e7721fdfb5405041ec5c7eb49b9612', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '{"fingerprint":"6694a6d9a10c733eecf2e25afad2d7ae9a5616b8b10f6d8e80c2684e3618f4d4","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36","ip":"::1","acceptLanguage":"he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6","acceptEncoding":"gzip, deflate, br, zstd"}', '2025-10-08 12:58:44', 0, '2025-10-08 12:57:36', '2025-10-09 09:57:36'),
	(52, 20, '615ed7e6afd1cd4d96dff288b5a1d4fce04f50f50795be3f263a7444066dc7ae', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '{"fingerprint":"6694a6d9a10c733eecf2e25afad2d7ae9a5616b8b10f6d8e80c2684e3618f4d4","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36","ip":"::1","acceptLanguage":"he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6","acceptEncoding":"gzip, deflate, br, zstd"}', '2025-10-08 12:59:35', 1, '2025-10-08 12:59:27', '2025-10-09 09:59:26'),
	(53, 7, 'edc100a697b5e139c92ca17dbd4f2022fb686280ed444b4e1077f7c85875db8a', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '{"fingerprint":"6694a6d9a10c733eecf2e25afad2d7ae9a5616b8b10f6d8e80c2684e3618f4d4","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36","ip":"::1","acceptLanguage":"he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6","acceptEncoding":"gzip, deflate, br, zstd"}', '2025-10-09 11:25:38', 0, '2025-10-09 10:50:51', '2025-10-10 07:50:51'),
	(54, 7, '6bc5326c5ba5aa9175e463727851ab30ec7b2b746bf46fd6a01ad4df5e6114e6', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '{"fingerprint":"6694a6d9a10c733eecf2e25afad2d7ae9a5616b8b10f6d8e80c2684e3618f4d4","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36","ip":"::1","acceptLanguage":"he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6","acceptEncoding":"gzip, deflate, br, zstd"}', '2025-10-09 11:25:38', 0, '2025-10-09 11:19:34', '2025-10-10 08:19:34'),
	(55, 7, '74756d7ede90536556f303534bd04d6f5856f5a6fcd2e8622766696c671f05b8', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '{"fingerprint":"6694a6d9a10c733eecf2e25afad2d7ae9a5616b8b10f6d8e80c2684e3618f4d4","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36","ip":"::1","acceptLanguage":"he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6","acceptEncoding":"gzip, deflate, br, zstd"}', '2025-10-09 11:25:38', 0, '2025-10-09 11:20:03', '2025-10-10 08:20:03'),
	(56, 7, 'a4fe11f1ab7d0237ada4e8248571576cef8580e18bdb18a47f33b719b46faad6', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '{"fingerprint":"6694a6d9a10c733eecf2e25afad2d7ae9a5616b8b10f6d8e80c2684e3618f4d4","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36","ip":"::1","acceptLanguage":"he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6","acceptEncoding":"gzip, deflate, br, zstd"}', '2025-10-13 16:47:35', 0, '2025-10-13 16:36:31', '2025-10-14 13:36:31'),
	(57, 7, '79e034c3bdabd22de6c34f833b108c181af047f991be2e899af0ae188a927f72', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '{"fingerprint":"6694a6d9a10c733eecf2e25afad2d7ae9a5616b8b10f6d8e80c2684e3618f4d4","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36","ip":"::1","acceptLanguage":"he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6","acceptEncoding":"gzip, deflate, br, zstd"}', '2025-10-13 16:47:35', 0, '2025-10-13 16:37:11', '2025-10-14 13:37:11'),
	(58, 7, 'a14d2de9012d5548ca0909ec4599d73a0dfae2b1f7233b537df86b6a68fe6c67', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '{"fingerprint":"6694a6d9a10c733eecf2e25afad2d7ae9a5616b8b10f6d8e80c2684e3618f4d4","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36","ip":"::1","acceptLanguage":"he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6","acceptEncoding":"gzip, deflate, br, zstd"}', '2025-10-13 16:47:36', 0, '2025-10-13 16:38:19', '2025-10-14 13:38:19'),
	(59, 7, 'c2cbf6c02220e1ae34c34e1e36aee9bf5faf3305f242de13efd4f3bbe8de4973', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '{"fingerprint":"6694a6d9a10c733eecf2e25afad2d7ae9a5616b8b10f6d8e80c2684e3618f4d4","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36","ip":"::1","acceptLanguage":"he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6","acceptEncoding":"gzip, deflate, br, zstd"}', '2025-10-13 19:16:06', 0, '2025-10-13 16:38:48', '2025-10-14 13:38:48'),
	(60, 7, 'caf66d7393fa4b4df2f35631cda1ee1d88f6c644e43015cafd64df07b5e345df', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '{"fingerprint":"6694a6d9a10c733eecf2e25afad2d7ae9a5616b8b10f6d8e80c2684e3618f4d4","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36","ip":"::1","acceptLanguage":"he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6","acceptEncoding":"gzip, deflate, br, zstd"}', '2025-10-13 19:55:18', 0, '2025-10-13 16:43:07', '2025-10-14 13:43:07'),
	(61, 7, '6fde7406c46e7f64504f3bf4900419074c77e205784ad37a2acf82cd8269c199', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '{"fingerprint":"6694a6d9a10c733eecf2e25afad2d7ae9a5616b8b10f6d8e80c2684e3618f4d4","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36","ip":"::1","acceptLanguage":"he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6","acceptEncoding":"gzip, deflate, br, zstd"}', '2025-10-13 19:56:57', 1, '2025-10-13 16:46:11', '2025-10-14 13:46:11'),
	(62, 7, '133eabcb02a49dd3fff99ce910deac941a1e8bb94cb445dd8713f350b21cf4d2', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '{"fingerprint":"6694a6d9a10c733eecf2e25afad2d7ae9a5616b8b10f6d8e80c2684e3618f4d4","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36","ip":"::1","acceptLanguage":"he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6","acceptEncoding":"gzip, deflate, br, zstd"}', '2025-10-13 19:56:57', 1, '2025-10-13 16:47:29', '2025-10-14 13:47:29'),
	(63, 7, 'af7540bd0602c88d6df5ef39971a1be861c522b0cb54efc5fe5709c75431277e', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '{"fingerprint":"6694a6d9a10c733eecf2e25afad2d7ae9a5616b8b10f6d8e80c2684e3618f4d4","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36","ip":"::1","acceptLanguage":"he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6","acceptEncoding":"gzip, deflate, br, zstd"}', '2025-10-13 19:56:57', 1, '2025-10-13 19:15:51', '2025-10-14 16:15:51'),
	(64, 7, 'ee1140d88df896065b526ea4ec2bd6ccfadc03a3d0f0236b5bcaf64851026c53', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '{"fingerprint":"6694a6d9a10c733eecf2e25afad2d7ae9a5616b8b10f6d8e80c2684e3618f4d4","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36","ip":"::1","acceptLanguage":"he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6","acceptEncoding":"gzip, deflate, br, zstd"}', '2025-10-13 19:56:57', 1, '2025-10-13 19:55:10', '2025-10-14 16:55:10'),
	(65, 7, '36c456b0a339a23158107fcdea07c57db3c376d9cfb786bc787ba05c319c3065', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '{"fingerprint":"6694a6d9a10c733eecf2e25afad2d7ae9a5616b8b10f6d8e80c2684e3618f4d4","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36","ip":"::1","acceptLanguage":"he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6","acceptEncoding":"gzip, deflate, br, zstd"}', '2025-10-13 21:08:10', 1, '2025-10-13 21:08:10', '2025-10-14 18:08:10');

-- Dumping structure for trigger custombid.after_bid_insert
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO';
DELIMITER //
CREATE TRIGGER after_bid_insert
AFTER INSERT ON bids
FOR EACH ROW
BEGIN
    -- Update request status if first bid
    DECLARE bid_count INT DEFAULT 0;
    
    SELECT COUNT(*) INTO bid_count 
    FROM bids 
    WHERE request_id = NEW.request_id;
    
    IF bid_count = 1 THEN
        UPDATE requests 
        SET status = 'bids_received', updated_at = NOW() 
        WHERE id = NEW.request_id AND status = 'open_for_bids';
    END IF;
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

-- Dumping structure for trigger custombid.after_request_update
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO';
DELIMITER //
CREATE TRIGGER after_request_update
AFTER UPDATE ON requests
FOR EACH ROW
BEGIN
    -- Log significant status changes
    IF OLD.status != NEW.status THEN
        INSERT INTO dashboard_performance_log (customer_id, query_type, execution_time_ms)
        VALUES (NEW.customer_id, 'status_change_trigger', 0);
    END IF;
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

-- Dumping structure for trigger custombid.create_bid_notification
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO';
DELIMITER //
CREATE TRIGGER `create_bid_notification` AFTER UPDATE ON `bids` FOR EACH ROW BEGIN
  IF NEW.status != OLD.status THEN
    IF NEW.status = 'accepted' THEN
      INSERT INTO notifications (user_id, type, title, message, related_id, related_type, priority)
      VALUES (NEW.supplier_id, 'bid_accepted', 'Bid Accepted!', 'Your bid has been accepted by the customer.', NEW.id, 'bid', 'high');
      
      INSERT INTO real_time_events (event_type, user_id, target_user_id, data)
      VALUES ('bid_accepted', NEW.supplier_id, NEW.supplier_id, JSON_OBJECT('bid_id', NEW.id, 'request_id', NEW.request_id));
      
    ELSEIF NEW.status = 'rejected' THEN
      INSERT INTO notifications (user_id, type, title, message, related_id, related_type)
      VALUES (NEW.supplier_id, 'bid_rejected', 'Bid Rejected', 'Your bid has been rejected by the customer.', NEW.id, 'bid');
      
      INSERT INTO real_time_events (event_type, user_id, target_user_id, data)
      VALUES ('bid_rejected', NEW.supplier_id, NEW.supplier_id, JSON_OBJECT('bid_id', NEW.id, 'request_id', NEW.request_id));
    END IF;
  END IF;
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

-- Dumping structure for trigger custombid.create_new_bid_notification
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO';
DELIMITER //
CREATE TRIGGER `create_new_bid_notification` AFTER INSERT ON `bids` FOR EACH ROW BEGIN
  DECLARE customer_id INT;
  
  SELECT r.customer_id INTO customer_id FROM requests r WHERE r.id = NEW.request_id;
  
  INSERT INTO notifications (user_id, type, title, message, related_id, related_type, priority)
  VALUES (customer_id, 'bid_received', 'New Bid Received!', 'You have received a new bid for your request.', NEW.id, 'bid', 'high');
  
  INSERT INTO real_time_events (event_type, user_id, target_user_id, data)
  VALUES ('bid_received', NEW.supplier_id, customer_id, JSON_OBJECT('bid_id', NEW.id, 'request_id', NEW.request_id));
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

-- Dumping structure for trigger custombid.generate_anonymous_supplier
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO';
DELIMITER //
CREATE TRIGGER `generate_anonymous_supplier` AFTER INSERT ON `bids` FOR EACH ROW BEGIN
  DECLARE anon_name VARCHAR(50);
  DECLARE anon_count INT;
  
  IF NOT EXISTS (SELECT 1 FROM anonymous_suppliers WHERE supplier_id = NEW.supplier_id AND request_id = NEW.request_id) THEN
    
    SELECT COUNT(*) INTO anon_count 
    FROM anonymous_suppliers 
    WHERE request_id = NEW.request_id;
    
    SET anon_name = CONCAT('Supplier ', CHAR(65 + anon_count));
    
    INSERT INTO anonymous_suppliers (supplier_id, request_id, anonymous_name, anonymous_rating, anonymous_review_count)
    SELECT NEW.supplier_id, NEW.request_id, anon_name, 
           COALESCE(sp.rating, 0), COALESCE(sp.review_count, 0)
    FROM users u
    LEFT JOIN supplier_profiles sp ON u.id = sp.user_id
    WHERE u.id = NEW.supplier_id;
    
  END IF;
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

-- Dumping structure for trigger custombid.generate_order_number
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO';
DELIMITER //
CREATE TRIGGER `generate_order_number` BEFORE INSERT ON `orders` FOR EACH ROW BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    SET NEW.order_number = CONCAT('CB', YEAR(NOW()), MONTH(NOW()), DAY(NOW()), '-', LAST_INSERT_ID() + 1);
  END IF;
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

-- Dumping structure for trigger custombid.supplier_profiles_audit_insert
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO';
DELIMITER //
CREATE TRIGGER IF NOT EXISTS `supplier_profiles_audit_insert`
AFTER INSERT ON `supplier_profiles`
FOR EACH ROW
BEGIN
  INSERT INTO `supplier_profile_audit` 
    (`supplier_id`, `change_type`, `change_description`, `changed_by`)
  VALUES 
    (NEW.id, 'info', 'Profile created', NEW.user_id);
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

-- Dumping structure for trigger custombid.supplier_profiles_audit_update
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO';
DELIMITER //
CREATE TRIGGER IF NOT EXISTS `supplier_profiles_audit_update`
AFTER UPDATE ON `supplier_profiles`
FOR EACH ROW
BEGIN
  IF OLD.company_name != NEW.company_name OR 
     OLD.description != NEW.description OR
     OLD.business_license != NEW.business_license OR
     OLD.tax_id != NEW.tax_id OR
     OLD.address != NEW.address OR
     OLD.website != NEW.website THEN
    INSERT INTO `supplier_profile_audit` 
      (`supplier_id`, `change_type`, `change_description`, `changed_by`)
    VALUES 
      (NEW.id, 'info', 'Profile information updated', NEW.user_id);
  END IF;
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

-- Dumping structure for trigger custombid.update_request_status_on_bid_accept
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO';
DELIMITER //
CREATE TRIGGER `update_request_status_on_bid_accept` AFTER UPDATE ON `bids` FOR EACH ROW BEGIN
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    UPDATE requests SET status = 'in_progress' WHERE id = NEW.request_id;
    UPDATE bids SET accepted_at = NOW() WHERE id = NEW.id;
  ELSEIF NEW.status = 'rejected' AND OLD.status != 'rejected' THEN
    UPDATE bids SET rejected_at = NOW() WHERE id = NEW.id;
  END IF;
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

-- Dumping structure for trigger custombid.update_supplier_rating
SET @OLDTMP_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO';
DELIMITER //
CREATE TRIGGER `update_supplier_rating` AFTER INSERT ON `reviews` FOR EACH ROW BEGIN
  UPDATE supplier_profiles sp
  JOIN users u ON sp.user_id = u.id
  SET sp.rating = (
    SELECT AVG(r.rating) 
    FROM reviews r 
    JOIN orders o ON r.order_id = o.id 
    WHERE o.supplier_id = u.id
  ),
  sp.review_count = (
    SELECT COUNT(*) 
    FROM reviews r 
    JOIN orders o ON r.order_id = o.id 
    WHERE o.supplier_id = u.id
  )
  WHERE sp.user_id = NEW.reviewed_id;
END//
DELIMITER ;
SET SQL_MODE=@OLDTMP_SQL_MODE;

-- Removing temporary table and create final VIEW structure
DROP TABLE IF EXISTS `active_requests_with_bids`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `active_requests_with_bids` AS SELECT 
    `r`.`id` AS `id`,
    `r`.`customer_id` AS `customer_id`,
    `r`.`title` AS `title`,
    `r`.`description` AS `description`,
    `r`.`budget_min` AS `budget_min`,
    `r`.`budget_max` AS `budget_max`,
    `r`.`currency` AS `currency`,
    `r`.`delivery_date` AS `delivery_date`,
    `r`.`time_flexibility` AS `time_flexibility`,
    `r`.`priorities` AS `priorities`,
    `r`.`status` AS `status`,
    `r`.`category_id` AS `category_id`,
    `r`.`ai_categorized` AS `ai_categorized`,
    `r`.`manually_categorized` AS `manually_categorized`,
    `r`.`ai_confidence` AS `ai_confidence`,
    `r`.`ai_categories_suggested` AS `ai_categories_suggested`,
    `r`.`ai_reasoning` AS `ai_reasoning`,
    `r`.`file_notes` AS `file_notes`,
    `r`.`expires_at` AS `expires_at`,
    `r`.`created_at` AS `created_at`,
    `r`.`updated_at` AS `updated_at`,
    `c`.`name` AS `category_name`,
    `u`.`first_name` AS `customer_first_name`,
    `u`.`last_name` AS `customer_last_name`,
    `u`.`email` AS `customer_email`,
    count(`b`.`id`) AS `bid_count`,
    min(`b`.`price`) AS `min_bid_price`,
    max(`b`.`price`) AS `max_bid_price`,
    avg(`b`.`price`) AS `avg_bid_price`
FROM (((`requests` `r` 
    LEFT JOIN `categories` `c` ON(`r`.`category_id` = `c`.`id`))
    LEFT JOIN `users` `u` ON(`r`.`customer_id` = `u`.`id`))
    LEFT JOIN `bids` `b` ON(`r`.`id` = `b`.`request_id` AND `b`.`status` = 'pending'))
WHERE `r`.`status` IN ('open_for_bids','bids_received') 
GROUP BY `r`.`id` 
;

-- Removing temporary table and create final VIEW structure
DROP TABLE IF EXISTS `ai_system_stats`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `ai_system_stats` AS SELECT 
  'rate_limits' as metric_type,
  COUNT(*) as total_count,
  COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR) THEN 1 END) as last_hour,
  COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as last_24h,
  MAX(created_at) as last_occurrence
FROM ai_rate_limits
UNION ALL
SELECT 
  'api_usage' as metric_type,
  SUM(requests_made) as total_count,
  SUM(CASE WHEN timestamp >= DATE_SUB(NOW(), INTERVAL 1 HOUR) THEN requests_made ELSE 0 END) as last_hour,
  SUM(CASE WHEN timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN requests_made ELSE 0 END) as last_24h,
  MAX(timestamp) as last_occurrence
FROM ai_usage_log
UNION ALL
SELECT 
  'categorization_queue' as metric_type,
  COUNT(*) as total_count,
  COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR) THEN 1 END) as last_hour,
  COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as last_24h,
  MAX(updated_at) as last_occurrence
FROM ai_categorization_queue 
;

-- Removing temporary table and create final VIEW structure
DROP TABLE IF EXISTS `customer_activity_feed`;
CREATE SQL SECURITY DEFINER VIEW `customer_activity_feed` AS SELECT 
    r.customer_id,
    'request_created' as activity_type,
    r.id as entity_id,
    r.title as entity_title,
    NULL as secondary_info,
    r.created_at as activity_time,
    'You created a new request' as activity_description,
    'request' as icon_type,
    'info' as priority
FROM requests r
WHERE r.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)

UNION ALL

SELECT 
    r.customer_id,
    'bid_received' as activity_type,
    b.id as entity_id,
    r.title as entity_title,
    CONCAT('$', FORMAT(b.price, 0)) as secondary_info,
    b.created_at as activity_time,
    CONCAT('New bid received for "', LEFT(r.title, 30), '"') as activity_description,
    'bid' as icon_type,
    CASE 
        WHEN b.created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR) THEN 'high'
        WHEN b.created_at >= DATE_SUB(NOW(), INTERVAL 6 HOUR) THEN 'medium'
        ELSE 'low'
    END as priority
FROM bids b
JOIN requests r ON b.request_id = r.id
WHERE b.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)

UNION ALL

SELECT 
    r.customer_id,
    'order_status_update' as activity_type,
    o.id as entity_id,
    r.title as entity_title,
    o.status as secondary_info,
    o.updated_at as activity_time,
    CONCAT('Order status updated to "', o.status, '"') as activity_description,
    'order' as icon_type,
    'medium' as priority
FROM orders o
JOIN bids b ON o.bid_id = b.id
JOIN requests r ON b.request_id = r.id
WHERE o.updated_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)

ORDER BY activity_time DESC 
;

-- Removing temporary table and create final VIEW structure
DROP TABLE IF EXISTS `customer_dashboard_insights`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `customer_dashboard_insights` AS SELECT 
    customer_id,
    
    -- Performance scores (0-100)
    CASE 
        WHEN total_requests = 0 THEN 0
        ELSE ROUND((completed_requests / total_requests) * 100, 1)
    END as completion_rate,
    
    CASE 
        WHEN total_bids = 0 THEN 0
        ELSE ROUND((accepted_bids / total_bids) * 100, 1)
    END as bid_acceptance_rate,
    
    CASE 
        WHEN active_requests = 0 THEN 100
        WHEN total_bids = 0 THEN 0
        ELSE ROUND((total_bids / active_requests), 1)
    END as avg_bids_per_request,
    
    -- Trend indicators
    CASE 
        WHEN requests_prev_7d = 0 THEN 
            CASE WHEN requests_last_7d > 0 THEN 100 ELSE 0 END
        ELSE ROUND(((requests_last_7d - requests_prev_7d) / requests_prev_7d) * 100, 1)
    END as requests_trend_pct,
    
    CASE 
        WHEN bids_prev_7d = 0 THEN 
            CASE WHEN bids_last_7d > 0 THEN 100 ELSE 0 END
        ELSE ROUND(((bids_last_7d - bids_prev_7d) / bids_prev_7d) * 100, 1)
    END as bids_trend_pct,
    
    -- Risk indicators
    CASE 
        WHEN active_requests > 5 AND total_bids / active_requests < 2 THEN 'low_engagement'
        WHEN avg_response_time_hours > 48 THEN 'slow_response'
        WHEN cancelled_requests / total_requests > 0.3 THEN 'high_cancellation'
        ELSE 'healthy'
    END as health_status,
    
    -- Recommendations
    CASE 
        WHEN avg_bid_price > 0 AND min_bid_price > 0 THEN 
            ROUND((avg_bid_price - min_bid_price) / avg_bid_price * 100, 1)
        ELSE 0
    END as potential_savings_pct,
    
    -- Activity level
    CASE 
        WHEN requests_last_7d >= 3 THEN 'high'
        WHEN requests_last_7d >= 1 THEN 'medium'
        ELSE 'low'
    END as activity_level

FROM customer_dashboard_metrics 
;

-- Removing temporary table and create final VIEW structure
DROP TABLE IF EXISTS `customer_dashboard_metrics`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `customer_dashboard_metrics` AS SELECT 
    r.customer_id,
    
    -- Core metrics
    COUNT(DISTINCT r.id) as total_requests,
    COUNT(DISTINCT CASE WHEN r.status IN ('open_for_bids', 'bids_received') THEN r.id END) as active_requests,
    COUNT(DISTINCT CASE WHEN r.status = 'completed' THEN r.id END) as completed_requests,
    COUNT(DISTINCT CASE WHEN r.status = 'cancelled' THEN r.id END) as cancelled_requests,
    
    -- Bid metrics
    COUNT(DISTINCT b.id) as total_bids,
    COUNT(DISTINCT CASE WHEN b.status = 'pending' THEN b.id END) as pending_bids,
    COUNT(DISTINCT CASE WHEN b.status = 'accepted' THEN b.id END) as accepted_bids,
    COUNT(DISTINCT CASE WHEN b.status = 'rejected' THEN b.id END) as rejected_bids,
    
    -- Order metrics
    COUNT(DISTINCT o.id) as total_orders,
    COUNT(DISTINCT CASE WHEN o.status IN ('confirmed', 'in_production', 'shipped') THEN o.id END) as active_orders,
    COUNT(DISTINCT CASE WHEN o.status IN ('delivered', 'completed') THEN o.id END) as completed_orders,
    
    -- Financial metrics
    COALESCE(SUM(CASE WHEN o.status IN ('delivered', 'completed') THEN o.total_amount END), 0) as total_spent,
    COALESCE(AVG(b.price), 0) as avg_bid_price,
    COALESCE(MIN(b.price), 0) as min_bid_price,
    COALESCE(MAX(b.price), 0) as max_bid_price,
    
    -- Timing metrics
    COALESCE(AVG(TIMESTAMPDIFF(HOUR, r.created_at, b.created_at)), 0) as avg_response_time_hours,
    COALESCE(AVG(TIMESTAMPDIFF(DAY, r.created_at, 
        CASE WHEN r.status = 'completed' THEN r.updated_at END)), 0) as avg_completion_days,
    
    -- Recent activity (last 7 days)
    COUNT(DISTINCT CASE WHEN r.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN r.id END) as requests_last_7d,
    COUNT(DISTINCT CASE WHEN b.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN b.id END) as bids_last_7d,
    COUNT(DISTINCT CASE WHEN o.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN o.id END) as orders_last_7d,
    
    -- Previous period (8-14 days ago) for trend calculation
    COUNT(DISTINCT CASE WHEN r.created_at BETWEEN DATE_SUB(NOW(), INTERVAL 14 DAY) AND DATE_SUB(NOW(), INTERVAL 7 DAY) THEN r.id END) as requests_prev_7d,
    COUNT(DISTINCT CASE WHEN b.created_at BETWEEN DATE_SUB(NOW(), INTERVAL 14 DAY) AND DATE_SUB(NOW(), INTERVAL 7 DAY) THEN b.id END) as bids_prev_7d,
    COUNT(DISTINCT CASE WHEN o.created_at BETWEEN DATE_SUB(NOW(), INTERVAL 14 DAY) AND DATE_SUB(NOW(), INTERVAL 7 DAY) THEN o.id END) as orders_prev_7d,
    
    -- Category performance
    (SELECT c.name FROM categories c JOIN requests r2 ON c.id = r2.category_id 
     WHERE r2.customer_id = r.customer_id GROUP BY c.id ORDER BY COUNT(*) DESC LIMIT 1) as top_category,
    
    -- Dates
    MAX(r.created_at) as last_request_date,
    MAX(b.created_at) as last_bid_date,
    MAX(o.created_at) as last_order_date

FROM requests r
LEFT JOIN bids b ON r.id = b.request_id
LEFT JOIN orders o ON b.id = o.bid_id
GROUP BY r.customer_id 
;

-- Removing temporary table and create final VIEW structure
DROP TABLE IF EXISTS `customer_dashboard_summary`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `customer_dashboard_summary` AS SELECT 
    `u`.`id` AS `customer_id`,
    `u`.`first_name` AS `first_name`,
    `u`.`last_name` AS `last_name`,
    `u`.`email` AS `email`,
    count(DISTINCT `r`.`id`) AS `total_requests`,
    count(DISTINCT CASE WHEN `r`.`status` IN ('open_for_bids','bids_received') THEN `r`.`id` END) AS `active_requests`,
    count(DISTINCT CASE WHEN `r`.`status` = 'completed' THEN `r`.`id` END) AS `completed_requests`,
    count(DISTINCT `b`.`id`) AS `total_bids_received`,
    count(DISTINCT CASE WHEN `b`.`status` = 'pending' THEN `b`.`id` END) AS `pending_bids`,
    count(DISTINCT CASE WHEN `b`.`status` = 'accepted' THEN `b`.`id` END) AS `accepted_bids`,
    count(DISTINCT `o`.`id`) AS `total_orders`,
    count(DISTINCT CASE WHEN `o`.`status` IN ('confirmed','in_production','shipped') THEN `o`.`id` END) AS `active_orders`,
    count(DISTINCT CASE WHEN `o`.`status` IN ('completed','delivered') THEN `o`.`id` END) AS `completed_orders`,
    coalesce(sum(DISTINCT `o`.`total_amount`),0) AS `total_spent`,
    max(`r`.`created_at`) AS `last_request_date`,
    max(`b`.`created_at`) AS `last_bid_date`,
    max(`o`.`created_at`) AS `last_order_date`
FROM (((`users` `u` 
    LEFT JOIN `requests` `r` ON(`u`.`id` = `r`.`customer_id`))
    LEFT JOIN `bids` `b` ON(`r`.`id` = `b`.`request_id`))
    LEFT JOIN `orders` `o` ON(`u`.`id` = `o`.`customer_id`))
WHERE `u`.`user_type` = 'customer' 
GROUP BY `u`.`id` 
;

-- Removing temporary table and create final VIEW structure
DROP TABLE IF EXISTS `customer_recent_activity`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `customer_recent_activity` AS SELECT 
    'request' AS `activity_type`,
    `r`.`customer_id` AS `customer_id`,
    `r`.`id` AS `item_id`,
    `r`.`title` AS `title`,
    `r`.`status` AS `status`,
    `r`.`created_at` AS `created_at`,
    `r`.`updated_at` AS `updated_at`,
    NULL AS `amount`,
    NULL AS `supplier_name`
FROM `requests` AS `r` 
WHERE `r`.`created_at` > current_timestamp() - INTERVAL 30 DAY
UNION ALL
SELECT 
    'bid' AS `activity_type`,
    `r`.`customer_id` AS `customer_id`,
    `b`.`id` AS `item_id`,
    CONCAT('Bid for: ',`r`.`title`) AS `title`,
    `b`.`status` AS `status`,
    `b`.`created_at` AS `created_at`,
    `b`.`updated_at` AS `updated_at`,
    `b`.`price` AS `amount`,
    COALESCE(`sp`.`company_name`,CONCAT(`u`.`first_name`,' ',`u`.`last_name`)) AS `supplier_name` 
FROM (((`bids` `b` 
    JOIN `requests` `r` ON(`b`.`request_id` = `r`.`id`))
    JOIN `users` `u` ON(`b`.`supplier_id` = `u`.`id`))
    LEFT JOIN `supplier_profiles` `sp` ON(`u`.`id` = `sp`.`user_id`))
WHERE `b`.`created_at` > current_timestamp() - INTERVAL 30 DAY
UNION ALL
SELECT 
    'order' AS `activity_type`,
    `o`.`customer_id` AS `customer_id`,
    `o`.`id` AS `item_id`,
    CONCAT('Order: ',`r`.`title`) AS `title`,
    `o`.`status` AS `status`,
    `o`.`created_at` AS `created_at`,
    `o`.`updated_at` AS `updated_at`,
    `o`.`total_amount` AS `amount`,
    COALESCE(`sp`.`company_name`,CONCAT(`u`.`first_name`,' ',`u`.`last_name`)) AS `supplier_name` 
FROM ((((`orders` `o` 
    JOIN `bids` `b` ON(`o`.`bid_id` = `b`.`id`))
    JOIN `requests` `r` ON(`b`.`request_id` = `r`.`id`))
    JOIN `users` `u` ON(`o`.`supplier_id` = `u`.`id`))
    LEFT JOIN `supplier_profiles` `sp` ON(`u`.`id` = `sp`.`user_id`))
WHERE `o`.`created_at` > current_timestamp() - INTERVAL 30 DAY
ORDER BY `created_at` DESC 
;

-- Removing temporary table and create final VIEW structure
DROP TABLE IF EXISTS `customer_requests_with_bids`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `customer_requests_with_bids` AS SELECT 
    `r`.`id` AS `id`,
    `r`.`customer_id` AS `customer_id`,
    `r`.`title` AS `title`,
    `r`.`description` AS `description`,
    `r`.`budget_min` AS `budget_min`,
    `r`.`budget_max` AS `budget_max`,
    `r`.`currency` AS `currency`,
    `r`.`delivery_date` AS `delivery_date`,
    `r`.`time_flexibility` AS `time_flexibility`,
    `r`.`priorities` AS `priorities`,
    `r`.`status` AS `status`,
    `r`.`category_id` AS `category_id`,
    `r`.`ai_categorized` AS `ai_categorized`,
    `r`.`manually_categorized` AS `manually_categorized`,
    `r`.`ai_confidence` AS `ai_confidence`,
    `r`.`ai_categories_suggested` AS `ai_categories_suggested`,
    `r`.`ai_reasoning` AS `ai_reasoning`,
    `r`.`file_notes` AS `file_notes`,
    `r`.`expires_at` AS `expires_at`,
    `r`.`created_at` AS `created_at`,
    `r`.`updated_at` AS `updated_at`,
    `c`.`name` AS `category_name`,
    count(`b`.`id`) AS `bid_count`,
    min(`b`.`price`) AS `min_bid_price`,
    max(`b`.`price`) AS `max_bid_price`,
    avg(`b`.`price`) AS `avg_bid_price`,
    count(CASE WHEN `b`.`status` = 'pending' THEN 1 END) AS `pending_bids`,
    count(CASE WHEN `b`.`status` = 'accepted' THEN 1 END) AS `accepted_bids`,
    count(CASE WHEN `b`.`status` = 'rejected' THEN 1 END) AS `rejected_bids`
FROM ((`requests` `r` 
    LEFT JOIN `categories` `c` ON(`r`.`category_id` = `c`.`id`))
    LEFT JOIN `bids` `b` ON(`r`.`id` = `b`.`request_id`))
GROUP BY `r`.`id` 
;

-- Removing temporary table and create final VIEW structure
DROP TABLE IF EXISTS `order_summary`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `order_summary` AS SELECT 
    `o`.`id` AS `id`,
    `o`.`bid_id` AS `bid_id`,
    `o`.`customer_id` AS `customer_id`,
    `o`.`supplier_id` AS `supplier_id`,
    `o`.`order_number` AS `order_number`,
    `o`.`total_amount` AS `total_amount`,
    `o`.`commission_amount` AS `commission_amount`,
    `o`.`commission_rate` AS `commission_rate`,
    `o`.`status` AS `status`,
    `o`.`delivery_date` AS `delivery_date`,
    `o`.`actual_delivery_date` AS `actual_delivery_date`,
    `o`.`tracking_number` AS `tracking_number`,
    `o`.`notes` AS `notes`,
    `o`.`customer_notes` AS `customer_notes`,
    `o`.`supplier_notes` AS `supplier_notes`,
    `o`.`created_at` AS `created_at`,
    `o`.`updated_at` AS `updated_at`,
    `r`.`title` AS `request_title`,
    `r`.`description` AS `request_description`,
    `cs`.`first_name` AS `customer_first_name`,
    `cs`.`last_name` AS `customer_last_name`,
    `cs`.`email` AS `customer_email`,
    `su`.`first_name` AS `supplier_first_name`,
    `su`.`last_name` AS `supplier_last_name`,
    `su`.`email` AS `supplier_email`,
    `sp`.`company_name` AS `supplier_company`,
    `b`.`price` AS `bid_price`,
    `b`.`delivery_time_days` AS `estimated_delivery_days`
FROM (((((`orders` `o` 
    JOIN `bids` `b` ON(`o`.`bid_id` = `b`.`id`))
    JOIN `requests` `r` ON(`b`.`request_id` = `r`.`id`))
    JOIN `users` `cs` ON(`o`.`customer_id` = `cs`.`id`))
    JOIN `users` `su` ON(`o`.`supplier_id` = `su`.`id`))
    LEFT JOIN `supplier_profiles` `sp` ON(`su`.`id` = `sp`.`user_id`)) 
;

-- Removing temporary table and create final VIEW structure
DROP TABLE IF EXISTS `security_monitoring`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `security_monitoring` AS SELECT 
  'failed_logins' as metric_type,
  COUNT(*) as count,
  DATE(created_at) as date
FROM `auth_logs` 
WHERE action = 'login_failed' AND success = 0
GROUP BY DATE(created_at)

UNION ALL

SELECT 
  'suspicious_activity' as metric_type,
  COUNT(*) as count,
  DATE(created_at) as date
FROM `auth_logs` 
WHERE action IN ('login_failed', 'session_expired', 'account_locked')
GROUP BY DATE(created_at)

UNION ALL

SELECT 
  'rate_limit_violations' as metric_type,
  COUNT(*) as count,
  DATE(last_attempt) as date
FROM `rate_limit_logs` 
WHERE is_blocked = 1
GROUP BY DATE(last_attempt) 
;

-- Removing temporary table and create final VIEW structure
DROP TABLE IF EXISTS `supplier_profiles_with_ratings`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `supplier_profiles_with_ratings` AS SELECT 
    `sp`.`id` AS `id`,
    `sp`.`user_id` AS `user_id`,
    `sp`.`company_name` AS `company_name`,
    `sp`.`business_license` AS `business_license`,
    `sp`.`tax_id` AS `tax_id`,
    `sp`.`address` AS `address`,
    `sp`.`city` AS `city`,
    `sp`.`country` AS `country`,
    `sp`.`website` AS `website`,
    `sp`.`description` AS `description`,
    `sp`.`is_approved` AS `is_approved`,
    `sp`.`rating` AS `rating`,
    `sp`.`review_count` AS `review_count`,
    `sp`.`approval_date` AS `approval_date`,
    `sp`.`created_at` AS `created_at`,
    `sp`.`updated_at` AS `updated_at`,
    `u`.`email` AS `email`,
    `u`.`first_name` AS `first_name`,
    `u`.`last_name` AS `last_name`,
    `u`.`phone` AS `phone`,
    `u`.`is_verified` AS `is_verified`,
    `u`.`is_active` AS `is_active`,
    `u`.`last_login` AS `last_login`,
    count(DISTINCT `o`.`id`) AS `completed_orders`,
    count(DISTINCT `b`.`id`) AS `total_bids`,
    count(CASE WHEN `b`.`status` = 'accepted' THEN 1 END) AS `accepted_bids`,
    CASE WHEN count(`b`.`id`) > 0 THEN ROUND(count(CASE WHEN `b`.`status` = 'accepted' THEN 1 END) / count(`b`.`id`) * 100,2) ELSE 0 END AS `acceptance_rate`
FROM (((`supplier_profiles` `sp` 
    JOIN `users` `u` ON(`sp`.`user_id` = `u`.`id`))
    LEFT JOIN `orders` `o` ON(`sp`.`user_id` = `o`.`supplier_id` AND `o`.`status` = 'completed'))
    LEFT JOIN `bids` `b` ON(`sp`.`user_id` = `b`.`supplier_id`))
GROUP BY `sp`.`id` 
;

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
