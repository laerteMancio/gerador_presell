const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getConnection, JWT_SECRET } = require("./utils.js");

const router = express.Router();

router.post("/", async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha)
    return res.status(400).json({ message: "Email e senha são obrigatórios" });

  let conn;
  try {
    conn = await getConnection();

    // 1️⃣ Busca usuário pelo email
    const [rows] = await conn.execute(
      "SELECT id, nome, email, senha_hash, role FROM usuarios WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      if (conn) await conn.release();
      return res.status(401).json({ message: "Usuário não encontrado" });
    }

    const usuario = rows[0];

    // 2️⃣ Valida senha
    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaValida) {
      if (conn) await conn.release();
      return res.status(401).json({ message: "Senha incorreta" });
    }

    // 3️⃣ Gera token JWT
    const token = jwt.sign(
      { id: usuario.id, nome: usuario.nome, role: usuario.role },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    // 4️⃣ Busca projetos do usuário
    // 4️⃣ Busca projetos do usuário
    const [projects] = await conn.execute(
      `SELECT id, nome_produto, dominio, projeto_vercel, url, subdominio, status, created_at
   FROM projetos WHERE user_id = ?`,
      [usuario.id]
    );

    if (conn) await conn.release();

    
    

    // 5️⃣ Retorna usuário + token + projetos
    res.json({
      id: usuario.id,
      nome: usuario.nome,
      role: usuario.role,
      token,
      projects: projects.map((p) => ({
        ...p,
        projeto_vercel: p.projeto_vercel, // ✅ garante que cada projeto tenha o token
      })),
    });
  } catch (err) {
    if (conn) await conn.release();
    console.error("Erro no login:", err);
    res.status(500).json({ message: "Erro ao fazer login" });
  }
});

module.exports = router;
