const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

function generateInvoice({ items, shippingAddress, paymentMethod, email, total }, outputPath) {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    const logoPath = path.join(__dirname, '../public/logo.png');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 50, 45, { width: 60 });
    }

    // Brand Title
    doc
      .fontSize(26)
      .fillColor('#0284c7')
      .text('MediCare+', 120, 50)
      .fontSize(12)
      .fillColor('#64748b')
      .text('Official Invoice', { align: 'right' });

    doc.moveDown(2);

    // Customer Info
    doc
      .fontSize(12)
      .fillColor('#1e293b')
      .text(`Customer Email: ${email}`)
      .text(`Shipping Address: ${shippingAddress}`)
      .text(`Payment Method: ${paymentMethod}`);

    doc.moveDown();

    // Table Headers
    const startY = doc.y + 10;
    const tableTop = startY + 10;
    const colWidths = [200, 80, 100, 100];

    doc
      .fontSize(12)
      .fillColor('#ffffff')
      .rect(50, tableTop, 500, 24)
      .fill('#0284c7')
      .fillColor('#ffffff')
      .text('Item', 55, tableTop + 6)
      .text('Qty', 255, tableTop + 6)
      .text('Price', 335, tableTop + 6)
      .text('Total', 435, tableTop + 6);

    // Table Rows
    let y = tableTop + 30;
    doc.fontSize(11).fillColor('#1e293b');

    items.forEach((item) => {
      doc.text(item.name, 55, y)
        .text(`x${item.quantity}`, 255, y)
        .text(`₹${item.price.toFixed(2)}`, 335, y)
        .text(`₹${(item.quantity * item.price).toFixed(2)}`, 435, y);
      y += 24;
    });

    // Total
    doc
      .fontSize(13)
      .fillColor('#0284c7')
      .text(`Grand Total: ₹${total.toFixed(2)}`, 400, y + 20, { align: 'right' });

    // Footer
    doc
      .moveDown(4)
      .fontSize(10)
      .fillColor('#94a3b8')
      .text('Thank you for shopping with MediCare+.', { align: 'center' })
      .text('For support, email us at support@medicare.com', { align: 'center' });

    doc.end();

    stream.on('finish', () => resolve(outputPath));
    stream.on('error', (err) => reject(err));
  });
}

module.exports = generateInvoice;
