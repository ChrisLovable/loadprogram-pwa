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

  // Load invoice data from localStorage
  React.useEffect(() => {
    const storedInvoiceData = localStorage.getItem('invoiceData')
    if (storedInvoiceData) {
      const data = JSON.parse(storedInvoiceData)
      setInvoiceData(data)
      console.log('FinalApprover loaded invoice data:', data)
    }
  }, [])

  // Debug: Log the load data
  console.log('FinalApprover received load:', load)
  console.log('FinalApprover invoice data:', invoiceData)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      // Temporarily disabled Supabase calls due to DNS/certificate issues
      console.log('Final approval disabled - simulating success')
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 800))
      
      setFinalComments('')
      alert('Final approval completed! Load processing finished. (Simulated - Supabase disabled)')
      onFinalApprovalComplete()
    } catch (error) {
      console.error('FinalApproverSection approval failed:', error)
      alert('Failed to submit final approval. See console for details.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="final-approver-form">
      {/* Invoice Summary - Read Only */}
      <div style={{background:'#f7fafd',borderRadius:'10px',padding:'0.7rem',marginBottom:'1.2rem',boxShadow:'0 1px 4px rgba(79,140,255,0.07)'}}>
        <div style={{fontWeight:700,marginBottom:'0.8rem',fontSize:'1.05rem',color:'#059669'}}>🧾 Invoice Summary</div>
        
        {/* Invoice Details - Read Only */}
        <div style={{marginBottom:'0.7rem'}}>
          <div style={labelStyle}>Invoice made out to:</div>
          <div style={{...inputStyle,background:'#f8fafc',color:'#666',fontWeight:500,minHeight:'3rem',display:'flex',alignItems:'center',border:'1px solid #333',borderRadius:'6px'}}>
            {invoiceData?.invoiceMadeOutTo || 'Not specified'}
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

        {/* Financial Summary */}
        <div style={{display:'flex',gap:'1rem',justifyContent:'flex-start',marginBottom:'0.7rem'}}>
          <div style={{textAlign:'center'}}>
            <div style={labelStyle}>Subtotal</div>
            <div style={{...inputStyle,width:'100px',background:'#f0f4ff',color:'#4f8cff',fontWeight:600,textAlign:'center',border:'1px solid #333',borderRadius:'6px'}}>
              {invoiceData?.invoiceSubtotal ? `R ${parseFloat(invoiceData.invoiceSubtotal).toFixed(2)}` : '-'}
            </div>
          </div>
          <div style={{textAlign:'center'}}>
            <div style={labelStyle}>VAT (15%)</div>
            <div style={{...inputStyle,width:'100px',background:'#fff4e6',color:'#ff8c00',fontWeight:600,textAlign:'center',border:'1px solid #333',borderRadius:'6px'}}>
              {invoiceData?.invoiceVat ? `R ${invoiceData.invoiceVat}` : '-'}
            </div>
          </div>
        </div>

        {/* Total - Own Line */}
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
            {invoiceData?.invoiceTotal ? `R ${invoiceData.invoiceTotal}` : 'R 0.00'}
          </div>
        </div>

        {/* Invoice Status */}
        <div style={{
          background: invoiceData?.invoiceSentToDebtor ? '#f0fdf4' : '#fef2f2',
          borderRadius:'8px',
          padding:'0.5rem',
          textAlign:'center',
          border: `1px solid ${invoiceData?.invoiceSentToDebtor ? '#16a34a' : '#ef4444'}`
        }}>
          <span style={{
            fontSize:'0.9rem',
            fontWeight:700,
            color: invoiceData?.invoiceSentToDebtor ? '#16a34a' : '#ef4444'
          }}>
            {invoiceData?.invoiceSentToDebtor ? '✅ Invoice sent to debtor' : '⏳ Invoice not yet sent'}
          </span>
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
