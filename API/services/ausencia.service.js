const pool = require('../config/db');
const crypto = require('crypto');

// 1. Obtener todas las ausencias (con nombres legibles)
const getAusencias = async () => {
    const query = `
        SELECT 
            a.ausencia_id,
            e.nombre_empleado,
            c.descripcion AS motivo,
            a.inicio_ausencia,
            a.fin_ausencia
        FROM ausencias a
        JOIN empleados e ON a.empleado_id = e.empleado_id
        JOIN catalogo_ausencias c ON a.tipo_ausencia_id = c.tipo_id
        ORDER BY a.inicio_ausencia DESC
    `;
    const result = await pool.query(query);
    return result.rows;
};

// 2. Registrar una ausencia
const createAusencia = async (empleado_id, tipo_ausencia_id, inicio, fin) => {
    const id = crypto.randomUUID();

    const query = `
        INSERT INTO ausencias (ausencia_id, empleado_id, tipo_ausencia_id, inicio_ausencia, fin_ausencia) 
        VALUES ($1, $2, $3, $4, $5) 
        RETURNING *`;

    const values = [id, empleado_id, tipo_ausencia_id, inicio, fin];
    const result = await pool.query(query, values);
    return result.rows[0];
};

// 3. Eliminar una ausencia (cancelar vacaciones)
const deleteAusencia = async (id) => {
    const query = 'DELETE FROM ausencias WHERE ausencia_id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
};

module.exports = {
    getAusencias,
    createAusencia,
    deleteAusencia
};