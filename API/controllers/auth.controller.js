const empleadoService = require('../services/empleado.service');
const { obtenerFraseAleatoria } = require('../utils/naas/naas');

const loginEmpleado = async (req, res) => {
    try {
        const { correo, password } = req.body;

        // 1. Buscamos al usuario
        const user = await empleadoService.verifyCredentials(correo, password);
        const frase = obtenerFraseAleatoria();

        if (!user) {
            return res.status(401).json({ error: frase });
        }

        // 2. Lógica de Roles (Tu aporte estrella ⭐)
        // Definimos el valor de la cookie según el puesto
        let roleValue = 'trabajador'; // Valor por defecto

        if (user.puesto_empleado_id === 'PUESTO_JEFE') {
            roleValue = 'lider';
        }

        // 3. Guardamos la Cookie
        // Usamos la variable roleValue que acabamos de calcular
        res.setHeader('Set-Cookie', `user_role=${roleValue}; Path=/; Max-Age=86400; HttpOnly; Secure`);

        // 4. Respondemos al Frontend
        res.json({
            mensaje: "¡Bienvenido!",
            user: user
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: frase });
    }
};

// En auth.controller.js

const logout = (req, res) => {
    // Sobrescribimos la cookie con tiempo de vida 0 (muerte instantánea)
    res.setHeader('Set-Cookie', 'user_role=; Path=/; Max-Age=0; HttpOnly; Secure');

    res.json({ mensaje: "Sesión cerrada exitosamente" });
};

// ¡No olvides exportarla al final!
module.exports = { loginEmpleado, logout };