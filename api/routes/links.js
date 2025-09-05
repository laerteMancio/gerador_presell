const express = require("express");
const { getConnection, autenticar } = require("./utils.js");

const router = express.Router();

router.get("/", autenticar, async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const [rows] = await conn.execute(
      "SELECT id, dominio, nome_pagina, link_afiliado, url_final, criado_em FROM presell_links WHERE usuario_id = ? ORDER BY criado_em DESC",
      [req.usuario.id]
    );
    if (conn) await conn.release();
    res.json({ links: rows });
  } catch (err) {
    if (conn) await conn.release();
    console.error("Erro ao buscar links:", err);
    res.status(500).json({ message: "Erro ao buscar links" });
  }
});

module.exports = router;
