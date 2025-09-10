// routes/deploy.js
const express = require("express");
const fetch = require("node-fetch"); // npm install node-fetch@2
const { getConnection } = require("./utils.js");

const router = express.Router();
const VERCEL_API = "https://api.vercel.com";
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;

router.post("/deploy", async (req, res) => {
  let connection;
  try {
    const { userId, nomeProduto, dominio, indexHtml } = req.body;

    // Validação de campos obrigatórios
    if (![userId, nomeProduto, dominio, indexHtml].every(v => v && v.toString().trim() !== "")) {
      return res.status(400).json({ error: "Dados incompletos. Todos os campos são obrigatórios." });
    }

    // Ajustar nome do projeto
    let projectName = `${userId}-${nomeProduto}`
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/--+/g, "-")
      .replace(/^-+|-+$/g, "");
    if (/^[0-9]/.test(projectName)) projectName = "proj-" + projectName;

    console.log("Nome final do projeto:", projectName);

    // 1️⃣ Criar projeto na Vercel
    const projectRes = await fetch(`${VERCEL_API}/v9/projects`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: projectName }),
    });

    if (!projectRes.ok) {
      const error = await projectRes.json();
      return res.status(projectRes.status).json({ error: "Erro ao criar projeto", details: error });
    }
    const projectData = await projectRes.json();
    const projectId = projectData.id;

    // 2️⃣ Deploy do index.html
    const deployRes = await fetch(`${VERCEL_API}/v13/deployments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: projectName,
        project: projectId,
        files: [{ file: "index.html", data: Buffer.from(indexHtml).toString("base64") }],
      }),
    });

    if (!deployRes.ok) {
      const error = await deployRes.json();
      return res.status(deployRes.status).json({ error: "Erro no deploy", details: error });
    }

    const deployData = await deployRes.json();
    const deployUrl = deployData.url;

    // 3️⃣ Preparar subdomínio pendente
    const subdomain = `${nomeProduto}.${dominio}`;
    const status = "pendente"; // subdomínio ainda não configurado/SSL

    // 4️⃣ Inserir no banco
    connection = await getConnection();
    await connection.query(
      `INSERT INTO projetos 
        (user_id, nome_produto, dominio, projeto_vercel, url, subdominio, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, nomeProduto, dominio, projectId, deployUrl, subdomain, status]
    );
    connection.release();

    return res.json({
      message: "Deploy realizado com sucesso! Subdomínio pendente de configuração DNS/SSL.",
      projectId,
      deployUrl,
      subdomain,
      status,
    });

  } catch (err) {
    if (connection) connection.release();
    console.error("Erro geral no deploy:", err);
    return res.status(500).json({ error: "Erro ao criar deploy", details: err.message });
  }
});

module.exports = router;
