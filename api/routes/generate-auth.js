const express = require("express");
const { getConnection, JWT_SECRET, autenticar } = require("./utils.js");

const router = express.Router();

// Criar presell
router.post("/", autenticar, async (req, res) => {
  const {
    dominio,
    nomePagina,
    linkAfiliado,
    titulo,
    subtitulo,
    descricao,
    imagemUrl,
    idioma = "pt",
    promocoes = [],
    reviews = [],
    benefits = null,
  } = req.body;

  if (!nomePagina || !linkAfiliado || !dominio)
    return res.status(400).json({ message: "Campos obrigatórios não preenchidos" });

  let conn;
  try {
    conn = await getConnection();

    // Verifica se já existe página com o mesmo nome
    const [existentes] = await conn.execute(
      "SELECT id FROM presell_links WHERE usuario_id = ? AND nome_pagina = ?",
      [req.usuario.id, nomePagina]
    );

    if (existentes.length > 0) {
      return res.status(400).json({ message: "Você já possui uma página com este nome" });
    }

    const subdominio = nomePagina.toLowerCase().replace(/\s+/g, "-");
    const urlFinal = `https://${subdominio}.${dominio}?keyword={keyword}`;
    const destaque = "Oferta especial!";

    // Inserir nova página
    await conn.execute(
      `INSERT INTO presell_links 
        (usuario_id, dominio, nome_pagina, link_afiliado, url_final, titulo, subtitulo, descricao, idioma, imagem_url, destaque, promocoes, reviews, benefits, criado_em)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        req.usuario.id,
        dominio,
        nomePagina,
        linkAfiliado,
        urlFinal,
        titulo,
        subtitulo,
        descricao,
        idioma,
        imagemUrl,
        destaque,
        JSON.stringify(promocoes),
        JSON.stringify(reviews),
        benefits,
      ]
    );

    res.json({
      finalUrl: urlFinal,
      presell: { titulo, subtitulo, descricao, imagemUrl, promocoes, reviews, benefits, destaque, idioma },
    });
  } catch (err) {
    console.error("Erro ao salvar link:", err);
    res.status(500).json({ message: "Erro ao salvar link" });
  } finally {
    if (conn) await conn.release();
  }
});

module.exports = router;
