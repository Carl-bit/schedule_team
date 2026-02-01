// services/empleado.service.js
const pool = require('../config/db');

const obtenerTodos = async () => {
  // CAMBIO: En lugar de *, listamos explícitamente las columnas públicas
  const query = `
    SELECT 
      empleado_id, 
      nombre_empleado, 
      correo_empleado, 
      puesto_empleado_id 
    FROM empleados
  `;

  const resultado = await pool.query(query);
  return resultado.rows;
};

module.exports = {
  obtenerTodos
};