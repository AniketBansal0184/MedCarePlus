const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

const sendVerificationMail = async (user) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
  const baseUrl = 'http://172.20.10.2:5000';
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  const url = `${baseUrl}/api/auth/verify/${token}`;

  await transporter.sendMail({
    from: `"MediCare+" <${process.env.MAIL_USER}>`,
    to: user.email,
    subject: 'Verify your email for MediCare+',
    html: `
  <div style="font-family: 'Segoe UI', sans-serif; background-color: #f0f4f8; padding: 30px;">
    <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 0 15px rgba(0,0,0,0.1);">
      <div style="background-color: #0284c7; padding: 20px 40px;">
        <img src="https://cdn-icons-png.flaticon.com/512/3771/3771333.png" alt="MediCare+" style="height: 50px;">
        <h1 style="color: #ffffff; font-size: 24px; margin: 10px 0 0;">Welcome to MediCare+</h1>
      </div>
      <div style="padding: 30px 40px;">
        <p style="font-size: 16px; color: #334155;">Hi ${user.name},</p>
        <p style="font-size: 15px; color: #475569;">
          Thank you for registering with <strong>MediCare+</strong>. To complete your registration, please verify your email address by clicking the button below.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${url}" style="background-color: #0284c7; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Verify Email</a>
        </div>
        <p style="font-size: 14px; color: #64748b;">
          If the button doesn't work, copy and paste the following link into your browser:<br>
          <a href="${url}" style="color: #0284c7;">${url}</a>
        </p>
        <p style="font-size: 13px; color: #9ca3af; margin-top: 30px;">This link is valid for 24 hours. If you did not request this, you can safely ignore this email.</p>
      </div>
      <div style="background-color: #f1f5f9; text-align: center; padding: 16px;">
        <p style="font-size: 12px; color: #94a3b8;">© ${new Date().getFullYear()} MediCare+. All rights reserved.</p>
      </div>
    </div>
  </div>
`
  });
};

module.exports = sendVerificationMail;
