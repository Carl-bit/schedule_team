const pool = require('../config/db');

// Obtener todas las etiquetas de un empleado
const getEtiquetasByEmpleado = async (empleadoId) => {
    const result = await pool.query(
        'SELECT * FROM catalogo_etiquetas WHERE empleado_id = $1',
        [empleadoId]
    );
    return result.rows;
};

// Crear una nueva etiqueta
const createEtiqueta = async (etiqueta) => {
    const { etiqueta_id, empleado_id, nombre, rango_horas, color, tipo, secuencia_patron } = etiqueta;
    const result = await pool.query(
        `INSERT INTO catalogo_etiquetas 
        (etiqueta_id, empleado_id, nombre, rango_horas, color, tipo, secuencia_patron) 
        VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [etiqueta_id, empleado_id, nombre, rango_horas, color, tipo, secuencia_patron ? JSON.stringify(secuencia_patron) : null]
    );
    return result.rows[0];
};

// Actualizar una etiqueta existente
const updateEtiqueta = async (etiqueta_id, empleado_id, data) => {
    const { nombre, rango_horas, color, tipo, secuencia_patron } = data;
    const result = await pool.query(
        `UPDATE catalogo_etiquetas 
         SET nombre = $1, rango_horas = $2, color = $3, tipo = $4, secuencia_patron = $5
         WHERE etiqueta_id = $6 AND empleado_id = $7 RETURNING *`,
        [nombre, rango_horas, color, tipo, secuencia_patron ? JSON.stringify(secuencia_patron) : null, etiqueta_id, empleado_id]
    );
    return result.rows[0];
};

// Eliminar una etiqueta
const deleteEtiqueta = async (etiqueta_id, empleado_id) => {
    const result = await pool.query(
        'DELETE FROM catalogo_etiquetas WHERE etiqueta_id = $1 AND empleado_id = $2 RETURNING *',
        [etiqueta_id, empleado_id]
    );
    return result.rowCount > 0;
};

module.exports = {
    getEtiquetasByEmpleado,
    createEtiqueta,
    updateEtiqueta,
    deleteEtiqueta
};
