const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getConnection, JWT_SECRET } = require("./utils.js");

const router = express.Router();

router.post("/", async (req, res) => {
  
  const { email, senha } = req.body;
  if (!email || !senha) return res.status(400).json({ message: "Email e senha são obrigatórios" });

  let conn;
  try {
    conn = await getConnection();
    const [rows] = await conn.execute(
      "SELECT id, nome, email, senha_hash, role FROM usuarios WHERE email = ?",
      [email]
    );

    if (conn) await conn.release();

    if (rows.length === 0) return res.status(401).json({ message: "Usuário não encontrado" });

    const usuario = rows[0];
    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaValida) return res.status(401).json({ message: "Senha incorreta" });

    const token = jwt.sign(
      { id: usuario.id, nome: usuario.nome, role: usuario.role },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ id: usuario.id, nome: usuario.nome, role: usuario.role, token });

  } catch (err) {
    if (conn) await conn.release();
    console.error("Erro no login:", err);
    res.status(500).json({ message: "Erro ao fazer login" });
  }
});

module.exports = router;
