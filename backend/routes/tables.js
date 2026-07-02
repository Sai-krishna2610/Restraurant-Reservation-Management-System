const express = require('express');
const router = express.Router();
const tableController = require('../controllers/tableController');
const { auth, admin } = require('../middleware/auth');

router.get('/', auth, tableController.getTables);
router.post('/', auth, admin, tableController.createTable);
router.delete('/:id', auth, admin, tableController.deleteTable);

module.exports = router;
