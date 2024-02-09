const mysql = require('mysql2/promise');

require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
};

async function DeleteAllData(){
    const connection = await mysql.createConnection(dbConfig);
    await connection.query('DELETE FROM transaction;');
    await connection.query('DELETE FROM cardprocessed;');
    await connection.query('DELETE FROM chargeback;');
    await connection.query('DELETE FROM status;');
    connection.commit();
    connection.end()
}

DeleteAllData();