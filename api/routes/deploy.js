const express = require("express");
const fetch = require("node-fetch");
const { getConnection } = require("./utils.js");

const router = express.Router();
const VERCEL_API = "https://api.vercel.com";
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;

router.post("/deploy", async (req, res) => {
  let connection;
  try {
    let { userId, nomeProduto, dominio, indexHtml, cssFiles } = req.body;

    if (![userId, nomeProduto, dominio, indexHtml].every(v => v && v.toString().trim() !== "")) {
      return res.status(400).json({ error: "Dados incompletos" });
    }

    if (!VERCEL_TOKEN) return res.status(500).json({ error: "Token Vercel não configurado" });

    // --- Sanitizar nomeProduto ---
    nomeProduto = nomeProduto
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")   // caracteres inválidos por "-"
      .replace(/--+/g, "-")          // remove duplicação de "-"
      .replace(/^-+|-+$/g, "");      // remove "-" no início/fim

    // --- Sanitizar domínio preservando pontos ---
    const cleanDomain = dominio
      .trim()
      .toLowerCase()
      .split('.')                     // separar por pontos
      .map(part => part.replace(/[^a-z0-9-]/g, "-")) // sanitizar cada parte
      .join('.');                     // juntar de volta com pontos

    const subdomain = `${nomeProduto}.${cleanDomain}`;

    // Projeto único com userId
    let projectName = `${userId}-${nomeProduto}`;

    // Se começar com número, adiciona prefixo "proj-"
    if (/^[0-9]/.test(projectName)) projectName = "proj-" + projectName;

    // --- Criar projeto na Vercel ---
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

    // --- Preparar arquivos ---
    const files = [
      {
        file: "index.html",
        data: Buffer.from(indexHtml, "utf-8").toString("base64"),
        encoding: "base64",
      },
    ];

    if (Array.isArray(cssFiles)) {
      cssFiles.forEach(css => {
        if (css.filename && css.content) {
          files.push({
            file: css.filename,
            data: Buffer.from(css.content, "utf-8").toString("base64"),
            encoding: "base64",
          });
        }
      });
    }

    // --- Deploy ---
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
      return res.status(deployRes.status).json({ error: "Erro no deploy", details: error });
    }

    const deployData = await deployRes.json();
    const deployUrl = deployData.url;

    // --- Inserir no banco ---
    connection = await getConnection();
    await connection.query(
      `INSERT INTO projetos (user_id,nome_produto,dominio,projeto_vercel,url,subdominio,status) VALUES (?,?,?,?,?,?,?)`,
      [userId, nomeProduto, dominio, projectId, deployUrl, subdomain, "pendente"]
    );
    connection.release();

    return res.json({
      message: "Deploy realizado com sucesso",
      projectId,
      deployUrl,
      subdomain,
      status: "pendente",
    });
  } catch (err) {
    if (connection) connection.release();
    console.error(err);
    return res.status(500).json({ error: "Erro ao criar deploy", details: err.message });
  }
});



// Rota para excluir projetos
router.post("/delete", async (req, res) => {
  let connection;
  try {
    const { projetoId, userId } = req.body;

    if (!projetoId || !userId) {
      return res.status(400).json({ error: "Dados incompletos" });
    }

    if (!VERCEL_TOKEN) {
      return res.status(500).json({ error: "Token Vercel não configurado" });
    }

    // 1. Buscar projeto no banco
    connection = await getConnection();
    const [rows] = await connection.query(
      `SELECT * FROM projetos WHERE id = ? AND user_id = ?`,
      [projetoId, userId]
    );

    if (!rows.length) {
      connection.release();
      return res.status(404).json({ error: "Projeto não encontrado" });
    }

    const projeto = rows[0];
    const projectIdVercel = projeto.projeto_vercel;

    // 2. Excluir projeto na Vercel
    const deleteRes = await fetch(
      `${VERCEL_API}/v9/projects/${projectIdVercel}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
      }
    );

    if (!deleteRes.ok && deleteRes.status !== 404) {
      const error = await deleteRes.json();
      connection.release();
      return res
        .status(deleteRes.status)
        .json({ error: "Erro ao excluir projeto na Vercel", details: error });
    }

    // 3. Registrar log de exclusão
    await connection.query(
      `INSERT INTO projetos_exclusoes 
       (projeto_id, projeto_vercel, user_id, nome_produto, dominio) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        projeto.id,
        projeto.projeto_vercel,
        userId,
        projeto.nome_produto,
        projeto.dominio,
      ]
    );

    // 4. Remover registro do banco
    await connection.query(
      `DELETE FROM projetos WHERE id = ? AND user_id = ?`,
      [projetoId, userId]
    );

    connection.release();

    return res.json({
      message: "Projeto excluído com sucesso e log registrado",
    });
  } catch (err) {
    if (connection) connection.release();
    console.error(err);
    return res
      .status(500)
      .json({ error: "Erro ao excluir projeto", details: err.message });
  }
});

module.exports = router;
