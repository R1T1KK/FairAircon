import React from 'react';
import './Legal.css';

const Terms = () => {
  return (
    <div className="legal-page-container">
      <div className="legal-card">
        <div className="legal-header">
          <h1>Terms of Service</h1>
          <div className="legal-meta">
            <span><strong>Effective Date:</strong> November 2026</span>
            <span>•</span>
            <span><strong>Business:</strong> Fair Aircon</span>
          </div>
        </div>

        <div className="legal-content">
          <section>
            <p>
              Welcome to <strong>Fair Aircon</strong>. By accessing our website, booking a service through our 
              online portal, or interacting with our automated WhatsApp Business booking assistant, you agree 
              to comply with and be bound by the following Terms of Service.
            </p>
            <p>
              Please read these terms carefully before scheduling any AC service, installation, or repair with us.
            </p>
          </section>

          <section>
            <h2>1. Services Offered</h2>
            <p>
              Fair Aircon provides professional HVAC and air conditioning services in Mumbai and surrounding areas, 
              including:
            </p>
            <ul>
              <li>AC General Servicing & Filter Cleaning</li>
              <li>High-pressure Jet Pump Deep Cleaning</li>
              <li>AC Repair, Diagnostics, and Troubleshooting</li>
              <li>Refrigerant Gas Leak Detection and Gas Refilling</li>
              <li>Split and Window AC Installation & Uninstallation</li>
              <li>Preventative Annual Maintenance & Commercial Support</li>
            </ul>
          </section>

          <section>
            <h2>2. Bookings, Scheduling & Rescheduling</h2>
            <ul>
              <li><strong>Booking Confirmation:</strong> Service appointments booked via our website or WhatsApp are confirmed based on technician availability and time slots.</li>
              <li><strong>Site Access:</strong> The customer agrees to provide safe, unobstructed access to the AC indoor and outdoor units, water source, and standard electrical power points.</li>
              <li><strong>Free Rescheduling:</strong> You can reschedule or cancel your appointment free of charge up to 2 hours before the scheduled time slot by contacting us on WhatsApp or phone.</li>
              <li><strong>Service Delays:</strong> While we endeavor to be punctual, occasional delays may occur due to Mumbai traffic, severe weather, or complex prior jobs. We will keep you informed promptly.</li>
            </ul>
          </section>

          <section>
            <h2>3. Pricing & Payments</h2>
            <ul>
              <li><strong>Transparent Quotations:</strong> Our base service rates are communicated upfront. Any additional spare parts, copper piping, electrical wiring, or specialized bracket work will be quoted before installation.</li>
              <li><strong>Payment Terms:</strong> Payment is due immediately upon satisfactory completion of the requested service.</li>
              <li><strong>Accepted Modes:</strong> We accept cash, UPI (Google Pay, PhonePe, Paytm), and online card payments processed via Razorpay.</li>
            </ul>
          </section>

          <section>
            <h2>4. Service Warranty & Limitation of Liability</h2>
            <ul>
              <li><strong>30-Day Service Warranty:</strong> We provide a 30-day warranty on our repair workmanship. If the same issue reoccurs within 30 days, our technician will inspect and rectify it free of service charge.</li>
              <li><strong>Warranty Exclusions:</strong> Warranty does not cover issues resulting from external electrical voltage surges, water damage, external tampering, or repair attempts by unauthorized third parties after our visit.</li>
              <li><strong>Liability Cap:</strong> To the maximum extent permitted by applicable Indian law, Fair Aircon's total liability for any claim arising from our services is strictly limited to the total service fee paid by the customer for that specific booking.</li>
            </ul>
          </section>

          <section>
            <h2>5. WhatsApp Communication & Notifications</h2>
            <p>
              By providing your mobile number when requesting an enquiry or booking, you consent to receive 
              transactional messages on WhatsApp regarding:
            </p>
            <ul>
              <li>Appointment confirmations, booking IDs, and scheduled time slots.</li>
              <li>Assigned technician details and live status updates.</li>
              <li>Digital invoices, service receipts, and customer satisfaction feedback requests.</li>
            </ul>
            <p>
              We do not send unsolicited promotional spam. You can request to stop non-essential notifications 
              at any time by replying to our WhatsApp chat.
            </p>
          </section>

          <section>
            <h2>6. Governing Law & Jurisdiction</h2>
            <p>
              These Terms of Service are governed by and construed in accordance with the laws of India. Any disputes 
              arising in connection with our services shall be subject to the exclusive jurisdiction of the courts 
              located in Mumbai, Maharashtra.
            </p>
          </section>

          <section>
            <h2>7. Contact Information</h2>
            <p>If you have any questions or require support regarding these Terms of Service, please reach out to us:</p>
            <div className="legal-contact-box">
              <p><strong>Business:</strong> Fair Aircon</p>
              <p><strong>Email:</strong> <a href="mailto:ritikxyzxyz@gmail.com">ritikxyzxyz@gmail.com</a></p>
              <p><strong>Phone / WhatsApp:</strong> +91 9137860398 / +91 9820454487</p>
              <p><strong>Address:</strong> Mumbai, Maharashtra, India</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Terms;
