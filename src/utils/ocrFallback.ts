// Fallback OCR service using Tesseract.js for when AWS Textract is unavailable

export interface OCRResult {
  confidence: number;
  sender: string;
  receiver: string;
  truck_reg: string;
  trailer_reg: string;
  date: string;
  startKm: string;
  endKm: string;
  table: any[];
}

export async function fallbackOCR(imageFile: File): Promise<OCRResult> {
  // Import Tesseract dynamically to avoid bundle bloat
  const { createWorker } = await import('tesseract.js');
  
  const worker = await createWorker('eng');
  
  try {
    const { data: { text, confidence } } = await worker.recognize(imageFile);
    
    // Basic text parsing logic (simplified version of your existing logic)
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    let sender = '';
    let receiver = '';
    let truck_reg = '';
    let trailer_reg = '';
    let date = '';
    let startKm = '';
    let endKm = '';
    
    // Simple pattern matching
    for (const line of lines) {
      if (line.includes('Sender') || line.includes('From')) {
        sender = line.replace(/Sender|From/i, '').trim();
      }
      if (line.includes('Receiver') || line.includes('To')) {
        receiver = line.replace(/Receiver|To/i, '').trim();
      }
      if (line.match(/\d{2}\/\d{2}\/\d{2}/)) {
        date = line;
      }
      if (line.match(/\d+\s+[A-Z]{2,3}\s+[A-Z]{2}/)) {
        if (!truck_reg) truck_reg = line;
        else trailer_reg = line;
      }
    }
    
    return {
      confidence: confidence / 100,
      sender: sender || 'Not detected',
      receiver: receiver || 'Not detected',
      truck_reg: truck_reg || 'Not detected',
      trailer_reg: trailer_reg || 'Not detected',
      date: date || 'Not detected',
      startKm: startKm || 'Not detected',
      endKm: endKm || 'Not detected',
      table: []
    };
    
  } finally {
    await worker.terminate();
  }
}

export function isTextractAvailable(): boolean {
  // Check if AWS Textract endpoint is reachable
  return navigator.onLine && true; // Basic check
}
