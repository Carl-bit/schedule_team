const pool = require('../config/db');

// Obtener etiquetas: las propias del empleado + las compartidas por el lider
const getEtiquetasByEmpleado = async (empleadoId) => {
    const result = await pool.query(
        'SELECT * FROM catalogo_etiquetas WHERE empleado_id = $1 OR compartida = true',
        [empleadoId]
    );
    return result.rows;
};

// Solo etiquetas compartidas (uso lider/cobertura)
const getEtiquetasCompartidas = async () => {
    const result = await pool.query(
        'SELECT * FROM catalogo_etiquetas WHERE compartida = true ORDER BY nombre'
    );
    return result.rows;
};

// Crear etiqueta (propia o compartida segun flag)
const createEtiqueta = async (etiqueta) => {
    const { etiqueta_id, empleado_id, nombre, rango_horas, color, tipo, secuencia_patron, compartida = false } = etiqueta;
    const result = await pool.query(
        `INSERT INTO catalogo_etiquetas
        (etiqueta_id, empleado_id, nombre, rango_horas, color, tipo, secuencia_patron, compartida)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [etiqueta_id, empleado_id, nombre, rango_horas, color, tipo, secuencia_patron ? JSON.stringify(secuencia_patron) : null, compartida]
    );
    return result.rows[0];
};

// Actualizar etiqueta. Si es compartida (sin empleado_id chequeado) solo se filtra por id.
const updateEtiqueta = async (etiqueta_id, empleado_id, data) => {
    const { nombre, rango_horas, color, tipo, secuencia_patron, compartida } = data;
    const where = empleado_id ? 'etiqueta_id = $6 AND empleado_id = $7' : 'etiqueta_id = $6 AND compartida = true';
    const params = [nombre, rango_horas, color, tipo, secuencia_patron ? JSON.stringify(secuencia_patron) : null, etiqueta_id];
    if (empleado_id) params.push(empleado_id);
    const setCompartida = typeof compartida === 'boolean' ? `, compartida = ${compartida}` : '';
    const result = await pool.query(
        `UPDATE catalogo_etiquetas
         SET nombre = $1, rango_horas = $2, color = $3, tipo = $4, secuencia_patron = $5${setCompartida}
         WHERE ${where} RETURNING *`,
        params
    );
    return result.rows[0];
};

// Eliminar etiqueta. Si no se pasa empleado_id, solo borra las compartidas.
const deleteEtiqueta = async (etiqueta_id, empleado_id) => {
    const sql = empleado_id
        ? 'DELETE FROM catalogo_etiquetas WHERE etiqueta_id = $1 AND empleado_id = $2 RETURNING *'
        : 'DELETE FROM catalogo_etiquetas WHERE etiqueta_id = $1 AND compartida = true RETURNING *';
    const params = empleado_id ? [etiqueta_id, empleado_id] : [etiqueta_id];
    const result = await pool.query(sql, params);
    return result.rowCount > 0;
};

module.exports = {
    getEtiquetasByEmpleado,
    getEtiquetasCompartidas,
    createEtiqueta,
    updateEtiqueta,
    deleteEtiqueta
};
