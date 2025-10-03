import jsPDF from 'jspdf';

export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  truckReg: string;
  sender: string;
  receiver: string;
  tripKm: number;
  totalAnimals: number;
  description: string;
  driverName: string;
  status: string;
}

export interface LoadData {
  id?: number;
  truckReg?: string;
  parsed_data?: {
    truckReg?: string;
    tripKm?: number;
    totalAnimals?: number;
    sender?: string;
    receiver?: string;
    [key: string]: any;
  };
  [key: string]: any;
}


// Minimal PDF test function
export const testPDFGeneration = (): void => {
  try {
    const doc = new jsPDF();
    doc.text('Hello World', 20, 20);
    doc.save('test.pdf');
    console.log('Minimal PDF test successful');
  } catch (error) {
    console.error('Minimal PDF test failed:', error);
  }
};

export const generatePDFInvoice = async (loadData: LoadData, invoiceData?: any): Promise<{ pdfData: string, filename: string }> => {
  console.log('🚀 GENERATING PDF - WITHOUT LINE ITEMS TABLE');
  
  try {
    // Create PDF document
    const doc = new jsPDF();
    
    // LOGO (top-left) - Load banner image
    try {
      // Load the banner image
      const img = new Image();
      img.crossOrigin = 'anonymous'; // Enable CORS for image loading
      
      // Create a promise to handle image loading
      await new Promise((resolve, reject) => {
        img.onload = () => {
          try {
            // Add the image to PDF (x, y, width, height)
            doc.addImage(img, 'JPEG', 20, 15, 60, 20);
            console.log('Banner image added to PDF successfully');
            resolve(true);
          } catch (error) {
            console.error('Error adding image to PDF:', error);
            reject(error);
          }
        };
        img.onerror = (error) => {
          console.error('Error loading banner image:', error);
          // Fallback to text logo if image fails
          doc.setFontSize(18);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 123, 255);
          doc.text('GOLIATSKRAAL', 20, 25);
          doc.setTextColor(0, 0, 0);
          resolve(true);
        };
        img.src = '/goliatskraal-banner.jpg';
      });
    } catch (error) {
      console.log('Logo error:', error);
      // Fallback to text logo
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 123, 255);
      doc.text('GOLIATSKRAAL', 20, 25);
      doc.setTextColor(0, 0, 0);
    }
    
    // HEADER - TAX INVOICE (centered)
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('TAX INVOICE', 105, 25, { align: 'center' });
    
    // COMPANY BOX (Modern 3D Design)
    // Create 3D shadow effect
    doc.setDrawColor(160, 160, 160); // Shadow border
    doc.setFillColor(220, 220, 220); // Shadow fill
    doc.rect(22, 42, 80, 35, 'FD'); // Shadow box
    
    // Main box with gradient effect
    doc.setDrawColor(80, 80, 80); // Darker border for depth
    doc.setFillColor(255, 255, 255); // Pure white background
    doc.rect(20, 40, 80, 35, 'FD'); // Main box
    
    // Add subtle inner highlight
    doc.setDrawColor(240, 240, 240);
    doc.rect(21, 41, 78, 33);
    
    // Modern header with accent
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30); // Darker text for contrast
    doc.text('COMPANY DETAILS', 22, 48);
    
    // Add accent line under header
    doc.setDrawColor(70, 130, 180); // Steel blue accent
    doc.setLineWidth(0.8);
    doc.line(22, 49, 98, 49);
    
    // Content with improved typography
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50); // Darker text
    doc.text('Goliatskraal', 22, 55);
    doc.text('POSBUS 27', 22, 60);
    doc.text('9595', 22, 67);
    doc.text('BTW 4220283446', 22, 72);
    
    // INVOICE BOX (Simple Design)
    // Simple box with thin border
    doc.setDrawColor(200, 200, 200); // Light grey border
    doc.setFillColor(255, 255, 255); // White background
    doc.rect(110, 40, 80, 35, 'FD'); // Main box
    
    // Modern header with accent
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30); // Darker text for contrast
    doc.text('INVOICE DETAILS', 112, 48);
    
    // Add accent line under header
    doc.setDrawColor(70, 130, 180); // Steel blue accent
    doc.setLineWidth(0.8);
    doc.line(112, 49, 188, 49);
    
    // Content with improved typography
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50); // Darker text
    doc.text(`Date: ${invoiceData?.invoiceDate || '2025-09-26'}`, 112, 55);
    doc.text('Page: 1', 112, 60);
    doc.text(`Document No: ${invoiceData?.invoiceNumber || '1111'}`, 112, 65);
    doc.text(`Account: ${invoiceData?.invoiceAccountRef || '2222'}`, 112, 72);
    
    // Add discounted subtotal to invoice details (updates with discount %)
    const invoiceOriginalSubtotal = Number(loadData.parsed_data?.subtotal || 0);
    const invoiceDiscountPercent = Number(invoiceData?.invoiceDiscount || 0);
    const invoiceDiscountAmount = invoiceOriginalSubtotal * (invoiceDiscountPercent / 100);
    const discountedSubtotal = invoiceOriginalSubtotal - invoiceDiscountAmount;
    
    console.log('🔍 PDF Invoice Details Calculation:');
    console.log('  Original Subtotal:', invoiceOriginalSubtotal);
    console.log('  Discount %:', invoiceDiscountPercent);
    console.log('  Discount Amount:', invoiceDiscountAmount);
    console.log('  Discounted Subtotal:', discountedSubtotal);
    
    // CLIENT BOX (Simple Design)
    // Simple box with thin border
    doc.setDrawColor(200, 200, 200); // Light grey border
    doc.setFillColor(255, 255, 255); // White background
    doc.rect(20, 85, 80, 35, 'FD'); // Main box
    
    // Modern header with accent
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30); // Darker text for contrast
    doc.text('CLIENT DETAILS', 22, 93);
    
    // Add accent line under header
    doc.setDrawColor(70, 130, 180); // Steel blue accent
    doc.setLineWidth(0.8);
    doc.line(22, 94, 98, 94);
    
    // Content with improved typography
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50); // Darker text
    
    // Split the invoice made out to text into lines and display each line
    const clientDetails = invoiceData?.invoiceMadeOutTo || 'Enter client details';
    const clientLines = clientDetails.split('\n').filter((line: string) => line.trim() !== '');
    
    let clientY = 100;
    clientLines.forEach((line: string) => {
      doc.text(line.trim(), 22, clientY);
      clientY += 5;
    });
    
    // REFERENCE BOX (Simple Design)
    // Simple box with thin border
    doc.setDrawColor(200, 200, 200); // Light grey border
    doc.setFillColor(255, 255, 255); // White background
    doc.rect(110, 85, 80, 35, 'FD'); // Main box
    
    // Modern header with accent
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30); // Darker text for contrast
    doc.text('REFERENCE', 112, 93);
    
    // Add accent line under header
    doc.setDrawColor(70, 130, 180); // Steel blue accent
    doc.setLineWidth(0.8);
    doc.line(112, 94, 188, 94);
    
    // Content with improved typography
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50); // Darker text
    doc.text(`Your Reference: ${invoiceData?.invoiceLoadRef || 'asdf'}`, 112, 100);
    doc.text('VAT Reference: 4220283446', 112, 105);
    
    // LINE ITEMS TABLE (Modern Design with 3D Effect)
    const tableY = 130;
    const headerY = tableY + 5;
    const dataY = headerY + 10;
    const tableHeight = 20; // Height for data row
    
    // Headers
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    const headers = ['Code', 'Description', 'Quantity', 'Unit', 'Unit Price', 'Discount %', 'VAT %', 'Nett Price'];
    const widths = [18, 45, 18, 12, 22, 18, 12, 25];
    
    // Draw table borders (modern design with 3D effect)
    const lineItemsTableWidth = widths.reduce((a, b) => a + b, 0);
    const tableStartX = 20;
    
    // Create shadow for 3D effect
    doc.setDrawColor(140, 140, 140); // Shadow border
    doc.setFillColor(200, 200, 200); // Shadow fill
    doc.rect(tableStartX + 2, tableY + 2, lineItemsTableWidth, tableHeight + 10, 'FD'); // Shadow
    
    // Main table with modern styling
    doc.setDrawColor(60, 60, 60); // Darker border for depth
    doc.setFillColor(255, 255, 255); // Pure white background
    
    // Outer border
    doc.rect(tableStartX, tableY, lineItemsTableWidth, tableHeight + 10);
    
    // Vertical lines between columns
    let x = tableStartX;
    for (let i = 0; i < widths.length - 1; i++) {
      x += widths[i];
      doc.line(x, tableY, x, tableY + tableHeight + 10);
    }
    
    // Horizontal line between header and data
    doc.line(tableStartX, headerY + 3, tableStartX + lineItemsTableWidth, headerY + 3);
    
    // Header text (modern styling)
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30); // Darker text for contrast
    x = tableStartX + 2; // Small padding from border
    headers.forEach((header, i) => {
      doc.text(header, x, headerY);
      x += widths[i];
    });
    
    // Data row - Extract data from loadData (modern styling)
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50); // Darker text
    x = tableStartX + 2; // Small padding from border
    
    // Code
    doc.text(invoiceData?.invoiceCode || '1450707', x, dataY);
    x += widths[0];
    
    // Description (only Kallers and VAN/NA details)
    const descLines = [
      '78 KALLERS',
      `VAN: ${loadData.parsed_data?.sender || 'Unknown'}`,
      `NA: ${loadData.parsed_data?.receiver || 'Unknown'}`
    ];
    
    let descY = dataY;
    descLines.forEach(line => {
      doc.text(line, x, descY);
      descY += 3;
    });
    x += widths[1];
    
    // Quantity (kms)
    const tripKms = Number(loadData.parsed_data?.tripKm || 0);
    doc.text(String(tripKms), x, dataY);
    x += widths[2];
    
    // Unit (empty)
    x += widths[3];
    
    // Unit Price (rate per km)
    const ratePerKm = Number(loadData.parsed_data?.rate || 0);
    doc.text(`R ${ratePerKm.toFixed(2)}`, x, dataY);
    x += widths[4];
    
    // Discount % (from invoice data, default 0%)
    const discount = invoiceData?.invoiceDiscount || '0';
    doc.text(`${discount}%`, x, dataY);
    x += widths[5];
    
    // VAT %
    doc.text('15.00%', x, dataY);
    x += widths[6];
    
    // Nett Price (should be the original subtotal, not discounted)
    const nettPrice = Number(loadData.parsed_data?.subtotal || 0);
    doc.text(`R ${nettPrice.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`, x, dataY);
    
    // SUMMARY TABLE (below line items table, auto-fit width, right-aligned)
    const summaryY = dataY + 25;
    const summaryTableWidth = 60; // Compact width
    const summaryX = 20 + lineItemsTableWidth - summaryTableWidth; // Right-aligned
    const rowHeight = 8;
    
    // Calculate actual values from line items
    const quantity = Number(loadData.parsed_data?.tripKm || 0);
    const unitPrice = Number(loadData.parsed_data?.rate || 0);
    const summaryDiscountPercent = Number(invoiceData?.invoiceDiscount || 0);
    
    // Use the same subtotal as invoice details for consistency
    const subtotal = Number(loadData.parsed_data?.subtotal || 0);
    
    console.log('🔍 PDF Summary Table Calculation:');
    console.log('  Quantity (tripKm):', quantity);
    console.log('  Unit Price (rate):', unitPrice);
    console.log('  Subtotal (from parsed_data):', subtotal);
    console.log('  Discount %:', summaryDiscountPercent);
    
    // Calculate discount amount
    const summaryDiscountAmount = subtotal * (summaryDiscountPercent / 100);
    
    console.log('  Discount Amount:', summaryDiscountAmount);
    
    // Calculate amount excluding VAT (subtotal - discount)
    const amountExclVAT = subtotal - summaryDiscountAmount;
    
    // Calculate VAT (15% of amount excluding VAT)
    const vatAmount = amountExclVAT * 0.15;
    
    // Calculate total (amount excluding VAT + VAT)
    const total = amountExclVAT + vatAmount;
    
    // Create bordered table for summary with calculated values
    const summaryData = [
      { label: 'Sub Total', value: subtotal.toLocaleString('en-ZA', { minimumFractionDigits: 2 }) },
      { label: `Discount @ ${summaryDiscountPercent}%`, value: summaryDiscountAmount.toLocaleString('en-ZA', { minimumFractionDigits: 2 }) },
      { label: 'Amount Excl VAT', value: amountExclVAT.toLocaleString('en-ZA', { minimumFractionDigits: 2 }) },
      { label: 'VAT', value: vatAmount.toLocaleString('en-ZA', { minimumFractionDigits: 2 }) },
      { label: 'Total', value: total.toLocaleString('en-ZA', { minimumFractionDigits: 2 }), bold: true }
    ];
    
    // Draw table borders (modern design with 3D effect)
    // Create shadow for 3D effect
    doc.setDrawColor(140, 140, 140); // Shadow border
    doc.setFillColor(200, 200, 200); // Shadow fill
    doc.rect(summaryX + 2, summaryY + 2, summaryTableWidth, summaryData.length * rowHeight, 'FD'); // Shadow
    
    // Main table with modern styling
    doc.setDrawColor(60, 60, 60); // Darker border for depth
    doc.setFillColor(255, 255, 255); // Pure white background
    doc.rect(summaryX, summaryY, summaryTableWidth, summaryData.length * rowHeight); // Main border
    
    
    // Draw horizontal lines between rows
    for (let i = 1; i < summaryData.length; i++) {
      doc.line(summaryX, summaryY + i * rowHeight, summaryX + summaryTableWidth, summaryY + i * rowHeight);
    }
    
    // Draw vertical line separating label and value
    doc.line(summaryX + 35, summaryY, summaryX + 35, summaryY + summaryData.length * rowHeight);
    
    // Add content to table (modern styling)
    doc.setFontSize(8);
    summaryData.forEach((row, index) => {
      const y = summaryY + (index * rowHeight) + 5;
      
      if (row.bold) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(52, 58, 64); // Dark gray for total
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(73, 80, 87); // Medium gray for other rows
      }
      
      doc.text(row.label, summaryX + 2, y);
      doc.text(row.value, summaryX + 37, y);
    });
    
    // Signature section (compact)
    const sigY = summaryY + (summaryData.length * rowHeight) + 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Received in good order', 20, sigY);
    doc.text('Signed _________', 20, sigY + 8);
    doc.text('Date _________', 110, sigY + 8);
    
    // Bank Details (compact design)
    const bankY = sigY + 18;
    const bankTableWidth = 100;
    const bankTableHeight = 25; // Reduced height
    const bankRowHeight = 5; // Reduced row height

    // Create shadow for 3D effect
    doc.setDrawColor(140, 140, 140); // Shadow border
    doc.setFillColor(200, 200, 200); // Shadow fill
    doc.rect(22, bankY + 2, bankTableWidth, bankTableHeight, 'FD'); // Shadow box

    // Main box with modern styling
    doc.setDrawColor(60, 60, 60); // Darker border for depth
    doc.setFillColor(255, 255, 255); // Pure white background
    doc.rect(20, bankY, bankTableWidth, bankTableHeight, 'FD'); // Main box

    // Add subtle inner highlight
    doc.setDrawColor(240, 240, 240);
    doc.rect(21, bankY + 1, bankTableWidth - 2, bankTableHeight - 2);

    // Modern header with accent
    doc.setFontSize(9); // Slightly smaller
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30); // Darker text for contrast
    doc.text('Bankbesonderhede:', 22, bankY + 5);

    // Add accent line under header
    doc.setDrawColor(70, 130, 180); // Steel blue accent
    doc.setLineWidth(0.8);
    doc.line(22, bankY + 6, 22 + bankTableWidth - 2, bankY + 6);

    // Bank details in table format (compact)
    const bankDetails = [
      { label: 'Bank:', value: 'Standard Bank' },
      { label: 'Branch:', value: 'Tak 055436' },
      { label: 'Account:', value: '252945220' },
      { label: 'Type:', value: 'Tjek' }
    ];

    doc.setFontSize(7); // Smaller font
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50); // Darker text

    let bankTextY = bankY + 9;
    bankDetails.forEach((detail) => {
      // Label (left column)
      doc.setFont('helvetica', 'bold');
      doc.text(detail.label, 22, bankTextY);
      
      // Value (right column)
      doc.setFont('helvetica', 'normal');
      doc.text(detail.value, 22 + 25, bankTextY);

      bankTextY += bankRowHeight;
    });
    
    // Calculate the actual content height to minimize white space
    const contentHeight = bankY + bankTableHeight + 10; // Add small margin
    
    // Set page size to fit content (remove excess white space)
    if (contentHeight < 297) {
      doc.internal.pageSize.height = contentHeight;
    }
    
    // Generate filename
    const fileName = `Tax_Invoice_${Date.now()}.pdf`;
    
    // Get PDF as base64 string for database storage
    const pdfData = doc.output('datauristring');
    
    // Save to downloads
    doc.save(fileName);
    console.log('✅ PDF SAVED:', fileName);
    console.log('📏 Content height:', contentHeight, 'mm');
    
    return {
      pdfData,
      filename: fileName
    };
    
  } catch (error) {
    console.error('❌ PDF Error:', error);
    throw error;
  }
};