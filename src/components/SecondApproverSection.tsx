import React, { useState } from 'react'
import { useToast } from './Toast'

interface SecondApproverSectionProps {
  load: any // expects load with textract_data, ocr_data, and approval data
  onApprovalComplete: () => void
}

const labelStyle = { fontSize: '1.05rem', fontWeight: 700, color: '#333', marginBottom: '0.1rem' }
const inputStyle = { width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #e0e7ef', fontSize: '1rem', background: '#f7fafd' }

const SecondApproverSection: React.FC<SecondApproverSectionProps> = ({ load, onApprovalComplete }) => {
  const [comments, setComments] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const { showToast } = useToast()

  // Add debug info to visual display
  const addDebugInfo = (message: string) => {
    console.log(message)
    setDebugInfo(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${message}`])
  }

  // Currency formatting function
  const formatCurrency = (value: number): string => {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }
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
    setDebugInfo([]) // Clear previous debug info
    try {
      addDebugInfo('Starting submission...')
      addDebugInfo(`Load ID: ${load?.id}`)
      addDebugInfo(`Mobile: ${/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)}`)
      
      if (!load?.id) {
        throw new Error('Load ID is missing')
      }
      
      // Test Supabase connection first
      addDebugInfo('Testing Supabase connection...')
      let supabase
      try {
        const supabaseModule = await import('../lib/supabase')
        supabase = supabaseModule.supabase
        addDebugInfo(`Supabase loaded: ${!!supabase}`)
        
        if (!supabase) {
          throw new Error('Supabase client is undefined')
        }
      } catch (importError) {
        const errorMessage = importError instanceof Error ? importError.message : String(importError)
        addDebugInfo(`Supabase import failed: ${errorMessage}`)
        
        // Fallback: Try to create Supabase client directly
        try {
          addDebugInfo('Trying direct Supabase creation...')
          const { createClient } = await import('@supabase/supabase-js')
          supabase = createClient(
            'https://rdzjowqopmdlbkfuafxr.supabase.co',
            'sb_publishable_Zfc7tBpl0ho1GuF2HLjKxQ_BlU_A24w'
          )
          addDebugInfo(`Direct Supabase created: ${!!supabase}`)
        } catch (directError) {
          const directErrorMessage = directError instanceof Error ? directError.message : String(directError)
          addDebugInfo(`Direct creation failed: ${directErrorMessage}`)
          throw new Error('Failed to create Supabase client: ' + directErrorMessage)
        }
      }
      
      // Test network connectivity
      try {
        const response = await fetch('https://rdzjowqopmdlbkfuafxr.supabase.co/rest/v1/', {
          method: 'HEAD',
          headers: {
            'apikey': 'sb_publishable_Zfc7tBpl0ho1GuF2HLjKxQ_BlU_A24w'
          }
        })
        addDebugInfo(`Network test: ${response.status} ${response.statusText}`)
      } catch (networkError) {
        const networkErrorMessage = networkError instanceof Error ? networkError.message : String(networkError)
        addDebugInfo(`Network error: ${networkErrorMessage}`)
        throw new Error('Network connectivity issue: ' + networkErrorMessage)
      }
      
      // Prepare updated parsed_data
      const updatedParsedData = {
        ...(load.parsed_data || {}),
        secondApproverComments: comments,
        second_approver: 'Second Approver',
        approved_by_2nd: currentUser.role === 'second_approver' ? currentUser.name : undefined,
        second_approved_at: new Date().toISOString(),
        // Ensure all fields from First Approver are carried forward as numbers
        date: getField('date', undefined),
        sender: getField('sender', undefined),
        receiver: getField('receiver', undefined),
        truckReg: getField('truckReg', undefined),
        trailerReg: getField('trailerReg', undefined),
        startKm: Number(getField('startKm', '0')),
        endKm: Number(getField('endKm', '0')),
        tripKm: Number(getField('tripKm', '0')),
        rate: Number(getField('rate', '0')),
        ratePerAnimal: Number(getField('ratePerAnimal', '0')),
        runningKms: Number(getField('runningKms', '0')),
        runningKmRate: Number(getField('runningKmRate', '0')),
        subtotal: Number(getField('subtotal', '0')),
        vat: Number(getField('vat', '0')),
        total: Number(getField('total', '0')),
        totalAnimals: Number(getField('totalAnimals', '0')),
      };
      
      addDebugInfo('Preparing data for submission...')
      
      // Update the load in Supabase
      addDebugInfo('Sending to Supabase...')
      const { error } = await supabase.from('loads').update({
        status: 'second_approved',
        parsed_data: updatedParsedData,
      }).eq('id', load.id)
      
      if (error) {
        addDebugInfo(`Supabase error: ${error.message}`)
        showToast('Failed to update load: ' + error.message, 'error')
      } else {
        addDebugInfo('Success! Submission completed.')
        showToast('🎉 Second approval submitted and promoted to Invoicer!', 'success')
        setComments('');
        onApprovalComplete();
      }
    } catch (error) {
      addDebugInfo(`Error: ${(error as Error).message}`)
      showToast('Failed to submit second approval: ' + (error as Error).message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="approver-form">
      {/* Debug Info Display */}
      {debugInfo.length > 0 && (
        <div style={{
          background: '#f0f0f0',
          border: '1px solid #ccc',
          borderRadius: '8px',
          padding: '10px',
          marginBottom: '20px',
          fontSize: '12px',
          fontFamily: 'monospace'
        }}>
          <strong>Debug Info:</strong>
          {debugInfo.map((info, index) => (
            <div key={index} style={{ marginTop: '5px', color: '#333' }}>
              {info}
            </div>
          ))}
        </div>
      )}
      
      {/* Sender and Receiver */}
      <div style={{display:'flex',flexDirection:'column',gap:'0.7rem',marginBottom:'0.7rem'}}>
        <div>
          <div style={labelStyle}>Sender</div>
          <div style={{...inputStyle,width:'160px',background:'#f8fafc',color:'#666',fontWeight:500,textAlign:'left',border:'1px solid #333',borderRadius:'6px'}}>
            {getField('sender')}
          </div>
        </div>
        <div>
          <div style={labelStyle}>Receiver</div>
          <div style={{...inputStyle,width:'160px',background:'#f8fafc',color:'#666',fontWeight:500,textAlign:'left',border:'1px solid #333',borderRadius:'6px'}}>
            {getField('receiver')}
          </div>
        </div>
      </div>
      {/* Descriptions Table */}
      {Array.isArray(load?.parsed_table) && load.parsed_table.filter((row: any) => Object.values(row).some((v: any) => v && v !== '')).length > 0 && (
        <div style={{marginBottom:'0.7rem'}}>
          <div style={labelStyle}>Descriptions Table</div>
          <table style={{width:'100%',borderCollapse:'collapse',background:'#ffffff',borderRadius:'8px',overflow:'hidden',boxShadow:'0 4px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.1)',fontSize:'0.75rem'}}>
            <thead>
              <tr style={{background:'#ffffff',color:'#38d39f',fontWeight:700}}>
                <th style={{padding:'0.3rem 0.2rem',fontSize:'0.75rem',border:'1px solid #d1d5db',background:'#ffffff'}}>No</th>
                <th style={{padding:'0.3rem 0.2rem',fontSize:'0.75rem',border:'1px solid #d1d5db',background:'#ffffff'}}>Description</th>
                <th style={{padding:'0.3rem 0.2rem',fontSize:'0.75rem',border:'1px solid #d1d5db',background:'#ffffff'}}>Mass</th>
                <th style={{padding:'0.3rem 0.2rem',fontSize:'0.75rem',border:'1px solid #d1d5db',background:'#ffffff'}}>Volume</th>
                <th style={{padding:'0.3rem 0.2rem',fontSize:'0.75rem',border:'1px solid #d1d5db',background:'#ffffff'}}>R</th>
                <th style={{padding:'0.3rem 0.2rem',fontSize:'0.75rem',border:'1px solid #d1d5db',background:'#ffffff'}}>C</th>
              </tr>
            </thead>
            <tbody>
              {load.parsed_table.filter((row: any) => Object.values(row).some((v: any) => v && v !== '')).map((row: any, i: number) => (
                <tr key={i} style={{textAlign:'center',fontWeight:600,color:'#333',background:'#ffffff'}}>
                  <td style={{padding:'0.3rem 0.2rem',fontSize:'0.75rem',border:'1px solid #d1d5db',minHeight:'2rem',background:'#ffffff'}}>{row.packages}</td>
                  <td style={{padding:'0.3rem 0.2rem',fontSize:'0.75rem',border:'1px solid #d1d5db',minHeight:'2rem',background:'#ffffff'}}>{row.description}</td>
                  <td style={{padding:'0.3rem 0.2rem',fontSize:'0.75rem',border:'1px solid #d1d5db',minHeight:'2rem',background:'#ffffff'}}>{row.gross}</td>
                  <td style={{padding:'0.3rem 0.2rem',fontSize:'0.75rem',border:'1px solid #d1d5db',minHeight:'2rem',background:'#ffffff'}}>{row.volume}</td>
                  <td style={{padding:'0.3rem 0.2rem',fontSize:'0.75rem',border:'1px solid #d1d5db',minHeight:'2rem',background:'#ffffff'}}>{row.r}</td>
                  <td style={{padding:'0.3rem 0.2rem',fontSize:'0.75rem',border:'1px solid #d1d5db',minHeight:'2rem',background:'#ffffff'}}>{row.c}</td>
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
              {getField('tripKm') ? Math.round(Number(getField('tripKm'))) : ''}
            </div>
          </div>
          <div>
            <div style={labelStyle}>Rate per KM</div>
            <div style={{...inputStyle,width:'100px',background:'#f8fafc',color:'#666',fontWeight:500,textAlign:'center',border:'1px solid #333',borderRadius:'6px'}}>
              {getField('rate') ? `R ${formatCurrency(Number(getField('rate')))}` : ''}
            </div>
          </div>
        </div>
        {/* # Animals and Rate / Animal */}
        {(getField('ratePerAnimal') || getField('ratePerAnimal') === 0) && (
          <div style={{display:'flex',gap:'1rem',marginBottom:'0.7rem'}}>
            <div>
              <div style={labelStyle}># Animals</div>
              <div style={{...inputStyle,width:'100px',background:'#f8fafc',color:'#666',fontWeight:500,textAlign:'center',border:'1px solid #333',borderRadius:'6px'}}>
                {getField('totalAnimals') ? Math.round(Number(getField('totalAnimals'))) : ''}
              </div>
            </div>
            <div>
              <div style={labelStyle}>Rate / Animal</div>
              <div style={{...inputStyle,width:'100px',background:'#f8fafc',color:'#666',fontWeight:500,textAlign:'center',border:'1px solid #333',borderRadius:'6px'}}>
                {getField('ratePerAnimal') && getField('ratePerAnimal') !== '-' ? `R ${formatCurrency(Number(getField('ratePerAnimal')))}` : ''}
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
                {getField('runningKms') && getField('runningKms') !== '-' ? Math.round(Number(getField('runningKms'))) : ''}
              </div>
            </div>
            <div>
              <div style={labelStyle}>Rate/Km</div>
              <div style={{...inputStyle,width:'100px',background:'#f8fafc',color:'#666',fontWeight:500,textAlign:'center',border:'1px solid #333',borderRadius:'6px'}}>
                {getField('runningKmRate') && getField('runningKmRate') !== '-' ? `R ${formatCurrency(Number(getField('runningKmRate')))}` : ''}
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
                {getField('subtotal') ? formatCurrency(Number(getField('subtotal'))) : '0.00'}
              </div>
            </div>
            <div style={{textAlign:'center'}}>
              <div style={labelStyle}>VAT (15%)</div>
              <div style={{...inputStyle,width:'100px',background:'#fff4e6',color:'#ff8c00',fontWeight:600,textAlign:'center',border:'1px solid #333',borderRadius:'6px'}}>
                {getField('vat') ? formatCurrency(Number(getField('vat'))) : '0.00'}
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
              {getField('total') ? formatCurrency(Number(getField('total'))) : '0.00'}
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

export default SecondApproverSection
