const express = require("express");
const fetch = require("node-fetch");
const router = express.Router();

router.post("/translate", async (req, res) => {
  // Permitir CORS para qualquer frontend (ou colocar seu domínio específico)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();

  const { q, target } = req.body;
  if (!q || !target)
    return res.status(400).json({ error: "Parâmetros 'q' e 'target' são obrigatórios." });

  try {
    const response = await fetch("https://libretranslate.de/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q, source: "pt", target, format: "text" }),
    });

    const data = await response.json();
    res.json(data); // retorna { translatedText: "..." }
  } catch (err) {
    console.error("Erro ao traduzir:", err);
    res.status(500).json({ error: "Falha ao traduzir texto." });
  }
});

module.exports = router;
