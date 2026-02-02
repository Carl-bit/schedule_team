const pool = require('../config/db');
const crypto = require('crypto');

// 1. LEER TODOS 
const getProyectos = async () => {
    const result = await pool.query('SELECT * FROM proyectos');
    return result.rows;
};

// 2. CREAR 
const createProyecto = async (nombre, cliente, fecha_inicio, fecha_entrega) => {
    const id = crypto.randomUUID();
    const query = `
        INSERT INTO proyectos (proyecto_id, nombre_proyecto, cliente, fecha_inicio, fecha_entrega) 
        VALUES ($1, $2, $3, $4, $5) 
        RETURNING *`;
    const values = [id, nombre, cliente, fecha_inicio, fecha_entrega];
    const result = await pool.query(query, values);
    return result.rows[0];
};


// 3. LEER UNO POR ID
const getProyectoById = async (id) => {
    const result = await pool.query('SELECT * FROM proyectos WHERE proyecto_id = $1', [id]);
    return result.rows[0];
};

// 4. ACTUALIZAR PROYECTO
const updateProyecto = async (id, nombre, cliente, fecha_inicio, fecha_entrega) => {
    const query = `
        UPDATE proyectos
        SET nombre_proyecto = $1, cliente = $2, fecha_inicio = $3, fecha_entrega = $4
        WHERE proyecto_id = $5
        RETURNING *`;

    const values = [nombre, cliente, fecha_inicio, fecha_entrega, id];
    const result = await pool.query(query, values);
    return result.rows[0];
};

// 5. ELIMINAR PROYECTO
const deleteProyecto = async (id) => {
    const query = 'DELETE FROM proyectos WHERE proyecto_id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
};

module.exports = {
    getProyectos,
    getProyectoById,
    createProyecto,
    updateProyecto,
    deleteProyecto
};