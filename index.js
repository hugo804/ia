require("dotenv").config();

const express = require("express");
const axios = require("axios");
const cors = require("cors");
const ESTADOS = require("./estados");

const app = express();
app.use(cors());
app.use(express.json());

/* ================= CONFIGURAÇÕES ================= */

const OPENAI_KEY = process.env.OPENAI_KEY;
const ZAPI_INSTANCE = process.env.ZAPI_INSTANCE;
const ZAPI_TOKEN = process.env.ZAPI_TOKEN;

const ZAPI_URL = `https://api.z-api.io/instances/3E13C68CBADED0F246222638C2118353/token/E3610A4DC24CF3A91DF4AE81/send-text`;

/* ================= MEMÓRIA (SIMPLES) ================= */

const atendimentos = {};

/* ================= FUNÇÕES ================= */

async function enviarMensagem(numero, texto) {
  try {
    await axios.post(
      ZAPI_URL,
      {
        phone: numero,
        message: texto
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Client-Token": ZAPI_TOKEN
        }
      }
    );
  } catch (erro) {
    console.error("Erro Z-API:", erro.response?.data || erro.message);
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
          content: `
Você é um técnico especialista em manutenção de máquinas de pelúcia.
Responda de forma técnica, objetiva e clara.
Nunca crie menus.
Nunca ofereça atendimento humano.
Nunca finalize atendimento.
Explique apenas diagnóstico e procedimentos técnicos.
          `
        },
        {
          role: "user",
          content: pergunta
        }
      ]
    },
    {
      headers: {
        Authorization: `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json"
      }
    }
  );

  return resposta.data.choices[0].message.content;
}

/* ================= WEBHOOK Z-API ================= */

app.post("/webhook", async (req, res) => {
  try {
    const mensagem = req.body.texto?.mensagem;
    const numero = req.body.telefone?.replace(/\D/g, "");
    const deMim = req.body["De mim"];

    // Ignora mensagens enviadas pelo próprio sistema
    if (deMim === true) return res.sendStatus(200);
    if (!mensagem || !numero) return res.sendStatus(200);

    /* ===== Novo atendimento ===== */
    if (!atendimentos[numero]) {
      atendimentos[numero] = { estado: ESTADOS.AGUARDANDO_OPCAO };

      await enviarMensagem(
        numero,
        `Olá! Sou o suporte automático Vendipromax 🤖

Escolha uma opção:
1️⃣ Problemas na máquina
2️⃣ Crédito remoto
3️⃣ Integração com sistema
4️⃣ Falar com um técnico`
      );

      return res.sendStatus(200);
    }

    const atendimento = atendimentos[numero];

    /* ===== Bloqueios ===== */
    if (
      atendimento.estado === ESTADOS.ATENDIMENTO_HUMANO ||
      atendimento.estado === ESTADOS.ENCERRADO
    ) {
      return res.sendStatus(200);
    }

    /* ===== Menu ===== */
    if (atendimento.estado === ESTADOS.AGUARDANDO_OPCAO) {
      if (mensagem === "1") {
        atendimento.estado = ESTADOS.BOT_ATIVO;
        await enviarMensagem(numero, "Descreva o problema da máquina.");
        return res.sendStatus(200);
      }

      if (mensagem === "2") {
        atendimento.estado = ESTADOS.BOT_ATIVO;
        await enviarMensagem(numero, "Informe sua dúvida sobre crédito remoto.");
        return res.sendStatus(200);
      }

      if (mensagem === "3") {
        atendimento.estado = ESTADOS.BOT_ATIVO;
        await enviarMensagem(numero, "Descreva a integração desejada.");
        return res.sendStatus(200);
      }

      if (mensagem === "4") {
        atendimento.estado = ESTADOS.ATENDIMENTO_HUMANO;
        await enviarMensagem(
          numero,
          "Você foi transferido para um técnico humano. Aguarde atendimento."
        );
        return res.sendStatus(200);
      }

      await enviarMensagem(numero, "Opção inválida. Digite de 1 a 4.");
      return res.sendStatus(200);
    }

    /* ===== IA ===== */
    const respostaIA = await responderComIA(mensagem);
    await enviarMensagem(numero, respostaIA);

    return res.sendStatus(200);
  } catch (erro) {
    console.error("Erro geral:", erro);
    return res.sendStatus(200);
  }
});

/* ================= SERVIDOR ================= */

app.listen(3000, () => {
  console.log("✅ Suporte IA Vendipromax rodando na porta 3000");
});
