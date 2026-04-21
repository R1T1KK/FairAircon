const express = require('express');
const router = express.Router();
const { getServices, getService } = require('../controllers/service.controller');

router.get('/', getServices);
router.get('/:id', getService);

module.exports = router;
