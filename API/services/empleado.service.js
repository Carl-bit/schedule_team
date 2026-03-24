const pool = require('../config/db');
const crypto = require('crypto');
const bcrypt = require('bcrypt'); // 🔐 Necesario para encriptar al crear

// 1. LEER TODOS (Ya lo tenías, lo dejamos igual)
const getEmpleados = async () => {
  const result = await pool.query(`SELECT 
                                  e.empleado_id,
                                  e.nombre_empleado, 
                                  e.alias_empleado,    
                                  e.telefono_empleado, 
                                  e.correo_empleado, 
                                  c.puesto_empleado    
                                FROM empleados e 
                                LEFT JOIN catalogo_empleado c ON e.puesto_empleado_id = c.puesto_empleado_id;`);
  return result.rows;
};

// 2. LEER UNO POR ID (Nuevo)
const getEmpleadoById = async (id) => {
  const result = await pool.query(`SELECT 
                                  e.empleado_id,
                                  e.nombre_empleado, 
                                  e.alias_empleado,    
                                  e.telefono_empleado, 
                                  e.correo_empleado, 
                                  c.puesto_empleado    
                                FROM empleados e 
                                LEFT JOIN catalogo_empleado c ON e.puesto_empleado_id = c.puesto_empleado_id 
                                WHERE e.empleado_id = $1;`, [id]);
  return result.rows[0];
};

// 3. CREAR EMPLEADO (¡Con Hash de contraseña!) 🆕
const createEmpleado = async (nombre, correo, password, alias, telefono, puesto_id) => {
  const id = crypto.randomUUID();

  // Encriptamos la contraseña antes de guardarla (10 rondas de sal)
  const passwordHash = await bcrypt.hash(password, 10);

  const query = `
        INSERT INTO empleados (empleado_id, nombre_empleado, correo_empleado, password_hash, alias_empleado, telefono_empleado, puesto_empleado_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING empleado_id, nombre_empleado, correo_empleado, alias_empleado, telefono_empleado, puesto_empleado_id`; // ¡Ojo! No devolvemos el hash por seguridad

  const values = [id, nombre, correo, passwordHash, alias, telefono, puesto_id];
  const result = await pool.query(query, values);
  return result.rows[0];
};

// 4. ACTUALIZAR EMPLEADO 🆕
const updateEmpleado = async (id, data) => {
  const { nombre_empleado, alias_empleado, telefono_empleado, correo_empleado, puesto_empleado_id } = data;

  const query = `
        UPDATE empleados
        SET nombre_empleado = COALESCE($1, nombre_empleado),
            alias_empleado = COALESCE($2, alias_empleado),
            telefono_empleado = COALESCE($3, telefono_empleado),
            correo_empleado = COALESCE($4, correo_empleado),
            puesto_empleado_id = COALESCE($5, puesto_empleado_id)
        WHERE empleado_id = $6
        RETURNING empleado_id, nombre_empleado, alias_empleado, telefono_empleado, correo_empleado, puesto_empleado_id`;

  const values = [nombre_empleado, alias_empleado, telefono_empleado, correo_empleado, puesto_empleado_id, id];
  const result = await pool.query(query, values);
  return result.rows[0];
};

// 4.1 ACTUALIZAR CONTRASEÑA 🆕
const updatePassword = async (id, newPassword) => {
  // 1. Generamos el Hash (Igual que en el registro)
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(newPassword, saltRounds);

  // 2. Actualizamos SOLO el campo password_hash
  const query = `
    UPDATE empleados
    SET password_hash = $1
    WHERE empleado_id = $2
    RETURNING empleado_id
  `;

  const values = [passwordHash, id];
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
  const query = 'SELECT e.empleado_id, e.nombre_empleado, e.alias_empleado, e.telefono_empleado, e.password_hash, e.correo_empleado, e.puesto_empleado_id, c.puesto_empleado FROM empleados e LEFT JOIN catalogo_empleado c ON e.puesto_empleado_id = c.puesto_empleado_id WHERE e.correo_empleado = $1;';
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
  verifyCredentials,
  updatePassword
};