const { initializeDatabase } = require('../config/database');

async function initializeDB() {
    try {
        console.log('Initializing database...');
        await initializeDatabase();
        console.log('Database initialized successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
}

initializeDB();