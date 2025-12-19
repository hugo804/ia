require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

/* ================= CONFIG ================= */

const PORT = process.env.PORT || 3000;

const OPENAI_KEY = process.env.OPENAI_KEY;
const ZAPI_URL = process.env.ZAPI_URL;

if (!OPENAI_KEY || !ZAPI_URL) {
  console.error("❌ Variáveis de ambiente não configuradas");
  process.exit(1);
}

/* ================= UTIL ================= */

async function enviarMensagem(numero, texto) {
  await axios.post(
    ZAPI_URL,
    {
      phone: numero,
      message: texto,
    },
    {
      headers: {
        "Content-Type": "application/json",
        "Client-Token": process.env.ZAPI_TOKEN,
      },
    }
  );
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
            "Você é um técnico especialista em manutenção de máquinas de pelúcia. Responda de forma técnica, objetiva e direta.",
        },
        { role: "user", content: pergunta },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  return resposta.data.choices[0].message.content;
}

/* ================= ROTAS ================= */

app.get("/", (req, res) => {
  res.send("Servidor IA Vendipromax online");
});

app.post("/webhook", async (req, res) => {
  try {
    console.log("📩 Webhook recebido:", JSON.stringify(req.body));

    const numero = req.body.telefone;
    const mensagem = req.body?.texto?.mensagem;
    const fromMe = req.body.fromMe;

    if (!numero || !mensagem || fromMe) {
      return res.sendStatus(200);
    }

    const respostaIA = await responderComIA(mensagem);
    await enviarMensagem(numero, respostaIA);

    res.sendStatus(200);
  } catch (erro) {
    console.error("❌ Erro no webhook:", erro.message);
    res.sendStatus(200);
  }
});

/* ================= START ================= */

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
