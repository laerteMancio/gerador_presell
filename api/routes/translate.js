// routes/translate.js
const express = require("express");
const fetch = require("node-fetch"); // npm install node-fetch@2
const router = express.Router();

// ---------------- CORS ----------------
// Permitir frontend local e remoto
const allowedOrigins = [
  "http://localhost:5173", // frontend local
  "https://frontend-gerenciador-campanhas.vercel.app", // frontend remoto adicionado
];

// Middleware CORS
router.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // Responder preflight
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

// POST /translate
router.post("/", async (req, res) => {
  const { q, target } = req.body;

  if (!q || !target) {
    return res
      .status(400)
      .json({ error: "Parâmetros 'q' e 'target' são obrigatórios." });
  }

  try {
    // Endpoint oficial do LibreTranslate
    const response = await fetch("https://libretranslate.com/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q,
        source: "pt",
        target,
        format: "text",
      }),
    });

    // Verifica se a resposta HTTP é OK
    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({
        error: `Erro na API de tradução: ${response.status}`,
        details: text,
      });
    }

    // Converte o JSON retornado
    const data = await response.json();

    // Retorna a tradução
    res.json(data); // { translatedText: "..." }
  } catch (err) {
    console.error("Erro ao traduzir:", err);

    // Resposta amigável caso a API pública não esteja acessível
    res.status(500).json({
      error:
        "Falha ao traduzir texto. A API de tradução pode estar indisponível.",
      details: err.message,
    });
  }
});

module.exports = router;
