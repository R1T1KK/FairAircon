const express = require('express');
const router = express.Router();
const { getMyJobs, updateJobStatus } = require('../controllers/technician.controller');
const { protect } = require('../middleware/auth');

// Make sure the calling user is truly a tech (though protect gets req.user)
const authorizeTech = (req, res, next) => {
  if (req.user.role !== 'technician') {
    return res.status(403).json({ success: false, message: 'Only technicians can access this route' });
  }
  next();
};

router.use(protect);
router.use(authorizeTech);

router.get('/jobs', getMyJobs);
router.put('/jobs/:id/status', updateJobStatus);

module.exports = router;
