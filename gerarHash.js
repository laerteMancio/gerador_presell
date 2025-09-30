const bcrypt = require("bcrypt");

async function gerarHash() {
  const senha = "12345678";
  const hash = await bcrypt.hash(senha, 10); // 10 rounds
  console.log(hash);
}

gerarHash();
