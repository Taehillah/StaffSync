-- StaffSync GraphSQL Schema (MySQL 8)
-- Enums, tables, helper functions (session-claim based), and procedures to emulate RLS
--
-- Session variables expected per connection (set by your API layer):
--   SET @jwt_user_id = 123;                   -- integer
--   SET @jwt_tier = 'TIER2';                  -- 'TIER1'|'TIER2'|'TIER3'|'TIER4'|'USER'
--   SET @jwt_force_number = '90119292MI';     -- string or NULL
--   SET @jwt_musterings = JSON_ARRAY('P','C2'); -- JSON array for Tier3 scopes
--
-- Notes:
-- - MySQL has no native Row Level Security. We emulate via stored procedures that enforce tier checks.
-- - Use InnoDB and utf8mb4 for reliable FKs and Unicode support.

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=1 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='STRICT_ALL_TABLES,NO_ENGINE_SUBSTITUTION' */;

-- ──────────────────────────────────────────────────────────────────────────────
-- Schema
-- ──────────────────────────────────────────────────────────────────────────────

CREATE DATABASE IF NOT EXISTS staffsync CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE staffsync;

-- Tables
CREATE TABLE IF NOT EXISTS musterings (
  code VARCHAR(16) PRIMARY KEY,
  name VARCHAR(255) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS bases (
  base_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS units (
  unit_id INT AUTO_INCREMENT PRIMARY KEY,
  base_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  CONSTRAINT fk_units_base FOREIGN KEY (base_id) REFERENCES bases(base_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS members (
  member_id INT AUTO_INCREMENT PRIMARY KEY,
  force_number VARCHAR(32) NOT NULL UNIQUE,
  suffix VARCHAR(16),
  rank VARCHAR(32),
  first_name VARCHAR(120),
  middle_names VARCHAR(240),
  surname VARCHAR(120),
  id_number VARCHAR(32),
  mustering_code VARCHAR(16) NOT NULL,
  unit_id INT,
  cell_number VARCHAR(40),
  work_tel VARCHAR(40),
  email VARCHAR(255),
  security_clearance VARCHAR(64),
  post_description VARCHAR(255),
  service_type VARCHAR(64),
  is_deployable TINYINT(1) NOT NULL DEFAULT 0,
  is_area_bound TINYINT(1) NOT NULL DEFAULT 0,
  current_whereabouts VARCHAR(255),
  is_registered_for_studies TINYINT(1) NOT NULL DEFAULT 0,
  readiness_status ENUM('Ready','Pending','Not Ready'),
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_members_mustering FOREIGN KEY (mustering_code) REFERENCES musterings(code)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_members_unit FOREIGN KEY (unit_id) REFERENCES units(unit_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  INDEX idx_members_mustering (mustering_code),
  INDEX idx_members_unit (unit_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  tier ENUM('TIER1','TIER2','TIER3','TIER4','USER') NOT NULL DEFAULT 'USER',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  force_number VARCHAR(32) NULL,
  mustering_code VARCHAR(16) NULL,
  last_login DATETIME(3) NULL,
  CONSTRAINT fk_users_member_force FOREIGN KEY (force_number) REFERENCES members(force_number)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_users_mustering FOREIGN KEY (mustering_code) REFERENCES musterings(code)
    ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_users_tier (tier)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_mustering_access (
  user_id INT NOT NULL,
  mustering_code VARCHAR(16) NOT NULL,
  PRIMARY KEY (user_id, mustering_code),
  CONSTRAINT fk_uma_user FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_uma_mustering FOREIGN KEY (mustering_code) REFERENCES musterings(code)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS password_reset_audit (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  acted_by INT NULL,
  target_user_id INT NOT NULL,
  note VARCHAR(255),
  at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_pra_actor FOREIGN KEY (acted_by) REFERENCES users(user_id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_pra_target FOREIGN KEY (target_user_id) REFERENCES users(user_id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

-- ──────────────────────────────────────────────────────────────────────────────
-- Helper functions (read session variables set by the API layer)
-- ──────────────────────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS get_tier;
DELIMITER $$
CREATE FUNCTION get_tier() RETURNS VARCHAR(10)
  NO SQL
BEGIN
  RETURN IFNULL(@jwt_tier, 'USER');
END$$
DELIMITER ;

DROP FUNCTION IF EXISTS get_user_id;
DELIMITER $$
CREATE FUNCTION get_user_id() RETURNS INT
  NO SQL
BEGIN
  RETURN @jwt_user_id;
END$$
DELIMITER ;

DROP FUNCTION IF EXISTS get_force_number;
DELIMITER $$
CREATE FUNCTION get_force_number() RETURNS VARCHAR(64)
  NO SQL
BEGIN
  RETURN @jwt_force_number;
END$$
DELIMITER ;

DROP FUNCTION IF EXISTS has_mustering;
DELIMITER $$
CREATE FUNCTION has_mustering(code_in VARCHAR(16)) RETURNS TINYINT(1)
  NO SQL
BEGIN
  -- expects @jwt_musterings to be a JSON array, e.g. JSON_ARRAY('P','C2')
  RETURN JSON_CONTAINS(COALESCE(@jwt_musterings, JSON_ARRAY()), JSON_QUOTE(code_in));
END$$
DELIMITER ;

-- ──────────────────────────────────────────────────────────────────────────────
-- Stored procedures to emulate role-based access (R/W paths)
-- ──────────────────────────────────────────────────────────────────────────────

DROP PROCEDURE IF EXISTS sp_members_select_all;
DELIMITER $$
CREATE PROCEDURE sp_members_select_all()
  SQL SECURITY INVOKER
BEGIN
  CASE get_tier()
    WHEN 'TIER1' THEN
      SELECT * FROM members;
    WHEN 'TIER2' THEN
      SELECT * FROM members;
    WHEN 'TIER3' THEN
      SELECT * FROM members m WHERE has_mustering(m.mustering_code);
    WHEN 'USER' THEN
      SELECT * FROM members m WHERE m.force_number = get_force_number();
    ELSE -- TIER4 or unknown
      SELECT * FROM members WHERE 1=0;
  END CASE;
END$$
DELIMITER ;

-- Update limited member fields with tier checks
DROP PROCEDURE IF EXISTS sp_member_update;
DELIMITER $$
CREATE PROCEDURE sp_member_update(
  IN p_member_id INT,
  IN p_email VARCHAR(255),
  IN p_cell VARCHAR(40),
  IN p_work_tel VARCHAR(40),
  IN p_whereabouts VARCHAR(255),
  IN p_post_desc VARCHAR(255),
  IN p_readiness ENUM('Ready','Pending','Not Ready'),
  IN p_is_deployable TINYINT(1)
)
  SQL SECURITY INVOKER
BEGIN
  DECLARE v_mustering VARCHAR(16);
  SELECT mustering_code INTO v_mustering FROM members WHERE member_id = p_member_id FOR UPDATE;

  IF get_tier() = 'TIER1' THEN
    UPDATE members SET email = p_email, cell_number = p_cell, work_tel = p_work_tel,
      current_whereabouts = p_whereabouts, post_description = p_post_desc,
      readiness_status = p_readiness, is_deployable = p_is_deployable
    WHERE member_id = p_member_id;
  ELSEIF get_tier() = 'TIER3' AND has_mustering(v_mustering) THEN
    UPDATE members SET email = p_email, cell_number = p_cell, work_tel = p_work_tel,
      current_whereabouts = p_whereabouts, post_description = p_post_desc,
      readiness_status = p_readiness, is_deployable = p_is_deployable
    WHERE member_id = p_member_id;
  ELSE
    SIGNAL SQLSTATE '42501' SET MESSAGE_TEXT = 'insufficient_privilege';
  END IF;
END$$
DELIMITER ;

-- Create new member with tier checks
DROP PROCEDURE IF EXISTS sp_member_insert;
DELIMITER $$
CREATE PROCEDURE sp_member_insert(
  IN p_force_number VARCHAR(32),
  IN p_first_name VARCHAR(120),
  IN p_surname VARCHAR(120),
  IN p_rank VARCHAR(32),
  IN p_mustering_code VARCHAR(16),
  IN p_unit_id INT,
  IN p_email VARCHAR(255)
)
  SQL SECURITY INVOKER
BEGIN
  IF get_tier() = 'TIER1' OR (get_tier() = 'TIER3' AND has_mustering(p_mustering_code)) THEN
    INSERT INTO members (force_number, first_name, surname, rank, mustering_code, unit_id, email)
    VALUES (p_force_number, p_first_name, p_surname, p_rank, p_mustering_code, p_unit_id, p_email);
  ELSE
    SIGNAL SQLSTATE '42501' SET MESSAGE_TEXT = 'insufficient_privilege';
  END IF;
END$$
DELIMITER ;

-- Delete member (Tier1 only)
DROP PROCEDURE IF EXISTS sp_member_delete;
DELIMITER $$
CREATE PROCEDURE sp_member_delete(IN p_member_id INT)
  SQL SECURITY INVOKER
BEGIN
  IF get_tier() = 'TIER1' THEN
    DELETE FROM members WHERE member_id = p_member_id;
  ELSE
    SIGNAL SQLSTATE '42501' SET MESSAGE_TEXT = 'insufficient_privilege';
  END IF;
END$$
DELIMITER ;

-- Password reset (Tier1 and Tier4)
DROP PROCEDURE IF EXISTS sp_reset_user_password;
DELIMITER $$
CREATE PROCEDURE sp_reset_user_password(IN p_target_user_id INT, IN p_new_password_hash VARCHAR(255))
  SQL SECURITY DEFINER
BEGIN
  IF get_tier() NOT IN ('TIER1','TIER4') THEN
    SIGNAL SQLSTATE '42501' SET MESSAGE_TEXT = 'insufficient_privilege';
  END IF;

  UPDATE users SET password_hash = p_new_password_hash WHERE user_id = p_target_user_id;
  INSERT INTO password_reset_audit(acted_by, target_user_id, note)
  VALUES (get_user_id(), p_target_user_id, 'Password reset via sp_reset_user_password');
END$$
DELIMITER ;

-- Convenience view for Tier2 reporting (no filtering; rely on caller rights)
DROP VIEW IF EXISTS v_members_basic;
CREATE VIEW v_members_basic AS
SELECT member_id, force_number, rank, first_name, surname, mustering_code, unit_id, email, readiness_status
FROM members;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

