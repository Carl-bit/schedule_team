const empleadoService = require('../services/empleado.service');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

const getEmpleados = asyncHandler(async (req, res) => {
    const empleados = await empleadoService.getEmpleados();
    res.json(empleados);
});

const getEmpleadoById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const empleado = await empleadoService.getEmpleadoById(id);
    if (!empleado) throw new AppError("Empleado no encontrado.", 404);
    res.json(empleado);
});

const createEmpleado = asyncHandler(async (req, res) => {
    const { nombre, correo, password, alias, telefono, puesto_id } = req.body;
    const nuevoEmpleado = await empleadoService.createEmpleado(nombre, correo, password, alias, telefono, puesto_id);
    res.status(201).json(nuevoEmpleado);
});

const updateEmpleado = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const empleadoActualizado = await empleadoService.updateEmpleado(id, req.body);
    if (!empleadoActualizado) throw new AppError("No encontré a quién actualizar.", 404);

    if (req.body.correo_empleado) {
        try {
            const emailService = require('../services/email.service');
            await emailService.sendEmailCambio(
                req.body.correo_empleado,
                empleadoActualizado.nombre_empleado || 'Empleado',
                'Correo electrónico',
                new Date().toLocaleString('es-CL')
            );
        } catch (emailErr) {
            console.log('Email no enviado (SMTP no configurado):', emailErr.message);
        }
    }

    res.json(empleadoActualizado);
});

const changePassword = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
        throw new AppError("La contraseña debe tener al menos 6 caracteres.");
    }

    const updated = await empleadoService.updatePassword(id, newPassword);
    if (!updated) throw new AppError("Empleado no encontrado.", 404);

    res.json({ message: "Contraseña actualizada correctamente" });
});

const deleteEmpleado = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const empleadoBorrado = await empleadoService.deleteEmpleado(id);
    if (!empleadoBorrado) throw new AppError("No se pudo borrar (¿quizás no existe?).", 404);
    res.json({ mensaje: "Empleado eliminado correctamente", empleado: empleadoBorrado });
});

const loginEmpleado = asyncHandler(async (req, res) => {
    const { correo, password } = req.body;
    const user = await empleadoService.verifyCredentials(correo, password);

    if (!user) throw new AppError("Credenciales incorrectas.", 401);

    const roleValue = user.puesto_empleado_id.toString() === 'PUESTO_JEFE' ? 'lider' : 'trabajador';
    res.setHeader('Set-Cookie', `user_role=${roleValue}; Path=/; Max-Age=86400; HttpOnly; Secure`);

    res.json({ mensaje: "¡Acceso concedido!", user });
});

module.exports = {
    getEmpleados,
    getEmpleadoById,
    createEmpleado,
    updateEmpleado,
    deleteEmpleado,
    loginEmpleado,
    changePassword
};
