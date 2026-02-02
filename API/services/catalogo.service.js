const pool = require('../config/db');

// 1. Obtener Roles (para Asignaciones)
const getRoles = async () => {
    const result = await pool.query('SELECT * FROM catalogo_roles');
    return result.rows;
};

// 2. Obtener Estados (para Registro de Horas)
const getEstados = async () => {
    const result = await pool.query('SELECT * FROM catalogo_estado');
    return result.rows;
};

// 3. Obtener Tipos de Ausencia (para la futura tabla Ausencias)
const getAusencias = async () => {
    const result = await pool.query('SELECT * FROM catalogo_ausencias');
    return result.rows;
};

// 4. Obtener Puestos (para Empleados)
const getPuestos = async () => {
    const result = await pool.query('SELECT * FROM catalogo_empleado');
    return result.rows;
};

// --- GESTIÓN DE PUESTOS (Crear y Borrar) ---

const createPuesto = async (nombrePuesto) => {
    // Generamos un ID amigable, ej: "PUESTO_X7Z9" o un UUID completo
    // Para simplificar y seguir tu patrón, usaremos UUID
    const id = crypto.randomUUID();

    const query = `
        INSERT INTO catalogo_empleado (puesto_empleado_id, puesto_empleado) 
        VALUES ($1, $2) 
        RETURNING *`;

    const values = [id, nombrePuesto];
    const result = await pool.query(query, values);
    return result.rows[0];
};

const deletePuesto = async (id) => {
    const query = 'DELETE FROM catalogo_empleado WHERE puesto_empleado_id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
};

module.exports = {
    getRoles,
    getEstados,
    getAusencias,
    getPuestos,
    createPuesto,
    deletePuesto
};