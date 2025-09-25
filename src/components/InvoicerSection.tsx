import React, { useState } from 'react'

interface InvoicerSectionProps {
  load: any // expects load with textract_data, ocr_data, and approval data
  onInvoiceComplete: () => void
}

const labelStyle = { fontSize: '1.05rem', fontWeight: 700, color: '#333', marginBottom: '0.1rem' }
const inputStyle = { width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #e0e7ef', fontSize: '1rem', background: '#f7fafd' }

const InvoicerSection: React.FC<InvoicerSectionProps> = ({ load, onInvoiceComplete }) => {
  const [invoiceMadeOutTo, setInvoiceMadeOutTo] = useState('')
  const [invoiceDate, setInvoiceDate] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [invoiceSubtotal, setInvoiceSubtotal] = useState('')
  const [invoiceVat, setInvoiceVat] = useState('')
  const [invoiceTotal, setInvoiceTotal] = useState('')
  const [invoiceSentToDebtor, setInvoiceSentToDebtor] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [firstApprovalData, setFirstApprovalData] = useState<any>(null)

  // Load first approval data from localStorage
  React.useEffect(() => {
    const storedFirstApproval = localStorage.getItem('firstApprovalData')
    if (storedFirstApproval) {
      const data = JSON.parse(storedFirstApproval)
      setFirstApprovalData(data)
      console.log('Invoicer loaded first approval data:', data)
    }
    
    // Listen for real-time updates from First Approver
    const handleFirstApprovalUpdate = (event: CustomEvent) => {
      const updatedData = event.detail
      setFirstApprovalData(updatedData)
      console.log('Invoicer received real-time update:', updatedData)
    }
    
    window.addEventListener('firstApprovalUpdated', handleFirstApprovalUpdate as EventListener)
    
    return () => {
      window.removeEventListener('firstApprovalUpdated', handleFirstApprovalUpdate as EventListener)
    }
  }, [])

  // Debug: Log the load data
  console.log('Invoicer received load:', load)
  console.log('Invoicer first approval data:', firstApprovalData)

  // Auto-calculate VAT and total when subtotal changes
  React.useEffect(() => {
    if (invoiceSubtotal) {
      const subtotal = parseFloat(invoiceSubtotal) || 0
      const vat = subtotal * 0.15
      const total = subtotal + vat
      setInvoiceVat(vat.toFixed(2))
      setInvoiceTotal(total.toFixed(2))
    } else {
      setInvoiceVat('')
      setInvoiceTotal('')
    }
  }, [invoiceSubtotal])

  // Real-time update when invoice data changes
  React.useEffect(() => {
    if (invoiceSubtotal && invoiceMadeOutTo && invoiceDate && invoiceNumber) {
      const currentInvoiceData = {
        invoiceMadeOutTo: invoiceMadeOutTo,
        invoiceDate: invoiceDate,
        invoiceNumber: invoiceNumber,
        invoiceSubtotal: Number(invoiceSubtotal),
        invoiceVat: Number(invoiceVat),
        invoiceTotal: Number(invoiceTotal),
        invoiceSentToDebtor: invoiceSentToDebtor,
        invoicer: 'Invoicer',
        timestamp: new Date().toISOString()
      }
      
      // Update localStorage immediately when invoice data changes
      localStorage.setItem('invoiceData', JSON.stringify(currentInvoiceData))
      
      // Dispatch custom event for real-time updates
      window.dispatchEvent(new CustomEvent('invoiceDataUpdated', { 
        detail: currentInvoiceData 
      }))
    }
  }, [invoiceSubtotal, invoiceMadeOutTo, invoiceDate, invoiceNumber, invoiceVat, invoiceTotal, invoiceSentToDebtor])

  // Helper to get a field from load.parsed_data or firstApprovalData
  const getField = (field: string, fallback: any = '-') => {
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
    if (!invoiceMadeOutTo || !invoiceDate || !invoiceNumber || !invoiceSubtotal) {
      alert('Please fill in all required fields: Invoice made out to, Date, Number, and Subtotal')
      return
    }
    setSubmitting(true)
    try {
      // Prepare updated parsed_data
      const updatedParsedData = {
        ...(load.parsed_data || {}),
        invoice: {
          invoiceMadeOutTo: invoiceMadeOutTo,
          invoiceDate: invoiceDate, // Use the state variable directly
          invoiceNumber: invoiceNumber,
          invoiceSubtotal: Number(invoiceSubtotal),
          invoiceVat: Number(invoiceVat),
          invoiceTotal: Number(invoiceTotal),
          invoiceSentToDebtor: invoiceSentToDebtor,
          rate: Number(getField('rate', 0)),
          ratePerAnimal: Number(getField('ratePerAnimal', 0)),
          runningKmRate: Number(getField('runningKmRate', 0)),
          runningKms: Number(getField('runningKms', 0)),
          subtotal: Number(getField('subtotal', 0)),
          vat: Number(getField('vat', 0)),
          total: Number(getField('total', 0)),
          totalAnimals: Number(getField('totalAnimals', 0)),
          tripKm: Number(getField('tripKm', 0)),
          startKm: Number(getField('startKm', 0)),
          endKm: Number(getField('endKm', 0)),
        },
        invoicer: 'Invoicer',
        approved_by_invoicer: currentUser.role === 'invoicer' ? currentUser.name : undefined,
        invoice_processed_at: new Date().toISOString(),
      };
      // Update the load in Supabase
      const { error } = await import('../lib/supabase').then(({ supabase }) =>
        supabase.from('loads').update({
          status: 'third_approved',
          parsed_data: updatedParsedData,
        }).eq('id', load.id)
      );
      if (error) {
        alert('Failed to update load: ' + error.message);
      } else {
        setInvoiceMadeOutTo('');
        setInvoiceDate('');
        setInvoiceNumber('');
        setInvoiceSubtotal('');
        setInvoiceVat('');
        setInvoiceTotal('');
        setInvoiceSentToDebtor(false);
        alert('Invoice processed and promoted to Final Approver!');
        onInvoiceComplete();
      }
    } catch (error) {
      console.error('InvoicerSection processing failed:', error)
      alert('Failed to process invoice. See console for details.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="invoicer-form">
      {currentUser.role === 'invoicer' && currentUser.name && (
        <div style={{fontSize:'0.98rem',color:'#dc2626',fontWeight:600,marginBottom:'0.5rem'}}>Approved by: {currentUser.name}</div>
      )}
      {/* Trip Details */}
      <div style={{background:'#fef7f7',borderRadius:'10px',padding:'0.7rem',marginBottom:'1.2rem',boxShadow:'0 1px 4px rgba(220,38,38,0.07)',border:'1px solid #fecaca'}}>
        <div style={{fontWeight:700,marginBottom:'0.8rem',fontSize:'1.05rem',color:'#dc2626'}}>🚚 Trip Details</div>
        
        {/* Date - Above Sender */}
        <div style={{marginBottom:'0.7rem'}}>
          <div style={labelStyle}>Date</div>
          <div style={{padding:'0.6rem',borderRadius:'6px',border:'1px solid #333',fontSize:'1rem',background:'#f8fafc',color:'#666',fontWeight:500,width:'80px'}}>
            {getField('date')}
          </div>
        </div>
        
        {/* Sender - Full Width */}
        <div style={{marginBottom:'0.7rem'}}>
          <div style={labelStyle}>Sender</div>
          <div style={{padding:'0.6rem',borderRadius:'6px',border:'1px solid #333',fontSize:'1rem',background:'#f8fafc',color:'#666',fontWeight:500,width:'280px'}}>
            {getField('sender')}
          </div>
        </div>
        
        {/* Receiver - Full Width */}
        <div style={{marginBottom:'0.7rem'}}>
          <div style={labelStyle}>Receiver</div>
          <div style={{padding:'0.6rem',borderRadius:'6px',border:'1px solid #333',fontSize:'1rem',background:'#f8fafc',color:'#666',fontWeight:500,width:'280px'}}>
            {getField('receiver')}
          </div>
        </div>

        {/* Start KM and End KM */}
        <div style={{display:'flex',gap:'1rem',marginBottom:'0.7rem'}}>
          <div>
            <div style={labelStyle}>Start KM</div>
            <div style={{padding:'0.6rem',borderRadius:'6px',border:'1px solid #333',fontSize:'1rem',background:'#f8fafc',color:'#666',fontWeight:500,textAlign:'center',width:'120px'}}>
              {getField('startKm')}
            </div>
          </div>
          <div>
            <div style={labelStyle}>End KM</div>
            <div style={{padding:'0.6rem',borderRadius:'6px',border:'1px solid #333',fontSize:'1rem',background:'#f8fafc',color:'#666',fontWeight:500,textAlign:'center',width:'120px'}}>
              {getField('endKm')}
            </div>
          </div>
        </div>

        {/* Trip KM and Rate per KM - Same Line */}
        <div style={{display:'flex',gap:'1rem',marginBottom:'0.7rem'}}>
          <div>
            <div style={labelStyle}>Trip KM</div>
            <div style={{padding:'0.6rem',borderRadius:'6px',border:'1px solid #333',fontSize:'1rem',background:'#f0f4ff',color:'#4f8cff',fontWeight:600,textAlign:'center',width:'120px'}}>
              {getField('tripKm')}
            </div>
          </div>
          <div>
            <div style={labelStyle}>Rate per KM</div>
            <div style={{padding:'0.6rem',borderRadius:'6px',border:'1px solid #333',fontSize:'1rem',background:'#f8fafc',color:'#666',fontWeight:500,textAlign:'center',width:'120px'}}>
              {getField('rate') ? `R ${parseFloat(getField('rate')).toFixed(2)}` : '-'}
            </div>
          </div>
        </div>

        {/* # Animals and Rate / Animal */}
        {(getField('ratePerAnimal', null) || getField('totalAnimals', null)) && (
          <div style={{display:'flex',gap:'1rem',marginBottom:'0.7rem'}}>
            <div>
              <div style={labelStyle}># Animals</div>
              <div style={{padding:'0.6rem',borderRadius:'6px',border:'1px solid #333',fontSize:'1rem',background:'#f8fafc',color:'#666',fontWeight:500,textAlign:'center',width:'120px'}}>
                {getField('totalAnimals')}
              </div>
            </div>
            <div>
              <div style={labelStyle}>Rate / Animal</div>
              <div style={{padding:'0.6rem',borderRadius:'6px',border:'1px solid #333',fontSize:'1rem',background:'#f8fafc',color:'#666',fontWeight:500,textAlign:'center',width:'120px'}}>
                {getField('ratePerAnimal') ? Number(getField('ratePerAnimal')).toFixed(2) : '-'}
              </div>
            </div>
          </div>
        )}
        {/* Running KMs and Running KM Rate - Always Show */}
        <div style={{display:'flex',gap:'1rem',marginBottom:'0.7rem'}}>
          <div>
            <div style={labelStyle}>Running KMs</div>
            <div style={{padding:'0.6rem',borderRadius:'6px',border:'1px solid #333',fontSize:'1rem',background:'#f8fafc',color:'#666',fontWeight:500,textAlign:'center',width:'120px'}}>
              {getField('runningKms') || '-'}
            </div>
          </div>
          <div>
            <div style={labelStyle}>Running KM Rate</div>
            <div style={{padding:'0.6rem',borderRadius:'6px',border:'1px solid #333',fontSize:'1rem',background:'#f8fafc',color:'#666',fontWeight:500,textAlign:'center',width:'120px'}}>
              {getField('runningKmRate') ? `R ${parseFloat(getField('runningKmRate')).toFixed(2)}` : '-'}
            </div>
          </div>
        </div>

        {/* Financial Breakdown */}
        <div style={{display:'flex',gap:'1rem',justifyContent:'flex-start',marginBottom:'0.7rem'}}>
          <div style={{textAlign:'center'}}>
            <div style={labelStyle}>Subtotal</div>
            <div style={{padding:'0.6rem',borderRadius:'6px',border:'1px solid #333',fontSize:'1rem',background:'#f0f4ff',color:'#4f8cff',fontWeight:600,textAlign:'center',width:'120px'}}>
              {getField('subtotal') ? `R ${parseFloat(getField('subtotal')).toFixed(2)}` : '-'}
            </div>
          </div>
          <div style={{textAlign:'center'}}>
            <div style={labelStyle}>VAT (15%)</div>
            <div style={{padding:'0.6rem',borderRadius:'6px',border:'1px solid #333',fontSize:'1rem',background:'#fff4e6',color:'#ff8c00',fontWeight:600,textAlign:'center',width:'120px'}}>
              {getField('vat') ? `R ${parseFloat(getField('vat')).toFixed(2)}` : '-'}
            </div>
          </div>
        </div>
        {/* Total - Own Line */}
        <div style={{textAlign:'center',marginBottom:'0.7rem'}}>
          <div style={{...labelStyle,fontSize:'1.1rem',fontWeight:700,color:'#16a34a'}}>TOTAL AMOUNT</div>
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
            {getField('total') ? `R ${parseFloat(getField('total')).toFixed(2)}` : 'R 0.00'}
          </div>
        </div>
      </div>

      {/* Invoice Details */}
      <div style={{background:'#fef7f7',borderRadius:'10px',padding:'0.7rem',marginBottom:'1.2rem',boxShadow:'0 1px 4px rgba(220,38,38,0.07)',border:'1px solid #fecaca'}}>
        <div style={{fontWeight:700,marginBottom:'0.8rem',fontSize:'1.05rem',color:'#dc2626'}}>🧾 Invoice Details</div>
        
        {/* Invoice Recipient */}
        <div style={{marginBottom:'0.7rem'}}>
          <div style={labelStyle}>Invoice made out to:</div>
          <textarea 
            value={invoiceMadeOutTo} 
            onChange={e => setInvoiceMadeOutTo(e.target.value)} 
            style={{...inputStyle,resize:'none',height:'3rem',border:'1px solid #333',borderRadius:'6px'}}
            placeholder="Enter company/person name and address for invoice..."
            required
          />
        </div>

        {/* Invoice Date and Invoice Number - Same Line */}
        <div style={{display:'flex',gap:'1rem',marginBottom:'0.7rem'}}>
          <div>
            <div style={labelStyle}>Invoice Date</div>
            <input 
              type="date" 
              value={invoiceDate} 
              onChange={e => setInvoiceDate(e.target.value)} 
              style={{padding:'0.6rem',borderRadius:'6px',border:'1px solid #333',fontSize:'1rem',background:'#f7fafd',width:'120px'}} 
              required 
            />
          </div>
          <div>
            <div style={labelStyle}>Invoice Number</div>
            <input 
              type="text" 
              value={invoiceNumber} 
              onChange={e => setInvoiceNumber(e.target.value)} 
              style={{padding:'0.6rem',borderRadius:'6px',border:'1px solid #333',fontSize:'1rem',background:'#f7fafd',width:'120px'}} 
              placeholder="INV-001"
              required 
            />
          </div>
        </div>

        {/* Cost Breakdown for Invoicer */}
        {firstApprovalData && (
          <div style={{
            background: '#f8f9fa',
            borderRadius: '8px',
            padding: '0.5rem',
            marginBottom: '0.8rem',
            fontSize: '0.9rem',
            color: '#666'
          }}>
            <div style={{fontWeight: 600, marginBottom: '0.3rem', color: '#333'}}>Cost Breakdown:</div>
            <div>Trip KM: {firstApprovalData.tripKm || '-'}</div>
            <div>Rate per Loaded KM: R{firstApprovalData.rate || '-'}</div>
            {firstApprovalData.costPerKm > 0 && (
              <div>Cost per Loaded KM: R{Number(firstApprovalData.costPerKm).toFixed(2)} ({firstApprovalData.tripKm} km × R{firstApprovalData.rate})</div>
            )}
            {firstApprovalData.costPerRunningKm > 0 && (
              <div>Cost per Running KM: R{Number(firstApprovalData.costPerRunningKm).toFixed(2)} ({firstApprovalData.runningKms} km × R{firstApprovalData.runningKmRate})</div>
            )}
            {firstApprovalData.costPerHead > 0 && (
              <div>Cost per Head: R{Number(firstApprovalData.costPerHead).toFixed(2)} ({firstApprovalData.totalAnimals} animals × R{firstApprovalData.ratePerAnimal})</div>
            )}
            <div style={{fontWeight: 600, marginTop: '0.3rem', color: '#333'}}>
              Total Subtotal: R{firstApprovalData.subtotal}
            </div>
          </div>
        )}

        {/* Invoice Subtotal and VAT - Same Line */}
        <div style={{display:'flex',gap:'1rem',marginBottom:'0.8rem'}}>
          <div>
            <div style={labelStyle}>Invoice Subtotal</div>
            <input 
              type="number" 
              step="0.01" 
              value={invoiceSubtotal} 
              onChange={e => setInvoiceSubtotal(e.target.value)} 
              style={{padding:'0.6rem',borderRadius:'6px',border:'1px solid #333',fontSize:'1rem',background:'#f7fafd',textAlign:'center',width:'80px'}} 
              placeholder="0.00"
              required 
            />
          </div>
          <div>
            <div style={labelStyle}>VAT (15%)</div>
            <input 
              type="text" 
              value={invoiceVat ? `R ${invoiceVat}` : ''} 
              readOnly 
              style={{padding:'0.6rem',borderRadius:'6px',border:'1px solid #333',fontSize:'1rem',background:'#fff4e6',color:'#ff8c00',fontWeight:600,textAlign:'center',width:'80px'}} 
            />
          </div>
        </div>
        
        {/* Invoice Total - Own Line */}
        <div style={{textAlign:'center',marginBottom:'0.8rem'}}>
          <div style={{...labelStyle,fontSize:'1.1rem',fontWeight:700,color:'#16a34a'}}>INVOICE TOTAL</div>
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
            {invoiceTotal ? `R ${invoiceTotal}` : 'R 0.00'}
          </div>
        </div>

        {/* Confirmation Checkbox */}
        <div style={{
          background:'#f8fafc',
          borderRadius:'8px',
          padding:'0.8rem',
          border:'1px solid #e5e7eb',
          marginBottom:'0.8rem'
        }}>
          <label style={{
            display:'flex',
            alignItems:'center',
            gap:'0.5rem',
            cursor:'pointer',
            fontSize:'1.05rem',
            fontWeight:700,
            color:'#333'
          }}>
            <input 
              type="checkbox" 
              checked={invoiceSentToDebtor} 
              onChange={e => setInvoiceSentToDebtor(e.target.checked)}
              style={{
                width:'20px',
                height:'20px',
                cursor:'pointer'
              }}
            />
            <span>✉️ Invoice has been sent to debtor</span>
          </label>
        </div>
      </div>

      <button 
        type="submit" 
        disabled={submitting || !invoiceSentToDebtor}
        style={{
          background: submitting ? '#94a3b8' : !invoiceSentToDebtor ? '#d1d5db' : 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '1rem',
          fontWeight: 700,
          fontSize: '1.1rem',
          cursor: submitting || !invoiceSentToDebtor ? 'not-allowed' : 'pointer',
          width: '100%',
          boxShadow: !invoiceSentToDebtor ? 'none' : '0 4px 12px rgba(220, 38, 38, 0.3)',
          marginTop: '1rem'
        }}
      >
        {submitting ? '⏳ Processing Invoice...' : '🧾 Complete Invoice Processing'}
      </button>
    </form>
  )
}

export default InvoicerSection
