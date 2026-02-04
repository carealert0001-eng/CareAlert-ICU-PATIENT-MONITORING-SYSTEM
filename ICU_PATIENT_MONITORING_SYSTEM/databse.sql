-- MySQL schema for carealert
CREATE DATABASE IF NOT EXISTS carealert;
USE carealert;

CREATE TABLE IF NOT EXISTS users (

	id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(256) NOT NULL,
    phone VARCHAR(20),
    specialization VARCHAR(100),
    department VARCHAR(100),
    role ENUM('doctor','patient') NOT NULL
    
);

CREATE TABLE IF NOT EXISTS patients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  device_token VARCHAR(128) NOT NULL UNIQUE,
  doctor_id INT DEFAULT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS readings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  bpm FLOAT NOT NULL,
  spo2 FLOAT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

USE carealert;
DESCRIBE users;
