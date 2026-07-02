const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const { auth, admin } = require('../middleware/auth');

router.post('/', auth, reservationController.createReservation);
router.get('/available-tables', auth, reservationController.getAvailableTables);
router.get('/', auth, reservationController.getCustomerReservations);
router.get('/all', auth, admin, reservationController.getAllReservations);
router.put('/:id', auth, admin, reservationController.updateReservation);
router.delete('/:id', auth, reservationController.cancelReservation);

module.exports = router;
