const Booking = require('../models/Booking');
const { getIO } = require('../config/socket');

// @desc    Get technician's assigned jobs
// @route   GET /api/technician/jobs
exports.getMyJobs = async (req, res, next) => {
  try {
    const jobs = await Booking.find({ technician: req.user._id })
      .populate('user', 'name email phone')
      .populate('service', 'name category')
      .sort('scheduledDate');

    res.json({ success: true, count: jobs.length, jobs });
  } catch (error) {
    next(error);
  }
};

// @desc    Update job status and notes
// @route   PUT /api/technician/jobs/:id/status
exports.updateJobStatus = async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    
    // verify the job belongs to this technician
    const job = await Booking.findById(req.params.id).populate('technician', 'name phone');
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    if (!job.technician || job.technician._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this job' });
    }

    if (status) job.status = status;
    if (notes) job.notes = notes;

    await job.save();

    // Broadcast update via Socket.io
    try {
      const io = getIO();
      io.to(`booking_${job._id}`).emit('status_update', {
        status: job.status,
        technician: job.technician,
        updatedAt: job.updatedAt
      });
    } catch (socketErr) {
      console.error('Socket notification failed:', socketErr.message);
    }

    res.json({ success: true, job });
  } catch (error) {
    next(error);
  }
};
