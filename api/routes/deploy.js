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
    const { userId, nomeProduto, dominio, indexHtml, cssFiles } = req.body;

    // Validação de campos obrigatórios
    if (
      ![userId, nomeProduto, dominio, indexHtml].every(
        (v) => v && v.toString().trim() !== ""
      )
    ) {
      return res
        .status(400)
        .json({
          error: "Dados incompletos. Todos os campos são obrigatórios.",
        });
    }

    // Ajustar nome do projeto
    let projectName = `${userId}-${nomeProduto}`
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/--+/g, "-")
      .replace(/^-+|-+$/g, "");
    if (/^[0-9]/.test(projectName)) projectName = "proj-" + projectName;

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
      return res
        .status(projectRes.status)
        .json({ error: "Erro ao criar projeto", details: error });
    }

    const projectData = await projectRes.json();
    const projectId = projectData.id;

    // 2️⃣ Preparar index.html funcional
    let finalHtml = indexHtml;

    // Adicionar <meta charset="UTF-8"> se não existir
    if (!/charset=['"]?utf-8['"]?/i.test(indexHtml)) {
      finalHtml = finalHtml.replace(/<head>/i, `<head><meta charset="UTF-8">`);
    }

    // 3️⃣ Preparar arquivos para deploy
    const files = [{ file: "index.html", data: finalHtml }];

    // Adicionar CSS (espera array de objetos: [{ filename: "style.css", content: "..." }])
    if (Array.isArray(cssFiles)) {
      cssFiles.forEach((css) => {
        if (css.filename && css.content) {
          files.push({
            file: css.filename,
            data: Buffer.from(css.content, "utf-8").toString("base64"),
          });
        }
      });
    }

    // 4️⃣ Deploy para a Vercel
    const deployRes = await fetch(`${VERCEL_API}/v13/deployments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: projectName,
        project: projectId,
        files,
      }),
    });

    if (!deployRes.ok) {
      const error = await deployRes.json();
      return res
        .status(deployRes.status)
        .json({ error: "Erro no deploy", details: error });
    }

    const deployData = await deployRes.json();
    const deployUrl = deployData.url;

    // 5️⃣ Preparar subdomínio pendente
    const subdomain = `${nomeProduto}.${dominio}`;
    const status = "pendente";

    // 6️⃣ Inserir no banco
    connection = await getConnection();
    await connection.query(
      `INSERT INTO projetos 
        (user_id, nome_produto, dominio, projeto_vercel, url, subdominio, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, nomeProduto, dominio, projectId, deployUrl, subdomain, status]
    );
    connection.release();

    return res.json({
      message:
        "Deploy realizado com sucesso! Subdomínio pendente de configuração DNS/SSL.",
      projectId,
      deployUrl,
      subdomain,
      status,
    });
  } catch (err) {
    if (connection) connection.release();
    console.error("Erro geral no deploy:", err);
    return res
      .status(500)
      .json({ error: "Erro ao criar deploy", details: err.message });
  }
});

module.exports = router;
