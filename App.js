const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const mysql = require('mysql2/promise');
const [columns, formatDate] = require('./Components/Utillity')

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

app.post('/transaction/upload', upload.single('excelFile'), async (req, res) => {
    try {
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
        const connection = await mysql.createConnection(dbConfig);

        data.slice(1, data.length).forEach(async (rows) => {
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

            const valuesString = row.map(value => `"${value}"`).join(', ');
            const updateClause = columns.map(column => `${column}=VALUES(${column})`).join(', ');
   
            const query = `INSERT INTO transaction VALUES (${valuesString}) ON DUPLICATE KEY UPDATE ${updateClause};`;
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
        const [rows] = await connection.query('SELECT * FROM transaction LIMIT 10');
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
