// db/connection.js — Pool de conexões MySQL com mysql2/promise
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

// Suporte a URL de conexão única (formato Render/Railway/PlanetScale)
// ou variáveis individuais
const poolConfig = process.env.DATABASE_URL
  ? {
      uri: process.env.DATABASE_URL,
      waitForConnections: true,
      connectionLimit: 10,
      ssl: process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : undefined,
    }
  : {
      host    : process.env.DB_HOST     || 'localhost',
      port    : Number(process.env.DB_PORT) || 3306,
      database: process.env.DB_NAME     || 'simec_db',
      user    : process.env.DB_USER     || 'root',
      password: process.env.DB_PASS     || '',
      waitForConnections: true,
      connectionLimit   : 10,
      charset           : 'utf8mb4',
    };

export const pool = mysql.createPool(poolConfig);

// Testar a conexão ao iniciar
export async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log('✅ Banco de dados conectado com sucesso.');
    conn.release();
  } catch (err) {
    console.error('❌ Falha na conexão com o banco:', err.message);
    process.exit(1); // encerra se não conseguir conectar
  }
}
