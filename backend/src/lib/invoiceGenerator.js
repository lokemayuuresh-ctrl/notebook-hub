const PDFDocument = require('pdfkit');

/**
 * Generate PDF Invoice Buffer
 */
const generateInvoicePDF = (invoiceData) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // Header
        doc.fillColor('#2563eb').fontSize(24).text('Notebook Hub', { align: 'center' });
        doc.fontSize(10).fillColor('#64748b').text('Premium Stationery & Notebooks', { align: 'center' });
        doc.moveDown();
        doc.fillColor('#000000').fontSize(18).text('INVOICE', { align: 'center' });
        doc.fontSize(10).text(`Invoice Number: ${invoiceData.invoiceNumber}`, { align: 'center' });
        doc.moveDown();

        // Seller & Buyer Info
        const top = doc.y;
        doc.fontSize(12).fillColor('#2563eb').text('Seller details:', 50, top);
        doc.fillColor('#000000').fontSize(10)
            .text(invoiceData.seller?.companyName || 'N/A', 50, top + 20)
            .text(invoiceData.seller?.address || 'N/A', 50, top + 35)
            .text(`GST: ${invoiceData.seller?.gstNumber || 'N/A'}`, 50, top + 50);

        doc.fontSize(12).fillColor('#2563eb').text('Buyer details:', 350, top);
        doc.fillColor('#000000').fontSize(10)
            .text(invoiceData.buyer?.name || 'N/A', 350, top + 20)
            .text(invoiceData.buyer?.address || 'N/A', 350, top + 35)
            .text(`Phone: ${invoiceData.buyer?.phone || 'N/A'}`, 350, top + 50);

        doc.moveDown(4);

        // Order Table
        const tableTop = doc.y;
        doc.fillColor('#f8fafc').rect(50, tableTop, 500, 20).fill();
        doc.fillColor('#1e293b').fontSize(10).font('Helvetica-Bold')
            .text('Item', 60, tableTop + 5)
            .text('Qty', 300, tableTop + 5)
            .text('Price', 400, tableTop + 5)
            .text('Total', 500, tableTop + 5);

        let y = tableTop + 25;
        doc.font('Helvetica');
        invoiceData.items.forEach(item => {
            doc.text(item.name, 60, y)
                .text(item.quantity.toString(), 300, y)
                .text(`₹${item.price.toLocaleString()}`, 400, y)
                .text(`₹${item.total.toLocaleString()}`, 500, y);
            y += 20;
        });

        // Summary
        doc.moveDown();
        const summaryTop = doc.y;
        doc.text('Subtotal:', 400, summaryTop)
            .text(`₹${invoiceData.summary.subtotal.toLocaleString()}`, 500, summaryTop);
        doc.text('GST (18%):', 400, summaryTop + 15)
            .text(`₹${invoiceData.summary.tax.toLocaleString()}`, 500, summaryTop + 15);
        doc.text('Delivery:', 400, summaryTop + 30)
            .text(`₹${invoiceData.summary.shipping.toLocaleString()}`, 500, summaryTop + 30);

        doc.fontSize(14).font('Helvetica-Bold').fillColor('#2563eb')
            .text('Total Amount:', 350, summaryTop + 50)
            .text(`₹${invoiceData.summary.total.toLocaleString()}`, 500, summaryTop + 50);

        // Footer
        doc.moveDown(4);
        doc.fontSize(10).fillColor('#64748b').text('Thank you for your business!', { align: 'center' });
        doc.text('This is a computer-generated invoice.', { align: 'center' });

        doc.end();
    });
};

module.exports = { generateInvoicePDF };
