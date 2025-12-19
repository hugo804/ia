const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

/* ================= CONFIG FIXA ================= */

// 🔴 COLOQUE OS DADOS REAIS AQUI
const OPENAI_KEY = "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";

const ZAPI_URL =
  "https://api.z-api.io/instances/3E13C68CBADED0F246222638C2118353/token/E3610A4DC24CF3A91DF4AE81/send-text";

const ZAPI_CLIENT_TOKEN = "Ff81fb672b7da4a3886c4432a0ab66452S";

// Porta do Heroku
const PORT = process.env.PORT || 3000;

/* ================= FUNÇÕES ================= */

async function enviarMensagem(numero, mensagem) {
  const payload = {
    phone: numero,
    message: mensagem,
    delayMessage: 10,
  };

  try {
    const response = await axios.post(ZAPI_URL, payload, {
      headers: {
        "Content-Type": 'application/json',
        "Client-Token": 'Ff81fb672b7da4a3886c4432a0ab66452S',
      },
    });

    console.log("✅ Mensagem enviada Z-API:", response.data);
  } catch (err) {
    console.error(
      "❌ Erro ao enviar mensagem Z-API:",
      err.response?.status,
      err.response?.data
    );
    throw err;
  }
}


async function responderComIA(pergunta) {
  const resposta = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Você é um técnico especialista em manutenção de máquinas de pelúcia. Responda de forma técnica, objetiva e clara.",
        },
        {
          role: "user",
          content: pergunta,
        },
      ],
    },
    {
      headers: {
        "Authorization": `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`,
        "Content-Type": "application/json",
      },
    }
  );

  return resposta.data.choices[0].message.content;
}

/* ================= ROTAS ================= */

app.get("/", (req, res) => {
  res.send("Servidor IA Vendipromax ONLINE");
});

app.post("/webhook", async (req, res) => {
  try {
    console.log("📩 Webhook recebido:", JSON.stringify(req.body));

    // 🔹 Validar estrutura
    if (!req.body.phone || !req.body.text || !req.body.text.message) {
      console.log("⚠️ Mensagem inválida, ignorando");
      return res.sendStatus(200);
    }

    const telefone = req.body.phone;
    const mensagemRecebida = req.body.text.message;

    console.log("📞 Telefone:", telefone);
    console.log("💬 Mensagem:", mensagemRecebida);

    // 🔹 IA responde
    const respostaIA = await responderComIA(mensagemRecebida);

    // 🔹 Enviar resposta
    await enviarMensagem(telefone, respostaIA);

    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Erro no webhook:", err.message);
    res.sendStatus(500);
  }
});




/* ================= START ================= */

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
