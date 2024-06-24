const express = require('express');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Carrega as credenciais do arquivo JSON
const keys = JSON.parse(fs.readFileSync(path.join(__dirname, 'credentials.json')));

// Criação do cliente de autenticação JWT
const client = new google.auth.JWT(
    keys.client_email,
    null,
    keys.private_key,
    ['https://www.googleapis.com/auth/spreadsheets']
);

// Rota principal para verificar se o servidor está rodando
app.get('/', (req, res) => {
    res.send('Servidor está rodando. Use a rota /buscar-produto para buscar produtos.');
});

// Endpoint para buscar produto
app.get('/buscar-produto', async (req, res) => {
    const { modelo } = req.query;

    try {
        // Autoriza o cliente
        await client.authorize();

        // Nome da planilha e intervalo de dados
        const sheetName = 'No preço eu quero que você coloca assim, R$ 2.520...';
        const range = `${sheetName}!A1:G129`;

        // Busca os dados da planilha
        const sheets = google.sheets('v4');
        const result = await sheets.spreadsheets.values.get({
            auth: client,
            spreadsheetId: '1qhggniVL6uET59CbhVdOVB_sskCm3FExSSeEutnNoMo',
            range: range,
        });

        const rows = result.data.values;

        // Procura pelo modelo específico
        for (const row of rows) {
            if (row[1] && row[1].trim().toLowerCase() === modelo.trim().toLowerCase()) {
                return res.json({ success: "true", produto: { modelo: row[1], preco: row[3], estoque: row[6] } });
            }
        }
        res.json({ success: "false", message: "Produto não encontrado" });
    } catch (error) {
        console.error('Erro ao buscar produto:', error.message);
        res.status(500).json({ success: "false", message: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
