import React, { useState } from 'react'
import { generatePDFInvoice } from '../utils/pdfGenerator'
import { isDesktop } from '../utils/errorHandling'

interface InvoicerSectionProps {
  load: any // expects load with textract_data, ocr_data, and approval data
  onInvoiceComplete: () => void
  onDeleteLoad?: (loadId: number) => void
  index?: number // Add index prop for alternating colors
}

const labelStyle = { fontSize: '1.05rem', fontWeight: 700, color: '#333', marginBottom: '0.1rem' }
const inputStyle = { width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #e0e7ef', fontSize: '1rem', background: '#f7fafd' }

const InvoicerSection: React.FC<InvoicerSectionProps> = ({ load, onInvoiceComplete, onDeleteLoad, index = 0 }) => {
  const [invoiceMadeOutTo, setInvoiceMadeOutTo] = useState('')
  const [invoiceDate, setInvoiceDate] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [invoiceAccountRef, setInvoiceAccountRef] = useState('')
  const [invoiceLoadRef, setInvoiceLoadRef] = useState('')
  const [invoiceCode, setInvoiceCode] = useState('')
  const [invoiceDiscount, setInvoiceDiscount] = useState('0')
  const [invoiceSubtotal, setInvoiceSubtotal] = useState('')
  const [invoiceVat, setInvoiceVat] = useState('')
  const [invoiceTotal, setInvoiceTotal] = useState('')

  // Currency formatting function
  const formatCurrency = (value: number): string => {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }
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
  console.log('Full load object keys:', Object.keys(load))
  console.log('Load parsed_data:', load?.parsed_data)
  console.log('Load first_approval:', load?.first_approval)
  console.log('Load approved_by_1st:', load?.approved_by_1st)

  // Auto-calculate VAT and total when subtotal changes
  React.useEffect(() => {
    if (invoiceSubtotal && invoiceSubtotal.trim() !== '') {
      // Remove currency formatting and parse as number - handle both comma and dot as decimal separator
      const cleanSubtotal = invoiceSubtotal.replace(/[R,\s]/g, '').replace(',', '.');
      const subtotal = parseFloat(cleanSubtotal) || 0
      
      console.log('🔍 InvoicerSection VAT Calculation:');
      console.log('  Raw invoiceSubtotal:', invoiceSubtotal);
      console.log('  Clean subtotal:', cleanSubtotal);
      console.log('  Parsed subtotal:', subtotal);
      
      if (subtotal > 0) {
        const vat = Math.round(subtotal * 0.15 * 100) / 100; // Round to 2 decimal places
        const total = Math.round((subtotal + vat) * 100) / 100; // Round to 2 decimal places
        setInvoiceVat(formatCurrency(vat))
        setInvoiceTotal(formatCurrency(total))
        
        console.log('  Calculated VAT:', vat);
        console.log('  Calculated Total:', total);
      } else {
        setInvoiceVat('')
        setInvoiceTotal('')
      }
    } else {
      setInvoiceVat('')
      setInvoiceTotal('')
    }
  }, [invoiceSubtotal])

  // Auto-update invoice subtotal when discount percentage changes
  React.useEffect(() => {
    if (load?.parsed_data?.subtotal && invoiceDiscount && invoiceDiscount !== '0') {
      const originalSubtotal = Number(load.parsed_data.subtotal);
      const discountPercent = Number(invoiceDiscount);
      const discountAmount = originalSubtotal * (discountPercent / 100);
      const discountedSubtotal = originalSubtotal - discountAmount;
      
      console.log('🔍 InvoicerSection Discount Calculation:');
      console.log('  Original Subtotal:', originalSubtotal);
      console.log('  Discount %:', discountPercent);
      console.log('  Discount Amount:', discountAmount);
      console.log('  Discounted Subtotal:', discountedSubtotal);
      
      if (discountedSubtotal > 0) {
        setInvoiceSubtotal(formatCurrency(discountedSubtotal));
      } else {
        setInvoiceSubtotal('0.00');
      }
    } else if (invoiceDiscount === '0') {
      // Only clear the subtotal if it was auto-populated, don't auto-populate when discount is 0
      if (invoiceSubtotal && load?.parsed_data?.subtotal) {
        const originalSubtotal = Number(load.parsed_data.subtotal);
        const currentSubtotal = parseFloat(invoiceSubtotal.replace(/[R,\s]/g, '').replace(',', '.')) || 0;
        // Only clear if the current subtotal matches the original (meaning it was auto-populated)
        if (Math.abs(currentSubtotal - originalSubtotal) < 0.01) {
          setInvoiceSubtotal('');
        }
      }
    } else if (!load?.parsed_data?.subtotal) {
      // If no subtotal data, clear the field
      setInvoiceSubtotal('');
    }
  }, [invoiceDiscount, load?.parsed_data?.subtotal])

  // Real-time update when invoice data changes
  React.useEffect(() => {
    if (invoiceSubtotal && invoiceMadeOutTo && invoiceDate && invoiceNumber) {
      // Parse currency strings properly
      const parseCurrency = (value: string) => {
        if (!value) return 0;
        const cleanValue = value.replace(/[R,\s]/g, '');
        return parseFloat(cleanValue) || 0;
      };
      
      const currentInvoiceData = {
        invoiceMadeOutTo: invoiceMadeOutTo,
        invoiceDate: invoiceDate,
        invoiceNumber: invoiceNumber,
        invoiceSubtotal: parseCurrency(invoiceSubtotal),
        invoiceVat: parseCurrency(invoiceVat),
        invoiceTotal: parseCurrency(invoiceTotal),
        invoiceDiscount: invoiceDiscount,
        invoiceSentToDebtor: invoiceSentToDebtor,
        invoicer: 'Invoicer',
        timestamp: new Date().toISOString()
      }
      
      console.log('🔍 InvoicerSection - Storing invoice data:', currentInvoiceData);
      
      // Update localStorage immediately when invoice data changes
      localStorage.setItem('invoiceData', JSON.stringify(currentInvoiceData))
      
      // Dispatch custom event for real-time updates
      window.dispatchEvent(new CustomEvent('invoiceDataUpdated', { 
        detail: currentInvoiceData 
      }))
    }
  }, [invoiceSubtotal, invoiceMadeOutTo, invoiceDate, invoiceNumber, invoiceVat, invoiceTotal, invoiceDiscount, invoiceSentToDebtor])

  // Helper to get a field from load.parsed_data or firstApprovalData
  const getField = (field: string, fallback: any = '-') => {
    // Special handling for date field - check both parsed_data.date and main date field
    if (field === 'date') {
      return load?.parsed_data?.date || load?.date || firstApprovalData?.[field] || fallback;
    }
    return load?.parsed_data?.[field] || firstApprovalData?.[field] || fallback;
  };

  // Normalize the data structure to use consistent field names
  const normalizedLoad = {
    ...load,
    firstApproval: load?.approved_by_1st ?? null,
    secondApproval: load?.approved_by_2nd ?? null,
    thirdApproval: load?.approved_by_3rd ?? null,
    invoicerApproval: load?.approved_by_invoicer ?? null,
    finalApproval: load?.approved_by_final ?? null,
  };
  
  console.log('Normalized load data:', normalizedLoad);
  console.log('First approval data:', normalizedLoad.firstApproval);

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
        status: 'third_approved',
        parsed_data: updatedParsedData,
      }).eq('id', load.id)
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

  const desktopLayout = isDesktop();
  
  // Determine card background color based on index
  const cardBackgroundColor = index % 2 === 0 ? '#000000' : '#4169E1'; // Black or Royal Blue
  
  return (
    <div style={{
      background: cardBackgroundColor,
      borderRadius: '16px',
      padding: desktopLayout ? '2rem' : '1rem',
      margin: desktopLayout ? '1rem auto' : '0.5rem',
      maxWidth: desktopLayout ? '1200px' : '100%',
      boxShadow: '0 8px 24px rgba(0,0,0,0.3), 0 4px 8px rgba(0,0,0,0.2)',
      border: '2px solid #333333',
      position: 'relative'
    }}>
      {/* Delete Icon - Top Left Corner */}
      {onDeleteLoad && (
        <button
          type="button"
          onClick={() => onDeleteLoad(load.id)}
          style={{
            position: 'absolute',
            top: '15px',
            left: '15px',
            background: 'rgba(239, 68, 68, 0.9)',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem',
            color: 'white',
            cursor: 'pointer',
            zIndex: 10,
            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={e => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 1)';
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.5)';
          }}
          onMouseOut={e => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.9)';
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.3)';
          }}
          title="Delete Load"
        >
          🗑️
        </button>
      )}

      <form onSubmit={handleSubmit} className="invoicer-form" style={{
        width: '100%',
        margin: '0',
        padding: '0'
      }}>
        {normalizedLoad.firstApproval && (
          <div style={{fontSize:'0.98rem',color:'#ffffff',fontWeight:600,marginBottom:'1rem',textAlign:'center'}}>Approved by: {normalizedLoad.firstApproval}</div>
        )}
      {/* Trip Details */}
      <div style={{
        background:'#fef7f7',
        borderRadius:'12px',
        padding: desktopLayout ? '1.5rem' : '0.7rem',
        marginBottom:'1.5rem',
        boxShadow:'0 4px 12px rgba(220,38,38,0.15), 0 2px 4px rgba(220,38,38,0.1)',
        border:'2px solid #fecaca',
        display: desktopLayout ? 'grid' : 'block',
        gridTemplateColumns: desktopLayout ? '1fr 1fr' : 'none',
        gap: desktopLayout ? '2rem' : '0',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Left Column - Basic Trip Info */}
        <div>
          <div style={{
            fontWeight:700,
            marginBottom:'0.8rem',
            fontSize:'1.05rem',
            color:'#dc2626',
            paddingBottom:'0.5rem',
            borderBottom:'2px solid #fecaca',
            position: 'relative'
          }}>🚚 Trip Details</div>
          
          {/* Date - Above Sender */}
          <div style={{marginBottom:'0.7rem'}}>
            <div style={labelStyle}>Date</div>
            <div style={{padding:'0.6rem',borderRadius:'6px',border:'1px solid #333',fontSize:'1rem',background:'#f8fafc',color:'#666',fontWeight:500,width: desktopLayout ? '120px' : '80px'}}>
              {getField('date')}
            </div>
          </div>

          {/* Truck Registration - Above Sender */}
          <div style={{marginBottom:'0.7rem'}}>
            <div style={labelStyle}>Truck Registration</div>
            <div style={{padding:'0.6rem',borderRadius:'6px',border:'1px solid #333',fontSize:'1rem',background:'#f8fafc',color:'#666',fontWeight:500,width: desktopLayout ? '160px' : '140px'}}>
              {getField('truck_reg') || getField('truckReg')}
            </div>
          </div>

          {/* Trailer Registration - Same Line as Truck */}
          <div style={{marginBottom:'0.7rem'}}>
            <div style={labelStyle}>Trailer Registration</div>
            <div style={{padding:'0.6rem',borderRadius:'6px',border:'1px solid #333',fontSize:'1rem',background:'#f8fafc',color:'#666',fontWeight:500,width: desktopLayout ? '160px' : '140px'}}>
              {getField('trailer_reg') || getField('trailerReg')}
            </div>
          </div>
          
          {/* Sender - Full Width */}
          <div style={{marginBottom:'0.7rem'}}>
            <div style={labelStyle}>Sender</div>
            <div style={{padding:'0.6rem',borderRadius:'6px',border:'1px solid #333',fontSize:'1rem',background:'#f8fafc',color:'#666',fontWeight:500,width: desktopLayout ? '350px' : '280px'}}>
              {getField('sender')}
            </div>
          </div>
          
          {/* Receiver - Full Width */}
          <div style={{marginBottom:'0.7rem'}}>
            <div style={labelStyle}>Receiver</div>
            <div style={{padding:'0.6rem',borderRadius:'6px',border:'1px solid #333',fontSize:'1rem',background:'#f8fafc',color:'#666',fontWeight:500,width: desktopLayout ? '350px' : '280px'}}>
              {getField('receiver')}
            </div>
          </div>

        </div>

        {/* Right Column - Animals and Financial */}
        <div>
          {/* Start KM and End KM */}
          <div style={{display:'flex',gap:'1rem',marginBottom:'0.7rem'}}>
            <div>
              <div style={labelStyle}>Start KM</div>
              <div style={{padding:'0.4rem',borderRadius:'6px',border:'1px solid #333',fontSize:'0.65rem',background:'#f8fafc',color:'#666',fontWeight:500,textAlign:'center',width: desktopLayout ? '140px' : '120px'}}>
                {getField('startKm')}
              </div>
            </div>
            <div>
              <div style={labelStyle}>End KM</div>
              <div style={{padding:'0.4rem',borderRadius:'6px',border:'1px solid #333',fontSize:'0.65rem',background:'#f8fafc',color:'#666',fontWeight:500,textAlign:'center',width: desktopLayout ? '140px' : '120px'}}>
                {getField('endKm')}
              </div>
            </div>
          </div>

          {/* Trip KM and Rate per KM - Same Line */}
          <div style={{display:'flex',gap:'1rem',marginBottom:'0.7rem'}}>
            <div>
              <div style={labelStyle}>Trip KM</div>
              <div style={{padding:'0.6rem',borderRadius:'6px',border:'1px solid #333',fontSize:'1rem',background:'#f0f4ff',color:'#4f8cff',fontWeight:600,textAlign:'center',width: desktopLayout ? '140px' : '120px'}}>
                {getField('tripKm') ? Math.round(Number(getField('tripKm'))) : ''}
              </div>
            </div>
            <div>
              <div style={labelStyle}>Rate per KM</div>
              <div style={{padding:'0.6rem',borderRadius:'6px',border:'1px solid #333',fontSize:'1rem',background:'#f8fafc',color:'#666',fontWeight:500,textAlign:'center',width: desktopLayout ? '140px' : '120px'}}>
                {getField('rate') ? `R ${formatCurrency(parseFloat(getField('rate')))}` : ''}
              </div>
            </div>
          </div>

          {/* # Animals and Rate / Animal */}
          {(getField('ratePerAnimal', null) || getField('totalAnimals', null)) && (
            <div style={{display:'flex',gap:'1rem',marginBottom:'0.7rem'}}>
              <div>
                <div style={labelStyle}># Animals</div>
                <div style={{padding:'0.6rem',borderRadius:'6px',border:'1px solid #333',fontSize:'1rem',background:'#f8fafc',color:'#666',fontWeight:500,textAlign:'center',width: desktopLayout ? '140px' : '120px'}}>
                  {getField('totalAnimals') ? Math.round(Number(getField('totalAnimals'))) : ''}
                </div>
              </div>
              <div>
                <div style={labelStyle}>Rate / Animal</div>
                <div style={{padding:'0.6rem',borderRadius:'6px',border:'1px solid #333',fontSize:'1rem',background:'#f8fafc',color:'#666',fontWeight:500,textAlign:'center',width: desktopLayout ? '140px' : '120px'}}>
                  {getField('ratePerAnimal') ? `R ${formatCurrency(Number(getField('ratePerAnimal')))}` : ''}
                </div>
              </div>
            </div>
          )}
          
          {/* Running KMs and Running KM Rate - Always Show */}
          <div style={{display:'flex',gap:'1rem',marginBottom:'0.7rem'}}>
            <div>
              <div style={labelStyle}>Running KMs</div>
              <div style={{padding:'0.6rem',borderRadius:'6px',border:'1px solid #333',fontSize:'1rem',background:'#f8fafc',color:'#666',fontWeight:500,textAlign:'center',width: desktopLayout ? '140px' : '120px'}}>
                {getField('runningKms') ? Math.round(Number(getField('runningKms'))) : ''}
              </div>
            </div>
            <div>
              <div style={labelStyle}>Running KM Rate</div>
              <div style={{padding:'0.6rem',borderRadius:'6px',border:'1px solid #333',fontSize:'1rem',background:'#f8fafc',color:'#666',fontWeight:500,textAlign:'center',width: desktopLayout ? '140px' : '120px'}}>
                {getField('runningKmRate') ? `R ${formatCurrency(parseFloat(getField('runningKmRate')))}` : ''}
              </div>
            </div>
          </div>

          {/* Financial Breakdown */}
          <div style={{display:'flex',flexDirection:'column',gap:'0.7rem',alignItems:'flex-start',marginBottom:'0.7rem'}}>
            <div style={{textAlign:'center'}}>
              <div style={labelStyle}>Subtotal</div>
              <div style={{padding:'0.6rem',borderRadius:'6px',border:'1px solid #333',fontSize:'1rem',background:'#f0f4ff',color:'#4f8cff',fontWeight:600,textAlign:'center',width: desktopLayout ? '140px' : '120px'}}>
                {getField('subtotal') ? formatCurrency(parseFloat(getField('subtotal'))) : ''}
              </div>
            </div>
            <div style={{textAlign:'center'}}>
              <div style={labelStyle}>Discount</div>
              <div style={{padding:'0.6rem',borderRadius:'6px',border:'1px solid #333',fontSize:'1rem',background:'#fef2f2',color:'#dc2626',fontWeight:600,textAlign:'center',width: desktopLayout ? '140px' : '120px'}}>
                {getField('discount') ? `${getField('discount')}%` : (firstApprovalData?.discount ? `${firstApprovalData.discount}%` : '')}
              </div>
            </div>
            <div style={{textAlign:'center'}}>
              <div style={labelStyle}>VAT (15%)</div>
              <div style={{padding:'0.6rem',borderRadius:'6px',border:'1px solid #333',fontSize:'1rem',background:'#fff4e6',color:'#ff8c00',fontWeight:600,textAlign:'center',width: desktopLayout ? '140px' : '120px'}}>
                {getField('vat') ? formatCurrency(parseFloat(getField('vat'))) : ''}
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
              marginTop:'0.3rem',
              width: desktopLayout ? '300px' : 'auto',
              margin: desktopLayout ? '0.3rem auto 0' : '0.3rem 0 0'
            }}>
              {getField('total') ? formatCurrency(parseFloat(getField('total'))) : '0.00'}
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Details */}
      <div style={{
        background:'#f0f9ff',
        borderRadius:'12px',
        padding: desktopLayout ? '1.5rem' : '0.7rem',
        marginBottom:'1.5rem',
        boxShadow:'0 4px 12px rgba(59,130,246,0.15), 0 2px 4px rgba(59,130,246,0.1)',
        border:'2px solid #bfdbfe',
        display: desktopLayout ? 'grid' : 'block',
        gridTemplateColumns: desktopLayout ? '1fr 1fr' : 'none',
        gap: desktopLayout ? '2rem' : '0',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Left Column - Invoice Inputs */}
        <div>
          <div style={{
            fontWeight:700,
            marginBottom:'0.8rem',
            fontSize:'1.05rem',
            color:'#2563eb',
            paddingBottom:'0.5rem',
            borderBottom:'2px solid #bfdbfe',
            position: 'relative'
          }}>🧾 Invoice Details</div>
          
          {/* Invoice Recipient */}
          <div style={{marginBottom:'0.7rem'}}>
            <div style={labelStyle}>Invoice made out to:</div>
            <textarea 
              value={invoiceMadeOutTo} 
              onChange={e => setInvoiceMadeOutTo(e.target.value)} 
              style={{
                ...inputStyle,
                resize:'none',
                height: desktopLayout ? '4rem' : '3rem',
                border:'1px solid #333',
                borderRadius:'6px',
                width: desktopLayout ? '100%' : '100%'
              }}
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
                style={{
                  padding:'0.6rem',
                  borderRadius:'6px',
                  border:'1px solid #333',
                  fontSize:'1rem',
                  background:'#f7fafd',
                  width: desktopLayout ? '160px' : '120px'
                }} 
                required 
              />
            </div>
            <div>
              <div style={labelStyle}>Invoice Number</div>
              <input 
                type="text" 
                value={invoiceNumber} 
                onChange={e => setInvoiceNumber(e.target.value)} 
                style={{
                  padding:'0.6rem',
                  borderRadius:'6px',
                  border:'1px solid #333',
                  fontSize:'1rem',
                  background:'#f7fafd',
                  width: desktopLayout ? '160px' : '120px'
                }} 
                placeholder="INV-001"
                required 
              />
            </div>
          </div>

          {/* Account Reference and Load Reference - Same Line */}
          <div style={{display:'flex',gap:'1rem',marginBottom:'0.7rem'}}>
            <div>
              <div style={labelStyle}>Account Reference</div>
              <input 
                type="text" 
                value={invoiceAccountRef} 
                onChange={e => setInvoiceAccountRef(e.target.value)} 
                style={{
                  padding:'0.6rem',
                  borderRadius:'6px',
                  border:'1px solid #333',
                  fontSize:'1rem',
                  background:'#f7fafd',
                  width: desktopLayout ? '160px' : '120px'
                }} 
                placeholder="REG002"
                required 
              />
            </div>
            <div>
              <div style={labelStyle}>Load Reference</div>
              <input 
                type="text" 
                value={invoiceLoadRef} 
                onChange={e => setInvoiceLoadRef(e.target.value)} 
                style={{
                  padding:'0.6rem',
                  borderRadius:'6px',
                  border:'1px solid #333',
                  fontSize:'1rem',
                  background:'#f7fafd',
                  width: desktopLayout ? '160px' : '120px'
                }} 
                placeholder={`LOAD ${load.id || 'N/A'}`}
                required 
              />
            </div>
          </div>

          {/* Code Field */}
          <div style={{marginBottom:'0.7rem'}}>
            <div style={labelStyle}>Code</div>
            <input 
              type="text" 
              value={invoiceCode} 
              onChange={e => setInvoiceCode(e.target.value)} 
              style={{
                padding:'0.6rem',
                borderRadius:'6px',
                border:'1px solid #333',
                fontSize:'1rem',
                background:'#f7fafd',
                width: desktopLayout ? '160px' : '120px'
              }} 
              placeholder="1450707"
              required 
            />
          </div>

          {/* Discount % Field */}
          <div style={{marginBottom:'0.7rem'}}>
            <div style={labelStyle}>Discount %</div>
            <input 
              type="number" 
              value={invoiceDiscount} 
              onChange={e => setInvoiceDiscount(e.target.value)} 
              style={{
                padding:'0.6rem',
                borderRadius:'6px',
                border:'1px solid #333',
                fontSize:'1rem',
                background:'#f7fafd',
                width: desktopLayout ? '160px' : '120px'
              }} 
              placeholder="0"
              min="0"
              max="100"
              step="0.01"
              required 
            />
          </div>

          {/* Invoice Subtotal and VAT - Same Line */}
          <div style={{display:'flex',gap:'1rem',marginBottom:'0.7rem'}}>
            <div>
              <div style={labelStyle}>Invoice Subtotal</div>
              <input 
                type="number" 
                step="0.01" 
                value={invoiceSubtotal} 
                onChange={e => setInvoiceSubtotal(e.target.value)} 
                style={{
                  padding:'0.6rem',
                  borderRadius:'6px',
                  border:'1px solid #333',
                  fontSize:'1rem',
                  background:'#f7fafd',
                  textAlign:'center',
                  width: desktopLayout ? '160px' : '120px'
                }} 
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
                style={{
                  padding:'0.6rem',
                  borderRadius:'6px',
                  border:'1px solid #333',
                  fontSize:'1rem',
                  background:'#fff4e6',
                  color:'#ff8c00',
                  fontWeight:600,
                  textAlign:'center',
                  width: desktopLayout ? '160px' : '120px'
                }} 
              />
            </div>
          </div>
        </div>

        {/* Right Column - Confirmation and Invoice Total */}
        <div>
          {/* Confirmation Checkbox - Above Invoice Total */}
          <div style={{
            background:'#f8fafc',
            borderRadius:'8px',
            padding: desktopLayout ? '1rem' : '0.8rem',
            border:'1px solid #e5e7eb',
            marginBottom:'0.8rem'
          }}>
            <label style={{
              display:'flex',
              alignItems:'center',
              gap:'0.5rem',
              cursor:'pointer',
              fontSize: desktopLayout ? '1.1rem' : '1.05rem',
              fontWeight:700,
              color:'#333'
            }}>
              <input 
                type="checkbox" 
                checked={invoiceSentToDebtor} 
                onChange={e => setInvoiceSentToDebtor(e.target.checked)}
                style={{
                  width: desktopLayout ? '24px' : '20px',
                  height: desktopLayout ? '24px' : '20px',
                  cursor:'pointer'
                }}
              />
              <span>✉️ Invoice has been sent to debtor</span>
            </label>
          </div>

          {/* Invoice Total - Aligned with VAT field */}
          <div style={{textAlign:'center',marginBottom:'0.8rem',marginTop:'200px'}}>
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
              marginTop:'0.3rem',
              width: desktopLayout ? '250px' : 'auto',
              margin: desktopLayout ? '0.3rem auto 0' : '0.3rem 0 0'
            }}>
              {invoiceTotal ? `R ${invoiceTotal}` : 'R 0.00'}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{
        background:'#f8fafc',
        borderRadius:'12px',
        padding: desktopLayout ? '1.5rem' : '1rem',
        marginTop: '1.5rem',
        boxShadow:'0 4px 12px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.05)',
        border:'2px solid #e2e8f0',
        display: desktopLayout ? 'grid' : 'block',
        gridTemplateColumns: desktopLayout ? '1fr 1fr' : 'none',
        gap: desktopLayout ? '1rem' : '0.5rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Combined Complete Invoice Processing & Generate PDF Button */}
        <button 
          type="button"
          disabled={submitting || !invoiceSentToDebtor}
          onClick={async (e) => {
            e.preventDefault();
            if (!invoiceMadeOutTo || !invoiceDate || !invoiceNumber || !invoiceSubtotal) {
              alert('Please fill in all required fields: Invoice made out to, Date, Number, and Subtotal')
              return
            }
            setSubmitting(true)
            try {
              // First generate PDF
              console.log('Generating PDF Invoice for load:', load);
              const invoiceData = {
                invoiceNumber,
                invoiceDate,
                invoiceMadeOutTo,
                invoiceAccountRef,
                invoiceLoadRef,
                invoiceCode,
                invoiceDiscount,
                invoiceSubtotal,
                invoiceVat,
                invoiceTotal
              };
              const { pdfData, filename } = await generatePDFInvoice(load, invoiceData);
              console.log('PDF generation completed successfully');
              
              // Then complete invoice processing
              console.log('Completing invoice processing...');
              
              // Prepare updated parsed_data
              const updatedParsedData = {
                ...(load.parsed_data || {}),
                invoice: {
                  invoiceMadeOutTo: invoiceMadeOutTo,
                  invoiceDate: invoiceDate,
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
                invoice_sent: invoiceSentToDebtor, // Add invoice sent status
              };
              
              // Update the load in Supabase with both PDF and processing data
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
                status: 'third_approved',
                parsed_data: updatedParsedData,
                pdf_invoice: pdfData,
                pdf_invoice_filename: filename,
                pdf_invoice_generated_at: new Date().toISOString(),
                invoice_number: invoiceNumber,
                debtor_name: invoiceMadeOutTo,
                invoice_sent: invoiceSentToDebtor // Store invoice sent status
              }).eq('id', load.id)
              
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
                alert('Invoice processed, PDF generated, and promoted to Final Approver!');
                onInvoiceComplete();
              }
            } catch (error) {
              console.error('Combined invoice processing failed:', error)
              alert('Failed to process invoice and generate PDF. See console for details.')
            } finally {
              setSubmitting(false)
            }
          }}
          style={{
            background: submitting ? '#94a3b8' : !invoiceSentToDebtor ? '#d1d5db' : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: desktopLayout ? '1.2rem' : '1rem',
            fontWeight: 700,
            fontSize: desktopLayout ? '1.2rem' : '1.1rem',
            cursor: submitting || !invoiceSentToDebtor ? 'not-allowed' : 'pointer',
            width: '100%',
            boxShadow: !invoiceSentToDebtor ? 'none' : '0 4px 12px rgba(5, 150, 105, 0.3)',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            if (!submitting && invoiceSentToDebtor) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(5, 150, 105, 0.4)';
            }
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = !invoiceSentToDebtor ? 'none' : '0 4px 12px rgba(5, 150, 105, 0.3)';
          }}
        >
          {submitting ? '⏳ Processing & Generating PDF...' : '🧾 Complete Invoice & Generate PDF'}
        </button>
      </div>

      {/* Photo Thumbnails */}
      {load.photos && load.photos.length > 0 && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <div style={{
            fontSize: '0.9rem',
            fontWeight: 600,
            color: 'white',
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
                  border: '2px solid rgba(255,255,255,0.3)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
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
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.8)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(255,255,255,0.3)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                }}
              />
            ))}
          </div>
        </div>
      )}
    </form>
    </div>
  )
}

export default InvoicerSection