const express = require("express");
const fetch = require("node-fetch");
const { getConnection } = require("./utils.js");

const router = express.Router();
const VERCEL_API = "https://api.vercel.com";
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;

router.post("/deploy", async (req, res) => {
  let connection;
  try {
    const { userId, nomeProduto, dominio, indexHtml, cssFiles } = req.body;

    if (
      ![userId, nomeProduto, dominio, indexHtml].every(
        (v) => v && v.toString().trim() !== ""
      )
    ) {
      return res.status(400).json({ error: "Dados incompletos" });
    }

    if (!VERCEL_TOKEN)
      return res.status(500).json({ error: "Token Vercel não configurado" });

    // Projeto único com timestamp
    // Nome do projeto sem timestamp
    let projectName = `${userId}-${nomeProduto}`
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/--+/g, "-")
      .replace(/^-+|-+$/g, "");

    // Se começar com número, adiciona prefixo "proj-"
    if (/^[0-9]/.test(projectName)) projectName = "proj-" + projectName;

    // Criar projeto
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
      return res
        .status(projectRes.status)
        .json({ error: "Erro ao criar projeto", details: error });
    }

    const projectData = await projectRes.json();
    const projectId = projectData.id;

    // Preparar arquivos
    const files = [
      {
        file: "index.html",
        data: Buffer.from(indexHtml, "utf-8").toString("base64"),
        encoding: "base64",
      },
    ];

    if (Array.isArray(cssFiles)) {
      cssFiles.forEach((css) => {
        if (css.filename && css.content) {
          files.push({
            file: css.filename,
            data: Buffer.from(css.content, "utf-8").toString("base64"),
            encoding: "base64",
          });
        }
      });
    }

    // Deploy
    const deployRes = await fetch(`${VERCEL_API}/v13/deployments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: projectName, project: projectId, files }),
    });

    if (!deployRes.ok) {
      const error = await deployRes.json();
      return res
        .status(deployRes.status)
        .json({ error: "Erro no deploy", details: error });
    }

    const deployData = await deployRes.json();
    const deployUrl = deployData.url;
    const subdomain = `${nomeProduto}.${dominio}`;
    const status = "pendente";

    // Inserir no banco
    connection = await getConnection();
    await connection.query(
      `INSERT INTO projetos (user_id,nome_produto,dominio,projeto_vercel,url,subdominio,status) VALUES (?,?,?,?,?,?,?)`,
      [userId, nomeProduto, dominio, projectId, deployUrl, subdomain, status]
    );
    connection.release();

    return res.json({
      message: "Deploy realizado com sucesso",
      projectId,
      deployUrl,
      subdomain,
      status,
    });
  } catch (err) {
    if (connection) connection.release();
    console.error(err);
    return res
      .status(500)
      .json({ error: "Erro ao criar deploy", details: err.message });
  }
});

module.exports = router;
