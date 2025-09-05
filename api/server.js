const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");

const generateAuth = require("./routes/generate-auth");
const links = require("./routes/links");
const login = require("./routes/login");
const registerPublic = require("./routes/register-public");
const usuariosRoutes = require("./routes/usuarios");

dotenv.config();

const app = express();

// Configurações do CORS
app.use(cors({
  origin: "*", // Se quiser liberar para qualquer front, ou especifique seu domínio
  credentials: true
}));

app.use(cookieParser());
app.use(express.json());

// Rotas
app.use("/generate-auth", generateAuth);
app.use("/links", links);
app.use("/login", login);
app.use("/register-public", registerPublic);
app.use("/usuarios", usuariosRoutes);

// Exporta para Vercel
module.exports = app;
