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
  truck_reg?: string  // snake_case for database
  trailer_reg?: string  // snake_case for database
  truckReg?: string  // camelCase for components
  trailerReg?: string  // camelCase for components
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
    
    // Debug: Log sender and receiver analysis
    console.log('=== SENDER AND RECEIVER ANALYSIS ===')
    const lines = text.split(/\r?\n/)
    lines.forEach((line, index) => {
      if (line.toLowerCase().includes('sender') || line.toLowerCase().includes('receiver') || 
          line.toLowerCase().includes('somerset') || line.toLowerCase().includes('fritz') || 
          line.toLowerCase().includes('karan') || line.toLowerCase().includes('wonderwale')) {
        console.log(`Line ${index}: "${line}"`)
      }
    })
    console.log('=== END SENDER/RECEIVER ANALYSIS ===')
    
    // Debug: Log the raw text for registration number analysis
    console.log('=== RAW TEXT FOR REGISTRATION ANALYSIS ===')
    console.log('Raw text length:', text.length)
    console.log('Raw text preview (first 500 chars):', text.substring(0, 500))
    console.log('Raw text preview (last 500 chars):', text.substring(Math.max(0, text.length - 500)))
    console.log('=== END RAW TEXT ANALYSIS ===')
    
    // Initialize extraction variables
    let startKm, endKm
    let allNumbers: number[] = []
    let sender = '', receiver = '', date = '', truck_reg = '', trailer_reg = ''
    let loading_time_arrived = '', loading_time_completed = ''
    let offloading_time_arrived = '', offloading_time_completed = ''
    let table: any[] = []
    
    // Debug: Log all lines for registration number analysis
    console.log('=== ANALYZING ALL LINES FOR REGISTRATION NUMBERS ===')
    lines.forEach((line, index) => {
      if (line.toLowerCase().includes('truck') || line.toLowerCase().includes('trailer') || line.toLowerCase().includes('reg')) {
        console.log(`Line ${index}: "${line}"`)
        console.log(`Line ${index} length: ${line.length}`)
        console.log(`Line ${index} trimmed: "${line.trim()}"`)
      }
    })
    console.log('=== END REGISTRATION ANALYSIS ===')
    
    // Debug: Test specific patterns on each line
    console.log('=== TESTING REGISTRATION PATTERNS ON EACH LINE ===')
    lines.forEach((line, index) => {
      if (line.toLowerCase().includes('truck') || line.toLowerCase().includes('trailer') || line.toLowerCase().includes('reg')) {
        console.log(`\n--- Testing Line ${index}: "${line}" ---`)
        
        // Test truck patterns
        const truckPatterns = [
          /Truck\s+Reg\.\s+No\.\s*:\s*(.+)/i,
          /Truck\s+Reg\s+No\.\s*:\s*(.+)/i,
          /Truck\s+Reg:\s*(.+)/i,
          /Truck\s+No\.\s*:\s*(.+)/i
        ]
        
        truckPatterns.forEach((pattern, i) => {
          const match = line.match(pattern)
          if (match) {
            console.log(`✅ TRUCK PATTERN ${i} MATCHED: "${match[1]}"`)
          } else {
            console.log(`❌ TRUCK PATTERN ${i} NO MATCH`)
          }
        })
        
        // Test trailer patterns
        const trailerPatterns = [
          /Trailer\s+Reg\.\s+No\.\s*:\s*(.+)/i,
          /Trailer\s+Reg\s+No\.\s*:\s*(.+)/i,
          /Trailer\s+Reg:\s*(.+)/i,
          /Trailer\s+No\.\s*:\s*(.+)/i
        ]
        
        trailerPatterns.forEach((pattern, i) => {
          const match = line.match(pattern)
          if (match) {
            console.log(`✅ TRAILER PATTERN ${i} MATCHED: "${match[1]}"`)
          } else {
            console.log(`❌ TRAILER PATTERN ${i} NO MATCH`)
          }
        })
      }
    })
    console.log('=== END PATTERN TESTING ===')
    
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
    
    // Extract sender and receiver with multi-line context
    let senderLines: string[] = []
    let receiverLines: string[] = []
    let inSenderSection = false
    let inReceiverSection = false
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      // Detect sender section
      if (line.match(/SENDER:/i)) {
        inSenderSection = true
        inReceiverSection = false
        console.log(`Found SENDER label at line ${i}: "${line}"`)
        
        // Extract content after SENDER: on the same line
        const senderMatch = line.match(/SENDER:\s*(.+)/i)
        if (senderMatch) {
          senderLines.push(senderMatch[1].trim())
          console.log(`Found sender content on same line: "${senderMatch[1].trim()}"`)
        }
        continue
      }
      
      // Detect receiver section
      if (line.match(/RECEIVER:/i)) {
        inReceiverSection = true
        inSenderSection = false
        console.log(`Found RECEIVER label at line ${i}: "${line}"`)
        
        // Extract content after RECEIVER: on the same line
        const receiverMatch = line.match(/RECEIVER:\s*(.+)/i)
        if (receiverMatch) {
          receiverLines.push(receiverMatch[1].trim())
          console.log(`Found receiver content on same line: "${receiverMatch[1].trim()}"`)
        }
        continue
      }
      
      // Collect sender lines (look for common sender patterns)
      if (inSenderSection && !inReceiverSection) {
        const senderPatterns = [
          /(Somerset East|Fritz Marx|Vleissentraal)/i,
          /(^[A-Z][a-z]+\s+[A-Z][a-z]+$)/, // Two capitalized words
          /(^[A-Z][a-z]+$)/ // Single capitalized word
        ]
        
        for (const pattern of senderPatterns) {
          if (pattern.test(line) && line.length > 3 && line.length < 50) {
            senderLines.push(line)
            console.log(`Found sender line: "${line}"`)
            break
          }
        }
        
        // Stop collecting sender lines if we hit a section divider or empty line
        if (line === '' || line.match(/Cell No:|LOADING:|OFF LOADING:/i)) {
          inSenderSection = false
        }
      }
      
      // Collect receiver lines (look for common receiver patterns)
      if (inReceiverSection && !inSenderSection) {
        const receiverPatterns = [
          /(KARAN BEEF|WONDERWALE|PMB)/i,
          /(^[A-Z][A-Z\s,]+$)/, // All caps with spaces and commas
          /(^[A-Z][a-z]+\s+[A-Z][a-z]+$)/ // Two capitalized words
        ]
        
        for (const pattern of receiverPatterns) {
          if (pattern.test(line) && line.length > 3 && line.length < 50) {
            receiverLines.push(line)
            console.log(`Found receiver line: "${line}"`)
            break
          }
        }
        
        // Stop collecting receiver lines if we hit a section divider or empty line
        if (line === '' || line.match(/Cell No:|LOADING:|OFF LOADING:/i)) {
          inReceiverSection = false
        }
      }
    }
    
    // Combine sender and receiver lines
    if (senderLines.length > 0) {
      sender = senderLines.join(', ')
      console.log(`Combined sender: "${sender}" from ${senderLines.length} lines`)
    }
    
    if (receiverLines.length > 0) {
      receiver = receiverLines.join(', ')
      console.log(`Combined receiver: "${receiver}" from ${receiverLines.length} lines`)
    }
    
    // Extract other fields from all lines
    for (const line of lines) {
      
      if (!truck_reg) {
        // Look for various truck registration patterns
        const truckMatch = line.match(/Truck\s+Reg\.\s+No\.\s*:\s*(.+)/i) ||
                          line.match(/Truck\s+Reg\s+No\.\s*:\s*(.+)/i) ||
                          line.match(/Truck\s+Registration\s+No\.\s*:\s*(.+)/i) ||
                          line.match(/Truck\s+Reg:\s*(.+)/i) ||
                          line.match(/Truck\s+No\.\s*:\s*(.+)/i) ||
                          line.match(/Truck:\s*(.+)/i) ||
                          line.match(/TRUCK\s+REG[:\s]+(.+)/i) ||
                          line.match(/TRUCK\s+NO[:\s]+(.+)/i) ||
                          line.match(/Truck\s+Reg[:\s]+(.+)/i) ||
                          line.match(/Truck\s+No[:\s]+(.+)/i) ||
                          line.match(/Truck\s+Reg\.\s+No\.\s+(.+)/i) ||
                          line.match(/Truck\s+Reg\s+No\.\s+(.+)/i)
        if (truckMatch) {
          truck_reg = truckMatch[1].trim()
          console.log(`Found truck_reg: "${truck_reg}" from line: "${line}"`)
        }
      }
      
      if (!trailer_reg) {
        // Look for various trailer registration patterns
        const trailerMatch = line.match(/Trailer\s+Reg\.\s+No\.\s*:\s*(.+)/i) ||
                            line.match(/Trailer\s+Reg\s+No\.\s*:\s*(.+)/i) ||
                            line.match(/Trailer\s+Registration\s+No\.\s*:\s*(.+)/i) ||
                            line.match(/Trailer\s+Reg:\s*(.+)/i) ||
                            line.match(/Trailer\s+No\.\s*:\s*(.+)/i) ||
                            line.match(/Trailer:\s*(.+)/i) ||
                            line.match(/Reg\.\s+Nox?\.\s*:\s*(.+)/i) ||
                            line.match(/Trailer.*?No\.\s*:\s*(.+)/i) ||
                            line.match(/Reg\.\s+No\.\s*:\s*(.+)/i) ||
                            line.match(/Rog\.\s+Nox?\.\s*:\s*(.+)/i) || // Keep old pattern as fallback
                            line.match(/TRAILER\s+REG[:\s]+(.+)/i) ||
                            line.match(/TRAILER\s+NO[:\s]+(.+)/i) ||
                            line.match(/Trailer\s+Reg[:\s]+(.+)/i) ||
                            line.match(/Trailer\s+No[:\s]+(.+)/i) ||
                            line.match(/REG\s+NO[:\s]+(.+)/i) ||
                            line.match(/Trailer\s+Reg\.\s+No\.\s+(.+)/i) ||
                            line.match(/Trailer\s+Reg\s+No\.\s+(.+)/i)
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
    
    // BRUTE FORCE APPROACH: Look for any line that might contain registration numbers
    console.log('=== BRUTE FORCE REGISTRATION SEARCH ===')
    console.log('Total lines to search:', lines.length)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      
      // Look for lines that contain both "reg" and numbers/letters that look like registration
      if (line.toLowerCase().includes('reg') && (line.match(/[0-9]/) || line.match(/[A-Z]/))) {
        console.log(`🔍 BRUTE FORCE: Found potential reg line ${i}: "${line}"`)
        console.log(`🔍 BRUTE FORCE: Line length: ${line.length}`)
        
        // Try to extract anything that looks like a registration number
        const regCandidates = line.match(/[A-Z0-9\s\-]{4,10}/g)
        if (regCandidates) {
          console.log(`🔍 BRUTE FORCE: Found candidates: ${regCandidates.join(', ')}`)
          
          // Filter candidates
          const validCandidates = regCandidates.filter(candidate => {
            const clean = candidate.trim()
            return clean.length >= 4 && clean.length <= 10 && 
                   (clean.match(/[0-9]/) && clean.match(/[A-Z]/)) // Must have both numbers and letters
          })
          
          console.log(`🔍 BRUTE FORCE: Valid candidates: ${validCandidates.join(', ')}`)
          
          // Assign to truck/trailer if not already found
          if (!truck_reg && validCandidates.length > 0) {
            truck_reg = validCandidates[0].trim()
            console.log(`🔍 BRUTE FORCE: Assigned truck_reg: "${truck_reg}"`)
          }
          
          if (!trailer_reg && validCandidates.length > 1) {
            trailer_reg = validCandidates[1].trim()
            console.log(`🔍 BRUTE FORCE: Assigned trailer_reg: "${trailer_reg}"`)
          }
        } else {
          console.log(`🔍 BRUTE FORCE: No candidates found in line: "${line}"`)
        }
      }
    }
    console.log('=== END BRUTE FORCE SEARCH ===')

    // Fallback registration extraction - look for any alphanumeric sequences that might be registration numbers
    if (!truck_reg || !trailer_reg) {
      console.log('=== FALLBACK REGISTRATION EXTRACTION ===')
      // Look for patterns like: ABC123, 123ABC, ABC-123, ABC 123, 018 SSG, 019-20-555, etc.
      const regMatches = text.match(/\b[A-Z]{2,3}[\s\-]?[0-9]{2,4}[A-Z]?\b/g) || 
                        text.match(/\b[0-9]{2,4}[\s\-]?[A-Z]{2,3}\b/g) ||
                        text.match(/\b[A-Z]{1,2}[0-9]{3,6}[A-Z]?\b/g) ||
                        text.match(/\b[0-9]{3,6}[A-Z]{1,2}\b/g) ||
                        text.match(/\b[0-9]{3}\s+[A-Z]{3}\b/g) ||  // Pattern: 018 SSG
                        text.match(/\b[0-9]{3}-[0-9]{2}-[0-9]{3}\b/g) ||  // Pattern: 019-20-555
                        text.match(/\b[0-9]{3}\s+[A-Z]{2,3}\b/g) ||  // Pattern: 018 SSG (alternative)
                        text.match(/\b[0-9]{3}-[0-9]{2}-[0-9]{3}\b/g)  // Pattern: 019-20-555 (alternative)
      
      if (regMatches) {
        console.log('Found potential registration numbers:', regMatches)
        
        // Filter out obvious non-registration patterns
        const filteredRegs = regMatches.filter(reg => {
          const cleanReg = reg.replace(/[\s\-]/g, '')
          // Skip if it's too short, too long, or contains only numbers
          return cleanReg.length >= 4 && cleanReg.length <= 8 && !/^\d+$/.test(cleanReg)
        })
        
        console.log('Filtered registration numbers:', filteredRegs)
        
        if (!truck_reg && filteredRegs.length > 0) {
          truck_reg = filteredRegs[0]
          console.log(`Fallback truck_reg: "${truck_reg}"`)
        }
        
        if (!trailer_reg && filteredRegs.length > 1) {
          trailer_reg = filteredRegs[1]
          console.log(`Fallback trailer_reg: "${trailer_reg}"`)
        }
      }
      
      // Additional fallback: look for any line that contains "reg" or "no" followed by alphanumeric
      if (!truck_reg || !trailer_reg) {
        console.log('=== ADDITIONAL FALLBACK: SEARCHING FOR REG/NO PATTERNS ===')
        for (const line of lines) {
          const regNoMatch = line.match(/(?:reg|no)[:\s]+([a-zA-Z0-9\s\-]{4,8})/i)
          if (regNoMatch) {
            const potentialReg = regNoMatch[1].trim()
            console.log(`Found potential registration from line: "${line}" -> "${potentialReg}"`)
            
            if (!truck_reg && potentialReg.length >= 4) {
              truck_reg = potentialReg
              console.log(`Using as truck_reg: "${truck_reg}"`)
            } else if (!trailer_reg && potentialReg.length >= 4) {
              trailer_reg = potentialReg
              console.log(`Using as trailer_reg: "${trailer_reg}"`)
            }
          }
        }
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
      truckReg: truck_reg || undefined,  // Convert to camelCase
      trailerReg: trailer_reg || undefined,  // Convert to camelCase
      truck_reg: truck_reg || undefined,  // Keep snake_case for database compatibility
      trailer_reg: trailer_reg || undefined,  // Keep snake_case for database compatibility
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