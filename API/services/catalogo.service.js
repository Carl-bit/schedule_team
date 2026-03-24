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

const updatePuesto = async (id, nombre) => {
    const query = 'UPDATE catalogo_empleado SET puesto_empleado = $1 WHERE puesto_empleado_id = $2 RETURNING *';
    const result = await pool.query(query, [nombre, id]);
    return result.rows[0];
};

// --- GESTIÓN DE ROLES ---

const createRol = async (rol_trabajo_id, rol_trabajo) => {
    const id = rol_trabajo_id || crypto.randomUUID();
    const query = `
        INSERT INTO catalogo_roles (rol_trabajo_id, rol_trabajo) 
        VALUES ($1, $2) 
        RETURNING *`;
    const result = await pool.query(query, [id, rol_trabajo]);
    return result.rows[0];
};

const deleteRol = async (id) => {
    const query = 'DELETE FROM catalogo_roles WHERE rol_trabajo_id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
};

const updateRol = async (id, nombre) => {
    const query = 'UPDATE catalogo_roles SET rol_trabajo = $1 WHERE rol_trabajo_id = $2 RETURNING *';
    const result = await pool.query(query, [nombre, id]);
    return result.rows[0];
};

// --- GESTIÓN DE ESTADOS ---

const createEstado = async (estado) => {
    const query = `
        INSERT INTO catalogo_estado (estado) 
        VALUES ($1) 
        RETURNING *`;
    const result = await pool.query(query, [estado]);
    return result.rows[0];
};

const deleteEstado = async (id) => {
    const query = 'DELETE FROM catalogo_estado WHERE estado_id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
};

const updateEstado = async (id, nombre) => {
    const query = 'UPDATE catalogo_estado SET estado = $1 WHERE estado_id = $2 RETURNING *';
    const result = await pool.query(query, [nombre, id]);
    return result.rows[0];
};

// --- GESTIÓN DE TIPOS DE AUSENCIA ---

const createTipoAusencia = async (tipo_id, descripcion, requiere_aprobacion = true) => {
    const id = tipo_id || crypto.randomUUID();
    const query = `
        INSERT INTO catalogo_ausencias (tipo_id, descripcion, requiere_aprobacion) 
        VALUES ($1, $2, $3) 
        RETURNING *`;
    const result = await pool.query(query, [id, descripcion, requiere_aprobacion]);
    return result.rows[0];
};

const deleteTipoAusencia = async (id) => {
    const query = 'DELETE FROM catalogo_ausencias WHERE tipo_id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
};

const updateTipoAusencia = async (id, descripcion, requiere_aprobacion) => {
    const query = 'UPDATE catalogo_ausencias SET descripcion = COALESCE($1, descripcion), requiere_aprobacion = COALESCE($2, requiere_aprobacion) WHERE tipo_id = $3 RETURNING *';
    const result = await pool.query(query, [descripcion, requiere_aprobacion, id]);
    return result.rows[0];
};

module.exports = {
    getRoles,
    getEstados,
    getAusencias,
    getPuestos,
    createPuesto,
    deletePuesto,
    updatePuesto,
    createRol,
    deleteRol,
    updateRol,
    createEstado,
    deleteEstado,
    updateEstado,
    createTipoAusencia,
    deleteTipoAusencia,
    updateTipoAusencia
};