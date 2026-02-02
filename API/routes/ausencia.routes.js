const express = require('express');
const router = express.Router();
const ausenciaController = require('../controllers/ausencia.controller');

router.get('/', ausenciaController.getAusencias);
router.post('/', ausenciaController.createAusencia);
router.delete('/:id', ausenciaController.deleteAusencia);

module.exports = router;