const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || './data/portfolio.db';
const DATA_DIR = path.dirname(DB_PATH);

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

class Database {
    constructor() {
        this.db = null;
    }

    async connect() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(DB_PATH, (err) => {
                if (err) {
                    console.error('Error opening database:', err);
                    reject(err);
                } else {
                    console.log('Connected to SQLite database');
                    resolve();
                }
            });
        });
    }

    async initializeTables() {
        const queries = [
            // Media table
            `CREATE TABLE IF NOT EXISTS media (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename VARCHAR(255) NOT NULL,
                original_name VARCHAR(255) NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                section VARCHAR(100) NOT NULL,
                media_type VARCHAR(20) NOT NULL,
                file_path VARCHAR(500) NOT NULL,
                file_size INTEGER,
                mime_type VARCHAR(100),
                file_data TEXT,
                upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            // Admin users table
            `CREATE TABLE IF NOT EXISTS admin_users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_login DATETIME
            )`,
            
            // Admin sessions table
            `CREATE TABLE IF NOT EXISTS admin_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                token VARCHAR(255) NOT NULL,
                expires_at DATETIME NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES admin_users (id)
            )`,
            
            // Create indexes
            `CREATE INDEX IF NOT EXISTS idx_media_section ON media(section)`,
            `CREATE INDEX IF NOT EXISTS idx_media_type ON media(media_type)`,
            `CREATE INDEX IF NOT EXISTS idx_sessions_token ON admin_sessions(token)`,
            `CREATE INDEX IF NOT EXISTS idx_sessions_expires ON admin_sessions(expires_at)`
        ];

        for (const query of queries) {
            await this.run(query);
        }
        
        // Add file_data column if it doesn't exist (for existing databases)
        try {
            await this.run(`ALTER TABLE media ADD COLUMN file_data TEXT`);
        } catch (error) {
            // Column already exists, ignore error
            if (!error.message.includes('duplicate column name')) {
                console.error('Error adding file_data column:', error);
            }
        }
        
        // Add supabase_url column for Supabase storage
        try {
            await this.run(`ALTER TABLE media ADD COLUMN supabase_url TEXT`);
        } catch (error) {
            // Column already exists, ignore error
            if (!error.message.includes('duplicate column name')) {
                console.error('Error adding supabase_url column:', error);
            }
        }
    }

    async run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    console.error('Database run error:', err);
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    async get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, result) => {
                if (err) {
                    console.error('Database get error:', err);
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }

    async all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    console.error('Database all error:', err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async close() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        console.error('Error closing database:', err);
                        reject(err);
                    } else {
                        console.log('Database connection closed');
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }
}

// Create global database instance
const database = new Database();

async function initializeDatabase() {
    try {
        await database.connect();
        await database.initializeTables();
        console.log('Database initialized successfully');
        return database;
    } catch (error) {
        console.error('Failed to initialize database:', error);
        throw error;
    }
}

function getDatabase() {
    return database;
}

module.exports = {
    initializeDatabase,
    getDatabase,
    Database
};