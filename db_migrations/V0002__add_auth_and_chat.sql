-- Add image_url column to articles
ALTER TABLE t_p18143168_police_reminder_app.articles 
ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);

-- Create bookmarks table
CREATE TABLE IF NOT EXISTS t_p18143168_police_reminder_app.bookmarks (
    user_id INTEGER REFERENCES t_p18143168_police_reminder_app.users(id),
    article_id INTEGER REFERENCES t_p18143168_police_reminder_app.articles(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, article_id)
);

-- Create chat messages table
CREATE TABLE IF NOT EXISTS t_p18143168_police_reminder_app.chat_messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES t_p18143168_police_reminder_app.users(id),
    username VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);