const express = require("express");
const fetch = require("node-fetch");
const router = express.Router();

const VERCEL_API = "https://api.vercel.com";
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;

router.post("/", async (req, res) => {
  const { projectId, subdominio } = req.body;

  if (!projectId || !subdominio) {
    return res.status(400).json({ error: "Parâmetros inválidos" });
  }

  try {
    // 🔍 Buscar domínios já anexados ao projeto
    const resp = await fetch(`${VERCEL_API}/v9/projects/${projectId}/domains`, {
      headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
    });
    const domains = await resp.json();

    const existe = domains?.domains?.some((d) => d.name === subdominio);

    // ➕ Se não existe ainda, adicionar
    if (!existe) {
      await fetch(`${VERCEL_API}/v9/projects/${projectId}/domains`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${VERCEL_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: subdominio }),
      });
    }

    // ✅ Checar configuração
    const checkResp = await fetch(`${VERCEL_API}/v9/projects/${projectId}/domains/${subdominio}`, {
      headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
    });
    const checkData = await checkResp.json();

    return res.json({
      status: checkData.verified ? "ativo" : "pendente",
      invalidConfiguration: checkData.misconfigured || false,
      vercelMessage: checkData.misconfigured
        ? "Invalid Configuration ⚠️"
        : checkData.verified
        ? "Domínio configurado corretamente ✅"
        : "Pendente ⏳",
    });
  } catch (err) {
    console.error("Erro Vercel:", err);
    res.status(500).json({ error: "Falha na verificação de subdomínio" });
  }
});

module.exports = router;
