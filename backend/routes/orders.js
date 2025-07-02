const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const nodemailer = require('nodemailer');
const path = require('path');

// Place an order and send PDF invoice
router.post('/', async (req, res) => {
  try {
    const { userId, items, shippingAddress, paymentMethod, paymentDetails, email } = req.body;

    const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

    const order = new Order({
      userId,
      items,
      total,
      shippingAddress,
      paymentMethod,
      paymentDetails,
      email,
    });

    await order.save();

    const invoicePath = path.join(__dirname, `../invoices/${Date.now()}_invoice.pdf`);
    await generateInvoicePDF({ items, shippingAddress, paymentMethod, email, total }, invoicePath);
    await sendInvoiceEmail(email, invoicePath);

    res.status(201).json({ message: 'Order placed & invoice sent successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to place order' });
  }
});

// Get order history for a user
router.get('/:userId', async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// --- Helper: Generate Invoice PDF ---
async function generateInvoicePDF({ items, shippingAddress, paymentMethod, email, total }, filePath) {
  return new Promise((resolve) => {
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.fontSize(20).text('🧾 MediCart Invoice', { align: 'center' });
    doc.moveDown().fontSize(12).text(`Email: ${email}`);
    doc.text(`Shipping Address: ${shippingAddress}`);
    doc.text(`Payment Method: ${paymentMethod}`);
    doc.moveDown().text('Items:', { underline: true });

    items.forEach((item) => {
      doc.text(`${item.name} x${item.quantity} - ₹${item.price * item.quantity}`);
    });

    doc.moveDown().text(`Total: ₹${total}`, { bold: true });
    doc.end();

    stream.on('finish', () => resolve());
  });
}

// --- Helper: Send Email with PDF Attachment ---
async function sendInvoiceEmail(to, filePath) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"MediCart" <${process.env.MAIL_USER}>`,
    to,
    subject: '🧾 Your MediCart Invoice',
    text: 'Thank you for your order. Please find your invoice attached.',
    attachments: [
      {
        filename: 'invoice.pdf',
        path: filePath,
      },
    ],
  };

  await transporter.sendMail(mailOptions);
}

module.exports = router;
