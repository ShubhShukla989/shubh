-- ePaper CMS MySQL Schema

CREATE DATABASE IF NOT EXISTS epaper_cms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE epaper_cms;

-- Users
CREATE TABLE users (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    email       VARCHAR(255) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    role        ENUM('superadmin','admin','editor','viewer') DEFAULT 'viewer',
    otp         VARCHAR(10) DEFAULT NULL,
    otp_expires DATETIME DEFAULT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories
CREATE TABLE categories (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    alias       VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    sort_order  INT DEFAULT 0,
    is_active   TINYINT(1) DEFAULT 1,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Editions
CREATE TABLE editions (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    title        VARCHAR(255) NOT NULL,
    category_id  INT,
    pdf_path     VARCHAR(500),
    publish_date DATE,
    status       ENUM('draft','published','archived') DEFAULT 'draft',
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Edition Pages
CREATE TABLE edition_pages (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    edition_id   INT NOT NULL,
    page_number  INT NOT NULL,
    image_path   VARCHAR(500),
    thumb_path   VARCHAR(500),
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (edition_id) REFERENCES editions(id) ON DELETE CASCADE
);

-- Area Maps
CREATE TABLE area_maps (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    edition_id   INT NOT NULL,
    page_id      INT,
    title        VARCHAR(255),
    image_path   VARCHAR(500),
    watermark_path VARCHAR(500),
    coords       JSON,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (edition_id) REFERENCES editions(id) ON DELETE CASCADE
);

-- Clips
CREATE TABLE clips (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    area_map_id  INT,
    title        VARCHAR(255),
    image_path   VARCHAR(500),
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (area_map_id) REFERENCES area_maps(id) ON DELETE SET NULL
);

-- Media
CREATE TABLE media (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    filename     VARCHAR(255) NOT NULL,
    path         VARCHAR(500) NOT NULL,
    mime_type    VARCHAR(100),
    size         INT,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Media Tags
CREATE TABLE media_tags (
    id    INT AUTO_INCREMENT PRIMARY KEY,
    name  VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE media_tag_map (
    media_id INT,
    tag_id   INT,
    PRIMARY KEY (media_id, tag_id),
    FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id)   REFERENCES media_tags(id) ON DELETE CASCADE
);

-- Menus
CREATE TABLE menus (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(255) NOT NULL,
    alias      VARCHAR(255) NOT NULL UNIQUE,
    location   VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE menu_items (
    id        INT AUTO_INCREMENT PRIMARY KEY,
    menu_id   INT NOT NULL,
    parent_id INT DEFAULT NULL,
    label     VARCHAR(255) NOT NULL,
    url       VARCHAR(500),
    sort_order INT DEFAULT 0,
    FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE
);

-- Static Pages
CREATE TABLE pages (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    title      VARCHAR(255) NOT NULL,
    alias      VARCHAR(255) NOT NULL UNIQUE,
    content    LONGTEXT,
    meta_title VARCHAR(255),
    meta_desc  TEXT,
    is_active  TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sliders
CREATE TABLE sliders (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(255) NOT NULL,
    alias      VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE slider_slides (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    slider_id  INT NOT NULL,
    image_path VARCHAR(500),
    title      VARCHAR(255),
    url        VARCHAR(500),
    sort_order INT DEFAULT 0,
    FOREIGN KEY (slider_id) REFERENCES sliders(id) ON DELETE CASCADE
);

-- Settings
CREATE TABLE settings (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    key_name   VARCHAR(100) NOT NULL UNIQUE,
    value      TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Epaper Categories
CREATE TABLE epaper_categories (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(255) NOT NULL,
    alias      VARCHAR(255) NOT NULL UNIQUE,
    sort_order INT DEFAULT 0,
    is_active  TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Featured
CREATE TABLE featured_editions (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    edition_id INT NOT NULL,
    sort_order INT DEFAULT 0,
    FOREIGN KEY (edition_id) REFERENCES editions(id) ON DELETE CASCADE
);

CREATE TABLE featured_categories (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    sort_order  INT DEFAULT 0,
    FOREIGN KEY (category_id) REFERENCES epaper_categories(id) ON DELETE CASCADE
);

-- Analytics
CREATE TABLE analytics (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    page       VARCHAR(500),
    ip         VARCHAR(50),
    user_agent TEXT,
    visited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Permissions
CREATE TABLE permissions (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    role       VARCHAR(50) NOT NULL,
    resource   VARCHAR(100) NOT NULL,
    can_view   TINYINT(1) DEFAULT 0,
    can_create TINYINT(1) DEFAULT 0,
    can_edit   TINYINT(1) DEFAULT 0,
    can_delete TINYINT(1) DEFAULT 0
);
