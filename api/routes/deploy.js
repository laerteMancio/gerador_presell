// routes/deploy.js
const express = require("express");
const { getConnection } = require("./utils.js");

const router = express.Router();
const VERCEL_API = "https://api.vercel.com";
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;

router.post("/deploy", async (req, res) => {
  try {
    const { userId, nomeProduto, dominio, indexHtml } = req.body;

    if (![userId, nomeProduto, dominio, indexHtml].every(v => v && v.toString().trim() !== "")) {
      return res.status(400).json({ error: "Dados incompletos. Todos os campos são obrigatórios." });
    }

    const projectName = `${userId}-${nomeProduto}-${dominio}`.toLowerCase();

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
        files: [
          {
            file: "index.html",
            data: Buffer.from(indexHtml).toString("base64"),
          },
        ],
      }),
    });

    if (!deployRes.ok) {
      const error = await deployRes.json();
      return res.status(deployRes.status).json({ error: "Erro no deploy", details: error });
    }

    const deployData = await deployRes.json();
    const deployUrl = deployData.url;

    // 3️⃣ Criar alias (subdomínio)
    let subdomain = null;
    if (dominio) {
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
        console.warn("Falha ao criar alias, mas deploy ok:", error);
      } else {
        const aliasData = await aliasRes.json();
        subdomain = aliasData.alias;
      }
    }

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
    console.error(err);
    return res.status(500).json({ error: "Erro ao criar deploy", details: err.message });
  }
});

module.exports = router;
