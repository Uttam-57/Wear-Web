import nodemailer from 'nodemailer';
import  AppError  from './appError.js';
import logger from './logger.js';

const createTransporter = () =>
  nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });

/**
 * Send an email.
 * @param {string} to - recipient email address
 * @param {string} subject
 * @param {string} html - HTML email body
 */
export const sendEmail = async (to, subject, html) => {
   if (process.env.NODE_ENV === 'test') return;
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"WearWeb" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    logger.info(`[EMAIL] Sent → ${to} | Subject: ${subject}`);
  } catch (err) {
    logger.error(`[EMAIL] Failed → ${to} | ${err.message}`);
    throw new AppError('Failed to send email', 500, 'SERVER_ERROR');
  }
};

// ─── Email Templates ──────────────────────────────────────────────────────────

export const passwordResetTemplate = (resetLink) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #333;">Reset Your Password</h2>
    <p>You requested a password reset for your WearWeb account.</p>
    <p>Click the button below to reset your password. This link expires in <strong>1 hour</strong>.</p>
    <a href="${resetLink}"
      style="display: inline-block; padding: 12px 24px; background-color: #000;
             color: #fff; text-decoration: none; border-radius: 4px; margin: 16px 0;">
      Reset Password
    </a>
    <p style="color: #666; font-size: 13px;">
      If you did not request this, ignore this email. Your password will not change.
    </p>
    <p style="color: #666; font-size: 13px;">
      Or copy this link: <a href="${resetLink}">${resetLink}</a>
    </p>
  </div>
`;

export const deliveryOtpTemplate = (otp, orderDetails) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #333;">Delivery Confirmation OTP</h2>
    <p>Your order is out for delivery. Share this OTP with the delivery agent to confirm receipt.</p>
    <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px;
                text-align: center; padding: 24px; background: #f5f5f5;
                border-radius: 8px; margin: 16px 0;">
      ${otp}
    </div>
    <p><strong>Order ID:</strong> ${orderDetails.orderId}</p>
    <p>This OTP expires in <strong>10 minutes</strong>.</p>
    <p style="color: #666; font-size: 13px;">
      Do not share this OTP with anyone other than the delivery agent at your door.
    </p>
  </div>
`;

export const returnPickupOtpTemplate = (otp, orderDetails) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #333;">Return Pickup OTP</h2>
    <p>Your return request has been approved and pickup is being arranged.</p>
    <p>Share this OTP with the pickup agent when your return item is collected.</p>
    <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px;
                text-align: center; padding: 24px; background: #f5f5f5;
                border-radius: 8px; margin: 16px 0;">
      ${otp}
    </div>
    <p><strong>Order ID:</strong> ${orderDetails.orderId}</p>
    <p>This OTP expires in <strong>10 minutes</strong>.</p>
    <p style="color: #666; font-size: 13px;">
      Do not share this OTP before the pickup agent arrives.
    </p>
  </div>
`;