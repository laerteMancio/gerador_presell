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

dotenv.config();

const app = express();

// ------------------ CORS ------------------
const allowedOrigins = [
  "http://localhost:5173", 
  "https://frontend-gerenciador-campanhas.vercel.app"
];

app.use(cors({
  origin: function(origin, callback) {
    // Permite requests sem origem (ex: Postman) ou origins da lista
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// Responde OPTIONS em todas as rotas (preflight)
app.options("*", cors());

// ------------------ Middlewares ------------------
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
app.use("/check-subdomain", vercelCheckDomain);

// ------------------ Listen local ------------------
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Backend rodando localmente na porta ${PORT}`);
  });
}

// ------------------ Export ------------------
module.exports = app;
