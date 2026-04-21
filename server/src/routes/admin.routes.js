const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  getDashboard,
  getAllBookings,
  updateBooking,
  createService,
  updateService,
  deleteService,
  getUsers,
  getTechnicians,
  updateUserRole
} = require('../controllers/admin.controller');

// All admin routes are protected
router.use(protect, adminOnly);

router.get('/dashboard', getDashboard);
router.get('/bookings', getAllBookings);
router.put('/bookings/:id', updateBooking);
router.post('/services', createService);
router.put('/services/:id', updateService);
router.delete('/services/:id', deleteService);
router.get('/users', getUsers);
router.get('/technicians', getTechnicians);
router.put('/users/:id/role', updateUserRole);

module.exports = router;
