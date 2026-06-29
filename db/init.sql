CREATE DATABASE IF NOT EXISTS revealscope CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE revealscope;

CREATE TABLE IF NOT EXISTS rating_sessions (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  guild_id VARCHAR(64) NOT NULL,
  channel_id VARCHAR(64) NOT NULL,
  opened_by VARCHAR(64) NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  questions JSON NOT NULL,
  started_at DATETIME NOT NULL,
  closed_at DATETIME NULL,
  PRIMARY KEY (id),
  INDEX idx_guild_active (guild_id, active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ratings (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  session_id INT UNSIGNED NOT NULL,
  guild_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  author_id VARCHAR(64) NOT NULL,
  score TINYINT UNSIGNED NOT NULL,
  answers JSON NULL,
  created_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  INDEX idx_guild_user (guild_id, user_id),
  INDEX idx_session (session_id),
  FOREIGN KEY (session_id) REFERENCES rating_sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
