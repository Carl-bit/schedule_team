const express = require('express');
const router = express.Router();
const proyectoController = require('../controllers/proyecto.controller');
const { validate } = require('../middleware/validate');

router.get('/', proyectoController.getProyectos);
router.get('/:id', proyectoController.getProyectoById);
router.post('/', validate(['nombre', 'fecha_inicio']), proyectoController.createProyecto);
router.put('/:id', proyectoController.updateProyecto);
router.delete('/:id', proyectoController.deleteProyecto);

module.exports = router;
