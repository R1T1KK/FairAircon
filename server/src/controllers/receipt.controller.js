const PDFDocument = require('pdfkit');
const Booking = require('../models/Booking');

// @desc    Download PDF receipt for a completed booking
// @route   GET /api/bookings/:id/receipt
exports.downloadReceipt = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('service', 'name category')
      .populate('technician', 'name phone');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Only the booking owner or admin can download
    if (
      booking.user._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Receipt only available for completed bookings' });
    }

    // Create PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=FairAircon-Receipt-${booking._id}.pdf`
    );
    doc.pipe(res);

    // ─── HEADER ───────────────────────────────────────────────────────────────
    doc
      .rect(0, 0, doc.page.width, 100)
      .fill('#1e86e9');

    doc
      .fill('white')
      .font('Helvetica-Bold')
      .fontSize(26)
      .text('Fair Aircon', 50, 30);

    doc
      .font('Helvetica')
      .fontSize(11)
      .text('Professional AC Service & Repair', 50, 62);

    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .text('SERVICE RECEIPT', doc.page.width - 190, 38, { align: 'right' })
      .font('Helvetica')
      .fontSize(10)
      .text(`Receipt #: ${booking._id.toString().slice(-8).toUpperCase()}`, doc.page.width - 190, 58, { align: 'right' })
      .text(`Date: ${new Date(booking.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`, doc.page.width - 190, 74, { align: 'right' });

    doc.moveDown(4);

    // ─── STATUS BADGE ─────────────────────────────────────────────────────────
    doc
      .rect(50, 115, 120, 28)
      .fill('#dcfce7');
    doc
      .fill('#166534')
      .font('Helvetica-Bold')
      .fontSize(11)
      .text('✔ COMPLETED', 58, 122);

    doc.moveDown(2);

    // ─── DIVIDER ──────────────────────────────────────────────────────────────
    const drawDivider = (y) => {
      doc.moveTo(50, y).lineTo(doc.page.width - 50, y).stroke('#e2e8f0');
    };

    const drawSection = (title, y) => {
      doc
        .fill('#1e86e9')
        .font('Helvetica-Bold')
        .fontSize(12)
        .text(title, 50, y);
      drawDivider(y + 18);
    };

    const drawRow = (label, value, y, highlight = false) => {
      doc
        .fill('#64748b')
        .font('Helvetica')
        .fontSize(10)
        .text(label, 50, y);
      doc
        .fill(highlight ? '#1e86e9' : '#1e293b')
        .font(highlight ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(highlight ? 13 : 10)
        .text(value, 200, y, { width: 330, align: 'right' });
    };

    // ─── CUSTOMER INFO ────────────────────────────────────────────────────────
    let y = 160;
    drawSection('Customer Information', y);
    y += 28;
    drawRow('Name', booking.user.name, y); y += 20;
    drawRow('Email', booking.user.email, y); y += 20;
    drawRow('Phone', booking.user.phone || '—', y); y += 30;

    // ─── SERVICE DETAILS ──────────────────────────────────────────────────────
    drawSection('Service Details', y);
    y += 28;
    drawRow('Service', booking.service.name, y); y += 20;
    drawRow('Category', booking.service.category || '—', y); y += 20;
    drawRow('Scheduled Date', new Date(booking.scheduledDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }), y); y += 20;
    drawRow('Time Slot', booking.timeSlot, y); y += 20;

    if (booking.technician) {
      drawRow('Technician', booking.technician.name, y); y += 20;
    }
    y += 10;

    // ─── ADDRESS ──────────────────────────────────────────────────────────────
    drawSection('Service Address', y);
    y += 28;
    const addr = booking.address;
    doc.fill('#1e293b').font('Helvetica').fontSize(10)
      .text(`${addr.street}, ${addr.city}, ${addr.state} — ${addr.pincode}`, 50, y, { width: 490 });
    y += 30;

    if (booking.notes) {
      drawRow('Notes', booking.notes, y); y += 20;
    }
    y += 10;

    // ─── PAYMENT SUMMARY ──────────────────────────────────────────────────────
    drawSection('Payment Summary', y);
    y += 28;

    doc.rect(50, y, doc.page.width - 100, 50).fill('#f8fafc');
    drawRow('Payment Status', booking.paymentStatus.toUpperCase(), y + 10);
    drawRow('Total Amount', `Rs. ${booking.totalAmount}`, y + 26, true);
    y += 70;

    // ─── THANK YOU ────────────────────────────────────────────────────────────
    drawDivider(y);
    y += 20;

    doc
      .fill('#64748b')
      .font('Helvetica')
      .fontSize(10)
      .text('Thank you for choosing Fair Aircon! We hope you enjoyed our service.', 50, y, { align: 'center', width: doc.page.width - 100 });

    y += 20;
    doc
      .fill('#1e86e9')
      .font('Helvetica-Bold')
      .fontSize(10)
      .text('For support: Fairaircon777@gmail.com  |  www.fairaircon.com', 50, y, { align: 'center', width: doc.page.width - 100 });

    // ─── FOOTER ───────────────────────────────────────────────────────────────
    const footerY = doc.page.height - 50;
    doc.rect(0, footerY, doc.page.width, 50).fill('#1e86e9');
    doc.fill('white').font('Helvetica').fontSize(9)
      .text(`© ${new Date().getFullYear()} Fair Aircon AC Services. All rights reserved.`, 50, footerY + 18, { align: 'center', width: doc.page.width - 100 });

    doc.end();
  } catch (error) {
    next(error);
  }
};
