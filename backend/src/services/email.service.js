const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail', // or your preferred service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS // Gmail app password
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
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Notebook Hub - Order #${orderId} Update`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #2563eb;">Order Update</h2>
        <p>Your order <strong>#${orderId}</strong> status has been updated to: <span style="color: #2563eb; font-weight: bold; text-transform: uppercase;">${status}</span></p>
        ${note ? `<p><strong>Note from seller:</strong> ${note}</p>` : ''}
        
        ${otp ? `
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; border: 1px dashed #2563eb;">
          <p style="margin: 0 0 10px 0; color: #64748b; font-size: 14px;">Delivery Verification OTP:</p>
          <div style="font-size: 28px; font-weight: 700; letter-spacing: 4px; color: #2563eb;">${otp}</div>
          <p style="margin: 10px 0 0 0; color: #64748b; font-size: 12px;">Please provide this code to the delivery person only after you receive your items.</p>
        </div>
        ` : ''}

        <p>You can track your order live on our website.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #666;">Thank you for shopping with Notebook Hub!</p>
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
