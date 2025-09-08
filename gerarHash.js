const bcrypt = require("bcrypt");

async function gerarHash() {
  const senha = "123456";
  const hash = await bcrypt.hash(senha, 10); // 10 rounds
  console.log(hash);
}

gerarHash();
