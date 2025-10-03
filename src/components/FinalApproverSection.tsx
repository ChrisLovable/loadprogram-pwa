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

  // Currency formatting function
  const formatCurrency = (value: number): string => {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }
  // const [firstApprovalData, setFirstApprovalData] = useState<any>(null)

  // Load invoice data from localStorage
  React.useEffect(() => {
    const storedInvoiceData = localStorage.getItem('invoiceData')
    if (storedInvoiceData) {
      const data = JSON.parse(storedInvoiceData)
      setInvoiceData(data)
      console.log('🔍 FinalApprover loaded invoice data:', data)
      console.log('🔍 FinalApprover - invoiceVat:', data.invoiceVat)
      console.log('🔍 FinalApprover - invoiceTotal:', data.invoiceTotal)
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
      console.log('🔍 FinalApprover received invoice update:', updatedData)
      console.log('🔍 FinalApprover - Updated invoiceVat:', updatedData.invoiceVat)
      console.log('🔍 FinalApprover - Updated invoiceTotal:', updatedData.invoiceTotal)
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
        status: 'final_signed_off',
        parsed_data: updatedParsedData,
      }).eq('id', load.id)
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
      {/* Load Calculation Summary */}
      <div style={{background:'#f7fafd',borderRadius:'10px',padding:'0.7rem',marginBottom:'1.2rem',boxShadow:'0 1px 4px rgba(79,140,255,0.07)'}}>
        <div style={{fontWeight:700,marginBottom:'0.8rem',fontSize:'1.05rem',color:'#059669'}}>📊 Load Calculation Summary</div>
        <div style={{display:'flex',flexDirection:'column',gap:'0.7rem',alignItems:'flex-start',marginBottom:'0.7rem'}}>
          <div style={{textAlign:'center'}}>
            <div style={labelStyle}>Subtotal</div>
            <div style={{...inputStyle,width:'100px',background:'#f0f4ff',color:'#4f8cff',fontWeight:600,textAlign:'center',border:'1px solid #4f8cff',borderRadius:'6px'}}>
              {invoiceData?.invoiceSubtotal ? formatCurrency(invoiceData.invoiceSubtotal) : (load?.parsed_data?.subtotal ? formatCurrency(parseFloat(load.parsed_data.subtotal)) : '0.00')}
            </div>
          </div>
          <div style={{textAlign:'center'}}>
            <div style={labelStyle}>Discount</div>
            <div style={{...inputStyle,width:'100px',background:'#fef2f2',color:'#dc2626',fontWeight:600,textAlign:'center',border:'1px solid #dc2626',borderRadius:'6px',minHeight:'2.5rem'}}>
              {invoiceData?.invoiceDiscount ? `${invoiceData.invoiceDiscount}%` : '0%'}
            </div>
          </div>
          <div style={{textAlign:'center'}}>
            <div style={labelStyle}>Subtotal after discount</div>
            <div style={{...inputStyle,width:'100px',background:'#f0f4ff',color:'#4f8cff',fontWeight:600,textAlign:'center',border:'1px solid #4f8cff',borderRadius:'6px'}}>
              {(() => {
                const subtotal = invoiceData?.invoiceSubtotal ? parseFloat(invoiceData.invoiceSubtotal.toString()) : (load?.parsed_data?.subtotal ? parseFloat(load.parsed_data.subtotal) : 0);
                const discountPercent = invoiceData?.invoiceDiscount ? parseFloat(invoiceData.invoiceDiscount.toString()) : 0;
                const discountAmount = subtotal * (discountPercent / 100);
                const subtotalAfterDiscount = subtotal - discountAmount;
                return subtotalAfterDiscount > 0 ? formatCurrency(subtotalAfterDiscount) : '0.00';
              })()}
            </div>
          </div>
          <div style={{textAlign:'center'}}>
            <div style={labelStyle}>VAT (15%)</div>
            <div style={{...inputStyle,width:'100px',background:'#fff4e6',color:'#ff8c00',fontWeight:600,textAlign:'center',border:'1px solid #ff8c00',borderRadius:'6px'}}>
              {(() => {
                const subtotal = invoiceData?.invoiceSubtotal ? parseFloat(invoiceData.invoiceSubtotal.toString()) : (load?.parsed_data?.subtotal ? parseFloat(load.parsed_data.subtotal) : 0);
                const discountPercent = invoiceData?.invoiceDiscount ? parseFloat(invoiceData.invoiceDiscount.toString()) : 0;
                const discountAmount = subtotal * (discountPercent / 100);
                const subtotalAfterDiscount = subtotal - discountAmount;
                const vatAmount = subtotalAfterDiscount * 0.15;
                return vatAmount > 0 ? formatCurrency(vatAmount) : '0.00';
              })()}
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
            {(() => {
              const subtotal = invoiceData?.invoiceSubtotal ? parseFloat(invoiceData.invoiceSubtotal.toString()) : (load?.parsed_data?.subtotal ? parseFloat(load.parsed_data.subtotal) : 0);
              const discountPercent = invoiceData?.invoiceDiscount ? parseFloat(invoiceData.invoiceDiscount.toString()) : 0;
              const discountAmount = subtotal * (discountPercent / 100);
              const subtotalAfterDiscount = subtotal - discountAmount;
              const vatAmount = subtotalAfterDiscount * 0.15;
              const totalAmount = subtotalAfterDiscount + vatAmount;
              return totalAmount > 0 ? formatCurrency(totalAmount) : '0.00';
            })()}
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
        <div style={{display:'flex',flexDirection:'column',gap:'0.7rem',marginBottom:'0.7rem'}}>
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
        <div style={{display:'flex',flexDirection:'column',gap:'0.7rem',marginBottom:'0.7rem'}}>
          <div style={{textAlign:'left'}}>
            <div style={labelStyle}>Invoice Subtotal</div>
            <div style={{...inputStyle,width:'100px',background:'#f0f4ff',color:'#4f8cff',fontWeight:600,textAlign:'left',border:'1px solid #4f8cff',borderRadius:'6px',minHeight:'2.5rem'}}>
              {invoiceData?.invoiceSubtotal ? formatCurrency(parseFloat(invoiceData.invoiceSubtotal)) : '-'}
            </div>
          </div>
          <div style={{textAlign:'left'}}>
            <div style={labelStyle}>Discount</div>
            <div style={{...inputStyle,width:'100px',background:'#fef2f2',color:'#dc2626',fontWeight:600,textAlign:'left',border:'1px solid #dc2626',borderRadius:'6px',minHeight:'2.5rem'}}>
              {load?.first_approval?.discount ? `${load.first_approval.discount}%` : (invoiceData?.invoiceDiscount ? `${invoiceData.invoiceDiscount}%` : '')}
            </div>
          </div>
          <div style={{textAlign:'left'}}>
            <div style={labelStyle}>Subtotal after discount</div>
            <div style={{...inputStyle,width:'100px',background:'#f0f4ff',color:'#4f8cff',fontWeight:600,textAlign:'left',border:'1px solid #4f8cff',borderRadius:'6px',minHeight:'2.5rem'}}>
              {(() => {
                const subtotal = invoiceData?.invoiceSubtotal ? parseFloat(invoiceData.invoiceSubtotal.toString()) : 0;
                const discountPercent = load?.first_approval?.discount ? parseFloat(load.first_approval.discount.toString()) : (invoiceData?.invoiceDiscount ? parseFloat(invoiceData.invoiceDiscount.toString()) : 0);
                const discountAmount = subtotal * (discountPercent / 100);
                const subtotalAfterDiscount = subtotal - discountAmount;
                return subtotalAfterDiscount > 0 ? formatCurrency(subtotalAfterDiscount) : '-';
              })()}
            </div>
          </div>
          <div style={{textAlign:'left'}}>
            <div style={labelStyle}>Invoice VAT</div>
            <div style={{...inputStyle,width:'100px',background:'#fff4e6',color:'#ff8c00',fontWeight:600,textAlign:'left',border:'1px solid #ff8c00',borderRadius:'6px',minHeight:'2.5rem'}}>
              {(() => {
                const subtotal = invoiceData?.invoiceSubtotal ? parseFloat(invoiceData.invoiceSubtotal.toString()) : 0;
                const discountPercent = load?.first_approval?.discount ? parseFloat(load.first_approval.discount.toString()) : (invoiceData?.invoiceDiscount ? parseFloat(invoiceData.invoiceDiscount.toString()) : 0);
                const discountAmount = subtotal * (discountPercent / 100);
                const subtotalAfterDiscount = subtotal - discountAmount;
                const vatAmount = subtotalAfterDiscount * 0.15;
                return vatAmount > 0 ? formatCurrency(vatAmount) : '-';
              })()}
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
            {(() => {
              const subtotal = invoiceData?.invoiceSubtotal ? parseFloat(invoiceData.invoiceSubtotal.toString()) : 0;
              const discountPercent = load?.first_approval?.discount ? parseFloat(load.first_approval.discount.toString()) : (invoiceData?.invoiceDiscount ? parseFloat(invoiceData.invoiceDiscount.toString()) : 0);
              const discountAmount = subtotal * (discountPercent / 100);
              const subtotalAfterDiscount = subtotal - discountAmount;
              const vatAmount = subtotalAfterDiscount * 0.15;
              const totalAmount = subtotalAfterDiscount + vatAmount;
              return totalAmount > 0 ? formatCurrency(totalAmount) : '0.00';
            })()}
          </div>
        </div>
      </div>

      {/* Previous Approver Comments */}
      {(load?.parsed_data?.comments && load.parsed_data.comments !== '-') || 
       (load?.parsed_data?.secondApproverComments && load.parsed_data.secondApproverComments !== '-') || 
       (load?.invoicer_comments && load.invoicer_comments !== '-') ? (
        <div style={{
          background:'#f8fafc',
          borderRadius:'12px',
          padding:'1rem',
          marginBottom:'1rem',
          boxShadow:'0 1px 4px rgba(0,0,0,0.1)',
          border:'1px solid #e5e7eb'
        }}>
          <div style={{
            fontWeight:700,
            marginBottom:'0.8rem',
            fontSize:'1.05rem',
            color:'#374151',
            textAlign:'center',
            paddingBottom:'0.5rem',
            borderBottom:'2px solid #d1d5db'
          }}>📝 Previous Approver Comments</div>
          
          {/* First Approver Comments */}
          {load?.parsed_data?.comments && load.parsed_data.comments !== '-' && (
            <div style={{marginBottom:'0.8rem'}}>
              <div style={{fontWeight:600,color:'#4f8cff',marginBottom:'0.3rem',fontSize:'0.95rem'}}>First Approver:</div>
              <div style={{
                padding:'0.6rem',
                borderRadius:'6px',
                border:'1px solid #4f8cff',
                fontSize:'0.95rem',
                background:'#f0f4ff',
                color:'#4f8cff',
                fontWeight:500,
                minHeight:'50px',
                whiteSpace:'pre-wrap'
              }}>
                {load.parsed_data.comments}
              </div>
            </div>
          )}
          
          {/* Second Approver Comments */}
          {load?.parsed_data?.secondApproverComments && load.parsed_data.secondApproverComments !== '-' && (
            <div style={{marginBottom:'0.8rem'}}>
              <div style={{fontWeight:600,color:'#059669',marginBottom:'0.3rem',fontSize:'0.95rem'}}>Second Approver:</div>
              <div style={{
                padding:'0.6rem',
                borderRadius:'6px',
                border:'1px solid #059669',
                fontSize:'0.95rem',
                background:'#f0fdf4',
                color:'#059669',
                fontWeight:500,
                minHeight:'50px',
                whiteSpace:'pre-wrap'
              }}>
                {load.parsed_data.secondApproverComments}
              </div>
            </div>
          )}
          
          {/* Invoicer Comments */}
          {load?.invoicer_comments && load.invoicer_comments !== '-' && (
            <div>
              <div style={{fontWeight:600,color:'#dc2626',marginBottom:'0.3rem',fontSize:'0.95rem'}}>Invoicer:</div>
              <div style={{
                padding:'0.6rem',
                borderRadius:'6px',
                border:'1px solid #dc2626',
                fontSize:'0.95rem',
                background:'#fef2f2',
                color:'#dc2626',
                fontWeight:500,
                minHeight:'50px',
                whiteSpace:'pre-wrap'
              }}>
                {load.invoicer_comments}
              </div>
            </div>
          )}
        </div>
      ) : null}

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
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'wrap',
            justifyContent: 'flex-start'
          }}>
            {load.photos.map((photoUrl: string, i: number) => (
              <img
                key={`${load.id}-photo-${i}`}
                src={photoUrl}
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
                  img.src = photoUrl;
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
            ))}
          </div>
        </div>
      )}
    </form>
  )
}

export default FinalApproverSection
