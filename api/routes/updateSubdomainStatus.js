// routes/updateSubdomainStatus.js
const express = require("express");
const { getConnection } = require("./utils.js");

const router = express.Router();

/**
 * Atualiza o status do subdomínio para "publicado"
 * Requisição esperada: { subdominio: "teste.meudominio.com" }
 */
router.post("/update-status", async (req, res) => {
  const { subdominio } = req.body;

  if (!subdominio || subdominio.trim() === "") {
    return res.status(400).json({ error: "Subdomínio não fornecido." });
  }

  let connection;
  try {
    connection = await getConnection();

    const [result] = await connection.query(
      "UPDATE projetos SET status = ? WHERE subdominio = ?",
      ["publicado", subdominio]
    );

    connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Subdomínio não encontrado." });
    }

    return res.json({ message: "Status atualizado para publicado com sucesso!" });
  } catch (err) {
    if (connection) connection.release();
    console.error("Erro ao atualizar status do subdomínio:", err);
    return res.status(500).json({ error: "Erro ao atualizar status", details: err.message });
  }
});

module.exports = router;
