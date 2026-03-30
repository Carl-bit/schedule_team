const empleadoService = require('../services/empleado.service');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { obtenerFraseAleatoria } = require('../utils/naas/naas');

const loginEmpleado = asyncHandler(async (req, res) => {
    const { correo, password } = req.body;
    const user = await empleadoService.verifyCredentials(correo, password);

    if (!user) {
        const frase = obtenerFraseAleatoria();
        return res.status(401).json({ error: frase });
    }

    const roleValue = user.puesto_empleado_id === 'PUESTO_JEFE' ? 'lider' : 'trabajador';
    res.setHeader('Set-Cookie', `user_role=${roleValue}; Path=/; Max-Age=86400; HttpOnly; SameSite=Lax`);

    res.json({ mensaje: "¡Bienvenido!", user });
});

const logout = (req, res) => {
    res.setHeader('Set-Cookie', 'user_role=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax');
    res.json({ mensaje: "Sesión cerrada exitosamente" });
};

module.exports = { loginEmpleado, logout };
