require('dotenv').config({ path: './.env' }); // Carga las variables del archivo .env
const { Pool } = require('pg');


const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Verificamos la conexión al iniciar
pool.connect((err, client, release) => {
    if (err) {
        return console.error('Error adquiriendo cliente', err.stack);
    }
    console.log('¡Conexión exitosa a la Base de Datos! 🐘');
    release();
});

module.exports = pool;