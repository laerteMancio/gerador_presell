const express = require("express");
const router = express.Router();

// CORS interno se precisar
router.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});



// Rota principal
router.post("/", async (req, res) => {
  try {
    const { userId, productName, domain, formData } = req.body;
    console.log(userId);
    console.log(productName);
    console.log(domain);
    console.log(formData);

    
    if (!userId || !productName || !domain || !formData) {
      return res.status(400).json({ success: false, message: "Dados incompletos" });
    }

    const subdomain = productName.replace(/\s+/g, "-").toLowerCase();
    const fullDomain = `${subdomain}.${domain}`;

    res.json({ success: true, url: `https://${fullDomain}` });
  } catch (err) {
    console.error("Erro ao publicar presell:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
