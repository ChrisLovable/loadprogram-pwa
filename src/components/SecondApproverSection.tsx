import React, { useState } from 'react'

interface SecondApproverSectionProps {
  load: any // expects load with textract_data, ocr_data, and approval data
  onApprovalComplete: () => void
}

const labelStyle = { fontSize: '1.05rem', fontWeight: 700, color: '#333', marginBottom: '0.1rem' }
const inputStyle = { width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #e0e7ef', fontSize: '1rem', background: '#f7fafd' }

const SecondApproverSection: React.FC<SecondApproverSectionProps> = ({ load, onApprovalComplete }) => {
  const [comments, setComments] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [firstApprovalData, setFirstApprovalData] = useState<any>(null)

  // Load first approval data from localStorage
  React.useEffect(() => {
    const storedFirstApproval = localStorage.getItem('firstApprovalData')
    if (storedFirstApproval) {
      const data = JSON.parse(storedFirstApproval)
      setFirstApprovalData(data)
      console.log('SecondApprover loaded first approval data:', data)
    }
    
    // Listen for real-time updates from First Approver
    const handleFirstApprovalUpdate = (event: CustomEvent) => {
      const updatedData = event.detail
      setFirstApprovalData(updatedData)
      console.log('SecondApprover received real-time update:', updatedData)
    }
    
    window.addEventListener('firstApprovalUpdated', handleFirstApprovalUpdate as EventListener)
    
    return () => {
      window.removeEventListener('firstApprovalUpdated', handleFirstApprovalUpdate as EventListener)
    }
  }, [])

  // Debug: Log the load data
  console.log('SecondApprover received load:', load)
  console.log('SecondApprover first approval data:', firstApprovalData)

  // Helper to get a field from load.parsed_data or firstApprovalData
  const getField = (field: string, fallback = '-') => {
    return load?.parsed_data?.[field] || firstApprovalData?.[field] || fallback;
  };

  // Get current user from localStorage
  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('currentUser') || '{}');
    } catch { return {}; }
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      // Prepare updated parsed_data
      const updatedParsedData = {
        ...(load.parsed_data || {}),
        secondApproverComments: comments,
        second_approver: 'Second Approver',
        approved_by_2nd: currentUser.role === 'second_approver' ? currentUser.name : undefined,
        second_approved_at: new Date().toISOString(),
        // Ensure all fields from First Approver are carried forward as numbers
        date: getField('date', null),
        sender: getField('sender', null),
        receiver: getField('receiver', null),
        truckReg: getField('truckReg', null),
        trailerReg: getField('trailerReg', null),
        startKm: Number(getField('startKm', 0)),
        endKm: Number(getField('endKm', 0)),
        tripKm: Number(getField('tripKm', 0)),
        rate: Number(getField('rate', 0)),
        ratePerAnimal: Number(getField('ratePerAnimal', 0)),
        runningKms: Number(getField('runningKms', 0)),
        runningKmRate: Number(getField('runningKmRate', 0)),
        subtotal: Number(getField('subtotal', 0)),
        vat: Number(getField('vat', 0)),
        total: Number(getField('total', 0)),
        totalAnimals: Number(getField('totalAnimals', 0)),
      };
      // Update the load in Supabase
      const { error } = await import('../lib/supabase').then(({ supabase }) =>
        supabase.from('loads').update({
          status: 'second_approved',
          parsed_data: updatedParsedData,
        }).eq('id', load.id)
      );
      if (error) {
        alert('Failed to update load: ' + error.message);
      } else {
        setComments('');
        alert('Second approval submitted and promoted to Invoicer!');
        onApprovalComplete();
      }
    } catch (error) {
      console.error('SecondApproverSection approval failed:', error)
      alert('Failed to submit second approval. See console for details.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="approver-form">
      {currentUser.role === 'second_approver' && currentUser.name && (
        <div style={{fontSize:'0.98rem',color:'#0284c7',fontWeight:600,marginBottom:'0.5rem'}}>Approved by: {currentUser.name}</div>
      )}
      {/* Sender and Receiver */}
      <div style={{display:'flex',gap:'1rem',marginBottom:'0.7rem'}}>
        <div>
          <div style={labelStyle}>Sender</div>
          <div style={{...inputStyle,width:'150px',background:'#f8fafc',color:'#666',fontWeight:500,textAlign:'left',border:'1px solid #333',borderRadius:'6px'}}>
            {getField('sender')}
          </div>
        </div>
        <div>
          <div style={labelStyle}>Receiver</div>
          <div style={{...inputStyle,width:'150px',background:'#f8fafc',color:'#666',fontWeight:500,textAlign:'left',border:'1px solid #333',borderRadius:'6px'}}>
            {getField('receiver')}
          </div>
        </div>
      </div>
      {/* Descriptions Table */}
      {Array.isArray(load?.parsed_table) && load.parsed_table.filter(row => Object.values(row).some(v => v && v !== '')).length > 0 && (
        <div style={{marginBottom:'0.7rem'}}>
          <div style={labelStyle}>Descriptions Table</div>
          <table style={{width:'100%',borderCollapse:'collapse',background:'#f7fafd',borderRadius:'8px',overflow:'hidden',boxShadow:'0 1px 4px rgba(79,140,255,0.07)',fontSize:'0.75rem'}}>
            <thead>
              <tr style={{background:'#e3f6f5',color:'#38d39f',fontWeight:700}}>
                <th style={{padding:'0.3rem 0.2rem',fontSize:'0.75rem',border:'1px solid #d1d5db'}}>No</th>
                <th style={{padding:'0.3rem 0.2rem',fontSize:'0.75rem',border:'1px solid #d1d5db'}}>Description</th>
                <th style={{padding:'0.3rem 0.2rem',fontSize:'0.75rem',border:'1px solid #d1d5db'}}>Mass</th>
                <th style={{padding:'0.3rem 0.2rem',fontSize:'0.75rem',border:'1px solid #d1d5db'}}>Volume</th>
                <th style={{padding:'0.3rem 0.2rem',fontSize:'0.75rem',border:'1px solid #d1d5db'}}>R</th>
                <th style={{padding:'0.3rem 0.2rem',fontSize:'0.75rem',border:'1px solid #d1d5db'}}>C</th>
              </tr>
            </thead>
            <tbody>
              {load.parsed_table.filter(row => Object.values(row).some(v => v && v !== '')).map((row, i) => (
                <tr key={i} style={{textAlign:'center',fontWeight:600,color:'#333'}}>
                  <td style={{padding:'0.3rem 0.2rem',fontSize:'0.75rem',border:'1px solid #d1d5db',minHeight:'2rem'}}>{row.packages}</td>
                  <td style={{padding:'0.3rem 0.2rem',fontSize:'0.75rem',border:'1px solid #d1d5db',minHeight:'2rem'}}>{row.description}</td>
                  <td style={{padding:'0.3rem 0.2rem',fontSize:'0.75rem',border:'1px solid #d1d5db',minHeight:'2rem'}}>{row.gross}</td>
                  <td style={{padding:'0.3rem 0.2rem',fontSize:'0.75rem',border:'1px solid #d1d5db',minHeight:'2rem'}}>{row.volume}</td>
                  <td style={{padding:'0.3rem 0.2rem',fontSize:'0.75rem',border:'1px solid #d1d5db',minHeight:'2rem'}}>{row.r}</td>
                  <td style={{padding:'0.3rem 0.2rem',fontSize:'0.75rem',border:'1px solid #d1d5db',minHeight:'2rem'}}>{row.c}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Load Summary - Read Only */}
      <div style={{background:'#f7fafd',borderRadius:'10px',padding:'0.7rem',marginBottom:'1.2rem',boxShadow:'0 1px 4px rgba(79,140,255,0.07)'}}>
        <div style={{fontWeight:700,marginBottom:'0.5rem',fontSize:'1.05rem',color:'#2563eb'}}>📋 Load Summary</div>
        
        {/* Trip KM and Rate per KM */}
        <div style={{display:'flex',gap:'1rem',marginBottom:'0.7rem'}}>
          <div>
            <div style={labelStyle}>Trip KM</div>
            <div style={{...inputStyle,width:'100px',background:'#f8fafc',color:'#666',fontWeight:500,textAlign:'center',border:'1px solid #333',borderRadius:'6px'}}>
              {getField('tripKm') ? Number(getField('tripKm')).toFixed(2) : '-'}
            </div>
          </div>
          <div>
            <div style={labelStyle}>Rate per KM</div>
            <div style={{...inputStyle,width:'100px',background:'#f8fafc',color:'#666',fontWeight:500,textAlign:'center',border:'1px solid #333',borderRadius:'6px'}}>
              {getField('rate') ? Number(getField('rate')).toFixed(2) : '-'}
            </div>
          </div>
        </div>
        {/* # Animals and Rate / Animal */}
        {(getField('ratePerAnimal') || getField('ratePerAnimal') === 0) && (
          <div style={{display:'flex',gap:'1rem',marginBottom:'0.7rem'}}>
            <div>
              <div style={labelStyle}># Animals</div>
              <div style={{...inputStyle,width:'100px',background:'#f8fafc',color:'#666',fontWeight:500,textAlign:'center',border:'1px solid #333',borderRadius:'6px'}}>
                {getField('totalAnimals') ? Number(getField('totalAnimals')).toFixed(2) : '-'}
              </div>
            </div>
            <div>
              <div style={labelStyle}>Rate / Animal</div>
              <div style={{...inputStyle,width:'100px',background:'#f8fafc',color:'#666',fontWeight:500,textAlign:'center',border:'1px solid #333',borderRadius:'6px'}}>
                {getField('ratePerAnimal') ? Number(getField('ratePerAnimal')).toFixed(2) : '-'}
              </div>
            </div>
          </div>
        )}
        {/* Running KMs and Running KM Rate */}
        {(getField('runningKmRate') || getField('runningKmRate') === 0) && (
          <div style={{display:'flex',gap:'1rem',marginBottom:'0.7rem'}}>
            <div>
              <div style={labelStyle}>Running KMs</div>
              <div style={{...inputStyle,width:'100px',background:'#f8fafc',color:'#666',fontWeight:500,textAlign:'center',border:'1px solid #333',borderRadius:'6px'}}>
                {getField('runningKms') ? Number(getField('runningKms')).toFixed(2) : '-'}
              </div>
            </div>
            <div>
              <div style={labelStyle}>Running KM Rate</div>
              <div style={{...inputStyle,width:'100px',background:'#f8fafc',color:'#666',fontWeight:500,textAlign:'center',border:'1px solid #333',borderRadius:'6px'}}>
                {getField('runningKmRate') ? Number(getField('runningKmRate')).toFixed(2) : '-'}
              </div>
            </div>
          </div>
        )}

        {/* Financial Summary from First Approver */}
        <div style={{
          background:'#f0f9ff',
          borderRadius:'8px',
          padding:'0.8rem',
          border:'1px solid #bfdbfe'
        }}>
          <div style={{fontWeight:700,marginBottom:'0.5rem',fontSize:'1.05rem',color:'#2563eb'}}>💰 First Approver Calculation</div>
          
          <div style={{display:'flex',gap:'1rem',justifyContent:'flex-start',marginBottom:'1rem'}}>
            <div style={{textAlign:'center'}}>
              <div style={labelStyle}>Subtotal</div>
              <div style={{...inputStyle,width:'100px',background:'#f0f4ff',color:'#4f8cff',fontWeight:600,textAlign:'center',border:'1px solid #333',borderRadius:'6px'}}>
                {getField('subtotal') ? Number(getField('subtotal')).toFixed(2) : 'R 0.00'}
              </div>
            </div>
            <div style={{textAlign:'center'}}>
              <div style={labelStyle}>VAT (15%)</div>
              <div style={{...inputStyle,width:'100px',background:'#fff4e6',color:'#ff8c00',fontWeight:600,textAlign:'center',border:'1px solid #333',borderRadius:'6px'}}>
                {getField('vat') ? Number(getField('vat')).toFixed(2) : 'R 0.00'}
              </div>
            </div>
          </div>
          
          <div style={{textAlign:'center'}}>
            <div style={{...labelStyle,fontSize:'1.1rem',fontWeight:700,color:'#16a34a'}}>TOTAL INVOICE</div>
            <div style={{
              background:'#f0fdf4',
              color:'#16a34a',
              fontWeight:700,
              fontSize:'1.2rem',
              padding:'0.8rem',
              borderRadius:'8px',
              border:'2px solid #16a34a',
              textAlign:'center',
              marginTop:'0.3rem'
            }}>
              {getField('total') ? Number(getField('total')).toFixed(2) : 'R 0.00'}
            </div>
          </div>
        </div>
      </div>

      {/* Second Approver Comments */}
      <div className="form-group" style={{paddingLeft:'0.5rem',paddingRight:'0.5rem',paddingBottom:'0.5rem'}}>
        <label style={labelStyle}>Second Approver Comments</label>
        <textarea 
          value={comments} 
          onChange={e => setComments(e.target.value)} 
          rows={4} 
          placeholder="Add your review comments, invoice details, or any concerns..."
          style={{
            width: '100%',
            maxWidth: '100%',
            padding: '0.6rem',
            borderRadius: '8px',
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
          padding: '1rem',
          fontWeight: 700,
          fontSize: '1.1rem',
          cursor: submitting ? 'not-allowed' : 'pointer',
          width: '100%',
          boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
          marginTop: '1rem'
        }}
      >
        {submitting ? '⏳ Submitting...' : '✅ Submit & Approve'}
      </button>
    </form>
  )
}

export default SecondApproverSection
