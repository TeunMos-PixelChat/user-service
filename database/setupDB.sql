CREATE SCHEMA IF NOT EXISTS user_service;

CREATE TABLE IF NOT EXISTS user_service.users (
  id VARCHAR(255) PRIMARY KEY,
  status VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_service.users_friends (
  user_id VARCHAR(255),
  friend_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, friend_id),
  FOREIGN KEY (user_id) REFERENCES user_service.users(id),
  FOREIGN KEY (friend_id) REFERENCES user_service.users(id)
);

CREATE TABLE IF NOT EXISTS user_service.groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  banner_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_service.users_groups (
  user_id VARCHAR(255),
  group_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, group_id),
  FOREIGN KEY (user_id) REFERENCES user_service.users(id),
  FOREIGN KEY (group_id) REFERENCES user_service.groups(id)
);