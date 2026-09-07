-- TadkaPlay MySQL Database Schema
-- Free-to-Play Virtual Coin Sports Prediction Game
--
-- Local: run the full file (creates tadkaplay_db).
-- Production: create the database in your host panel first, then import
-- this file starting from the CREATE TABLE statements (skip the next two lines
-- if your provider does not allow CREATE DATABASE).

CREATE DATABASE IF NOT EXISTS tadkaplay_db;
USE tadkaplay_db;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
    coin_balance BIGINT UNSIGNED NOT NULL DEFAULT 1000000,
  xp INT NOT NULL DEFAULT 0,
  level INT NOT NULL DEFAULT 1,
  win_streak INT NOT NULL DEFAULT 0,
  is_admin TINYINT(1) NOT NULL DEFAULT 0,
    role ENUM('USER', 'MASTER', 'SUPER_MASTER') NOT NULL DEFAULT 'USER',
  is_suspended TINYINT(1) NOT NULL DEFAULT 0,
  avatar VARCHAR(255) DEFAULT 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Matches Table
CREATE TABLE IF NOT EXISTS matches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sport ENUM('cricket', 'football', 'tennis', 'basketball') NOT NULL DEFAULT 'cricket',
  team_a_name VARCHAR(100) NOT NULL,
  team_a_logo VARCHAR(255) NOT NULL,
  team_b_name VARCHAR(100) NOT NULL,
  team_b_logo VARCHAR(255) NOT NULL,
  match_time DATETIME NOT NULL,
  status ENUM('UPCOMING', 'LIVE', 'COMPLETED') NOT NULL DEFAULT 'UPCOMING',
  winner_team VARCHAR(100) DEFAULT NULL,
  score_team_a VARCHAR(100) DEFAULT '0',
  score_team_b VARCHAR(100) DEFAULT '0',
  match_minute VARCHAR(50) DEFAULT '',
  venue VARCHAR(150) DEFAULT 'International Stadium',
  league VARCHAR(150) DEFAULT 'World Championship',
  live_events_json JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Predictions Table
CREATE TABLE IF NOT EXISTS predictions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  match_id INT NOT NULL,
  predicted_team VARCHAR(100) NOT NULL,
  coins_staked INT NOT NULL,
  potential_reward INT NOT NULL,
    outcome ENUM('PENDING', 'WON', 'LOST', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Coin Transactions Table
CREATE TABLE IF NOT EXISTS coin_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  amount INT NOT NULL,
  transaction_type ENUM('REGISTRATION_BONUS', 'DAILY_REWARD', 'STREAK_BONUS', 'PREDICTION_STAKE', 'PREDICTION_WIN', 'ACHIEVEMENT_REWARD', 'ADMIN_ADJUSTMENT') NOT NULL,
  description VARCHAR(255) NOT NULL,
  balance_after INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Achievements Table
CREATE TABLE IF NOT EXISTS achievements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(255) NOT NULL,
  icon VARCHAR(50) NOT NULL,
  coin_reward INT NOT NULL DEFAULT 100,
  xp_reward INT NOT NULL DEFAULT 50
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. User Achievements Table
CREATE TABLE IF NOT EXISTS user_achievements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  achievement_id INT NOT NULL,
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY user_ach_unique (user_id, achievement_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Daily Rewards Table
CREATE TABLE IF NOT EXISTS daily_rewards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  streak_count INT NOT NULL DEFAULT 1,
  last_claimed_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

  -- 8. In-app notifications
  CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type VARCHAR(50) NOT NULL,
    message VARCHAR(255) NOT NULL,
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notifications_user_read (user_id, is_read, created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

  -- 9. Administrative audit trail
  CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    admin_user_id INT NOT NULL,
    admin_role VARCHAR(20) NOT NULL,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50) DEFAULT NULL,
    target_id VARCHAR(100) DEFAULT NULL,
    details JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_audit_created_at (created_at),
    INDEX idx_audit_admin (admin_user_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Indexes for optimal querying
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_sport ON matches(sport);
CREATE INDEX idx_predictions_user ON predictions(user_id);
CREATE INDEX idx_predictions_match ON predictions(match_id);
CREATE INDEX idx_coin_trans_user ON coin_transactions(user_id);
CREATE INDEX idx_predictions_outcome ON predictions(outcome);
