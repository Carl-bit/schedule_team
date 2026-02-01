// controllers/empleado.controller.js
const empleadoService = require('../services/empleado.service');

const getEmpleados = async (req, res) => {
    try {
        // 1. Llamamos al servicio (abstracción)
        const empleados = await empleadoService.obtenerTodos();

        // 2. Respondemos
        res.status(200).json(empleados);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno al obtener empleados' });
    }
};

module.exports = {
    getEmpleados
};