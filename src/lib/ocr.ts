import Tesseract from 'tesseract.js'

export interface OCRResult {
  startKm?: number
  endKm?: number
  totalKm?: number
  confidence: number
  allNumbers?: number[]
  // Additional fields for form population
  sender?: string
  receiver?: string
  date?: string
  truck_reg?: string
  trailer_reg?: string
  loading_time_arrived?: string
  loading_time_completed?: string
  offloading_time_arrived?: string
  offloading_time_completed?: string
  table?: Array<{
    packages?: string
    description?: string
    gross?: string
    volume?: string
    r?: string
    c?: string
  }>
}

export const extractLoadDocumentData = async (imageFile: File): Promise<OCRResult | null> => {
  try {
    const { data: { text, confidence } } = await Tesseract.recognize(imageFile, 'eng')
    
    // Debug: Log the full OCR text
    console.log('=== TESSERACT OCR FULL TEXT ===')
    console.log(text)
    console.log('=== END OCR TEXT ===')
    
    // Initialize extraction variables
    let startKm, endKm
    let allNumbers: number[] = []
    let sender = '', receiver = '', date = '', truck_reg = '', trailer_reg = ''
    let loading_time_arrived = '', loading_time_completed = ''
    let offloading_time_arrived = '', offloading_time_completed = ''
    let table: any[] = []
    
    const lines = text.split(/\r?\n/)
    
    // Extract KM values - they are handwritten at the bottom of the document
    // Focus on the bottom portion where KM readings appear
    const totalLines = lines.length
    const bottomLines = lines.slice(Math.floor(totalLines * 0.7)) // Bottom 30% of document
    
    console.log('=== SEARCHING FOR KM VALUES IN BOTTOM SECTION ===')
    bottomLines.forEach((line, index) => {
      console.log(`Bottom line ${index}: "${line}"`)
    })
    
    for (const line of bottomLines) {
      // Skip lines with obvious non-KM content
      if (line.includes('ax:') || line.includes('£') || line.includes('BTW') || 
          line.includes('E-Pos') || line.includes('INVOICE') || line.includes('fax') ||
          line.includes('conditions') || line.includes('liable') || line.includes('premium') ||
          line.includes('shortages') || line.includes('packages') || line.includes('declared')) {
        continue
      }
      
      // Look for any numbers in the bottom section - could be handwritten KM readings
      const numbers = line.match(/\b(\d{4,7})\b/g) // Broader range for handwritten numbers
      if (numbers) {
        for (const num of numbers) {
          const numVal = parseInt(num)
          // KM readings are typically in this range
          if (numVal >= 50000 && numVal <= 2000000) {
            if (!startKm) {
              startKm = numVal
              console.log(`Found startKm: ${startKm} from bottom line: "${line}"`)
            } else if (!endKm && numVal !== startKm) {
              endKm = numVal
              console.log(`Found endKm: ${endKm} from bottom line: "${line}"`)
              break // Stop after finding two KM values
            }
          }
        }
      }
      
      // If we found both KM values, stop searching
      if (startKm && endKm) break
    }
    
    // Extract other fields from all lines
    for (const line of lines) {
      // Extract fields - customized for your specific document format
      if (!sender && !receiver) {
        // Handle the case where SENDER and RECEIVER are on the same line
        const senderReceiverMatch = line.match(/SENDER:\s*([^R]+)\s*RECEIVER:\s*(.+)/i)
        if (senderReceiverMatch) {
          sender = senderReceiverMatch[1].trim()
          receiver = senderReceiverMatch[2].trim()
          console.log(`Found sender: "${sender}" and receiver: "${receiver}" from line: "${line}"`)
        }
      }
      
      // Fallback: try individual patterns if not found together
      if (!sender) {
        const senderMatch = line.match(/SENDER:\s*([^R]+)/i)
        if (senderMatch) {
          sender = senderMatch[1].trim()
          console.log(`Found sender: "${sender}" from line: "${line}"`)
        }
      }
      
      if (!receiver) {
        const receiverMatch = line.match(/RECEIVER:\s*(.+)/i)
        if (receiverMatch) {
          receiver = receiverMatch[1].trim()
          console.log(`Found receiver: "${receiver}" from line: "${line}"`)
        }
      }
      
      if (!truck_reg) {
        // Look for "Truck Reg. No." pattern from your document
        const truckMatch = line.match(/Truck\s+Reg\.\s+No\.\s+(.+)/i)
        if (truckMatch) {
          truck_reg = truckMatch[1].trim()
          console.log(`Found truck_reg: "${truck_reg}" from line: "${line}"`)
        }
      }
      
      if (!trailer_reg) {
        // Look for trailer registration pattern from your document
        const trailerMatch = line.match(/Rog\.\s+Nox?\.\s+(.+)/i) ||
                            line.match(/Trailer.*?No\.\s+(.+)/i)
        if (trailerMatch) {
          trailer_reg = trailerMatch[1].trim()
          console.log(`Found trailer_reg: "${trailer_reg}" from line: "${line}"`)
        }
      }
      
      if (!date) {
        // Look for date patterns in your document (handwritten dates)
        const dateMatch = line.match(/(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i) ||
                         line.match(/(\d{1,2}\s+\d{1,2}\s+\d{2,4})/i)
        if (dateMatch) {
          date = dateMatch[1].trim()
          console.log(`Found date: "${date}" from line: "${line}"`)
        }
      }
      
      // Extract time fields
      if (!loading_time_arrived) {
        const loadArrMatch = line.match(/loading.*arrived[:\s]*(\d{1,2}:\d{2})/i)
        if (loadArrMatch) loading_time_arrived = loadArrMatch[1].trim()
      }
      
      if (!loading_time_completed) {
        const loadCompMatch = line.match(/loading.*completed[:\s]*(\d{1,2}:\d{2})/i)
        if (loadCompMatch) loading_time_completed = loadCompMatch[1].trim()
      }
      
      if (!offloading_time_arrived) {
        const offloadArrMatch = line.match(/offloading.*arrived[:\s]*(\d{1,2}:\d{2})/i)
        if (offloadArrMatch) offloading_time_arrived = offloadArrMatch[1].trim()
      }
      
      if (!offloading_time_completed) {
        const offloadCompMatch = line.match(/offloading.*completed[:\s]*(\d{1,2}:\d{2})/i)
        if (offloadCompMatch) offloading_time_completed = offloadCompMatch[1].trim()
      }
      
      // Extract table data (basic pattern matching for packages and description)
      const packageMatch = line.match(/(\d+)\s+([A-Za-z\s]+)\s*(\d*\.?\d*)\s*(\d*\.?\d*)/i)
      if (packageMatch && packageMatch[1] && packageMatch[2]) {
        table.push({
          packages: packageMatch[1],
          description: packageMatch[2].trim(),
          gross: packageMatch[3] || '',
          volume: packageMatch[4] || '',
          r: '',
          c: ''
        })
      }
    }
    
    // Fallback KM extraction if not found in bottom section
    if (!startKm || !endKm) {
      const kmMatches = text.match(/\d{5,7}/g)
      if (kmMatches && kmMatches.length >= 2) {
        allNumbers = kmMatches.map(n => parseInt(n)).filter(n => !isNaN(n) && n >= 50000 && n <= 2000000)
        if (!startKm && allNumbers.length > 0) startKm = allNumbers[allNumbers.length - 2]
        if (!endKm && allNumbers.length > 1) endKm = allNumbers[allNumbers.length - 1]
      }
    }
    
    return {
      startKm,
      endKm,
      totalKm: startKm && endKm ? endKm - startKm : undefined,
      confidence: confidence || 0,
      allNumbers,
      sender: sender || undefined,
      receiver: receiver || undefined,
      date: date || undefined,
      truck_reg: truck_reg || undefined,
      trailer_reg: trailer_reg || undefined,
      loading_time_arrived: loading_time_arrived || undefined,
      loading_time_completed: loading_time_completed || undefined,
      offloading_time_arrived: offloading_time_arrived || undefined,
      offloading_time_completed: offloading_time_completed || undefined,
      table: table.length > 0 ? table : undefined
    }
  } catch (error) {
    return null
  }
}