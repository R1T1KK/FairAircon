const Service = require('../models/Service');

// @desc    Get all active services
// @route   GET /api/services
exports.getServices = async (req, res, next) => {
  try {
    const { category } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;

    const services = await Service.find(filter).sort('category');
    res.json({ success: true, count: services.length, services });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single service
// @route   GET /api/services/:id
exports.getService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    res.json({ success: true, service });
  } catch (error) {
    next(error);
  }
};
