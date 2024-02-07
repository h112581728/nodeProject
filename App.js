const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const mysql = require('mysql2/promise');
const [TransactionColumns, StatusColumns, CardPColumns, ChargebackColumns, formatDate] = require('./Components/Utillity')
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const upload = multer();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
};

//Route to upload transaction data
app.post('/transaction/upload', upload.single('excelFile'), async (req, res) => {
    try {
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
        const connection = await mysql.createConnection(dbConfig);

        for (const rows of data.slice(1)) {
            let row = rows;
            while (row.length < 62) {
                row.push("0");
            }

            for (let i = 0; i < row.length; i++) {
                if (row[i] === null || row[i] === "" || row[i] === undefined) {
                    row[i] = '0';
                }
            }

            row[2] = formatDate(row[2]); // Column 3
            row[3] = formatDate(row[3]); // Column 4
            row[60] = formatDate(row[60]); // Column 61
            row[61] = formatDate(row[61]); // Column 62
            const currentTimestamp = Date.now();
            const dateObject = new Date(currentTimestamp);
            const databaseTimestampString = dateObject.toISOString().slice(0, 19).replace('T', ' ');
            row.push(databaseTimestampString);

            let newRow = [row[0], row[2], row[4], row[61], row[62]]

            const valuesString = row.map(value => `"${value}"`).join(', ');
            const updateClause = TransactionColumns.map(TransactionColumns => `${TransactionColumns}=VALUES(${TransactionColumns})`).join(', ');

            const newvaluesString = newRow.map(value => `"${value}"`).join(', ');
            const newupdateClause = StatusColumns.map(StatusColumns => `${StatusColumns}=VALUES(${StatusColumns})`).join(', ');

            const query = `INSERT INTO transaction VALUES (${valuesString}) ON DUPLICATE KEY UPDATE ${updateClause};`;
            const query2 = `INSERT INTO status VALUES (${newvaluesString}) ON DUPLICATE KEY UPDATE ${newupdateClause};`;
            await connection.beginTransaction();
            await connection.query(query);
            await connection.query(query2);
            await connection.commit();
        }

        await connection.end();
        res.status(200).send('Data inserted or updated successfully.');
    } catch (error) {
        console.error('Error inserting or updating data:', error);
        res.status(500).send('Internal Server Error');
    }
});

//Route to upload tabapay card data
app.post('/cardProcessed/upload', upload.single('excelFile'), async (req, res) => {
    try {
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
        const connection = await mysql.createConnection(dbConfig);

        data.slice(1, data.length).forEach(async (rows) => {
            let row = rows;
            while (row.length < 53) {
                row.push("0");
            }

            for (let i = 0; i < row.length; i++) {
                if (row[i] === null || row[i] === "" || row[i] === undefined) {
                    row[i] = '0';
                }
            }

            row[6] = formatDate(row[6]); // Column 7
            row[7] = formatDate(row[7]); // Column 8
            row[33] = formatDate(row[33]); // Column 34
            const currentTimestamp = Date.now();
            const dateObject = new Date(currentTimestamp);
            const databaseTimestampString = dateObject.toISOString().slice(0, 19).replace('T', ' ');
            row.push(databaseTimestampString);

            const valuesString = row.map(value => `"${value}"`).join(', ');
            const updateClause = CardPColumns.map(CardPColumns => `${CardPColumns}=VALUES(${CardPColumns})`).join(', ');

            const query = `INSERT INTO cardprocessed VALUES (${valuesString}) ON DUPLICATE KEY UPDATE ${updateClause};`;
            await connection.query(query);
        })

        await connection.end();
        res.status(200).send('Data inserted or updated successfully.');
    } catch (error) {
        console.error('Error inserting or updating data:', error);
        res.status(500).send('Internal Server Error');
    }
});

//Route to upload tabapay card data
app.post('/chargeback/upload', upload.single('excelFile'), async (req, res) => {
    try {
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
        const connection = await mysql.createConnection(dbConfig);

        data.slice(1, data.length).forEach(async (rows) => {
            let row = rows;
            while (row.length < 30) {
                row.push("0");
            }

            for (let i = 0; i < row.length; i++) {
                if (row[i] === null || row[i] === "" || row[i] === undefined) {
                    row[i] = '0';
                }
            }

            row[8] = formatDate(row[8]); // Column 9
            row[10] = formatDate(row[10]); // Column 11
            row[13] = formatDate(row[13]); // Column 14
            row[14] = formatDate(row[14]); // Column 15
            const currentTimestamp = Date.now();
            const dateObject = new Date(currentTimestamp);
            const databaseTimestampString = dateObject.toISOString().slice(0, 19).replace('T', ' ');
            row.push(databaseTimestampString);

            const valuesString = row.map(value => `"${value}"`).join(', ');
            const updateClause = ChargebackColumns.map(ChargebackColumns => `${ChargebackColumns}=VALUES(${ChargebackColumns})`).join(', ');

            const query = `INSERT INTO chargeback VALUES (${valuesString}) ON DUPLICATE KEY UPDATE ${updateClause};`;
            await connection.query(query);
        })

        await connection.end();
        res.status(200).send('Data inserted or updated successfully.');
    } catch (error) {
        console.error('Error inserting or updating data:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Route to load a specific table from the database
app.get('/transaction/view', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        let myfile = fs.readFileSync(path.join(__dirname, 'DatabaseQueries', '05.InitialTableQuery.txt'), { encoding: 'utf8' });
        const [rows] = await connection.query(`${myfile}`);
        await connection.end();
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error loading data:', error);
        res.status(500).send('Internal Server Error');
    }
});






// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
