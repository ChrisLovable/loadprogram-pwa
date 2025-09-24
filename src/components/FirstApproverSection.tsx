import React, { useState } from 'react'

interface FirstApproverSectionProps {
  load: any // expects load with ocr_data and optionally vision_data
  onApprovalComplete: () => void
}

// Helper to get table data from AWS Textract, Vision, or OCR
const getTableData = (load: any) => {
  // Priority: AWS Textract > Vision data > Local OCR data
  if (load?.textract_data?.table && Array.isArray(load.textract_data.table)) {
    return load.textract_data.table
  }
  if (load?.vision_data?.table && Array.isArray(load.vision_data.table)) {
    return load.vision_data.table
  }
  if (load?.ocr_data?.table && Array.isArray(load.ocr_data.table)) {
    return load.ocr_data.table
  }
  // No hardcoded fallback - let OCR/Vision/Textract populate the table
  return [
    { packages: '', description: '', gross: '', volume: '', r: '', c: '' }
  ]
}

const getField = (load: any, field: string, fallback: any = '') => {
  // Priority: AWS Textract > Vision data > Local OCR data
  if (load?.textract_data && load.textract_data[field] !== undefined) return load.textract_data[field]
  if (load?.vision_data && load.vision_data[field] !== undefined) return load.vision_data[field]
  if (load?.ocr_data && load.ocr_data[field] !== undefined) return load.ocr_data[field]
  return fallback
}

const labelStyle = { fontSize: '1.05rem', fontWeight: 700, color: '#333', marginBottom: '0.1rem' }
const inputStyle = { width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #e0e7ef', fontSize: '1rem', background: '#f7fafd' }

const FirstApproverSection: React.FC<FirstApproverSectionProps> = ({ load, onApprovalComplete }) => {
  // Debug: Log the load data
  console.log('FirstApprover received load:', load)
  console.log('Textract data available:', load?.textract_data)
  console.log('StartKm from getField:', getField(load, 'startKm', 'NOT_FOUND'))
  console.log('EndKm from getField:', getField(load, 'endKm', 'NOT_FOUND'))
  // Vision fields
  const [sender, setSender] = useState(getField(load, 'sender', ''))
  const [receiver, setReceiver] = useState(getField(load, 'receiver', ''))
  const [date, setDate] = useState(getField(load, 'date', ''))
  const [truckReg, setTruckReg] = useState(getField(load, 'truck_reg', ''))
  const [trailerReg, setTrailerReg] = useState(getField(load, 'trailer_reg', ''))

  const [table, setTable] = useState(getTableData(load))
  const [startKm, setStartKm] = useState(getField(load, 'startKm', ''))
  const [endKm, setEndKm] = useState(getField(load, 'endKm', ''))

  // Update fields when load data changes (e.g., when Textract data arrives)
  React.useEffect(() => {
    const newStartKm = getField(load, 'startKm', '')
    const newEndKm = getField(load, 'endKm', '')
    const newSender = getField(load, 'sender', '')
    const newReceiver = getField(load, 'receiver', '')
    const newTruckReg = getField(load, 'truck_reg', '')
    const newTrailerReg = getField(load, 'trailer_reg', '')
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
  const [rate, setRate] = useState('')
  const [comments, setComments] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const tripKm = startKm && endKm ? Number(endKm) - Number(startKm) : ''
  const subtotal = rate && tripKm ? Number(rate) * Number(tripKm) : 0
  const vatAmount = subtotal ? subtotal * 0.15 : 0
  const totalInvoice = subtotal ? subtotal + vatAmount : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      // Temporarily disabled Supabase calls due to DNS/certificate issues
      console.log('Supabase approval disabled - simulating success')
      
      // Store first approval data for other roles to access
      const firstApprovalData = {
        rate: rate,
        subtotal: subtotal.toFixed(2),
        vat: vatAmount.toFixed(2),
        total: totalInvoice.toFixed(2),
        comments: comments,
        tripKm: tripKm,
        approver: 'First Approver',
        timestamp: new Date().toISOString()
      }
      
      // Store in localStorage for other roles to access
      localStorage.setItem('firstApprovalData', JSON.stringify(firstApprovalData))
      console.log('Stored first approval data:', firstApprovalData)
      
      // Simulate approval delay
      await new Promise(resolve => setTimeout(resolve, 800))
      
      setRate('')
      setComments('')
      alert('Approval submitted! (Simulated - Supabase disabled)')
      onApprovalComplete()
    } catch (error) {
      console.error('FirstApproverSection approval failed:', error)
      alert('Failed to submit approval. See console for details.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="approver-form">
      {/* Load Details - No Extra Padding */}
      <div style={{background:'#f7fafd',borderRadius:'10px',padding:'0',marginBottom:'1.2rem',boxShadow:'0 1px 4px rgba(79,140,255,0.07)'}}>
        <div style={{fontWeight:700,marginBottom:'0.5rem',fontSize:'1.05rem',color:'#38d39f',padding:'0.5rem 0.5rem 0 0.5rem'}}>📋 Load Details</div>
        
        {/* Date - Left Aligned */}
        <div style={{marginBottom:'0.7rem',paddingLeft:'0.5rem',paddingRight:'0.5rem'}}>
          <div style={labelStyle}>Date</div>
          <input type="text" value={date} onChange={e => setDate(e.target.value)} style={{padding:'0.6rem',borderRadius:'6px',border:'1px solid #333',fontSize:'1rem',background:'#f7fafd',width:'80px'}} />
        </div>
        
        {/* Sender - Left Aligned */}
        <div style={{marginBottom:'0.7rem',paddingLeft:'0.5rem',paddingRight:'0.5rem'}}>
          <div style={labelStyle}>Sender</div>
          <input type="text" value={sender} onChange={e => setSender(e.target.value)} style={{padding:'0.6rem',borderRadius:'6px',border:'1px solid #333',fontSize:'1rem',background:'#f7fafd',width:'280px'}} />
        </div>
        
        {/* Receiver - Left Aligned */}
        <div style={{marginBottom:'0.7rem',paddingLeft:'0.5rem',paddingRight:'0.5rem'}}>
          <div style={labelStyle}>Receiver</div>
          <input type="text" value={receiver} onChange={e => setReceiver(e.target.value)} style={{padding:'0.6rem',borderRadius:'6px',border:'1px solid #333',fontSize:'1rem',background:'#f7fafd',width:'280px'}} />
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
      <div style={{marginBottom:'1.2rem'}}>
        <table style={{width:'100%',borderCollapse:'collapse',background:'#f7fafd',borderRadius:'8px',overflow:'hidden',boxShadow:'0 1px 4px rgba(79,140,255,0.07)',fontSize:'0.75rem'}}>
          <thead>
            <tr style={{background:'#e3f6f5',color:'#38d39f',fontWeight:700}}>
              <th style={{padding:'0.3rem 0.2rem',fontSize:'0.7rem',border:'1px solid #d1d5db'}}>No</th>
              <th style={{padding:'0.3rem 0.2rem',fontSize:'0.7rem',border:'1px solid #d1d5db'}}>Description</th>
              <th style={{padding:'0.3rem 0.2rem',fontSize:'0.7rem',border:'1px solid #d1d5db'}}>Mass</th>
              <th style={{padding:'0.3rem 0.2rem',fontSize:'0.7rem',border:'1px solid #d1d5db'}}>Volume</th>
              <th style={{padding:'0.3rem 0.2rem',fontSize:'0.7rem',border:'1px solid #d1d5db'}}>R</th>
              <th style={{padding:'0.3rem 0.2rem',fontSize:'0.7rem',border:'1px solid #d1d5db'}}>C</th>
            </tr>
          </thead>
          <tbody>
            {/* Always show 5 rows - populated from data or empty */}
            {Array.from({ length: 5 }, (_, i) => {
              const row = table[i] || { packages: '', description: '', gross: '', volume: '', r: '', c: '' }
              return (
                <tr key={i} style={{textAlign:'center',fontWeight:600,color:'#333'}}>
                  <td style={{padding:'0.3rem 0.2rem',fontSize:'0.75rem',border:'1px solid #d1d5db',minHeight:'2rem'}}>{row.packages}</td>
                  <td style={{padding:'0.3rem 0.2rem',fontSize:'0.75rem',border:'1px solid #d1d5db',minHeight:'2rem'}}>{row.description}</td>
                  <td style={{padding:'0.3rem 0.2rem',fontSize:'0.75rem',border:'1px solid #d1d5db',minHeight:'2rem'}}>{row.gross}</td>
                  <td style={{padding:'0.3rem 0.2rem',fontSize:'0.75rem',border:'1px solid #d1d5db',minHeight:'2rem'}}>{row.volume}</td>
                  <td style={{padding:'0.3rem 0.2rem',fontSize:'0.75rem',border:'1px solid #d1d5db',minHeight:'2rem'}}>{row.r}</td>
                  <td style={{padding:'0.3rem 0.2rem',fontSize:'0.75rem',border:'1px solid #d1d5db',minHeight:'2rem'}}>{row.c}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
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
        <div style={{display: 'flex', justifyContent: 'center', marginBottom: '0.5rem', paddingLeft: '0.5rem', paddingRight: '0.5rem', gap: '1rem'}}>
          <div style={{border: '1px solid #4f8cff', borderRadius: '6px', padding: '0.5rem', minHeight: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '120px'}}>
            Start: <input type="number" value={startKm} onChange={e => setStartKm(e.target.value)} style={{width:70,border:'none',background:'transparent',fontWeight:700,color:'#4f8cff',marginLeft:'0.3rem',textAlign:'center'}} />
          </div>
          <div style={{border: '1px solid #4f8cff', borderRadius: '6px', padding: '0.5rem', minHeight: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '120px'}}>
            End: <input type="number" value={endKm} onChange={e => setEndKm(e.target.value)} style={{width:70,border:'none',background:'transparent',fontWeight:700,color:'#4f8cff',marginLeft:'0.3rem',textAlign:'center'}} />
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
        
        {/* Rate per KM - Fixed Width */}
        <div style={{marginBottom:'0.8rem'}}>
          <div style={{...labelStyle,fontSize:'0.9rem'}}>Rate per KM</div>
          <input 
            type="number" 
            step="0.01" 
            value={rate} 
            onChange={e => setRate(e.target.value)} 
            style={{...inputStyle,width:'80px',textAlign:'center',fontSize:'1rem',border:'1px solid #333',borderRadius:'6px'}} 
            placeholder="0.00"
            required 
          />
        </div>
        
        {/* Subtotal and VAT - Same Line */}
        <div style={{display:'flex',gap:'1rem',justifyContent:'flex-start',marginBottom:'1rem'}}>
          <div style={{textAlign:'center'}}>
            <div style={labelStyle}>Subtotal</div>
            <input 
              type="text" 
              value={subtotal ? `R ${subtotal.toFixed(2)}` : ''} 
              readOnly 
              style={{...inputStyle,width:'100px',background:'#f0f4ff',color:'#4f8cff',fontWeight:600,textAlign:'center',fontSize:'0.9rem',border:'1px solid #333',borderRadius:'6px'}} 
            />
          </div>
          <div style={{textAlign:'center'}}>
            <div style={labelStyle}>VAT (15%)</div>
            <input 
              type="text" 
              value={vatAmount ? `R ${vatAmount.toFixed(2)}` : ''} 
              readOnly 
              style={{...inputStyle,width:'100px',background:'#fff4e6',color:'#ff8c00',fontWeight:600,textAlign:'center',fontSize:'0.9rem',border:'1px solid #333',borderRadius:'6px'}} 
            />
          </div>
        </div>
        
        <div style={{textAlign:'center'}}>
          <div style={{...labelStyle,fontSize:'1.1rem',fontWeight:700,color:'#38d39f'}}>TOTAL INVOICE</div>
          <div style={{
            background:'#e3f6f5',
            color:'#38d39f',
            fontWeight:700,
            fontSize:'1.3rem',
            padding:'0.8rem',
            borderRadius:'8px',
            border:'2px solid #38d39f',
            textAlign:'center',
            marginTop:'0.3rem'
          }}>
            {totalInvoice ? `R ${totalInvoice.toFixed(2)}` : 'R 0.00'}
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
    </form>
  )
}

export default FirstApproverSection
