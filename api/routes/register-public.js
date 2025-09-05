const express = require("express");
const bcrypt = require("bcryptjs");
const { getConnection } = require("./utils.js");

const router = express.Router();

router.post("/", async (req, res) => {
  const { nome, email, senha } = req.body;
  if (!nome || !email || !senha) return res.status(400).json({ message: "Todos os campos são obrigatórios" });

  let conn;
  try {
    const hash = await bcrypt.hash(senha, 10);
    conn = await getConnection();

    await conn.execute(
      "INSERT INTO usuarios (nome, email, senha_hash, role) VALUES (?, ?, ?, ?)",
      [nome, email, hash, "user"]
    );

    if (conn) await conn.release();
    res.json({ message: "Usuário registrado com sucesso" });

  } catch (err) {
    if (conn) await conn.release();
    console.error("Erro ao registrar usuário:", err);
    res.status(500).json({ message: "Erro ao registrar usuário" });
  }
});

module.exports = router;
