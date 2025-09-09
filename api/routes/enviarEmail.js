const express = require("express");
const nodemailer = require("nodemailer");
const multer = require("multer");

const router = express.Router();

// Usar multer com armazenamento em memória
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/", upload.array("attachments"), async (req, res) => {
  const { to, subject, text } = req.body;

  if (!to) {
    return res.status(400).json({ error: "Destinatário (to) é obrigatório." });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: "email-ssl.com.br",
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // Mapear os arquivos recebidos (buffer na memória)
    const attachments = (req.files || []).map((file) => ({
      filename: file.originalname,
      content: file.buffer,
      contentType: file.mimetype,
    }));

    const info = await transporter.sendMail({
      from: '"NFE - Agiltec" <nfe@agiltec.com.br>',
      to,
      cc: "nfe@agiltec.com.br",
      subject: subject || "NFE",
      text: `Segue XML e DANFE referente à Nota Fiscal Emitida.

Por favor, não responda a esta mensagem.
Este é um e-mail automático do sistema AGILNFe.

Copyright © Agil Informática. Todos os direitos reservados. Termos do Serviço.
Contato: comercial@agiltec.com.br | +55 11 94588-4774
www.agiltec.com.br`,
      attachments,
    });

    console.log("Email enviado:", info.messageId);
    res.status(200).json({ message: "Email enviado com sucesso!" });
  } catch (error) {
    console.error("Erro ao enviar email:", error);
    res.status(500).json({ error: error.toString() });
  }
});

module.exports = router;
