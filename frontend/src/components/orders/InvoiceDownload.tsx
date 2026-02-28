import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';

interface InvoiceDownloadProps {
  orderId: string;
  orderStatus: string;
}

export const InvoiceDownload = ({ orderId, orderStatus }: InvoiceDownloadProps) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateInvoice = async () => {
    if (orderStatus !== 'delivered') {
      toast.error("Invoice Not Available", {
        description: "Invoice can only be downloaded for delivered orders.",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const base = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${base}/api/invoices/${orderId}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to generate invoice' }));
        throw new Error(errorData.message || 'Failed to generate invoice');
      }

      const data = await response.json();
      const doc = new jsPDF();

      // Professional Colors
      const primaryColor = [37, 99, 235]; // Royal Blue
      const secondaryColor = [71, 85, 105]; // Slate Gray
      const accentColor = [241, 245, 249]; // Light Background

      let y = 20;
      const margin = 15;
      const pageWidth = doc.internal.pageSize.width;

      // Header Section
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, pageWidth, 40, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(24);
      doc.text("NOTEBOOK HUB", margin, 20);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Professional Notebook Marketplace", margin, 28);

      doc.setFontSize(18);
      doc.text("TAX INVOICE", pageWidth - margin - 45, 25);

      y = 50;

      // Order & Invoice Details
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("INVOICE DETAILS", margin, y);
      doc.text("ORDER DETAILS", 110, y);

      y += 6;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(`Invoice No: ${data.invoiceNumber || 'N/A'}`, margin, y);
      doc.text(`Order ID: ${data.orderId}`, 110, y);

      y += 5;
      const orderDate = data.orderDate ? new Date(data.orderDate).toLocaleDateString() : 'N/A';
      const deliveryDate = data.deliveryDate ? new Date(data.deliveryDate).toLocaleDateString() : 'N/A';
      doc.text(`Invoice Date: ${orderDate}`, margin, y);
      doc.text(`Order Date: ${orderDate}`, 110, y);

      y += 5;
      doc.text(`Payment: ${data.payment?.methodDisplay || 'N/A'}`, margin, y);
      doc.text(`Delivery Date: ${deliveryDate}`, 110, y);

      y += 15;
      doc.setDrawColor(200);
      doc.line(margin, y - 5, pageWidth - margin, y - 5);

      // Seller & Buyer Section
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("SOLD BY (SELLER):", margin, y);
      doc.text("SHIPPING TO (BUYER):", 110, y);

      y += 6;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);

      // Seller Column
      const seller = data.seller || {};
      doc.text(seller.companyName || seller.name || "Notebook Hub Seller", margin, y);
      // Buyer Column
      const buyer = data.buyer || {};
      doc.text(buyer.name || "Valued Customer", 110, y);

      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);

      const drawWrappedText = (text: string, x: number, currentY: number, maxWidth: number) => {
        const lines = doc.splitTextToSize(text || "N/A", maxWidth);
        doc.text(lines, x, currentY);
        return lines.length * 4;
      };

      const sellerAddrHeight = drawWrappedText(seller.address, margin, y, 80);
      const buyerAddrHeight = drawWrappedText(buyer.address, 110, y, 80);

      let nextY = y + Math.max(sellerAddrHeight, buyerAddrHeight);

      doc.text(`PIN: ${seller.pinCode || 'N/A'}`, margin, nextY);
      doc.text(`PIN: ${buyer.pinCode || 'N/A'}`, 110, nextY);

      nextY += 5;
      doc.text(`Phone: ${seller.phone || 'N/A'}`, margin, nextY);
      doc.text(`Phone: ${buyer.phone || 'N/A'}`, 110, nextY);

      if (seller.gstNumber && seller.gstNumber !== 'N/A') {
        nextY += 5;
        doc.setFont("helvetica", "bold");
        doc.text(`GSTIN: ${seller.gstNumber}`, margin, nextY);
        doc.setFont("helvetica", "normal");
      }

      y = nextY + 15;

      // Product Table
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(margin, y, pageWidth - (margin * 2), 10, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text("Items Description", margin + 5, y + 6.5);
      doc.text("Qty", 120, y + 6.5);
      doc.text("Unit Price", 140, y + 6.5);
      doc.text("Amount", 175, y + 6.5);

      y += 16;
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");

      if (Array.isArray(data.items)) {
        data.items.forEach((item: any) => {
          const itemLines = doc.splitTextToSize(item.name || "Product", 90);
          doc.text(itemLines, margin + 5, y);
          doc.text((item.quantity || 1).toString(), 122, y);
          doc.text(`Rs. ${(item.price || 0).toLocaleString()}`, 140, y);
          doc.text(`Rs. ${(item.total || 0).toLocaleString()}`, 175, y);
          y += (itemLines.length * 5) + 2;
        });
      }

      y = Math.max(y, 180); // Ensure table footer is at a reasonable position
      doc.setDrawColor(200);
      doc.line(margin, y, pageWidth - margin, y);
      y += 8;

      // Totals
      if (data.payment) {
        doc.setFontSize(10);
        doc.text("Subtotal:", 135, y);
        doc.text(`Rs. ${(data.payment.subtotal || 0).toLocaleString()}`, 175, y, { align: 'left' });

        y += 6;
        doc.text("GST (18% Included):", 135, y);
        doc.text(`Rs. ${(data.payment.tax || 0).toLocaleString()}`, 175, y, { align: 'left' });

        y += 6;
        doc.text("Delivery Charges:", 135, y);
        doc.text(`Rs. ${(data.payment.shipping || 0).toLocaleString()}`, 175, y, { align: 'left' });

        y += 10;
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(130, y - 6, pageWidth - margin - 130, 10, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("GRAND TOTAL:", 135, y);
        doc.text(`Rs. ${(data.payment.total || 0).toLocaleString()}`, 172, y);
      }

      // Footer
      y = 270;
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.text("This is a computer generated invoice and does not require a physical signature.", pageWidth / 2, y, { align: 'center' });
      doc.text("Thank you for shopping at Notebook Hub!", pageWidth / 2, y + 5, { align: 'center' });

      doc.save(`Invoice_${data.invoiceNumber || 'order'}.pdf`);

      toast.success("Invoice Downloaded", {
        description: "Your professional tax invoice has been generated.",
      });
    } catch (error: any) {
      console.error('Invoice generation error', error);
      toast.error("Error", {
        description: error.message || "Failed to generate invoice. Please try again.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
      onClick={generateInvoice}
      disabled={isGenerating || orderStatus !== 'delivered'}
    >
      {isGenerating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      Download Invoice
    </Button>
  );
};
