const pool = require('../config/db');
const crypto = require('crypto');
const bcrypt = require('bcrypt'); // 🔐 Necesario para encriptar al crear

// 1. LEER TODOS (Ya lo tenías, lo dejamos igual)
const getEmpleados = async () => {
  const result = await pool.query('SELECT * FROM empleados');
  return result.rows;
};

// 2. LEER UNO POR ID (Nuevo)
const getEmpleadoById = async (id) => {
  const result = await pool.query('SELECT * FROM empleados WHERE empleado_id = $1', [id]);
  return result.rows[0];
};

// 3. CREAR EMPLEADO (¡Con Hash de contraseña!) 🆕
const createEmpleado = async (nombre, correo, password, puesto_id) => {
  const id = crypto.randomUUID();

  // Encriptamos la contraseña antes de guardarla (10 rondas de sal)
  const passwordHash = await bcrypt.hash(password, 10);

  const query = `
        INSERT INTO empleados (empleado_id, nombre_empleado, correo_empleado, password_hash, puesto_empleado_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING empleado_id, nombre_empleado, correo_empleado, puesto_empleado_id`; // ¡Ojo! No devolvemos el hash por seguridad

  const values = [id, nombre, correo, passwordHash, puesto_id];
  const result = await pool.query(query, values);
  return result.rows[0];
};

// 4. ACTUALIZAR EMPLEADO 🆕
const updateEmpleado = async (id, nombre, correo) => {
  const query = `
        UPDATE empleados
        SET nombre_empleado = $1, correo_empleado = $2
        WHERE empleado_id = $3
        RETURNING empleado_id, nombre_empleado, correo_empleado`;

  const values = [nombre, correo, id];
  const result = await pool.query(query, values);
  return result.rows[0];
};

// 5. ELIMINAR EMPLEADO 🆕
const deleteEmpleado = async (id) => {
  const query = 'DELETE FROM empleados WHERE empleado_id = $1 RETURNING *';
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

const verifyCredentials = async (email, password) => {
  // A. Buscamos por EMAIL, no por ID
  const query = 'SELECT * FROM empleados WHERE correo_empleado = $1';
  const result = await pool.query(query, [email]);

  const user = result.rows[0];

  // B. Si no existe el usuario, retornamos null
  if (!user) return null;

  // C. Comparamos la contraseña que nos dieron con el Hash de la DB
  const isMatch = await bcrypt.compare(password, user.password_hash);

  if (!isMatch) return null; // Contraseña incorrecta

  // D. Retornamos el usuario (¡Sin el hash por seguridad!)
  const { password_hash, ...userWithoutPass } = user;
  return userWithoutPass;
};

module.exports = {
  getEmpleados,
  getEmpleadoById,
  createEmpleado,
  updateEmpleado,
  deleteEmpleado,
  verifyCredentials
};