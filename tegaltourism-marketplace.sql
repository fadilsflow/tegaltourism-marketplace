-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:8889
-- Generation Time: Oct 24, 2025 at 02:11 PM
-- Server version: 5.7.23-23
-- PHP Version: 7.4.33

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `tegaltourism-marketplace`
--

-- --------------------------------------------------------

--
-- Table structure for table `account`
--

CREATE TABLE `account` (
  `id` varchar(191) NOT NULL,
  `account_id` varchar(191) NOT NULL,
  `provider_id` varchar(191) NOT NULL,
  `user_id` varchar(191) NOT NULL,
  `access_token` text,
  `refresh_token` text,
  `id_token` text,
  `access_token_expires_at` timestamp NULL DEFAULT NULL,
  `refresh_token_expires_at` timestamp NULL DEFAULT NULL,
  `scope` text,
  `password` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `address`
--

CREATE TABLE `address` (
  `id` varchar(191) NOT NULL,
  `user_id` varchar(191) NOT NULL,
  `recipient_name` varchar(191) NOT NULL,
  `phone` varchar(191) DEFAULT NULL,
  `street` text NOT NULL,
  `city` text NOT NULL,
  `province` text NOT NULL,
  `postal_code` varchar(191) NOT NULL,
  `is_default` tinyint(1) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cart`
--

CREATE TABLE `cart` (
  `id` varchar(191) NOT NULL,
  `user_id` varchar(191) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cart_item`
--

CREATE TABLE `cart_item` (
  `id` varchar(191) NOT NULL,
  `cart_id` varchar(191) NOT NULL,
  `product_id` varchar(191) NOT NULL,
  `quantity` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `order`
--

CREATE TABLE `order` (
  `id` varchar(191) NOT NULL,
  `buyer_id` varchar(191) NOT NULL,
  `address_id` varchar(191) NOT NULL,
  `status` varchar(191) DEFAULT NULL,
  `total` decimal(10,2) NOT NULL,
  `service_fee` decimal(10,2) NOT NULL DEFAULT '0.00',
  `buyer_service_fee` decimal(10,2) NOT NULL DEFAULT '0.00',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `order_item`
--

CREATE TABLE `order_item` (
  `id` varchar(191) NOT NULL,
  `order_id` varchar(191) NOT NULL,
  `product_id` varchar(191) NOT NULL,
  `store_id` varchar(191) NOT NULL,
  `quantity` int NOT NULL,
  `price` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payment`
--

CREATE TABLE `payment` (
  `id` varchar(191) NOT NULL,
  `order_id` varchar(191) NOT NULL,
  `transaction_id` varchar(191) NOT NULL,
  `status` varchar(191) DEFAULT NULL,
  `gross_amount` decimal(10,2) NOT NULL,
  `payment_type` varchar(191) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `product`
--

CREATE TABLE `product` (
  `id` varchar(191) NOT NULL,
  `store_id` varchar(191) NOT NULL,
  `name` text NOT NULL,
  `slug` varchar(191) NOT NULL,
  `description` text,
  `price` decimal(10,2) NOT NULL,
  `stock` int NOT NULL,
  `image` text,
  `status` varchar(191) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `session`
--

CREATE TABLE `session` (
  `id` varchar(191) NOT NULL,
  `expires_at` timestamp NOT NULL,
  `token` varchar(191) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `ip_address` text,
  `user_agent` text,
  `user_id` varchar(191) NOT NULL,
  `impersonated_by` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `store`
--

CREATE TABLE `store` (
  `id` varchar(191) NOT NULL,
  `owner_id` varchar(191) NOT NULL,
  `name` text NOT NULL,
  `slug` varchar(191) NOT NULL,
  `area_id` text,
  `description` text,
  `logo` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `system_settings`
--

CREATE TABLE `system_settings` (
  `id` varchar(191) NOT NULL,
  `key` varchar(191) NOT NULL,
  `value` text NOT NULL,
  `description` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `id` varchar(191) NOT NULL,
  `name` text NOT NULL,
  `email` varchar(191) NOT NULL,
  `email_verified` tinyint(1) NOT NULL,
  `image` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `role` varchar(191) DEFAULT 'user',
  `banned` tinyint(1) DEFAULT '0',
  `ban_reason` text,
  `ban_expires` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `verification`
--

CREATE TABLE `verification` (
  `id` varchar(191) NOT NULL,
  `identifier` varchar(191) NOT NULL,
  `value` varchar(191) NOT NULL,
  `expires_at` timestamp NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
  -- Indexes for table `account`
  --
  ALTER TABLE `account`
    ADD PRIMARY KEY (`id`),
    ADD KEY `account_user_id_user_id_fk` (`user_id`);

  --
  -- Indexes for table `address`
  --
  ALTER TABLE `address`
    ADD PRIMARY KEY (`id`),
    ADD KEY `address_user_id_user_id_fk` (`user_id`);

  --
  -- Indexes for table `cart`
  --
  ALTER TABLE `cart`
    ADD PRIMARY KEY (`id`),
    ADD KEY `cart_user_id_user_id_fk` (`user_id`);

  --
  -- Indexes for table `cart_item`
  --
  ALTER TABLE `cart_item`
    ADD PRIMARY KEY (`id`),
    ADD KEY `cart_item_cart_id_cart_id_fk` (`cart_id`),
    ADD KEY `cart_item_product_id_product_id_fk` (`product_id`);

  --
  -- Indexes for table `order`
  --
  ALTER TABLE `order`
    ADD PRIMARY KEY (`id`),
    ADD KEY `order_buyer_id_user_id_fk` (`buyer_id`),
    ADD KEY `order_address_id_address_id_fk` (`address_id`);

  --
  -- Indexes for table `order_item`
  --
  ALTER TABLE `order_item`
    ADD PRIMARY KEY (`id`),
    ADD KEY `order_item_order_id_order_id_fk` (`order_id`),
    ADD KEY `order_item_product_id_product_id_fk` (`product_id`),
    ADD KEY `order_item_store_id_store_id_fk` (`store_id`);

  --
  -- Indexes for table `payment`
  --
  ALTER TABLE `payment`
    ADD PRIMARY KEY (`id`),
    ADD KEY `payment_order_id_order_id_fk` (`order_id`);

  --
  -- Indexes for table `product`
  --
  ALTER TABLE `product`
    ADD PRIMARY KEY (`id`),
    ADD UNIQUE KEY `product_slug_unique` (`slug`),
    ADD KEY `product_store_id_store_id_fk` (`store_id`);

  --
  -- Indexes for table `session`
  --
  ALTER TABLE `session`
    ADD PRIMARY KEY (`id`),
    ADD UNIQUE KEY `session_token_unique` (`token`),
    ADD KEY `session_user_id_user_id_fk` (`user_id`);

  --
  -- Indexes for table `store`
  --
  ALTER TABLE `store`
    ADD PRIMARY KEY (`id`),
    ADD UNIQUE KEY `store_slug_unique` (`slug`),
    ADD KEY `store_owner_id_user_id_fk` (`owner_id`);

  --
  -- Indexes for table `system_settings`
  --
  ALTER TABLE `system_settings`
    ADD PRIMARY KEY (`id`),
    ADD UNIQUE KEY `system_settings_key_unique` (`key`);

  --
  -- Indexes for table `user`
  --
  ALTER TABLE `user`
    ADD PRIMARY KEY (`id`),
    ADD UNIQUE KEY `user_email_unique` (`email`);

  --
  -- Indexes for table `verification`
  --
  ALTER TABLE `verification`
    ADD PRIMARY KEY (`id`);

  --
  -- Constraints for dumped tables
  --

  --
  -- Constraints for table `account`
  --
  ALTER TABLE `account`
    ADD CONSTRAINT `account_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE;

  --
  -- Constraints for table `address`
  --
  ALTER TABLE `address`
    ADD CONSTRAINT `address_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE;

  --
  -- Constraints for table `cart`
  --
  ALTER TABLE `cart`
    ADD CONSTRAINT `cart_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE;

  --
  -- Constraints for table `cart_item`
  --
  ALTER TABLE `cart_item`
    ADD CONSTRAINT `cart_item_cart_id_cart_id_fk` FOREIGN KEY (`cart_id`) REFERENCES `cart` (`id`) ON DELETE CASCADE,
    ADD CONSTRAINT `cart_item_product_id_product_id_fk` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`) ON DELETE CASCADE;

  --
  -- Constraints for table `order`
  --
  ALTER TABLE `order`
    ADD CONSTRAINT `order_address_id_address_id_fk` FOREIGN KEY (`address_id`) REFERENCES `address` (`id`) ON DELETE RESTRICT,
    ADD CONSTRAINT `order_buyer_id_user_id_fk` FOREIGN KEY (`buyer_id`) REFERENCES `user` (`id`) ON DELETE CASCADE;

  --
  -- Constraints for table `order_item`
  --
  ALTER TABLE `order_item`
    ADD CONSTRAINT `order_item_order_id_order_id_fk` FOREIGN KEY (`order_id`) REFERENCES `order` (`id`) ON DELETE CASCADE,
    ADD CONSTRAINT `order_item_product_id_product_id_fk` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`) ON DELETE CASCADE,
    ADD CONSTRAINT `order_item_store_id_store_id_fk` FOREIGN KEY (`store_id`) REFERENCES `store` (`id`) ON DELETE CASCADE;

  --
  -- Constraints for table `payment`
  --
  ALTER TABLE `payment`
    ADD CONSTRAINT `payment_order_id_order_id_fk` FOREIGN KEY (`order_id`) REFERENCES `order` (`id`) ON DELETE CASCADE;

  --
  -- Constraints for table `product`
  --
  ALTER TABLE `product`
    ADD CONSTRAINT `product_store_id_store_id_fk` FOREIGN KEY (`store_id`) REFERENCES `store` (`id`) ON DELETE CASCADE;

  --
  -- Constraints for table `session`
  --
  ALTER TABLE `session`
    ADD CONSTRAINT `session_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE;

  --
  -- Constraints for table `store`
  --
  ALTER TABLE `store`
    ADD CONSTRAINT `store_owner_id_user_id_fk` FOREIGN KEY (`owner_id`) REFERENCES `user` (`id`) ON DELETE CASCADE;
  COMMIT;

  /*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
  /*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
  /*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
