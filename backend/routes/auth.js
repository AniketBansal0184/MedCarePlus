const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendVerificationMail = require('../utils/sendVerificationMail');
const router = express.Router();
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',    
  port: 587,               
  secure: false,            
  auth: {
    user: process.env.MAIL_USER, 
    pass: process.env.MAIL_PASS  
  }
});
const axios = require('axios');
require('dotenv').config();
const otpStore = new Map();
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

router.post('/register', async (req, res) => {
  const { name, email, phone, password } = req.body;
  try {
    let user = await User.findOne({ email });

    if (user) {
      if (user.verified) {
        return res.status(400).json({ message: 'User already exists. Please login.' });
      } else {
        await sendVerificationMail(user, 'http://172.20.10.2:5000');
        return res.status(409).json({ message: 'Account not verified. Verification email resent.' });
      }
    }

    const hashed = await bcrypt.hash(password, 10);
    user = new User({ name, email, phone, password: hashed });
    await user.save();

    await sendVerificationMail(user, 'http://172.20.10.2:5000');
    res.status(201).json({ message: 'Verification email sent. Please verify to continue.' });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed' });
  }
});

// Email verification route
router.get('/verify/:token', async (req, res) => {
  try {
    const decoded = jwt.verify(req.params.token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) return res.status(404).send('User not found');

    user.verified = true;
    await user.save();

    res.send('✅ Email verified! You can now login.');
  } catch (err) {
    res.status(400).send('Invalid or expired token');
  }
});


// Login with verification check
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found. Please sign up first.' });
    }

    if (!user.verified) {
      return res.status(403).json({ message: 'Please verify your email first' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: 'Incorrect password' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    const { _id, name, phone } = user;

    res.json({
      token,
      user: { _id, name, email, phone }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

router.post('/forgotpassword', async (req, res) => {
  console.log('Received request to /forgotpassword with body:', req.body);
  const { email } = req.body;
  try {
    const startQuery = Date.now();
    const user = await User.findOne({ email });
    console.log(`MongoDB query took: ${Date.now() - startQuery}ms`);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const otp = generateOTP();
    otpStore.set(email, { otp, expires: Date.now() + 10 * 60 * 1000 });
    console.log(`Generated OTP for ${email}: ${otp}`);

    const startEmail = Date.now();
    await transporter.sendMail({
      from: `"MediCare+" <${process.env.MAIL_USER}>`,
      to: email,
      subject: 'Password Reset OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
          <h2 style="color: #0284c7;">MediCare+ Password Reset</h2>
          <p>Dear ${user.name || 'User'},</p>
          <p>Your OTP for resetting your password is:</p>
          <h3 style="color: #16a34a;">${otp}</h3>
          <p>This OTP is valid for 10 minutes. Please use it to reset your password.</p>
          <p>If you did not request this, please ignore this email.</p>
          <p>Best regards,<br>MediCare+ Team</p>
        </div>
      `,
    });
    console.log(`Email sending took: ${Date.now() - startEmail}ms`);

    res.json({ message: 'OTP sent to your email' });
  } catch (err) {
    console.error('Forgot Password Error:', err);
    res.status(500).json({ message: 'Failed to send OTP', details: err.message });
  }
});

// Verify OTP Endpoint
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  try {
    const stored = otpStore.get(email);
    if (!stored) {
      return res.status(400).json({ message: 'OTP not found or expired' });
    }
    if (stored.expires < Date.now()) {
      otpStore.delete(email);
      return res.status(400).json({ message: 'OTP expired' });
    }
    if (stored.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }
    res.json({ message: 'OTP verified successfully' });
  } catch (err) {
    console.error('Verify OTP Error:', err);
    res.status(500).json({ message: 'Failed to verify OTP' });
  }
});

// Reset Password Endpoint
router.post('/reset-password', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!otpStore.has(email)) {
      return res.status(400).json({ message: 'OTP not verified' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    otpStore.delete(email);

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('Reset Password Error:', err);
    res.status(500).json({ message: 'Failed to reset password' });
  }
});


module.exports = router;
