const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verify connection configuration
transporter.verify(function (error, success) {
  if (error) {
    console.error('CRITICAL: Email Transporter Error:', error);
  } else {
    console.log('Email Transporter is ready to send messages');
  }
});

/**
 * Send OTP via Email
 */
const sendEmailOTP = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Notebook Hub - Your OTP Verification Code',
    html: `
      <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #2563eb; margin: 0; font-size: 24px;">Notebook Hub</h1>
          <p style="color: #64748b; margin-top: 4px;">Premium Stationery & Notebooks</p>
        </div>
        <div style="background: #f8fafc; padding: 24px; border-radius: 8px; text-align: center;">
          <p style="color: #1e293b; font-size: 16px; margin-bottom: 16px;">Your verification code is:</p>
          <div style="font-size: 32px; font-weight: 700; letter-spacing: 4px; color: #2563eb; margin-bottom: 16px;">${otp}</div>
          <p style="color: #64748b; font-size: 14px;">This code will expire in 10 minutes. Please do not share this code with anyone.</p>
        </div>
        <div style="margin-top: 24px; text-align: center; font-size: 12px; color: #94a3b8;">
          <p>If you didn't request this code, you can safely ignore this email.</p>
          <p style="margin-top: 8px;">&copy; 2026 Notebook Hub. All rights reserved.</p>
        </div>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};

/**
 * Send Invoice via Email
 */
const sendInvoiceEmail = async (email, order, pdfBuffer) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Order #${order._id || order.id} - Your Invoice from Notebook Hub`,
    text: `Hello ${order.name || 'Customer'},\n\nPlease find attached the invoice for your order #${order._id || order.id}.\n\nThank you for shopping with us!`,
    attachments: [
      {
        filename: `Invoice-${order._id || order.id}.pdf`,
        content: pdfBuffer
      }
    ]
  };

  return transporter.sendMail(mailOptions);
};

/**
 * Send Order Status Update Email
 */
const sendStatusUpdateEmail = async (email, orderId, status, note = '', otp = null) => {
  console.log(`Preparing status update email: To=${email}, Order=${orderId}, Status=${status}, OTP=${otp || 'None'}`);
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Notebook Hub - Order #${orderId} Update`,
    html: `
      <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff; color: #1e293b;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h2 style="color: #2563eb; margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 1px;">Order Update</h2>
          <div style="height: 2px; width: 40px; background: #2563eb; margin: 12px auto;"></div>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6;">Your order <strong style="color: #2563eb;">#${orderId}</strong> status has been updated to:</p>
        
        <div style="background: #eff6ff; color: #1d4ed8; padding: 12px 24px; border-radius: 8px; display: inline-block; font-weight: 700; text-transform: uppercase; margin: 16px 0; font-size: 14px; border: 1px solid #bfdbfe;">
          ${status}
        </div>

        ${note ? `
        <div style="background: #f8fafc; padding: 16px; border-radius: 8px; border-left: 4px solid #cbd5e1; margin: 16px 0;">
          <p style="margin: 0; font-style: italic; color: #475569;">"${note}"</p>
        </div>` : ''}
        
        ${otp ? `
        <div style="background: #fff7ed; padding: 24px; border-radius: 12px; text-align: center; margin: 24px 0; border: 1px solid #fed7aa;">
          <p style="margin: 0 0 12px 0; color: #9a3412; font-size: 14px; font-weight: 600;">Delivery Verification OTP:</p>
          <div style="font-size: 36px; font-weight: 800; letter-spacing: 6px; color: #c2410c;">${otp}</div>
          <p style="margin: 12px 0 0 0; color: #9a3412; font-size: 12px; opacity: 0.8;">Share this code with the delivery partner upon arrival.</p>
        </div>
        ` : ''}

        <p style="font-size: 14px; color: #64748b; margin-top: 32px;">You can track your order progress directly on the <a href="${process.env.FRONTEND_URL || 'http://localhost:8080'}/my-orders" style="color: #2563eb; text-decoration: none; font-weight: 600;">Notebook Hub</a> dashboard.</p>
        
        <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #f1f5f9; text-align: center;">
          <p style="font-size: 14px; color: #94a3b8; margin: 0;">Thank you for choosing premium quality.</p>
          <p style="font-size: 12px; color: #2563eb; font-weight: 600; margin-top: 8px;">&copy; 2026 Notebook Hub</p>
        </div>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};

module.exports = {
  sendEmailOTP,
  sendInvoiceEmail,
  sendStatusUpdateEmail
};
