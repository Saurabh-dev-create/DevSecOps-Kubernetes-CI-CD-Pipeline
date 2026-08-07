CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user'
);

INSERT INTO users(username,password,role)
VALUES
('Saurabh','Saurabh123','admin'),
('developer','dev123','developer');
