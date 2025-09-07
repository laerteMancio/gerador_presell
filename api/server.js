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

dotenv.config();

const app = express();

// ------------------ CORS ------------------
// Permite localhost para desenvolvimento
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

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

// ------------------ Export ------------------
// Para Vercel, sem listen()
module.exports = app;
