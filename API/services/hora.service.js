const pool = require('../config/db');
const crypto = require('crypto');

const getHoras = async () => {
    const result = await pool.query('SELECT * FROM registro_horas ORDER BY inicio_trabajo DESC');
    return result.rows;
};

// --- NUEVO: Verificar si tiene un turno abierto ---
const verificarSiTrabaja = async (empleado_id) => {
    // Buscamos si hay algún registro donde 'fin_trabajo' sea NULL para este empleado
    const query = 'SELECT * FROM registro_horas WHERE empleado_id = $1 AND fin_trabajo IS NULL';
    const result = await pool.query(query, [empleado_id]);
    return result.rows[0]; // Si devuelve algo, es que YA está trabajando
};

const iniciarJornada = async (empleado_id) => {
    const id = crypto.randomUUID();
    const query = `
        INSERT INTO registro_horas (registro_id, empleado_id, inicio_trabajo) 
        VALUES ($1, $2, NOW()) 
        RETURNING *`;
    const values = [id, empleado_id];
    const result = await pool.query(query, values);
    return result.rows[0];
};

const terminarJornada = async (registro_id) => {
    const query = `
        UPDATE registro_horas 
        SET fin_trabajo = NOW() 
        WHERE registro_id = $1 
        RETURNING *`;
    const values = [registro_id];
    const result = await pool.query(query, values);
    return result.rows[0];
};

// --- NUEVO: Borrar un registro (por si se equivocaron de dedo) ---
const deleteHora = async (registro_id) => {
    const query = 'DELETE FROM registro_horas WHERE registro_id = $1 RETURNING *';
    const result = await pool.query(query, [registro_id]);
    return result.rows[0];
};

module.exports = {
    getHoras,
    verificarSiTrabaja, // ¡Exportamos la nueva función!
    iniciarJornada,
    terminarJornada,
    deleteHora          // ¡Y esta también!
};