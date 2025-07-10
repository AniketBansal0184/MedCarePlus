const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const Cart = require('../models/Cart');
const Coupon = require('../models/Coupon');
const DeleteFeedback = require('../models/DeleteFeedback');
const nodemailer = require('nodemailer');

const isAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access only' });
  }
  next();
};

// PATCH /api/admin/restore-user/:id
router.patch('/restore-user/:id', auth, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !user.isDeleted) {
      return res.status(400).json({ message: 'User not found or already active' });
    }

    user.isDeleted = false;
    user.deletedAt = null;
    user.deletedByAdmin = false;
    await user.save();

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',    
      port: 587,               
      secure: false,            
      auth: {
        user: process.env.MAIL_USER, 
        pass: process.env.MAIL_PASS  
      }
    });

    const html = `
  <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: auto; padding: 20px; background-color: #f9fafb; border: 1px solid #e5e7eb;">
    <div style="text-align: center; margin-bottom: 20px;">
      <img src="https://cdn-icons-png.flaticon.com/512/3771/3771333.png" alt="MediCare+ Logo" width="64" />
      <h2 style="color: #16a34a; margin-top: 10px;">Account Restored</h2>
    </div>

    <p>Hello <strong>${user.name}</strong>,</p>
    <p>We’re happy to inform you that your <strong>MediCare+</strong> account has been successfully <strong>restored</strong> by our admin team.</p>
    <p>You can now log in and continue using our services as usual.</p>
    <p>If you have any questions or face any issues, feel free to reach out to our support team.</p>

    <p style="color: #6b7280; font-size: 12px; margin-top: 30px; text-align: center;">
      © ${new Date().getFullYear()} MediCare+. All rights reserved.
    </p>
  </div>
`;


    await transporter.sendMail({
      from: `"MediCare+" <${process.env.MAIL_USER}>`,
      to: user.email,
      subject: '✅ Your Account Has Been Restored',
      html,
    });

    res.json({ message: 'User restored and email sent' });
  } catch (err) {
    console.error('Restore User Error:', err);
    res.status(500).json({ message: 'Failed to restore user' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const users = await User.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(); // to allow direct field adding

    const userIds = users.map(u => u._id.toString());

    const feedbacks = await DeleteFeedback.find({
      userId: { $in: userIds },
    }).lean();

    const feedbackMap = {};
    feedbacks.forEach((f) => {
      feedbackMap[f.userId] = {
        rating: f.rating,
        feedback: f.feedback,
        deletedAt: f.createdAt,
      };
    });

    const usersWithFeedback = users.map(u => {
      const extra = feedbackMap[u._id.toString()];
      if (extra) {
        u.feedback = extra.feedback;
        u.rating = extra.rating;
        u.deletedAt = extra.deletedAt;
        u.isDeleted = true;
        u.deletedByAdmin = false;
      }
      return u;
    });

    const totalCount = await User.countDocuments();
    const hasMore = skip + limit < totalCount;

    res.json({
      users: usersWithFeedback,
      hasMore,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


router.delete('/user/:id', auth, isAdmin, async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isDeleted = true;
    user.deletedAt = new Date();
    user.deletedByAdmin = true;
    await user.save();

    await Cart.deleteOne({ userId });
    await Coupon.updateMany({ usedBy: userId }, { $pull: { usedBy: userId } });

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',    
      port: 587,               
      secure: false,            
      auth: {
        user: process.env.MAIL_USER, 
        pass: process.env.MAIL_PASS  
      }
    });

    const html = `
  <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: auto; padding: 20px; background-color: #f9fafb; border: 1px solid #e5e7eb;">
    <div style="text-align: center; margin-bottom: 20px;">
      <img src="https://cdn-icons-png.flaticon.com/512/3771/3771333.png" alt="MediCare+ Logo" width="64" />
      <h2 style="color: #dc2626; margin-top: 10px;">Account Deactivated</h2>
    </div>

    <p>Hello <strong>${user.name}</strong>,</p>
    <p>We would like to inform you that your MediCare+ account has been <strong>deactivated by our administrator</strong> due to a violation of our platform’s guidelines or terms of use.</p>
    <p>If you believe this was a mistake, please contact our support team.</p>
    <p>You are free to create a new account, but ensure compliance with our policies to avoid future issues.</p>

    <p style="color: #6b7280; font-size: 12px; margin-top: 30px; text-align: center;">
      © ${new Date().getFullYear()} MediCare+. All rights reserved.
    </p>
  </div>
`;


    await transporter.sendMail({
      from: `"MediCare+" <${process.env.MAIL_USER}>`,
      to: user.email,
      subject: '⚠️ Your Account Has Been Deactivated by Admin',
      html,
    });

    res.json({ message: 'User soft-deleted, cleaned up, and email sent' });
  } catch (err) {
    console.error('Admin Delete Error:', err);
    res.status(500).json({ message: 'Error deleting user' });
  }
});


// Promote or demote user
router.patch('/user/:id/role', auth, isAdmin, async (req, res) => {
  const { role } = req.body;
  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  try {
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    res.json({ message: `User role updated to ${role}`, user });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update role' });
  }
});

module.exports = router;
