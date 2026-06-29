CREATE DATABASE IF NOT EXISTS zoho_crm_manufacturing;
USE zoho_crm_manufacturing;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE,
  password VARCHAR(255),
  google_id VARCHAR(100) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  full_name VARCHAR(100),
  photo VARCHAR(255),
  address VARCHAR(255),
  education VARCHAR(255),
  department VARCHAR(100),
  designation VARCHAR(100),
  plant_location VARCHAR(100),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
