const db = require('../config/db');

const updateSchema = async () => {
    try {
        console.log('Adding priority columns to complaints table...');

        await db.query(`ALTER TABLE complaints ADD COLUMN IF NOT EXISTS impact_score FLOAT DEFAULT 0;`);
        await db.query(`ALTER TABLE complaints ADD COLUMN IF NOT EXISTS recurrence_score FLOAT DEFAULT 0;`);
        await db.query(`ALTER TABLE complaints ALTER COLUMN priority_score TYPE FLOAT USING priority_score::FLOAT;`);
        await db.query(`ALTER TABLE complaints ALTER COLUMN priority_score SET DEFAULT 0;`);

        console.log('Schema update completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error updating schema:', error);
        process.exit(1);
    }
};

updateSchema();
