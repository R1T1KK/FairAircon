import React from 'react';
import './Legal.css';

const PrivacyPolicy = () => {
  return (
    <div className="legal-page-container">
      <div className="legal-card">
        <div className="legal-header">
          <h1>Privacy Policy</h1>
          <div className="legal-meta">
            <span><strong>Effective Date:</strong> November 2026</span>
            <span>•</span>
            <span><strong>Business:</strong> Fair Aircon</span>
          </div>
        </div>

        <div className="legal-content">
          <section>
            <p>
              Welcome to <strong>Fair Aircon</strong>. We provide professional air conditioning sales, installation, 
              repair, servicing, and maintenance solutions in Mumbai, India. We value your trust and are committed 
              to protecting your personal privacy.
            </p>
            <p>
              This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information 
              when you use our website or interact with our WhatsApp Business booking and support service.
            </p>
          </section>

          <section>
            <h2>1. Information We Collect</h2>
            <p>We only collect information necessary to schedule, perform, and manage your AC service bookings:</p>
            <ul>
              <li><strong>Contact Information:</strong> Full name, phone number (voice and WhatsApp), and email address.</li>
              <li><strong>Service Address:</strong> Street address, flat/building number, landmark, city, and pincode to enable our technician to reach your premises.</li>
              <li><strong>Booking Details:</strong> Type of service requested (e.g., General Servicing, Deep Cleaning, Repair, Gas Refill, Installation), AC brand/type, preferred appointment date and time slot, and any specific notes or technician instructions.</li>
              <li><strong>Customer Communication:</strong> Messages and requests you send via our WhatsApp Business chat or website support channels.</li>
            </ul>
          </section>

          <section>
            <h2>2. How We Use Your Information</h2>
            <p>We use the collected information strictly for legitimate operational purposes:</p>
            <ul>
              <li>Replying to customer enquiries and providing accurate service quotes.</li>
              <li>Scheduling, dispatching, and executing on-site AC service appointments.</li>
              <li>Sending automated transactional updates via WhatsApp (booking confirmation, technician assignment, estimated arrival time, and digital service receipts).</li>
              <li>Managing warranty records, service history, and customer assistance.</li>
              <li>Improving our service quality and customer experience.</li>
            </ul>
          </section>

          <section>
            <h2>3. Information Sharing & Disclosure</h2>
            <p>
              <strong>We never sell, rent, trade, or monetize your personal information.</strong> Your information is shared only on a strict need-to-know basis with:
            </p>
            <ul>
              <li><strong>Assigned Field Technicians:</strong> Only the essential contact name, phone number, and address required to reach your premises and complete the requested service.</li>
              <li><strong>Infrastructure & Service Providers:</strong> Trusted platforms that facilitate our business operations under strict data confidentiality terms:
                <ul>
                  <li><strong>Meta / WhatsApp Cloud API:</strong> To deliver real-time WhatsApp booking confirmations and customer support messages.</li>
                  <li><strong>Google Workspace & Google Calendar:</strong> For technician scheduling and customer booking logging.</li>
                  <li><strong>Payment Processors (Razorpay):</strong> For secure digital payments (we never store your credit card, debit card, or UPI credentials).</li>
                </ul>
              </li>
              <li><strong>Legal Compliance:</strong> When required by Indian law, legal proceedings, or to protect the safety and rights of Fair Aircon, our customers, or the public.</li>
            </ul>
          </section>

          <section>
            <h2>4. Data Security</h2>
            <p>
              We implement industry-standard technical and organizational security measures to protect your personal 
              data against unauthorized access, alteration, disclosure, or destruction. All data transmissions across 
              our web platform and APIs utilize secure HTTPS/TLS encryption.
            </p>
          </section>

          <section>
            <h2>5. Data Retention & Deletion Rights</h2>
            <p>
              We retain your booking and contact details only as long as necessary to maintain service warranty records 
              and comply with legal and taxation obligations.
            </p>
            <p>
              <strong>Your Right to Delete:</strong> You have the right to request deletion of your personal information 
              from our database at any time. Simply send an email with your registered phone number or email address 
              to our data privacy team at <a href="mailto:ritikxyzxyz@gmail.com">ritikxyzxyz@gmail.com</a>. We will process 
              and confirm deletion within 48 to 72 business hours.
            </p>
          </section>

          <section>
            <h2>6. Contact Us</h2>
            <p>If you have any questions, concerns, or requests regarding this Privacy Policy, please contact us:</p>
            <div className="legal-contact-box">
              <p><strong>Business Name:</strong> Fair Aircon</p>
              <p><strong>Email:</strong> <a href="mailto:ritikxyzxyz@gmail.com">ritikxyzxyz@gmail.com</a></p>
              <p><strong>Phone / WhatsApp:</strong> +91 9137860398 / +91 9820454487</p>
              <p><strong>Location:</strong> Mumbai, Maharashtra, India</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
