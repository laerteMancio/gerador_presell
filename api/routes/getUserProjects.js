const express = require("express");
const { getConnection } = require("./utils.js");
const router = express.Router();

// Retorna todos os projetos de um usuário
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;
  if (!userId) return res.status(400).json({ error: "userId não fornecido" });

  let connection;
  try {
    connection = await getConnection();
    const [projects] = await connection.query(
      "SELECT id, nome_produto, dominio, url, subdominio, status FROM projetos WHERE user_id = ?",
      [userId]
    );
    connection.release();
    return res.json(projects);
  } catch (err) {
    if (connection) connection.release();
    console.error(err);
    return res.status(500).json({ error: "Erro ao buscar projetos", details: err.message });
  }
});

module.exports = router;
