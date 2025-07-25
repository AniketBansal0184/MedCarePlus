const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const User = require('../models/User');
const Coupon = require('../models/Coupon');
const Order = require('../models/Order');
const generateInvoice = require('../utils/invoiceGenerator');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const DeleteFeedback = require('../models/DeleteFeedback');
const Subscriber = require('../models/Subscriber');

require('dotenv').config();

router.post('/save/:userId', async (req, res) => {
  const { items } = req.body;
  let userId;

  if (!Array.isArray(items)) {
    return res.status(400).json({ error: 'Items must be an array' });
  }

  try {
    userId = new mongoose.Types.ObjectId(req.params.userId);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid User ID format' });
  }

  try {
    const cart = await Cart.findOneAndUpdate(
      { userId },
      { items, updatedAt: Date.now() },
      { upsert: true, new: true }
    );
    res.json({ message: 'Cart saved successfully', cart });
  } catch (err) {
    console.error('Save Cart Error:', err);
    res.status(500).json({ error: 'Failed to save cart' });
  }
});

router.post('/clear/:userId', async (req, res) => {
  let userId;

  try {
    userId = new mongoose.Types.ObjectId(req.params.userId);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid User ID format' });
  }

  try {
    const cart = await Cart.findOneAndUpdate(
      { userId },
      { items: [], updatedAt: Date.now() },
      { upsert: true, new: true }
    );
    res.json({ message: 'Cart cleared successfully', cart });
  } catch (err) {
    console.error('Clear Cart Error:', err);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

router.get('/available-coupons/:userId', async (req, res) => {
  try {
    const { query } = req.query;
    const userId = req.params.userId;
    const regex = new RegExp(query || '', 'i');

    const coupons = await Coupon.aggregate([
      {
        $match: {
          code: { $regex: regex },
          $or: [
            { expiresAt: { $eq: null } },
            { expiresAt: { $gt: new Date() } },
          ],
          usedBy: { $nin: [userId] },
        },
      },
      {
        $match: {
          $or: [
            { maxUses: { $eq: null } },
            { $expr: { $gt: ['$maxUses', { $size: '$usedBy' }] } },
          ],
        },
      },
      {
        $project: {
          code: 1,
          discount: 1,
          _id: 0,
        },
      },
    ]);

    res.json({ coupons });
  } catch (error) {
    console.error('Error fetching available coupons:', error);
    res.status(500).json({ error: 'Failed to fetch coupons' });
  }
});

router.post('/apply-coupon/:userId', async (req, res) => {
  try {
    const { couponCode } = req.body;
    const userId = req.params.userId;

    if (!couponCode) {
      return res.status(400).json({ error: 'Coupon code is required' });
    }

    const coupon = await Coupon.findOne({
      code: couponCode.toUpperCase(),
      $or: [
        { expiresAt: { $eq: null } },
        { expiresAt: { $gt: new Date() } },
      ],
      usedBy: { $nin: [userId] },
    });

    if (!coupon) {
      return res.status(400).json({ error: 'Invalid or expired coupon code' });
    }

    if (coupon.maxUses && coupon.usedBy.length >= coupon.maxUses) {
      return res.status(400).json({ error: 'Coupon has reached maximum usage' });
    }

    res.json({ discount: coupon.discount });
  } catch (error) {
    console.error('Error applying coupon:', error);
    res.status(500).json({ error: 'Failed to apply coupon' });
  }
});

router.post('/confirm/:userId', async (req, res) => {
  const { items, shippingDetails, paymentMethod, couponCode, discount } = req.body;
  const userId = req.params.userId;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (
      !shippingDetails.addressLine1 ||
      !shippingDetails.city ||
      !shippingDetails.state ||
      !shippingDetails.pinCode ||
      !/^\d{6}$/.test(shippingDetails.pinCode) ||
      !shippingDetails.phoneNumber ||
      !/^\d{10}$/.test(shippingDetails.phoneNumber) ||
      shippingDetails.country !== 'India'
    ) {
      return res.status(400).json({ error: 'Invalid shipping details' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items must be a non-empty array' });
    }

    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const finalTotal = total - (discount || 0);

    if (finalTotal < 0) {
      return res.status(400).json({ error: 'Final total cannot be negative' });
    }

    // Save order to database
    const order = new Order({
      userId,
      items: items.map(item => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image || '',
      })),
      total: finalTotal,
      createdAt: new Date(),
    });
    await order.save();

    const invoicePath = path.join(__dirname, `../invoices/invoice_${Date.now()}.pdf`);

    await generateInvoice(
      {
        items,
        shippingAddress: shippingDetails,
        paymentMethod,
        email: user.email,
        total: finalTotal,
        couponCode,
        discount,
      },
      invoicePath
    );

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    const htmlContent = `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: auto; padding: 20px; background-color: #f9fafb; border: 1px solid #e5e7eb;">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="https://cdn-icons-png.flaticon.com/512/3771/3771333.png" alt="MediCare+ Logo" width="64" />
        <h2 style="color: #0284c7; margin-top: 10px;">MediCare+</h2>
      </div>

      <p>Dear <strong>${user.name}</strong>,</p>
      <p>Thank you for your purchase! Your order has been successfully placed.</p>
      <p><strong>Shipping Address:</strong></p>
      <p style="margin: 0;">${shippingDetails.addressLine1}</p>
      ${shippingDetails.addressLine2 ? `<p style="margin: 0;">${shippingDetails.addressLine2}</p>` : ''}
      <p style="margin: 0;">${shippingDetails.city}, ${shippingDetails.state} ${shippingDetails.pinCode}</p>
      <p style="margin: 0;">India</p>
      <p style="margin: 0;">Phone: ${shippingDetails.phoneNumber}</p>
      <p>Please find your invoice attached with this email.</p>
      ${couponCode ? `
      <div style="margin-top: 20px; padding: 10px; background-color: #ecfeff; border-left: 4px solid #16a34a;">
        <p style="margin: 0;">Coupon Code: <strong>${couponCode}</strong></p>
        <p style="margin: 0;">Discount: <strong>₹${discount}</strong></p>
      </div>` : ''}

      <div style="margin-top: 20px; padding: 10px; background-color: #ecfeff; border-left: 4px solid #0ea5e9;">
        <p style="margin: 0;">Invoice Date: <strong>${new Date().toLocaleDateString()}</strong></p>
        <p style="margin: 0;">Subtotal: <strong>₹${total.toFixed(2)}</strong></p>
        ${discount ? `<p style="margin: 0;">Discount: <strong>-₹${discount.toFixed(2)}</strong></p>` : ''}
        <p style="margin: 0;">Total: <strong>₹${finalTotal.toFixed(2)}</strong></p>
      </div>

      <p style="margin-top: 20px;">For any support, feel free to reply to this email or contact us at <a href="mailto:support@medicare.com">support@medicare.com</a>.</p>

      <p style="color: #6b7280; font-size: 12px; margin-top: 30px; text-align: center;">
        © ${new Date().getFullYear()} MediCare+. All rights reserved.
      </p>
    </div>
    `;

    await transporter.sendMail({
      from: `"MediCare+" <${process.env.MAIL_USER}>`,
      to: user.email,
      subject: '🧾 Your MediCare+ Invoice',
      html: htmlContent,
      attachments: [
        {
          filename: 'invoice.pdf',
          path: invoicePath,
          contentType: 'application/pdf',
        },
      ],
    });

    fs.unlinkSync(invoicePath);
    await Cart.findOneAndUpdate(
      { userId },
      { items: [], updatedAt: Date.now() },
      { upsert: true, new: true }
    );
    res.json({ message: 'Order confirmed & invoice sent successfully' });
  } catch (err) {
    console.error('Order Error:', err);
    res.status(500).json({ error: 'Order failed' });
  }
});

router.get('/:userId', async (req, res) => {
  let userId;
  try {
    userId = new mongoose.Types.ObjectId(req.params.userId);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid User ID format' });
  }

  try {
    const cart = await Cart.findOne({ userId });
    res.json(cart || { items: [] });
  } catch (err) {
    console.error('GET /cart error:', err.message);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

router.delete('/user/delete/:userId', async (req, res) => {
  let userId;

  try {
    userId = new mongoose.Types.ObjectId(req.params.userId);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid User ID format' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.isDeleted = true;
    user.deletedAt = new Date();
    user.deletedByAdmin = req.user?.role === 'admin';
    await user.save();

    // Optional: cleanup related data
    await Cart.deleteOne({ userId });
    await Coupon.updateMany(
      { usedBy: userId },
      { $pull: { usedBy: userId } }
    );

    res.json({ success: true, message: 'User soft-deleted and data cleaned up.' });
  } catch (err) {
    console.error('Soft Delete Error:', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});


router.put('/user/update/:userId', async (req, res) => {
  let userId;
  try {
    userId = new mongoose.Types.ObjectId(req.params.userId);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid User ID format' });
  }

  const { name, email, phone, avatar } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  if (phone && !/^\d{10}$/.test(phone)) {
    return res.status(400).json({ error: 'Phone number must be 10 digits' });
  }

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { name, email, phone, avatar },
      { new: true, runValidators: true }
    );
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ success: true, message: 'User profile updated successfully', user });
  } catch (err) {
    console.error('Update User Error:', err);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

// Get order history
router.get('/orders/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Fetch orders, return empty array if none exist
    const orders = await Order.find({ userId }).select('items total createdAt').lean();
    res.json({ orders: orders || [] });
  } catch (err) {
    console.error('Fetch Orders Error:', err);
    res.status(500).json({ error: 'Failed to fetch order history', details: err.message });
  }
});

router.post('/delete-feedback', async (req, res) => {
  try {
    const { userId, rating, feedback } = req.body;

    if (!userId || !feedback || !rating) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const saved = await DeleteFeedback.create({
      userId,
      rating,
      feedback,
      createdAt: new Date(),
    });

    res.json({ success: true, message: 'Feedback saved', data: saved });
  } catch (err) {
    console.error('Error saving delete feedback:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/subscribe', async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
if (!email) return res.status(400).json({ success: false, error: 'Email is required' });

const alreadySubscribed = await Subscriber.findOne({ email });
if (alreadySubscribed) {
  return res.status(400).json({ success: false, error: 'You are already subscribed' });
}

await Subscriber.create({ email, subscribedAt: new Date() });

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    const token = Buffer.from(email).toString('base64');
    const unsubscribeLink = `${process.env.API_BASE_URL}/api/cart/unsubscribe-direct/${token}`;

    const htmlContent = `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: auto; padding: 20px; background-color: #f9fafb; border: 1px solid #e5e7eb;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://cdn-icons-png.flaticon.com/512/3771/3771333.png" alt="MediCare+ Logo" width="64" />
          <h2 style="color: #0284c7; margin-top: 10px;">Welcome to MediCare+</h2>
        </div>

        <p>Hi there,</p>
        <p>Thank you for subscribing to <strong>MediCare+</strong>! 🎉</p>
        <p>You'll now receive updates on:</p>
        <ul style="margin-left: 20px;">
          <li>🔔 New medicine launches</li>
          <li>💊 Health tips and blogs</li>
          <li>🎁 Exclusive discounts & offers</li>
        </ul>
        <p>Stay tuned for more!</p>

        <p style="margin-top: 20px;">Need help? Reach us at <a href="mailto:support@medicare.com">support@medicare.com</a>.</p>

        <p style="text-align: center; font-size: 14px; margin-top: 30px;">
          Don’t want these emails? <a href="${unsubscribeLink}" style="color: #ef4444;">Unsubscribe</a>
        </p>

        <p style="color: #6b7280; font-size: 12px; margin-top: 30px; text-align: center;">
          © ${new Date().getFullYear()} MediCare+. All rights reserved.
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: `"MediCare+" <${process.env.MAIL_USER}>`,
      to: email,
      subject: '✅ You’re subscribed to MediCare+',
      html: htmlContent,
    });

    res.json({ success: true, message: 'Subscription confirmation email sent.' });
  } catch (err) {
    console.error('Subscription Email Error:', err);
    res.status(500).json({ error: 'Failed to send subscription email' });
  }
});

router.get('/unsubscribe-direct/:token', async (req, res) => {
  try {
    const token = req.params.token;
    const email = Buffer.from(token, 'base64').toString('utf-8').trim().toLowerCase();

    if (!email) return res.status(400).send('Invalid request');

    const unsubscribed = await Subscriber.findOneAndDelete({ email });

    if (!unsubscribed) {
      return res.status(404).send('Email not found or already unsubscribed');
    }

    // Send confirmation email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    const html = `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2 style="color: #e11d48;">You’ve been unsubscribed</h2>
        <p>You will no longer receive updates from <strong>MediCare+</strong>.</p>
        <p>If this was a mistake, you can <a href="mailto:support@medicare.com">contact support</a>.</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"MediCare+" <${process.env.MAIL_USER}>`,
      to: email,
      subject: 'You have been unsubscribed from MediCare+',
      html,
    });

    res.send(`
      <div style="
  font-family: 'Segoe UI', sans-serif;
  padding: 30px;
  max-width: 600px;
  margin: auto;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.05);
  color: #1f2937;
">
  <div style="text-align: center;">
    <img src="https://cdn-icons-png.flaticon.com/512/1828/1828843.png" alt="Unsubscribed Icon" width="60" />
    <h2 style="color: #dc2626; margin-top: 15px;">You’ve been unsubscribed</h2>
  </div>
  <p style="font-size: 16px; line-height: 1.6; margin-top: 20px;">
    You will no longer receive updates from <strong>MediCare+</strong>.
  </p>
  <p style="font-size: 15px; color: #6b7280;">
    If this was a mistake, please <a href="mailto:support@medicare.com" style="color: #2563eb;">contact support</a>.
  </p>
  <p style="font-size: 15px; color: #4b5563; margin-top: 20px;">
    We hope to see you again in the future. Your health is important to us!
  </p>
  <p style="font-size: 15px; color: #4b5563;">
    Thank you for being a part of our community.
  </p>
</div>
    `);
  } catch (err) {
    console.error('Direct Unsubscribe Error:', err);
    res.status(500).send('Something went wrong. Please try again later.');
  }
});

module.exports = router;