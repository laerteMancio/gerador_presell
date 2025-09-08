// routes/deploy.js
const express = require("express");
const { getConnection, JWT_SECRET } = require("./utils.js");

const router = express.Router();

const VERCEL_API = "https://api.vercel.com";
const VERCEL_TOKEN = process.env.VERCEL_TOKEN; // gere em https://vercel.com/account/tokens

router.post("/deploy", async (req, res) => {
  try {
    const { userId, nomeProduto, dominio, indexHtml } = req.body;

    if (!userId || !nomeProduto || !dominio || !indexHtml) {
      return res.status(400).json({ error: "Dados incompletos." });
    }

    const projectName = `${userId}-${nomeProduto}-${dominio}`.toLowerCase();

    // 1️⃣ Criar projeto na Vercel
    const projectRes = await fetch(`${VERCEL_API}/v9/projects`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: projectName,
      }),
    });

    if (!projectRes.ok) {
      const error = await projectRes.json();
      throw new Error(`Erro ao criar projeto: ${JSON.stringify(error)}`);
    }

    const projectData = await projectRes.json();
    const projectId = projectData.id;

    // 2️⃣ Fazer deploy do index.html
    const deployRes = await fetch(`${VERCEL_API}/v13/deployments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: projectName,
        files: [
          {
            file: "index.html",
            data: Buffer.from(indexHtml).toString("base64"), // precisa enviar como base64
          },
        ],
        project: projectId,
      }),
    });

    if (!deployRes.ok) {
      const error = await deployRes.json();
      throw new Error(`Erro no deploy: ${JSON.stringify(error)}`);
    }

    const deployData = await deployRes.json();
    const deployUrl = deployData.url;

    // 3️⃣ Criar subdomínio
    const aliasRes = await fetch(`${VERCEL_API}/v2/domains/${dominio}/aliases`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        alias: `${nomeProduto}.${dominio}`,
        deploymentId: deployData.id,
      }),
    });

    if (!aliasRes.ok) {
      const error = await aliasRes.json();
      throw new Error(`Erro ao criar alias: ${JSON.stringify(error)}`);
    }

    const aliasData = await aliasRes.json();
    const subdomain = aliasData.alias;

    // 4️⃣ Inserir no banco
    await getConnection.query(
      "INSERT INTO projetos (user_id, nome_produto, dominio, projeto_vercel, url, subdominio) VALUES (?, ?, ?, ?, ?, ?)",
      [userId, nomeProduto, dominio, projectId, deployUrl, subdomain]
    );

    return res.json({
      message: "Deploy realizado com sucesso!",
      projectId,
      deployUrl,
      subdomain,
    });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ error: "Erro ao criar deploy", details: err.message });
  }
});

module.exports = router;
