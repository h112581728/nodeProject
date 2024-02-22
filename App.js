
const multer = require('multer');
const express = require('express');
const xlsx = require('xlsx');
const mysql = require('mysql2/promise');
const [TransactionColumns, StatusColumns, CardPColumns, ChargebackColumns, formatDate, MachpayWireColumns] = require('./Components/Utillity')
const fs = require('fs');
const path = require('path');
const cors = require('cors')

require('dotenv').config({ path: path.resolve(__dirname, ".env"), override: true, debug: true });

const app = express();
app.use(cors());
const PORT = process.env.PORT || 3000;
const upload = multer();
const bodyParser = require('body-parser');
app.use(bodyParser.json());

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

app.post('/machpay_wire/upload', async (req, res) => {
    try {
        const { wireId: wire_id, wireDate: wire_date, specialRemarks: remarks, data } = req.body;
        const connection = await mysql.createConnection(dbConfig);

        const formattedData = data.map(({ rtrn, wallet_balance }) => [
            wire_id, rtrn, wire_date, wallet_balance, remarks, new Date().toISOString().slice(0, 19).replace('T', ' ')
        ]);

        const queryValues = formattedData.map(rows => `(${rows.map(value => `"${value}"`).join(', ')})`).join(', ');
        const updateClause = MachpayWireColumns.map(col => `${col}=VALUES(${col})`).join(', ');
        const query = `INSERT INTO machpay_wire VALUES ${queryValues} ON DUPLICATE KEY UPDATE ${updateClause};`;
        await connection.query(query);
        await connection.end();
        res.status(200).send('Data inserted or updated successfully.');
    } catch (error) {
        console.error('Error inserting or updating data:', error);
        res.status(500).send('Internal Server Error');
    }

});

app.post('/payout_partner_wire/upload', async (req, res) => {
    try {
        const { wireId: wire_id, wireDate: wire_date, specialRemarks: remarks, data } = req.body;
        const connection = await mysql.createConnection(dbConfig);

        const formattedData = data.map(({ rtrn, wallet_balance }) => [
            wire_id, rtrn, wire_date, wallet_balance, remarks, new Date().toISOString().slice(0, 19).replace('T', ' ')
        ]);

        const queryValues = formattedData.map(rows => `(${rows.map(value => `"${value}"`).join(', ')})`).join(', ');
        const updateClause = MachpayWireColumns.map(col => `${col}=VALUES(${col})`).join(', ');
        const query = `INSERT INTO payout_partner_wire VALUES ${queryValues} ON DUPLICATE KEY UPDATE ${updateClause};`;
        await connection.query(query);
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

        // Pagination parameters
        const page = req.query.page || 1;
        const pageSize = req.query.pageSize || 10000000; // Default page size

        // Filtering parameters
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;
        const filterValue = req.query.filterValue;

        let query = `SELECT * FROM (${myfile}) transaction_subquery`;

        // Apply filtering
        if (startDate && endDate) {
            query += ` WHERE transaction_date_pst > DATE'${startDate}' AND transaction_date_pst <= DATE_ADD(DATE'${endDate}', INTERVAL 1 day)`
        }


        if (filterValue) {
            if (!(startDate && endDate)) {
                query += ` WHERE (mto LIKE '%${filterValue}%' OR msb LIKE '%${filterValue}%')`;
            }
            else {
                query += ` AND (mto LIKE '%${filterValue}%' OR msb LIKE '%${filterValue}%')`;
            }
        }

        query += ` ORDER BY transaction_date_pst DESC LIMIT ${(page - 1) * pageSize}, ${pageSize}`;

        const [rows] = await connection.query(`${query}`);
        await connection.end();
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error loading data:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/machpay_wire/view', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        let myfile = fs.readFileSync(path.join(__dirname, 'DatabaseQueries', '06.MachpayWireQuery.txt'), { encoding: 'utf8' });

        // Pagination parameters
        const page = req.query.page || 1;
        const pageSize = req.query.pageSize || 10000000; // Default page size

        // Filtering parameters
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;
        const filterValue = req.query.filterValue;

        let query = `SELECT * FROM (${myfile}) transaction_subquery`;

        // Apply filtering
        if (startDate && endDate) {
            query += ` WHERE transaction_date_pst > DATE'${startDate}' AND transaction_date_pst <= DATE_ADD(DATE'${endDate}', INTERVAL 1 day)`
        }


        if (filterValue) {
            if (!(startDate && endDate)) {
                query += ` WHERE (mto LIKE '%${filterValue}%' OR msb LIKE '%${filterValue}%')`;
            }
            else {
                query += ` AND (mto LIKE '%${filterValue}%' OR msb LIKE '%${filterValue}%')`;
            }
        }

        const [rows] = await connection.query(`${query}`);
        await connection.end();
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error loading data:', error);
        res.status(500).send('Internal Server Error');
    }
});


app.get('/payout_partner_wire/view', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        let myfile = fs.readFileSync(path.join(__dirname, 'DatabaseQueries', '07.PayoutPartnerWireQuery.txt'), { encoding: 'utf8' });

        // Pagination parameters
        const page = req.query.page || 1;
        const pageSize = req.query.pageSize || 10000000; // Default page size

        // Filtering parameters
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;
        const filterValue = req.query.filterValue;

        let query = `SELECT * FROM (${myfile}) transaction_subquery`;

        // Apply filtering
        if (startDate && endDate) {
            query += ` WHERE transaction_date_pst > DATE'${startDate}' AND transaction_date_pst <= DATE_ADD(DATE'${endDate}', INTERVAL 1 day)`
        }


        if (filterValue) {
            if (!(startDate && endDate)) {
                query += ` WHERE (mto LIKE '%${filterValue}%' OR msb LIKE '%${filterValue}%')`;
            }
            else {
                query += ` AND (mto LIKE '%${filterValue}%' OR msb LIKE '%${filterValue}%')`;
            }
        }

        const [rows] = await connection.query(`${query}`);
        await connection.end();
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error loading data:', error);
        res.status(500).send('Internal Server Error');
    }
});


app.get('/wire_batch/view', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
       
        // Pagination parameters
        const page = req.query.page || 1;
        const pageSize = req.query.pageSize || 10000000; // Default page size

        // Filtering parameters
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;
        const filterValue = req.query.filterValue;

        let query = `SELECT * FROM payout_partner_wire`;
        const [rows] = await connection.query(`${query}`);
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