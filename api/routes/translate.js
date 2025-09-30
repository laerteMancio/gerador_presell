// routes/translate.js
const express = require("express");
const fetch = require("node-fetch"); // npm install node-fetch@2
const router = express.Router();

// POST /api/translate
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
    res.json(data); // retorna { translatedText: "..." }
  } catch (err) {
    console.error("Erro ao traduzir:", err);
    res.status(500).json({ error: "Falha ao traduzir texto." });
  }
});

module.exports = router;
