const express = require("express");
const router = express.Router();
const db = require("../../olddb");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Variável secreta
const JWT_SECRET = process.env.SECRET_KEY || "minha_chave_secreta";

// GET - listar usuários
router.get("/usuarios", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, nome, data_nasc, cpf, sexo, email, telefone FROM usuarios"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar usuários" });
  }
});

// GET - listar usuarios por id
router.get("/usuarios-id", async (req, res) => {
  const { usuarioId } = req.query;
  if (!usuarioId) return res.status(400).json({ error: "usuarioId é obrigatório" });

  try {
    const [rows] = await db.query(
      "SELECT id, nome, data_nasc, cpf, sexo, email, telefone FROM usuarios WHERE id = ?",
      [usuarioId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar usuarios por id" });
  }
});

// POST - criar usuário
router.post("/usuarios", async (req, res) => {
  const { nome, email, senha } = req.body;
  if (!nome || !email || !senha) return res.status(400).json({ error: "Todos os campos são obrigatórios" });

  try {
    const hash = await bcrypt.hash(senha, 10);
    const [result] = await db.query(
      "INSERT INTO usuarios (nome, email, senha_hash, role) VALUES (?, ?, ?, ?)",
      [nome, email, hash, "user"]
    );
    res.json({ id: result.insertId, nome, email });
  } catch (err) {
    res.status(500).json({ error: "Erro ao inserir usuário" });
  }
});

// PATCH /usuarios/:id/dados-pessoais
router.patch("/:id/dados-pessoais", async (req, res) => {
  const { id } = req.params;
  const dadosAtualizados = req.body;
  const camposPermitidos = ["nome", "data_nasc", "cpf", "sexo", "telefone"];
  const campos = Object.keys(dadosAtualizados).filter(c => camposPermitidos.includes(c));

  if (campos.length === 0) return res.status(400).json({ mensagem: "Nenhum dado para atualizar." });

  const sets = campos.map(c => `${c} = ?`).join(", ");
  const valores = campos.map(c => dadosAtualizados[c]);

  try {
    const [resultado] = await db.query(`UPDATE usuarios SET ${sets} WHERE id = ?`, [...valores, id]);
    if (resultado.affectedRows === 0) return res.status(404).json({ mensagem: "Usuário não encontrado." });
    res.json({ mensagem: "Dados pessoais atualizados com sucesso." });
  } catch (err) {
    console.error("Erro ao atualizar dados pessoais:", err);
    res.status(500).json({ mensagem: "Erro no servidor." });
  }
});

// PATCH /usuarios/:id/email
router.patch("/:id/email", async (req, res) => {
  const { id } = req.params;
  const { email } = req.body;
  if (!email) return res.status(400).json({ mensagem: "Email não fornecido." });

  try {
    const [resultado] = await db.query("UPDATE usuarios SET email = ? WHERE id = ?", [email, id]);
    if (resultado.affectedRows === 0) return res.status(404).json({ mensagem: "Usuário não encontrado." });
    res.json({ mensagem: "Email atualizado com sucesso." });
  } catch (err) {
    console.error("Erro ao atualizar email:", err);
    res.status(500).json({ mensagem: "Erro no servidor." });
  }
});

// PATCH /usuarios/:id/senha
router.patch("/:id/senha", async (req, res) => {
  const { id } = req.params;
  const { senhaAtual, novaSenha, confirmarNovaSenha } = req.body;

  if (!senhaAtual || !novaSenha || !confirmarNovaSenha) {
    return res.status(400).json({ mensagem: "Todos os campos de senha são obrigatórios." });
  }
  if (novaSenha !== confirmarNovaSenha) return res.status(400).json({ mensagem: "As senhas não coincidem." });

  try {
    const [resultado] = await db.query("SELECT senha_hash FROM usuarios WHERE id = ?", [id]);
    if (resultado.length === 0) return res.status(404).json({ mensagem: "Usuário não encontrado." });

    const usuario = resultado[0];
    const senhaValida = await bcrypt.compare(senhaAtual, usuario.senha_hash);
    if (!senhaValida) return res.status(401).json({ mensagem: "Senha atual incorreta." });

    const senhaHash = await bcrypt.hash(novaSenha, 10);
    const [updateResultado] = await db.query("UPDATE usuarios SET senha_hash = ? WHERE id = ?", [senhaHash, id]);
    if (updateResultado.affectedRows === 0) return res.status(500).json({ mensagem: "Erro ao atualizar senha." });

    res.json({ mensagem: "Senha atualizada com sucesso." });
  } catch (err) {
    console.error("Erro ao atualizar senha:", err);
    res.status(500).json({ mensagem: "Erro no servidor." });
  }
});

// POST /login
router.post("/login", async (req, res) => {
  const { email, senha } = req.body;
  try {
    const [rows] = await db.query("SELECT * FROM usuarios WHERE email = ?", [email]);
    if (rows.length === 0) return res.status(401).json({ error: "Usuário não encontrado" });

    const usuario = rows[0];
    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaValida) return res.status(401).json({ error: "Senha incorreta" });

    const token = jwt.sign({ id: usuario.id, nome: usuario.nome, email: usuario.email }, JWT_SECRET, { expiresIn: "1h" });
    res.cookie("token", token, { httpOnly: true, secure: true, sameSite: "None", maxAge: 3600000 });
    res.json({ mensagem: "Login realizado com sucesso", usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email } });
  } catch (err) {
    console.error("Erro ao fazer login:", err);
    res.status(500).json({ error: "Erro no servidor" });
  }
});

// GET - verificar usuário logado
router.get("/usuario-logado", (req, res) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: "Não autenticado" });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    res.json({ id: payload.id, nome: payload.nome });
  } catch (err) {
    res.status(401).json({ error: "Token inválido ou expirado" });
  }
});

// GET /logout
router.get("/logout", (req, res) => {
  res.clearCookie("token", { httpOnly: true, secure: false, sameSite: "Strict" });
  res.json({ mensagem: "Logout realizado com sucesso" });
});

module.exports = router;
