import React, { useState, useEffect } from 'react'

interface FirstApproverSectionProps {
  load: any // expects load with ocr_data and optionally vision_data
  onApprovalComplete: () => void
}

// Helper to get table data from parsed_data/parsed_table, AWS Textract, Vision, or OCR
const getTableData = (load: any) => {
  // Priority: parsed_table > parsed_data.table > textract_data.table > vision_data.table > ocr_data.table
  if (load?.parsed_table && Array.isArray(load.parsed_table)) {
    return load.parsed_table
  }
  if (load?.parsed_data?.table && Array.isArray(load.parsed_data.table)) {
    return load.parsed_data.table
  }
  if (load?.textract_data?.table && Array.isArray(load.textract_data.table)) {
    return load.textract_data.table
  }
  if (load?.vision_data?.table && Array.isArray(load.vision_data.table)) {
    return load.vision_data.table
  }
  if (load?.ocr_data?.table && Array.isArray(load.ocr_data.table)) {
    return load.ocr_data.table
  }
  return [
    { packages: '', description: '', gross: '', volume: '', r: '', c: '' }
  ]
}

const getField = (load: any, field: string, fallback: any = '') => {
  // Priority: parsed_data > textract_data > vision_data > ocr_data
  if (load?.parsed_data && load.parsed_data[field] !== undefined) return load.parsed_data[field]
  if (load?.textract_data && load.textract_data[field] !== undefined) return load.textract_data[field]
  if (load?.vision_data && load.vision_data[field] !== undefined) return load.vision_data[field]
  if (load?.ocr_data && load.ocr_data[field] !== undefined) return load.ocr_data[field]
  
  // Special handling for registration numbers - check both camelCase and snake_case
  if (field === 'truckReg' || field === 'trailerReg') {
    const snakeCaseField = field === 'truckReg' ? 'truck_reg' : 'trailer_reg'
    if (load?.parsed_data && load.parsed_data[snakeCaseField] !== undefined) return load.parsed_data[snakeCaseField]
    if (load?.textract_data && load.textract_data[snakeCaseField] !== undefined) return load.textract_data[snakeCaseField]
    if (load?.vision_data && load.vision_data[snakeCaseField] !== undefined) return load.vision_data[snakeCaseField]
    if (load?.ocr_data && load.ocr_data[snakeCaseField] !== undefined) return load.ocr_data[snakeCaseField]
  }
  
  return fallback
}

const labelStyle = { fontSize: '1.05rem', fontWeight: 700, color: '#333', marginBottom: '0.1rem' }
const inputStyle = { width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #e0e7ef', fontSize: '1rem', background: '#f7fafd', height: '2.2rem', minHeight: '2.2rem' }

const FirstApproverSection: React.FC<FirstApproverSectionProps> = ({ load, onApprovalComplete }) => {
  // Debug: Log the load data
  console.log('FirstApprover received load:', load)
  console.log('Textract data available:', load?.textract_data)
  console.log('Parsed data available:', load?.parsed_data)
  console.log('Load keys:', Object.keys(load || {}))
  console.log('StartKm from getField:', getField(load, 'startKm', 'NOT_FOUND'))
  console.log('EndKm from getField:', getField(load, 'endKm', 'NOT_FOUND'))
  console.log('TruckReg from getField:', getField(load, 'truckReg', 'NOT_FOUND'))
  console.log('TrailerReg from getField:', getField(load, 'trailerReg', 'NOT_FOUND'))
  // Vision fields
  const [sender, setSender] = useState(getField(load, 'sender', ''))
  const [receiver, setReceiver] = useState(getField(load, 'receiver', ''))
  const [date, setDate] = useState(getField(load, 'date', ''))
  const [truckReg, setTruckReg] = useState(getField(load, 'truckReg', ''))
  const [trailerReg, setTrailerReg] = useState(getField(load, 'trailerReg', ''))

  const [table, setTable] = useState(getTableData(load))
  const [startKm, setStartKm] = useState(getField(load, 'startKm', ''))
  const [endKm, setEndKm] = useState(getField(load, 'endKm', ''))

  // Update fields when load data changes (e.g., when Textract data arrives)
  React.useEffect(() => {
    const newStartKm = getField(load, 'startKm', '')
    const newEndKm = getField(load, 'endKm', '')
    const newSender = getField(load, 'sender', '')
    const newReceiver = getField(load, 'receiver', '')
    const newTruckReg = getField(load, 'truckReg', '')
    const newTrailerReg = getField(load, 'trailerReg', '')
    const newDate = getField(load, 'date', '')
    
    console.log('Updating all fields:', { 
      newStartKm, newEndKm, newSender, newReceiver, 
      newTruckReg, newTrailerReg, newDate 
    })
    
    setStartKm(newStartKm)
    setEndKm(newEndKm)
    setSender(newSender)
    setReceiver(newReceiver)
    setTruckReg(newTruckReg)
    setTrailerReg(newTrailerReg)
    setDate(newDate)
    setTable(getTableData(load))
  }, [load.textract_data, load.ocr_data, load.vision_data])
  const [rate, setRate] = useState(0)
  const [ratePerAnimal, setRatePerAnimal] = useState(0)
  const [runningKms, setRunningKms] = useState(0)
  const [runningKmRate, setRunningKmRate] = useState(0)
  const [discount, setDiscount] = useState(0)
  const [comments, setComments] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Currency formatting function
  const formatCurrency = (value: number): string => {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  const tripKm = startKm && endKm ? Number(endKm) - Number(startKm) : ''
  
  // Calculate costs
  // Parse all values as numbers, defaulting to 0
  const tripKmNum = Number(tripKm) || 0;
  const rateNum = Number(rate) || 0;
  const ratePerAnimalNum = Number(ratePerAnimal) || 0;
  const runningKmsNum = Number(runningKms) || 0;
  const runningKmRateNum = Number(runningKmRate) || 0;
  const discountNum = Number(discount) || 0;

  const costPerLoadedKm = rateNum && tripKmNum ? rateNum * tripKmNum : 0;
  // Calculate totalAnimals from the table
  const totalAnimals = table.reduce((sum: number, row: any) => {
    const packages = parseInt(row.packages) || 0;
    return sum + packages;
  }, 0);
  const costPerHead = ratePerAnimalNum && totalAnimals ? ratePerAnimalNum * totalAnimals : 0;
  const costPerRunningKm = runningKmsNum && runningKmRateNum ? runningKmsNum * runningKmRateNum : 0;
  // Total subtotal is the sum of all three
  const baseSubtotal = costPerLoadedKm + costPerHead + costPerRunningKm;
  // Apply discount
  const discountAmount = baseSubtotal * (discountNum / 100);
  const subtotal = baseSubtotal - discountAmount;
  const vatAmount = subtotal ? subtotal * 0.15 : 0;
  const totalInvoice = subtotal ? subtotal + vatAmount : 0;

  // Input handlers
  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRate(e.target.value === '' ? 0 : e.target.valueAsNumber);
  };
  const handleRatePerAnimalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRatePerAnimal(e.target.value === '' ? 0 : e.target.valueAsNumber);
  };
  const handleRunningKmsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRunningKms(e.target.value === '' ? 0 : e.target.valueAsNumber);
  };
  const handleRunningKmRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRunningKmRate(e.target.value === '' ? 0 : e.target.valueAsNumber);
  };
  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDiscount(e.target.value === '' ? 0 : e.target.valueAsNumber);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      // Prepare updated data
      const updatedParsedData = {
        ...load.parsed_data,
        sender,
        receiver,
        date,
        truckReg,
        trailerReg,
        startKm: Number(startKm),
        endKm: Number(endKm),
        tripKm: Number(tripKm),
        rate: Number(rate),
        ratePerAnimal: Number(ratePerAnimal),
        runningKms: Number(runningKms),
        runningKmRate: Number(runningKmRate),
        discount: Number(discount),
        subtotal: subtotal, // store as number
        vat: vatAmount, // store as number
        total: totalInvoice, // store as number
        totalAnimals,
            comments,
        approved_by_1st: currentUser.name || '',
        // Add any other fields you want to persist
      };
      // Normalize date to YYYY-MM-DD
      let safeDate = date;
      if (date) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
          safeDate = date;
        } else if (/^\d{2}-\d{2}-\d{2}$/.test(date)) {
          const [yy, mm, dd] = date.split('-');
          const yyyy = parseInt(yy, 10) < 50 ? '20' + yy : '19' + yy;
          safeDate = `${yyyy}-${mm}-${dd}`;
        } else {
          safeDate = new Date().toISOString().slice(0, 10);
        }
      } else {
        safeDate = new Date().toISOString().slice(0, 10);
      }
      // Update the load in Supabase
      let supabase
      try {
        const supabaseModule = await import('../lib/supabase')
        supabase = supabaseModule.supabase
        
        if (!supabase) {
          throw new Error('Supabase client is undefined')
        }
      } catch (importError) {
        const errorMessage = importError instanceof Error ? importError.message : String(importError)
        console.error('Supabase import failed:', errorMessage)
        
        // Fallback: Try to create Supabase client directly
        try {
          console.log('Trying direct Supabase creation...')
          const { createClient } = await import('@supabase/supabase-js')
          supabase = createClient(
            'https://rdzjowqopmdlbkfuafxr.supabase.co',
            'sb_publishable_Zfc7tBpl0ho1GuF2HLjKxQ_BlU_A24w'
          )
          console.log('Direct Supabase created:', !!supabase)
        } catch (directError) {
          const directErrorMessage = directError instanceof Error ? directError.message : String(directError)
          console.error('Direct creation failed:', directErrorMessage)
          throw new Error('Failed to create Supabase client: ' + directErrorMessage)
        }
      }
      
      const { error } = await supabase.from('loads').update({
        status: 'first_approved',
        sender,
        receiver,
        date: safeDate,
        truck_reg: truckReg,
        trailer_reg: trailerReg,
        parsed_data: updatedParsedData,
        parsed_table: table,
      }).eq('id', load.id)
      if (error) {
        alert('Failed to update load: ' + error.message);
      } else {
        // Store first approval data for other roles to access
        const firstApprovalData = {
          rate: rate,
          ratePerAnimal: ratePerAnimal,
          subtotal: formatCurrency(subtotal),
          vat: formatCurrency(vatAmount),
          total: formatCurrency(totalInvoice),
          comments: comments,
          tripKm: tripKm,
          totalAnimals: totalAnimals,
          costPerLoadedKm: formatCurrency(costPerLoadedKm),
          costPerHead: formatCurrency(costPerHead),
          costPerRunningKm: formatCurrency(costPerRunningKm),
          discount: discount,
          discountAmount: formatCurrency(discountAmount),
          approver: 'First Approver',
          timestamp: new Date().toISOString()
        }
        localStorage.setItem('firstApprovalData', JSON.stringify(firstApprovalData))
        window.dispatchEvent(new CustomEvent('firstApprovalUpdated', { detail: firstApprovalData }))
        setRate(0)
      setComments('')
        alert('Approval submitted and saved!')
      onApprovalComplete()
      }
    } catch (error) {
      console.error('FirstApproverSection approval failed:', error)
      alert('Failed to submit approval. See console for details.')
    } finally {
      setSubmitting(false)
    }
  }

  // Real-time update when rate changes (without submitting)
  React.useEffect(() => {
    if ((rate && tripKm) || (ratePerAnimal && totalAnimals) || (runningKms && runningKmRate)) {
      const currentData = {
        rate: rate,
        ratePerAnimal: ratePerAnimal,
        subtotal: formatCurrency(subtotal),
        vat: formatCurrency(vatAmount),
        total: formatCurrency(totalInvoice),
        comments: comments,
        tripKm: tripKm,
        totalAnimals: totalAnimals,
        costPerLoadedKm: formatCurrency(costPerLoadedKm),
        costPerHead: formatCurrency(costPerHead),
        costPerRunningKm: formatCurrency(costPerRunningKm),
        discount: discount,
        discountAmount: formatCurrency(discountAmount),
        approver: 'First Approver',
        timestamp: new Date().toISOString()
      }
      
      // Update localStorage immediately when rate changes
      localStorage.setItem('firstApprovalData', JSON.stringify(currentData))
      
      // Dispatch custom event for real-time updates
      window.dispatchEvent(new CustomEvent('firstApprovalUpdated', { 
        detail: currentData 
      }))
    }
  }, [rate, ratePerAnimal, tripKm, subtotal, vatAmount, totalInvoice, comments, totalAnimals, costPerLoadedKm, costPerHead, costPerRunningKm, discount, discountAmount])

  // Real-time save for basic fields (sender, receiver, date, truck/trailer reg)
  React.useEffect(() => {
    const saveBasicFields = async () => {
      if (!load?.id) return;
      
      try {
        // Normalize date to YYYY-MM-DD
        let safeDate = date;
        if (date) {
          if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            safeDate = date;
          } else if (/^\d{2}-\d{2}-\d{2}$/.test(date)) {
            const [yy, mm, dd] = date.split('-');
            const yyyy = parseInt(yy, 10) < 50 ? '20' + yy : '19' + yy;
            safeDate = `${yyyy}-${mm}-${dd}`;
          } else {
            safeDate = new Date().toISOString().slice(0, 10);
          }
        } else {
          safeDate = new Date().toISOString().slice(0, 10);
        }

        // Update the load in Supabase with basic fields
        const { supabase } = await import('../lib/supabase');
        const { error } = await supabase.from('loads').update({
          sender,
          receiver,
          date: safeDate,
          truck_reg: truckReg,
          trailer_reg: trailerReg,
        }).eq('id', load.id);

        if (error) {
          console.error('Failed to save basic fields:', error);
        } else {
          console.log('Basic fields saved successfully:', { sender, receiver, date: safeDate, truckReg, trailerReg });
        }
      } catch (error) {
        console.error('Error saving basic fields:', error);
      }
    };

    // Debounce the save operation to avoid too many database calls
    const timeoutId = setTimeout(saveBasicFields, 1000); // Save after 1 second of no changes
    
    return () => clearTimeout(timeoutId);
  }, [sender, receiver, date, truckReg, trailerReg, load?.id]);

  // Get current user from localStorage
  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('currentUser') || '{}');
    } catch { return {}; }
  })();

  return (
    <form onSubmit={handleSubmit} className="approver-form">
      {/* Load Details - No Extra Padding */}
      <div style={{background:'#f7fafd',borderRadius:'10px',padding:'0',marginBottom:'1.2rem',boxShadow:'0 1px 4px rgba(79,140,255,0.07)',width:'90%',maxWidth:'90vw',margin:'0 auto 1.2rem auto'}}>
        <div style={{
          color: '#2563eb',
          borderRadius: '8px',
          padding: '0.5rem 1rem',
          textAlign: 'center',
          textShadow: '0 1px 2px rgba(0,0,0,0.03)',
          letterSpacing: '0.5px',
          fontWeight: 700,
          fontSize: '1.1rem',
          margin: '0.5rem 0',
          background: 'none'
        }}>
          📋 Load Details
          </div>
        
        {/* Document Thumbnails */}
        {load.photos && load.photos.length > 0 && (
          <div style={{marginBottom:'0.7rem',paddingLeft:'0.5rem',paddingRight:'0.5rem'}}>
            <div style={labelStyle}>Documents</div>
            <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap',marginTop:'0.3rem'}}>
              {load.photos.map((photoUrl: string, i: number) => (
                <div key={i} style={{
                  width: 48,
                  height: 48,
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: '2px solid #2563eb',
                  boxShadow: '0 2px 6px rgba(37,99,235,0.2)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease'
                }}
                onClick={() => {
                  // Open image in full screen
                  const newWindow = window.open('', '_blank');
                  if (newWindow) {
                    newWindow.document.write(`
                      <html>
                        <head><title>Document ${i+1}</title></head>
                        <body style="margin:0;padding:20px;background:#000;display:flex;justify-content:center;align-items:center;min-height:100vh;">
                          <img src="${photoUrl}" style="max-width:90%;max-height:90%;object-fit:contain;border-radius:8px;" />
                        </body>
                      </html>
                    `);
                  }
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <img 
                    src={photoUrl} 
                    alt={`Document ${i+1}`} 
                    style={{
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover'
                    }} 
                    onError={(e) => {
                      if (!e.currentTarget.src.endsWith('/no-image.png')) {
                        e.currentTarget.src = '/no-image.png';
                      }
                    }} 
                  />
          </div>
              ))}
          </div>
          </div>
        )}
        
        {/* Date - Left Aligned */}
        <div style={{marginBottom:'0.7rem',paddingLeft:'0.5rem',paddingRight:'0.5rem'}}>
          <div style={labelStyle}>Date</div>
          <input type="text" value={date} onChange={e => setDate(e.target.value)} style={{padding:'0.6rem',borderRadius:'6px',border:'1px solid #333',fontSize:'1rem',background:'#f7fafd',width:'120px'}} />
          </div>
        
        {/* Sender - Left Aligned */}
        <div style={{marginBottom:'0.7rem',paddingLeft:'0.5rem',paddingRight:'0.5rem'}}>
            <div style={labelStyle}>Sender</div>
          <input type="text" value={sender} onChange={e => setSender(e.target.value)} style={{padding:'0.6rem',borderRadius:'6px',border:'1px solid #333',fontSize:'1rem',background:'#f7fafd',width:'100%',maxWidth:'280px'}} />
          </div>
        
        {/* Receiver - Left Aligned */}
        <div style={{marginBottom:'0.7rem',paddingLeft:'0.5rem',paddingRight:'0.5rem'}}>
            <div style={labelStyle}>Receiver</div>
          <input type="text" value={receiver} onChange={e => setReceiver(e.target.value)} style={{padding:'0.6rem',borderRadius:'6px',border:'1px solid #333',fontSize:'1rem',background:'#f7fafd',width:'100%',maxWidth:'280px'}} />
          </div>
        
        {/* Truck & Trailer Reg - Aligned to Edges */}
        <div style={{display:'flex',justifyContent:'space-between',paddingLeft:'0.5rem',paddingRight:'0.5rem',paddingBottom:'0.5rem'}}>
          <div>
            <div style={labelStyle}>Truck Reg.</div>
            <input type="text" value={truckReg} onChange={e => setTruckReg(e.target.value)} style={{...inputStyle,width:'100px',border:'1px solid #333',borderRadius:'6px'}} />
          </div>
          <div>
            <div style={labelStyle}>Trailer Reg.</div>
            <input type="text" value={trailerReg} onChange={e => setTrailerReg(e.target.value)} style={{...inputStyle,width:'100px',border:'1px solid #333',borderRadius:'6px'}} />
          </div>
        </div>
      </div>
      {/* Document Info Table - Excel-like Structure */}
      <div style={{marginBottom:'1.2rem', maxWidth:'100%', overflowX:'auto'}}>
        <table style={{width:'100%', borderCollapse:'collapse', background:'#ffffff', borderRadius:'8px', overflow:'hidden', boxShadow:'0 4px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.1)', fontSize:'0.65rem'}}>
          <thead>
            <tr style={{background:'#ffffff',color:'#2563eb',fontWeight:700}}>
              <th style={{padding:'0',fontSize:'0.65rem',border:'1px solid #d1d5db', minWidth:'40px',background:'#ffffff'}}>No</th>
              <th style={{padding:'0',fontSize:'0.65rem',border:'1px solid #d1d5db', minWidth:'80px',background:'#ffffff'}}>Description</th>
              <th style={{padding:'0',fontSize:'0.65rem',border:'1px solid #d1d5db', minWidth:'50px',background:'#ffffff'}}>Mass</th>
              <th style={{padding:'0',fontSize:'0.65rem',border:'1px solid #d1d5db', minWidth:'50px',background:'#ffffff'}}>Volume</th>
              <th style={{padding:'0',fontSize:'0.65rem',border:'1px solid #d1d5db', minWidth:'30px',background:'#ffffff'}}>R</th>
              <th style={{padding:'0',fontSize:'0.65rem',border:'1px solid #d1d5db', minWidth:'30px',background:'#ffffff'}}>C</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 6 }, (_, i) => {
              const row = table[i] || { packages: '', description: '', gross: '', volume: '', r: '', c: '' };
              return (
              <tr key={i} style={{textAlign:'center',fontWeight:600,color:'#333',background:'#ffffff'}}>
                  <td style={{padding:'0',fontSize:'0.65rem',border:'1px solid #d1d5db',minHeight:'2rem',background:'#ffffff'}}>
                    <input
                      type="text"
                      value={row.packages}
                      onChange={e => {
                        const newTable = [...table];
                        // Ensure we have enough rows
                        while (newTable.length <= i) {
                          newTable.push({ packages: '', description: '', gross: '', volume: '', r: '', c: '' });
                        }
                        newTable[i] = { ...row, packages: e.target.value };
                        setTable(newTable);
                      }}
                      style={{width:'100%',maxWidth:'40px',textAlign:'center',border:'none',background:'transparent',fontWeight:600,color:'#333',padding:'0',fontSize:'0.65rem'}}
                    />
                  </td>
                  <td style={{padding:'0',fontSize:'0.65rem',border:'1px solid #d1d5db',minHeight:'2rem',background:'#ffffff'}}>
                    <input
                      type="text"
                      value={row.description}
                      onChange={e => {
                        const newTable = [...table];
                        // Ensure we have enough rows
                        while (newTable.length <= i) {
                          newTable.push({ packages: '', description: '', gross: '', volume: '', r: '', c: '' });
                        }
                        newTable[i] = { ...row, description: e.target.value };
                        setTable(newTable);
                      }}
                      style={{width:'100%',maxWidth:'80px',textAlign:'left',border:'none',background:'transparent',fontWeight:600,color:'#333',padding:'0',fontSize:'0.65rem'}}
                    />
                  </td>
                  <td style={{padding:'0',fontSize:'0.65rem',border:'1px solid #d1d5db',minHeight:'2rem',background:'#ffffff'}}>
                    <input
                      type="text"
                      value={row.gross}
                      onChange={e => {
                        const newTable = [...table];
                        // Ensure we have enough rows
                        while (newTable.length <= i) {
                          newTable.push({ packages: '', description: '', gross: '', volume: '', r: '', c: '' });
                        }
                        newTable[i] = { ...row, gross: e.target.value };
                        setTable(newTable);
                      }}
                      style={{width:'100%',maxWidth:'50px',textAlign:'center',border:'none',background:'transparent',fontWeight:600,color:'#333',padding:'0',fontSize:'0.65rem'}}
                    />
                  </td>
                  <td style={{padding:'0',fontSize:'0.65rem',border:'1px solid #d1d5db',minHeight:'2rem',background:'#ffffff'}}>
                    <input
                      type="text"
                      value={row.volume}
                      onChange={e => {
                        const newTable = [...table];
                        // Ensure we have enough rows
                        while (newTable.length <= i) {
                          newTable.push({ packages: '', description: '', gross: '', volume: '', r: '', c: '' });
                        }
                        newTable[i] = { ...row, volume: e.target.value };
                        setTable(newTable);
                      }}
                      style={{width:'100%',maxWidth:'50px',textAlign:'center',border:'none',background:'transparent',fontWeight:600,color:'#333',padding:'0',fontSize:'0.65rem'}}
                    />
                  </td>
                  <td style={{padding:'0',fontSize:'0.65rem',border:'1px solid #d1d5db',minHeight:'2rem',background:'#ffffff'}}>
                    <input
                      type="text"
                      value={row.r}
                      onChange={e => {
                        const newTable = [...table];
                        // Ensure we have enough rows
                        while (newTable.length <= i) {
                          newTable.push({ packages: '', description: '', gross: '', volume: '', r: '', c: '' });
                        }
                        newTable[i] = { ...row, r: e.target.value };
                        setTable(newTable);
                      }}
                      style={{width:'100%',maxWidth:'30px',textAlign:'center',border:'none',background:'transparent',fontWeight:600,color:'#333',padding:'0',fontSize:'0.65rem'}}
                    />
                  </td>
                  <td style={{padding:'0',fontSize:'0.65rem',border:'1px solid #d1d5db',minHeight:'2rem',background:'#ffffff'}}>
                    <input
                      type="text"
                      value={row.c}
                      onChange={e => {
                        const newTable = [...table];
                        // Ensure we have enough rows
                        while (newTable.length <= i) {
                          newTable.push({ packages: '', description: '', gross: '', volume: '', r: '', c: '' });
                        }
                        newTable[i] = { ...row, c: e.target.value };
                        setTable(newTable);
                      }}
                      style={{width:'100%',maxWidth:'30px',textAlign:'center',border:'none',background:'transparent',fontWeight:600,color:'#333',padding:'0',fontSize:'0.65rem'}}
                    />
                  </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Total # of Animals */}
      <div style={{
        background: '#f0f9ff',
        borderRadius: '10px',
        padding: '0.7rem 1rem',
        marginBottom: '1.2rem',
        fontWeight: 600,
        fontSize: '1.05rem',
        color: '#0ea5e9',
        boxShadow: '0 1px 4px rgba(14,165,233,0.07)',
        textAlign: 'center'
      }}>
      <div style={{
          border: '1px solid #0ea5e9',
          borderRadius: '6px',
          padding: '0.5rem',
          minHeight: '2.5rem',
        display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto',
          maxWidth: '200px',
          background: '#ffffff'
        }}>
          Total # of Animals: <b style={{marginLeft:'0.3rem',color:'#0ea5e9'}}>
            {table.reduce((sum: number, row: any) => {
              const packages = parseInt(row.packages) || 0
              return sum + packages
            }, 0)}
          </b>
        </div>
      </div>
      
      <div style={{
        background: '#f0f4ff',
        borderRadius: '10px',
        padding: '0.7rem 1rem',
        marginBottom: '1.2rem',
        fontWeight: 600,
        fontSize: '1.05rem',
        color: '#4f8cff',
        boxShadow: '0 1px 4px rgba(79,140,255,0.07)'
      }}>
        <div style={{display: 'flex', justifyContent: 'center', marginBottom: '0.5rem', gap: '1rem'}}>
          <div style={{border: '1px solid #4f8cff', borderRadius: '6px', padding: '0.1rem', minHeight: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '150px'}}>
            <span style={{fontWeight: 600, color: '#4f8cff', marginRight: '0.2rem', fontSize: '0.8rem'}}>Start:</span>
            <input type="number" value={startKm} onChange={e => setStartKm(e.target.value)} style={{width:'100%',border:'none',background:'transparent',fontWeight:700,color:'#4f8cff',textAlign:'center',outline:'none', fontSize: '0.8rem'}} />
          </div>
          <div style={{border: '1px solid #4f8cff', borderRadius: '6px', padding: '0.1rem', minHeight: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '150px'}}>
            <span style={{fontWeight: 600, color: '#4f8cff', marginRight: '0.2rem', fontSize: '0.8rem'}}>End:</span>
            <input type="number" value={endKm} onChange={e => setEndKm(e.target.value)} style={{width:'100%',border:'none',background:'transparent',fontWeight:700,color:'#4f8cff',textAlign:'center',outline:'none', fontSize: '0.8rem'}} />
          </div>
        </div>
        <div style={{textAlign: 'center', borderTop: '1px solid rgba(79,140,255,0.2)', paddingTop: '0.5rem', paddingLeft: '0.5rem', paddingRight: '0.5rem'}}>
          <div style={{border: '1px solid #4f8cff', borderRadius: '6px', padding: '0.5rem', minHeight: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', maxWidth: '150px'}}>
            Trip: <b style={{marginLeft:'0.3rem'}}>{tripKm || '-'}</b> km
          </div>
        </div>
      </div>
      {/* Financial Calculation Section */}
      <div style={{
        background:'#f8f9ff',
        borderRadius:'12px',
        padding:'1rem',
        marginBottom:'1.2rem',
        boxShadow:'0 2px 8px rgba(79,140,255,0.1)',
        border:'1px solid #e8ecff'
      }}>
        <div style={{fontWeight:700,marginBottom:'0.8rem',fontSize:'1.05rem',color:'#4f8cff'}}>💰 Invoice Calculation</div>
        
        {/* Rate per Loaded KM - Fixed Width */}
        <div style={{marginBottom:'0.8rem'}}>
          <div style={{...labelStyle,fontSize:'1.05rem'}}>Rate per Loaded KM</div>
          <div style={{display:'flex',alignItems:'center',width:'120px',borderRadius:'6px',border:'1px solid #333',background:'#fff',overflow:'hidden'}}>
            <span style={{padding:'0 0.4rem',color:'#4f8cff',fontWeight:700,fontSize:'1rem',background:'#f7fafd',height:'100%',display:'flex',alignItems:'center'}}>R</span>
            <input 
              type="number" 
              step="0.01" 
              value={rate === 0 ? '' : rate}
              onChange={handleRateChange}
              style={{...inputStyle,border:'none',width:'100%',textAlign:'right',fontSize:'1rem',background:'transparent',fontWeight:700,color:'#333',outline:'none'}} 
              placeholder="0.00"
              required 
            />
          </div>
      </div>
        {/* Running KMs and Running KM Rate - Side by Side */}
        <div style={{display:'flex',gap:'1rem',marginBottom:'0.8rem'}}>
          <div>
            <div style={{...labelStyle,fontSize:'1.05rem'}}>Running KMs</div>
            <input 
              type="number" 
              step="0.01" 
              value={runningKms === 0 ? '' : runningKms}
              onChange={handleRunningKmsChange}
              style={{...inputStyle,width:'120px',textAlign:'right',fontSize:'1rem',border:'1px solid #333',borderRadius:'6px'}} 
              placeholder="0"
            />
          </div>
          <div>
            <div style={{...labelStyle,fontSize:'1.05rem'}}>Rate/km</div>
            <div style={{display:'flex',alignItems:'center',width:'120px',borderRadius:'6px',border:'1px solid #333',background:'#fff',overflow:'hidden'}}>
              <span style={{padding:'0 0.4rem',color:'#4f8cff',fontWeight:700,fontSize:'1rem',background:'#f7fafd',height:'100%',display:'flex',alignItems:'center'}}>R</span>
              <input 
                type="number" 
                step="0.01" 
                value={runningKmRate === 0 ? '' : runningKmRate}
                onChange={handleRunningKmRateChange}
                style={{...inputStyle,border:'none',width:'100%',textAlign:'right',fontSize:'1rem',background:'transparent',fontWeight:700,color:'#333',outline:'none'}} 
                placeholder="0.00"
              />
            </div>
          </div>
        </div>
        {/* Rate / Animal */}
        <div style={{marginBottom:'0.8rem'}}>
          <div style={{...labelStyle,fontSize:'1.05rem'}}>Rate / Animal</div>
          <div style={{display:'flex',alignItems:'center',width:'120px',borderRadius:'6px',border:'1px solid #333',background:'#fff',overflow:'hidden'}}>
            <span style={{padding:'0 0.4rem',color:'#4f8cff',fontWeight:700,fontSize:'1rem',background:'#f7fafd',height:'100%',display:'flex',alignItems:'center'}}>R</span>
            <input 
              type="number" 
              step="0.01" 
              value={ratePerAnimal === 0 ? '' : ratePerAnimal}
              onChange={handleRatePerAnimalChange}
              style={{...inputStyle,border:'none',width:'100%',textAlign:'right',fontSize:'1rem',background:'transparent',fontWeight:700,color:'#333',outline:'none'}} 
              placeholder="0.00"
            />
          </div>
        </div>
        {/* Cost Breakdown */}
        {(costPerLoadedKm > 0 || costPerHead > 0 || costPerRunningKm > 0 || discountAmount > 0) && (
          <div style={{
            background: '#f8f9fa',
            borderRadius: '8px',
            padding: '0.5rem',
            marginBottom: '0.8rem',
            fontSize: '0.9rem',
            color: '#666'
          }}>
            <div style={{fontWeight: 600, marginBottom: '0.3rem', color: '#333'}}>Cost Breakdown:</div>
            {costPerLoadedKm > 0 && (
              <div>Cost per Loaded KM: R{formatCurrency(costPerLoadedKm)} ({tripKm} km × R{rate})</div>
            )}
            {costPerRunningKm > 0 && (
              <div>Cost per Running KM: R{formatCurrency(costPerRunningKm)} ({runningKms} km × R{runningKmRate})</div>
            )}
            {costPerHead > 0 && (
              <div>Cost per Head: R{formatCurrency(costPerHead)} ({totalAnimals} animals × R{ratePerAnimal})</div>
            )}
            {discountAmount > 0 && (
              <div style={{color: '#dc2626'}}>Discount ({discount}%): -R{formatCurrency(discountAmount)}</div>
            )}
            <div style={{fontWeight: 600, marginTop: '0.3rem', color: '#333'}}>
              Total Subtotal: R{formatCurrency(subtotal)}
            </div>
          </div>
        )}
        
        {/* Subtotal, Discount, VAT, and Total Invoice - Responsive Layout */}
        <div style={{display:'flex',flexDirection:'column',gap:'0.8rem',marginBottom:'1rem',maxWidth:'100%'}}>
          {/* Top row: Subtotal, Discount, VAT - Vertical Layout */}
          <div style={{display:'flex',flexDirection:'column',gap:'0.8rem',alignItems:'flex-start'}}>
            <div style={{textAlign:'left',width:'120px'}}>
              <div style={{...labelStyle,fontSize:'1.05rem',marginBottom:'0.2rem'}}>Subtotal</div>
              <div style={{display:'flex',alignItems:'center',width:'120px',borderRadius:'6px',border:'1px solid #333',background:'#fff',overflow:'hidden',minHeight:'2rem'}}>
                <span style={{padding:'0 0.4rem',color:'#4f8cff',fontWeight:700,fontSize:'1rem',background:'#f7fafd',height:'100%',display:'flex',alignItems:'center'}}>R</span>
                <input 
                  type="text" 
                  value={baseSubtotal ? formatCurrency(baseSubtotal) : ''} 
                  readOnly 
                  style={{...inputStyle,border:'none',width:'100%',textAlign:'right',fontSize:'1rem',background:'transparent',fontWeight:700,color:'#333',outline:'none',minHeight:'2rem'}} 
                />
              </div>
            </div>
            <div style={{textAlign:'left',width:'120px'}}>
              <div style={{...labelStyle,fontSize:'1.05rem',marginBottom:'0.2rem'}}>Discount</div>
              <div style={{display:'flex',alignItems:'center',width:'120px',borderRadius:'6px',border:'1px solid #333',background:'#fff',overflow:'hidden',minHeight:'2rem'}}>
                <input 
                  type="number" 
                  step="0.01" 
                  value={discount === 0 ? '' : discount}
                  onChange={handleDiscountChange}
                  style={{...inputStyle,border:'none',width:'100%',textAlign:'right',fontSize:'1rem',background:'transparent',fontWeight:700,color:'#333',outline:'none',minHeight:'2rem'}} 
                  placeholder="0.00"
                />
                <span style={{padding:'0 0.4rem',color:'#dc2626',fontWeight:700,fontSize:'1rem',background:'#f7fafd',height:'100%',display:'flex',alignItems:'center'}}>%</span>
              </div>
            </div>
            <div style={{textAlign:'left',width:'120px'}}>
              <div style={{...labelStyle,fontSize:'1.05rem',marginBottom:'0.2rem'}}>VAT (15%)</div>
              <div style={{display:'flex',alignItems:'center',width:'120px',borderRadius:'6px',border:'1px solid #333',background:'#fff',overflow:'hidden',minHeight:'2rem'}}>
                <span style={{padding:'0 0.4rem',color:'#4f8cff',fontWeight:700,fontSize:'1rem',background:'#f7fafd',height:'100%',display:'flex',alignItems:'center'}}>R</span>
                <input 
                  type="text" 
                  value={vatAmount ? formatCurrency(vatAmount) : ''} 
                  readOnly 
                  style={{...inputStyle,border:'none',width:'100%',textAlign:'right',fontSize:'1rem',background:'transparent',fontWeight:700,color:'#333',outline:'none',minHeight:'2rem'}} 
                />
              </div>
            </div>
          </div>
          
          {/* Bottom row: TOTAL */}
          <div style={{display:'flex',justifyContent:'center',alignItems:'center'}}>
            <div style={{textAlign:'center',minWidth:'200px',maxWidth:'300px'}}>
              <div style={{...labelStyle,fontSize:'1.05rem',fontWeight:700,color:'#38d39f',marginBottom:'0.2rem'}}>TOTAL</div>
              <div style={{display:'flex',alignItems:'center',width:'100%',borderRadius:'6px',border:'2px solid #38d39f',background:'#fff',overflow:'hidden'}}>
                <span style={{padding:'0 0.4rem',color:'#38d39f',fontWeight:700,fontSize:'1rem',background:'#e3f6f5',height:'100%',display:'flex',alignItems:'center'}}>R</span>
                <input 
                  type="text" 
                  value={totalInvoice ? formatCurrency(totalInvoice) : '0.00'} 
                  readOnly 
                  style={{...inputStyle,border:'none',width:'100%',textAlign:'right',fontSize:'1rem',background:'transparent',fontWeight:700,color:'#38d39f',outline:'none'}} 
                />
              </div>
      </div>
        </div>
        </div>
      </div>
      
      <div className="form-group">
        <label>Comments</label>
        <textarea 
          value={comments} 
          onChange={e => setComments(e.target.value)} 
          rows={3} 
          placeholder="Optional notes or special instructions..." 
          style={{
            width: '100%',
            maxWidth: '100%',
            padding: '0.6rem',
            borderRadius: '6px',
            border: '1px solid #333',
            fontSize: '1rem',
            background: '#f7fafd',
            resize: 'none',
            boxSizing: 'border-box'
          }}
        />
      </div>
      <button 
        type="submit" 
        disabled={submitting} 
        style={{
          background: submitting ? '#94a3b8' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '1.1rem',
          fontWeight: 700,
          fontSize: '1.15rem',
          cursor: submitting ? 'not-allowed' : 'pointer',
          width: '100%',
          boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
          marginTop: '1.5rem',
          letterSpacing: '1px'
        }}
      >
        {submitting ? '⏳ Approving...' : '✅ Approve & Continue'}
      </button>

      {/* Photo Thumbnails */}
      {load.photos && load.photos.length > 0 && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          background: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{
            fontSize: '0.9rem',
            fontWeight: 600,
            color: '#374151',
            marginBottom: '0.5rem'
          }}>
            📸 Document Photos ({load.photos.length})
          </div>
          {/* Debug info */}
          <div style={{
            fontSize: '0.7rem',
            color: '#666',
            marginBottom: '0.5rem',
            padding: '0.3rem',
            background: '#f0f0f0',
            borderRadius: '4px'
          }}>
            Debug: {load.photos.length} photos found. First URL: {load.photos[0] ? load.photos[0].substring(0, 50) + '...' : 'No URL'}
          </div>
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'wrap',
            justifyContent: 'flex-start'
          }}>
            {load.photos.map((photoUrl: string, i: number) => {
              // Check if this is a Supabase storage path (starts with loads/) or a full URL
              const isStoragePath = photoUrl && photoUrl.startsWith('loads/');
              const [imageUrl, setImageUrl] = useState(photoUrl);
              
              // If it's a storage path, generate a new signed URL
              useEffect(() => {
                if (isStoragePath) {
                  const generateSignedUrl = async () => {
                    try {
                      const { supabase } = await import('../lib/supabase');
                      const { data, error } = await supabase.storage
                        .from('loads')
                        .createSignedUrl(photoUrl, 60 * 60 * 24 * 365); // 1 year expiry
                      
                      if (data && data.signedUrl) {
                        setImageUrl(data.signedUrl);
                        console.log(`Generated new signed URL for ${photoUrl}:`, data.signedUrl);
                      } else {
                        console.error(`Failed to generate signed URL for ${photoUrl}:`, error);
                      }
                    } catch (err) {
                      console.error(`Error generating signed URL for ${photoUrl}:`, err);
                    }
                  };
                  generateSignedUrl();
                }
              }, [photoUrl, isStoragePath]);
              
              return (
                <img
                  key={`${load.id}-photo-${i}`}
                  src={imageUrl}
                  alt={`Document ${i+1}`}
                  style={{
                    width: 60,
                    height: 60,
                    objectFit: 'cover',
                    borderRadius: '8px',
                    border: '2px solid #d1d5db',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                  onError={(e) => {
                    console.error(`Failed to load image ${i}:`, imageUrl);
                    e.currentTarget.style.border = '2px solid #ef4444';
                    e.currentTarget.style.background = '#fef2f2';
                  }}
                  onLoad={() => {
                    console.log(`Successfully loaded image ${i}:`, imageUrl);
                  }}
                  onClick={() => {
                    // Create modal for expanded view
                    const modal = document.createElement('div');
                    modal.style.cssText = `
                      position: fixed;
                      top: 0;
                      left: 0;
                      width: 100%;
                      height: 100%;
                      background: rgba(0,0,0,0.8);
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      z-index: 10000;
                      cursor: pointer;
                    `;
                    
                    const img = document.createElement('img');
                    img.src = imageUrl;
                    img.style.cssText = `
                      max-width: 90%;
                      max-height: 90%;
                      object-fit: contain;
                      border-radius: 8px;
                      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                    `;
                    
                    modal.appendChild(img);
                    document.body.appendChild(modal);
                    
                    modal.onclick = () => {
                      document.body.removeChild(modal);
                    };
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.borderColor = '#3b82f6';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.3)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.borderColor = '#d1d5db';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                  }}
                />
              );
            })}
          </div>
        </div>
      )}
    </form>
  )
}

export default FirstApproverSection

