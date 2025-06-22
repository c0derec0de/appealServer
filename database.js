import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'appeals_db',
  password: process.env.DB_PASSWORD || 'adminqwe',
  port: process.env.DB_PORT || 5432,
});

export async function initializeDatabase() {
    try {
  
      await pool.query(`
        CREATE TABLE IF NOT EXISTS appeals (
          id SERIAL PRIMARY KEY,
          topic TEXT NOT NULL,
          message TEXT NOT NULL,
          status TEXT NOT NULL,
          init_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          update_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
  
      await pool.query(`
        CREATE TABLE IF NOT EXISTS appeal_responses (
          id SERIAL PRIMARY KEY,
          appeal_id INTEGER REFERENCES appeals(id) ON DELETE CASCADE,
          response_message TEXT NOT NULL,
          date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
  
      console.log('Таблицы appeals и appeal_responses созданы успешно');
    } catch (err) {
      console.error('Ошибка при создании таблиц:', err);
      throw err;
    }
  }

export { pool };