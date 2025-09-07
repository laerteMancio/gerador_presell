// utils.js
const mysql = require("mysql2/promise");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET;

// Pool de conexões
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Pegar conexão do pool
async function getConnection() {
  return pool.getConnection();
}

// Middleware de autenticação
function autenticar(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Token não fornecido" });

  const token = authHeader.split(" ")[1];
  try {
    const usuario = jwt.verify(token, JWT_SECRET);
    req.usuario = usuario;
    next();
  } catch {
    return res.status(401).json({ message: "Token inválido" });
  }
}

// Middleware admin
function apenasAdmin(req, res, next) {
  if (!req.usuario || req.usuario.role !== "admin")
    return res.status(403).json({ message: "Acesso negado" });
  next();
}

module.exports = { getConnection, JWT_SECRET, autenticar, apenasAdmin };
