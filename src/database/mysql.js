import mysql from "mysql2/promise";

let pool;

export async function connectDatabase() {
  pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "revealscope",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  await pool.query("SELECT 1");
  console.log("Connecté à la base MySQL");
}

export function getPool() {
  if (!pool) {
    throw new Error("Pool de base de données non initialisé");
  }
  return pool;
}
