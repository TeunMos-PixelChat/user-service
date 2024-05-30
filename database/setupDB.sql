CREATE SCHEMA IF NOT EXISTS user_service;


CREATE TABLE IF NOT EXISTS user_service.users (
  id VARCHAR(255) PRIMARY KEY NOT NULL,
  status VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  nickname VARCHAR(255) NOT NULL,
  picture VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



CREATE TABLE IF NOT EXISTS user_service.users_friends (
  user_id VARCHAR(255) NOT NULL,
  friend_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, friend_id),
  FOREIGN KEY (user_id) REFERENCES user_service.users(id),
  FOREIGN KEY (friend_id) REFERENCES user_service.users(id)
);

CREATE TABLE IF NOT EXISTS user_service.groups (
  id SERIAL PRIMARY KEY NOT NULL,
  name VARCHAR(255) NOT NULL,
  banner_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_service.users_groups (
  user_id VARCHAR(255) NOT NULL,
  group_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, group_id),
  FOREIGN KEY (user_id) REFERENCES user_service.users(id),
  FOREIGN KEY (group_id) REFERENCES user_service.groups(id)
);
