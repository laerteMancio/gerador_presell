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
const vercelCheckDomain = require("./routes/vercelCheck"); // <--- rota adicionada

dotenv.config();

const app = express();

// ------------------ CORS ------------------
const allowedOrigins = [
  "http://localhost:5173",
  "https://frontend-gerenciador-campanhas.vercel.app",
  "https://gerador-presell.vercel.app"
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Permite chamadas sem origem (ex.: Postman, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization"
    ],
    credentials: true
  })
);

// Tratar preflight (OPTIONS)
app.options("*", cors());

app.use(cookieParser());
app.use(express.json());

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
app.use("/check-subdomain", vercelCheckDomain); // <--- rota adicionada


// ------------------ Export ------------------
module.exports = app;
