const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cron = require('node-cron');
const fs = require('fs');
const app = express();

app.use(cors());
app.use(express.json());

const API_KEY = '123456'; 
const DB_FILE = 'banco-dados.json';

// --- FUNÇÕES AUXILIARES ---
function carregarAlunos() {
    if (fs.existsSync(DB_FILE)) {
        const dados = fs.readFileSync(DB_FILE);
        return JSON.parse(dados);
    }
    return [];
}

function salvarAlunos(alunos) {
    fs.writeFileSync(DB_FILE, JSON.stringify(alunos, null, 2));
}

let alunos = carregarAlunos();

function formatarParaWhatsApp(numero) {
    let n = numero.replace(/\D/g, '');
    if (n.length === 13 && n.startsWith('55')) n = n.substring(0, 4) + n.substring(5);
    return n;
}

// --- ROBÔ AUTOMÁTICO (IA) ---
cron.schedule('0 9 * * *', async () => {
    console.log('🤖 ROBÔ: Verificando prazos...');
    const hoje = new Date();
    let mudou = false;

    for (let aluno of alunos) {
        if (aluno.status === 'Pendente' && aluno.dataRetirada) {
            const dataRetirada = new Date(aluno.dataRetirada);
            const dias = Math.floor((hoje - dataRetirada) / (1000 * 60 * 60 * 24));

            if (dias >= 30) {
                await enviarCobranca(aluno, dias);
                aluno.status = 'Cobrado Robô';
                mudou = true;
            }
        }
    }
    if (mudou) salvarAlunos(alunos);
});

async function enviarCobranca(aluno, dias = 30) {
    const tel = formatarParaWhatsApp(aluno.telefone);
    try {
        await axios.post('https://apievolution.online/api/sendText', {
            session: 'default',
            chatId: `${tel}@c.us`,
            text: `Olá ${aluno.responsavel}! 🤖\nPassaram-se ${dias} dias da retirada do histórico do(a) ${aluno.nome}. Favor regularizar.`
        }, { headers: { 'X-Api-Key': API_KEY } });
        return true;
    } catch (e) {
        console.error(`Erro envio: ${e.message}`);
        return false;
    }
}

// --- ROTAS ---
app.get('/alunos', (req, res) => res.json(alunos));

app.post('/alunos', (req, res) => {
    const novo = { id: Date.now(), ...req.body, status: 'Pendente' };
    alunos.push(novo);
    salvarAlunos(alunos);
    res.json(novo);
});

app.post('/cobrar/:id', async (req, res) => {
    const aluno = alunos.find(a => a.id == req.params.id);
    if (aluno) {
        await enviarCobranca(aluno);
        aluno.status = 'Cobrado Manual';
        salvarAlunos(alunos);
        res.json({ success: true });
    }
});

// NOVA ROTA: EXCLUIR ALUNO
app.delete('/alunos/:id', (req, res) => {
    const id = Number(req.params.id); // Converte para número
    alunos = alunos.filter(a => a.id !== id); // Remove o aluno da lista
    salvarAlunos(alunos); // Salva o arquivo novo
    res.json({ success: true });
});

// O Render vai nos dar uma porta (process.env.PORT)
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🔥 SERVIDOR RODANDO NA PORTA ${PORT}`));