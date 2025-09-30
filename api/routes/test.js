const GoogleTranslate = require("@vitalets/google-translate-api");
const translate = GoogleTranslate.default;

(async () => {
  try {
    const res = await translate("Olá mundo", { to: "en" });
    console.log(res.text); // Deve exibir "Hello world"
  } catch (err) {
    console.error(err);
  }
})();
