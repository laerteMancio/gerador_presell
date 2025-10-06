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

// GET /clickbank
router.get("/sales", async (req, res) => { 

  const API_NAME = process.env.API_NAME_CLICKBAN; 
  const API_KEY = process.env.API_SECRET_CLICKBANK;  

 try {
    const response = await fetch("https://api.clickbank.com/rest/1.3/reports/sales", {
      headers: {
        "Authorization": "Basic " + Buffer.from(`${API_NAME}:${API_KEY}`).toString("base64"),
        "Accept": "application/json"
      }
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar vendas da ClickBank" });
  }
});


module.exports = router;
