import React, { useState } from 'react'

interface FinalApproverSectionProps {
  load: any // expects load with all previous approval data
  onFinalApprovalComplete: () => void
}

const labelStyle = { fontSize: '1.05rem', fontWeight: 700, color: '#333', marginBottom: '0.1rem' }
const inputStyle = { width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #e0e7ef', fontSize: '1rem', background: '#f7fafd' }

const FinalApproverSection: React.FC<FinalApproverSectionProps> = ({ load, onFinalApprovalComplete }) => {
  const [finalComments, setFinalComments] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [invoiceData, setInvoiceData] = useState<any>(null)
  // const [firstApprovalData, setFirstApprovalData] = useState<any>(null)

  // Load invoice data from localStorage
  React.useEffect(() => {
    const storedInvoiceData = localStorage.getItem('invoiceData')
    if (storedInvoiceData) {
      const data = JSON.parse(storedInvoiceData)
      setInvoiceData(data)
      console.log('FinalApprover loaded invoice data:', data)
    }
    
    // const storedFirstApproval = localStorage.getItem('firstApprovalData')
    // if (storedFirstApproval) {
    //   const data = JSON.parse(storedFirstApproval)
    //   setFirstApprovalData(data)
    //   console.log('FinalApprover loaded first approval data:', data)
    // }
    
    // Listen for real-time updates from First Approver
    // const handleFirstApprovalUpdate = (event: CustomEvent) => {
    //   const updatedData = event.detail
    //   setFirstApprovalData(updatedData)
    //   console.log('FinalApprover received real-time update:', updatedData)
    // }
    
    // Listen for real-time updates from Invoicer
    const handleInvoiceDataUpdate = (event: CustomEvent) => {
      const updatedData = event.detail
      setInvoiceData(updatedData)
      console.log('FinalApprover received invoice update:', updatedData)
    }
    
    // window.addEventListener('firstApprovalUpdated', handleFirstApprovalUpdate as EventListener)
    window.addEventListener('invoiceDataUpdated', handleInvoiceDataUpdate as EventListener)
    
    return () => {
      // window.removeEventListener('firstApprovalUpdated', handleFirstApprovalUpdate as EventListener)
      window.removeEventListener('invoiceDataUpdated', handleInvoiceDataUpdate as EventListener)
    }
  }, [])

  // Debug: Log the load data
  console.log('FinalApprover received load:', load)
  console.log('FinalApprover invoice data:', invoiceData)

  // Normalize invoiceDate to YYYY-MM-DD if present in invoiceData
  // let safeInvoiceDate = invoiceData?.invoiceDate;
  // if (invoiceData?.invoiceDate) {
  //   if (/^\d{4}-\d{2}-\d{2}$/.test(invoiceData.invoiceDate)) {
  //     safeInvoiceDate = invoiceData.invoiceDate;
  //   } else if (/^\d{2}-\d{2}-\d{2}$/.test(invoiceData.invoiceDate)) {
  //     const [yy, mm, dd] = invoiceData.invoiceDate.split('-');
  //     const yyyy = parseInt(yy, 10) < 50 ? '20' + yy : '19' + yy;
  //     safeInvoiceDate = `${yyyy}-${mm}-${dd}`;
  //   } else {
  //     safeInvoiceDate = new Date().toISOString().slice(0, 10);
  //   }
  // } else {
  //   safeInvoiceDate = new Date().toISOString().slice(0, 10);
  // }

  // Helper to get a field from load.parsed_data, invoiceData, or firstApprovalData
  // const getField = (field: string, fallback: any = '-') => {
  //   return load?.parsed_data?.[field] || invoiceData?.[field] || firstApprovalData?.[field] || fallback;
  // };

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
        finalApproverComments: finalComments,
        final_approver: 'Final Approver',
        approved_by_final: currentUser.role === 'final_approver' ? currentUser.name : undefined,
        final_signed_off_at: new Date().toISOString(),
      };
      // Update the load in Supabase
      const { error } = await import('../lib/supabase').then(({ supabase }) =>
        supabase.from('loads').update({
          status: 'final_signed_off',
          parsed_data: updatedParsedData,
        }).eq('id', load.id)
      );
      if (error) {
        alert('Failed to update load: ' + error.message);
      } else {
        setFinalComments('');
        alert('Final approval completed! Load processing finished.');
        onFinalApprovalComplete();
      }
    } catch (error) {
      console.error('FinalApproverSection approval failed:', error)
      alert('Failed to submit final approval. See console for details.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="final-approver-form">
      {currentUser.role === 'final_approver' && currentUser.name && (
        <div style={{fontSize:'0.98rem',color:'#047857',fontWeight:600,marginBottom:'0.5rem'}}>Approved by: {currentUser.name}</div>
      )}
      {/* Load Calculation Summary */}
      <div style={{background:'#f7fafd',borderRadius:'10px',padding:'0.7rem',marginBottom:'1.2rem',boxShadow:'0 1px 4px rgba(79,140,255,0.07)'}}>
        <div style={{fontWeight:700,marginBottom:'0.8rem',fontSize:'1.05rem',color:'#059669'}}>📊 Load Calculation Summary</div>
        <div style={{display:'flex',gap:'1rem',justifyContent:'flex-start',marginBottom:'0.7rem'}}>
          <div style={{textAlign:'center'}}>
            <div style={labelStyle}>Subtotal</div>
            <div style={{...inputStyle,width:'100px',background:'#f0f4ff',color:'#4f8cff',fontWeight:600,textAlign:'center',border:'1px solid #333',borderRadius:'6px'}}>
              {load?.parsed_data?.subtotal ? `R ${parseFloat(load.parsed_data.subtotal).toFixed(2)}` : '-'}
            </div>
          </div>
          <div style={{textAlign:'center'}}>
            <div style={labelStyle}>VAT (15%)</div>
            <div style={{...inputStyle,width:'100px',background:'#fff4e6',color:'#ff8c00',fontWeight:600,textAlign:'center',border:'1px solid #333',borderRadius:'6px'}}>
              {load?.parsed_data?.vat ? `R ${parseFloat(load.parsed_data.vat).toFixed(2)}` : '-'}
            </div>
          </div>
        </div>
        <div style={{textAlign:'center',marginBottom:'0.7rem'}}>
          <div style={{...labelStyle,fontSize:'1.1rem',fontWeight:700,color:'#16a34a'}}>TOTAL</div>
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
            {load?.parsed_data?.total ? `R ${parseFloat(load.parsed_data.total).toFixed(2)}` : 'R 0.00'}
          </div>
        </div>
      </div>

      {/* Invoice Details */}
      <div style={{background:'#f7fafd',borderRadius:'10px',padding:'0.7rem',marginBottom:'1.2rem',boxShadow:'0 1px 4px rgba(79,140,255,0.07)'}}>
        <div style={{fontWeight:700,marginBottom:'0.8rem',fontSize:'1.05rem',color:'#059669'}}>🧾 Invoice Details</div>
        <div style={{marginBottom:'0.7rem'}}>
          <div style={labelStyle}>Debtor</div>
          <div style={{...inputStyle,background:'#f8fafc',color:'#666',fontWeight:500,minHeight:'2rem',display:'flex',alignItems:'center',border:'1px solid #333',borderRadius:'6px',width:'calc(100% - 20px)'}}>
            {load?.parsed_data?.invoice?.invoiceMadeOutTo || invoiceData?.invoiceMadeOutTo || '-'}
          </div>
        </div>
        <div style={{display:'flex',gap:'1rem',marginBottom:'0.7rem'}}>
          <div>
            <div style={labelStyle}>Invoice Date</div>
            <div style={{...inputStyle,width:'120px',background:'#f8fafc',color:'#666',fontWeight:500,textAlign:'center',border:'1px solid #333',borderRadius:'6px'}}>
              {invoiceData?.invoiceDate || '-'}
            </div>
          </div>
          <div>
            <div style={labelStyle}>Invoice Number</div>
            <div style={{...inputStyle,width:'120px',background:'#f8fafc',color:'#666',fontWeight:500,textAlign:'center',border:'1px solid #333',borderRadius:'6px'}}>
              {invoiceData?.invoiceNumber || '-'}
            </div>
          </div>
        </div>
        <div style={{display:'flex',gap:'1rem',justifyContent:'flex-start',marginBottom:'0.7rem'}}>
          <div style={{textAlign:'center'}}>
            <div style={labelStyle}>Invoice Subtotal</div>
            <div style={{...inputStyle,width:'100px',background:'#f0f4ff',color:'#4f8cff',fontWeight:600,textAlign:'center',border:'1px solid #333',borderRadius:'6px'}}>
              {invoiceData?.invoiceSubtotal ? `R ${parseFloat(invoiceData.invoiceSubtotal).toFixed(2)}` : '-'}
            </div>
          </div>
          <div style={{textAlign:'center'}}>
            <div style={labelStyle}>Invoice VAT</div>
            <div style={{...inputStyle,width:'100px',background:'#fff4e6',color:'#ff8c00',fontWeight:600,textAlign:'center',border:'1px solid #333',borderRadius:'6px'}}>
              {invoiceData?.invoiceVat ? `R ${parseFloat(invoiceData.invoiceVat).toFixed(2)}` : '-'}
            </div>
          </div>
        </div>
        <div style={{textAlign:'center',marginBottom:'0.7rem'}}>
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
            {invoiceData?.invoiceTotal ? `R ${parseFloat(invoiceData.invoiceTotal).toFixed(2)}` : 'R 0.00'}
          </div>
        </div>
      </div>

      {/* Final Approver Comments */}
      <div className="form-group" style={{paddingLeft:'0.5rem',paddingRight:'0.5rem',paddingBottom:'0.5rem'}}>
        <label style={labelStyle}>Final Approver Comments</label>
        <textarea 
          value={finalComments} 
          onChange={e => setFinalComments(e.target.value)} 
          className="form-textarea" 
          rows={4} 
          placeholder="Final review comments, approval notes, or any final instructions..."
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
          background: submitting ? '#94a3b8' : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '1rem',
          fontWeight: 700,
          fontSize: '1.1rem',
          cursor: submitting ? 'not-allowed' : 'pointer',
          width: '100%',
          boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)',
          marginTop: '1rem'
        }}
      >
        {submitting ? '⏳ Finalizing...' : '✅ Approve & Save'}
      </button>
    </form>
  )
}

export default FinalApproverSection
