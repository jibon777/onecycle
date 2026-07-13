CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(50) NOT NULL
);

-- Insert user dummy untuk testing login (user: admin, pass: admin123)
INSERT INTO users (username, password) 
VALUES ('admin', 'admin123')
ON CONFLICT (username) DO NOTHING;
