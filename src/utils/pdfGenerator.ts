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

export const generatePDFInvoice = (loadData: any): void => {
  const doc = new jsPDF();
  
  // Generate invoice number
  const invoiceNumber = `INV-${Date.now()}`;
  
  // Company header
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('GOLIATSKRAAL', 20, 30);
  
  // Company details
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Transport & Logistics', 20, 40);
  doc.text('Phone: +27 XX XXX XXXX', 20, 50);
  doc.text('Email: info@goliatskraal.co.za', 20, 60);
  
  // Invoice title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 150, 30);
  
  // Invoice details
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice #: ${invoiceNumber}`, 150, 45);
  doc.text(`Date: ${loadData.date || new Date().toLocaleDateString()}`, 150, 55);
  doc.text(`Status: ${loadData.status || 'Completed'}`, 150, 65);
  
  // Load information section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('LOAD DETAILS', 20, 85);
  
  // Load information table
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const loadDetails = [
    ['Truck Registration:', loadData.truckReg || loadData.parsed_data?.truckReg || 'N/A'],
    ['Driver:', loadData.driverName || loadData.driver_name || 'N/A'],
    ['From:', loadData.sender || loadData.parsed_data?.sender || 'N/A'],
    ['To:', loadData.receiver || loadData.parsed_data?.receiver || 'N/A'],
    ['Trip Distance:', `${loadData.tripKm || loadData.parsed_data?.tripKm || 0} km`],
    ['Total Animals:', loadData.totalAnimals || loadData.parsed_data?.totalAnimals || 0],
  ];
  
  let yPosition = 100;
  loadDetails.forEach(([label, value]) => {
    doc.text(label, 20, yPosition);
    doc.text(value, 80, yPosition);
    yPosition += 10;
  });
  
  // Description section
  if (loadData.description || loadData.parsed_data?.description) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DESCRIPTION:', 20, yPosition + 10);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const description = loadData.description || loadData.parsed_data?.description || '';
    const splitDescription = doc.splitTextToSize(description, 150);
    doc.text(splitDescription, 20, yPosition + 20);
    yPosition += 30 + (splitDescription.length * 5);
  }
  
  // Pricing section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('CHARGES', 20, yPosition + 20);
  
  // Simple pricing table
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const charges = [
    ['Transport Fee', 'R 2,500.00'],
    ['Distance Charge', `R ${((loadData.tripKm || 0) * 2.50).toFixed(2)}`],
    ['Animal Handling', `R ${((loadData.totalAnimals || 0) * 15.00).toFixed(2)}`],
  ];
  
  yPosition += 35;
  charges.forEach(([description, amount]) => {
    doc.text(description, 20, yPosition);
    doc.text(amount, 150, yPosition);
    yPosition += 10;
  });
  
  // Total
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  const total = 2500 + ((loadData.tripKm || 0) * 2.50) + ((loadData.totalAnimals || 0) * 15.00);
  doc.text('TOTAL:', 20, yPosition + 10);
  doc.text(`R ${total.toFixed(2)}`, 150, yPosition + 10);
  
  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Thank you for your business!', 20, 280);
  doc.text('Generated on: ' + new Date().toLocaleString(), 20, 290);
  
  // Save the PDF
  const fileName = `Invoice_${loadData.truckReg || loadData.parsed_data?.truckReg || 'Unknown'}_${loadData.date || new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
  
  // Save invoice to localStorage for invoice manager
  const invoice = {
    id: `invoice_${Date.now()}`,
    invoiceNumber,
    date: loadData.date || new Date().toLocaleDateString(),
    truckReg: loadData.truckReg || loadData.parsed_data?.truckReg || 'N/A',
    sender: loadData.sender || loadData.parsed_data?.sender || 'N/A',
    receiver: loadData.receiver || loadData.parsed_data?.receiver || 'N/A',
    total: total,
    status: 'Generated',
    loadData: loadData
  };
  
  const existingInvoices = JSON.parse(localStorage.getItem('generatedInvoices') || '[]');
  existingInvoices.push(invoice);
  localStorage.setItem('generatedInvoices', JSON.stringify(existingInvoices));
};
