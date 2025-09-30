// api/server.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");

// Rotas
const generateAuth = require("./routes/generate-auth");
const links = require("./routes/links");
const login = require("./routes/login");
const registerPublic = require("./routes/register-public");
const usuariosRoutes = require("./routes/usuarios");
const publishPresellRouter = require("./routes/publishPresell");
const deployRoute = require("./routes/deploy");
const updateSubdomainStatus = require("./routes/updateSubdomainStatus");
const getUserProjects = require("./routes/getUserProjects");
const vercelCheckDomain = require("./routes/vercelCheck");
const translateRoute = require("./routes/translate");

const app = express();

// Middleware para parsing JSON
app.use(express.json());

dotenv.config();

const allowedOrigins = [
  "https://frontend-gerenciador-campanhas.vercel.app", // frontend remoto
  "http://localhost:5173", // frontend local
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed"));
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, // ESSENCIAL para cookies
  })
);



// Rota de teste GET
app.get("/ping", (req, res) => {
  res.json({ status: "ok", message: "Servidor funcionando!" });
});

// Rota de teste POST
app.post("/echo", (req, res) => {
  const body = req.body;
  res.json({ received: body });
});

// ------------------ Rotas ------------------
app.use("/generate-auth", generateAuth);
app.use("/links", links);
app.use("/login", login);
app.use("/register-public", registerPublic);
app.use("/registerPublic", registerPublic);
app.use("/usuarios", usuariosRoutes);
app.use("/publicar-presell", publishPresellRouter);
app.use("/vercel", deployRoute);
app.use("/subdomain", updateSubdomainStatus);
app.use("/projects", getUserProjects);
app.use("/check-subdomain", vercelCheckDomain);
app.use("/translate", translateRoute);

// Exporta o app para Vercel
module.exports = app;
