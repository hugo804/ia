const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// ================= CONFIGURAÇÃO =================
const OPENAI_KEY = "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";

// ================= ROTA PARA CONVERSAR COM A IA =================
app.post("/ia", async (req, res) => {
  try {
    const pergunta = req.body.pergunta;

    if (!pergunta) {
      return res.status(400).json({ erro: "Pergunta não fornecida" });
    }

    const resposta = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Você é um técnico especialista em manutenção de máquinas de pelúcia. Responda de forma técnica, objetiva e clara."
          },
          { role: "user", content: pergunta }
        ]
      },
      {
        headers: {
          "Authorization": `Bearer ${OPENAI_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    res.json({ resposta: resposta.data.choices[0].message.content });
  } catch (erro) {
    console.error("❌ Erro na rota /ia:", erro.response?.data || erro.message);
    res.status(500).json({ erro: erro.response?.data || erro.message });
  }
});

// ================= SERVIDOR =================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
