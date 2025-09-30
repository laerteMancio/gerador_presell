// routes/translate.js
const express = require("express");
const fetch = require("node-fetch"); // npm install node-fetch@2
const router = express.Router();

// Middleware para tratar CORS manualmente
router.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*"); // ou coloque o domínio do frontend
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Responder preflight OPTIONS
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// POST /translate
router.post("/", async (req, res) => {
  const { q, target } = req.body;

  if (!q || !target) {
    return res.status(400).json({ error: "Parâmetros 'q' e 'target' são obrigatórios." });
  }

  try {
    const response = await fetch("https://libretranslate.de/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q,
        source: "pt",
        target,
        format: "text",
      }),
    });

    const data = await response.json();
    res.json(data); // { translatedText: "..." }
  } catch (err) {
    console.error("Erro ao traduzir:", err);
    res.status(500).json({ error: "Falha ao traduzir texto." });
  }
});

module.exports = router;
