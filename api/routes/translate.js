// routes/translate.js
const express = require("express");
const router = express.Router();
const GoogleTranslate = require("@vitalets/google-translate-api");
const translate = GoogleTranslate.default; // 🔹 versão 9.x precisa do .default


// ---------------- CORS ----------------
const allowedOrigins = [
  "http://localhost:5173",
  "https://frontend-gerenciador-campanhas.vercel.app",
];

router.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") return res.sendStatus(200);

  next();
});

// POST /translate
router.post("/", async (req, res) => {
  const { q, target } = req.body;

  if (!q || !target) {
    return res.status(400).json({ error: "Parâmetros 'q' e 'target' são obrigatórios." });
  }

  try {
    const result = await translate(q, { to: target });
    res.json({ translatedText: result.text });
  } catch (err) {
    console.error("Erro ao traduzir:", err);
    res.status(500).json({
      error: "Falha ao traduzir texto.",
      details: err.message,
    });
  }
});


module.exports = router;
