-- Platter Database Schema (MySQL 8.0)
CREATE DATABASE IF NOT EXISTS platter CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE platter;

-- Drop existing tables in reverse dependency order
DROP TABLE IF EXISTS collection_items;
DROP TABLE IF EXISTS collections;
DROP TABLE IF EXISTS view_history;
DROP TABLE IF EXISTS user_favorites;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS recipe_instructions;
DROP TABLE IF EXISTS recipe_ingredients;
DROP TABLE IF EXISTS recipes;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS settings;

-- 1. Users Table
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'contributor', 'explorer') NOT NULL DEFAULT 'explorer',
    bio TEXT,
    avatar VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_email (email),
    INDEX idx_user_role (role)
) ENGINE=InnoDB;

-- 2. System Settings Table
CREATE TABLE settings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    site_name VARCHAR(100) NOT NULL DEFAULT 'Platter',
    require_approval BOOLEAN NOT NULL DEFAULT TRUE,
    allow_reviews BOOLEAN NOT NULL DEFAULT TRUE,
    max_ingredients INT NOT NULL DEFAULT 25,
    maintenance_mode BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. Recipes Table
CREATE TABLE recipes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    cuisine VARCHAR(50) NOT NULL,
    diet VARCHAR(50) NOT NULL,
    prep_time INT NOT NULL DEFAULT 15,
    cook_time INT NOT NULL DEFAULT 20,
    total_time INT NOT NULL DEFAULT 35,
    servings INT NOT NULL DEFAULT 4,
    photo_url VARCHAR(500),
    author_id BIGINT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    average_rating DECIMAL(3, 1) NOT NULL DEFAULT 0.0,
    review_count INT NOT NULL DEFAULT 0,
    view_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_recipe_status (status),
    INDEX idx_recipe_cuisine (cuisine),
    INDEX idx_recipe_diet (diet),
    INDEX idx_recipe_rating (average_rating),
    INDEX idx_recipe_views (view_count),
    INDEX idx_recipe_author (author_id)
) ENGINE=InnoDB;

-- 4. Recipe Ingredients Table
CREATE TABLE recipe_ingredients (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    recipe_id BIGINT NOT NULL,
    ingredient VARCHAR(255) NOT NULL,
    item_order INT NOT NULL DEFAULT 0,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    INDEX idx_recipe_ing (recipe_id)
) ENGINE=InnoDB;

-- 5. Recipe Instructions Table
CREATE TABLE recipe_instructions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    recipe_id BIGINT NOT NULL,
    step_instruction TEXT NOT NULL,
    step_number INT NOT NULL DEFAULT 1,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    INDEX idx_recipe_inst (recipe_id)
) ENGINE=InnoDB;

-- 6. Reviews Table
CREATE TABLE reviews (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    recipe_id BIGINT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_recipe_review (user_id, recipe_id),
    INDEX idx_review_recipe (recipe_id),
    INDEX idx_review_user (user_id)
) ENGINE=InnoDB;

-- 7. Messages Table
CREATE TABLE messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sender_id BIGINT NOT NULL,
    recipient_id BIGINT NOT NULL,
    recipe_id BIGINT,
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE SET NULL,
    INDEX idx_msg_sender (sender_id),
    INDEX idx_msg_recipient (recipient_id)
) ENGINE=InnoDB;

-- 8. Collections Table
CREATE TABLE collections (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_col_user (user_id)
) ENGINE=InnoDB;

-- 9. Collection Items Table
CREATE TABLE collection_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    collection_id BIGINT NOT NULL,
    recipe_id BIGINT NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    UNIQUE KEY uk_collection_recipe (collection_id, recipe_id),
    INDEX idx_col_item (collection_id)
) ENGINE=InnoDB;

-- 10. View History Table
CREATE TABLE view_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    recipe_id BIGINT NOT NULL,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_recipe_view (user_id, recipe_id),
    INDEX idx_history_user (user_id, viewed_at)
) ENGINE=InnoDB;

-- 11. User Favorites Table
CREATE TABLE user_favorites (
    user_id BIGINT NOT NULL,
    recipe_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, recipe_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
) ENGINE=InnoDB;
