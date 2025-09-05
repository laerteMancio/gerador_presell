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

// Origem liberada apenas para localhost (uso local)
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

app.use(cookieParser());
app.use(express.json());

// Rotas
app.use("/generate-auth", generateAuth);
app.use("/links", links);
app.use("/login", login);
app.use("/register-public", registerPublic);
app.use("/registerPublic", registerPublic);
app.use("/usuarios", usuariosRoutes);



// Inicia o servidor local
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando LOCALMENTE na porta ${PORT}`);
});
