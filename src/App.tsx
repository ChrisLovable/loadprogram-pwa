import React, { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import DriverSection from './components/DriverSection'
import FirstApproverSection from './components/FirstApproverSection'
import SecondApproverSection from './components/SecondApproverSection'
import InvoicerSection from './components/InvoicerSection'
import FinalApproverSection from './components/FinalApproverSection'
import RoleSelector from './components/RoleSelector'
import './App.css'

// Debug: Log env variables
console.log('VITE_SUPABASE_URL', import.meta.env.VITE_SUPABASE_URL)
console.log('VITE_SUPABASE_ANON_KEY', import.meta.env.VITE_SUPABASE_ANON_KEY)

const DEMO_LOAD = {
  id: 999,
  ocr_data: null, // No hardcoded values - let OCR populate them
  textract_data: null // AWS Textract data will be stored here
}

function App() {
  const [loads, setLoads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentLoad, setCurrentLoad] = useState(DEMO_LOAD)
  const [currentRole, setCurrentRole] = useState<string | null>(null)
  const [firstApprovalData, setFirstApprovalData] = useState<any>(null)

  const loadData = async () => {
    // Temporarily disabled Supabase calls due to DNS/certificate issues
    console.log('Supabase calls disabled - using demo data')
    setLoads([]) // Empty for now, or add demo data if needed
    setLoading(false)
  }

  useEffect(() => {
    loadData()
    // Load first approval data from localStorage
    const storedFirstApproval = localStorage.getItem('firstApprovalData')
    if (storedFirstApproval) {
      setFirstApprovalData(JSON.parse(storedFirstApproval))
    }
    // Optionally add realtime subscription here
  }, [])

  if (loading) return <div className="loading">Loading...</div>

  // Handle Textract completion
  const handleTextractComplete = (textractData: any) => {
    console.log('App received Textract data:', textractData)
    setCurrentLoad(prev => ({
      ...prev,
      textract_data: textractData
    }))
  }

  // Find the first load in 'uploaded' status for First Approver
  const firstLoad = loads.find(l => l.status === 'uploaded') || {
    ...currentLoad,
    first_approval: firstApprovalData
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#f5f7fa',
      padding: '1rem'
    }}>
      <div style={{
        width: '400px',
        maxWidth: '100%',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        maxHeight: '100vh',
        overflowY: 'auto'
      }}>
        <header style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '0.5rem 1rem',
          textAlign: 'center'
        }}>
          <h1 style={{margin: 0, fontSize: '0.9rem', fontWeight: 700}}>🚛 Load Approval</h1>
        </header>
        
        <div style={{padding: '0.5rem'}}>
          {/* ROLE SELECTOR */}
          <RoleSelector currentRole={currentRole} onRoleChange={setCurrentRole} />
          
          {/* DRIVER ROLE CARD */}
          {(currentRole === 'driver' || !currentRole) && (
            <section style={{
              marginBottom: '1rem',
              background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
              borderRadius: '12px',
              padding: '3px',
              border: '1px solid #374151',
              boxShadow: '0 4px 12px rgba(107, 114, 128, 0.3)'
            }}>
              <h2 style={{
                fontSize: '1.05rem',
                fontWeight: 700,
                color: 'white',
                marginBottom: '0.5rem',
                textAlign: 'center',
                textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                letterSpacing: '0.5px',
                margin: '0.5rem 0'
              }}>📸 DRIVER - Upload Photos</h2>
              <div style={{
                background: 'rgba(255,255,255,0.95)',
                borderRadius: '8px',
                padding: '10px',
                border: '1px solid rgba(255,255,255,0.8)'
              }}>
                <DriverSection onUploadComplete={loadData} onTextractComplete={handleTextractComplete} />
              </div>
            </section>
          )}
          
          {/* FIRST APPROVER ROLE CARD */}
          {(currentRole === 'first_approver' || !currentRole) && (
            <section style={{
              marginBottom: '1rem',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              borderRadius: '12px',
              padding: '3px',
              border: '1px solid #2563eb',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
            }}>
              <h2 style={{
                fontSize: '1.05rem',
                fontWeight: 700,
                color: 'white',
                marginBottom: '0.5rem',
                textAlign: 'center',
                textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                letterSpacing: '0.5px',
                margin: '0.5rem 0'
              }}>✅ FIRST APPROVER - Review & Enter Details</h2>
              <div style={{
                background: 'rgba(255,255,255,0.95)',
                borderRadius: '8px',
                padding: '10px',
                border: '1px solid rgba(255,255,255,0.8)'
              }}>
                <FirstApproverSection load={firstLoad} onApprovalComplete={loadData} />
              </div>
            </section>
          )}

          {/* SECOND APPROVER ROLE CARD */}
          {(currentRole === 'second_approver' || !currentRole) && (
            <section style={{
              marginBottom: '1rem',
              background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
              borderRadius: '12px',
              padding: '3px',
              border: '1px solid #0284c7',
              boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)'
            }}>
              <h2 style={{
                fontSize: '1.05rem',
                fontWeight: 700,
                color: 'white',
                marginBottom: '0.5rem',
                textAlign: 'center',
                textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                letterSpacing: '0.5px',
                margin: '0.5rem 0'
              }}>📝 SECOND APPROVER - Final Review</h2>
              <div style={{
                background: 'rgba(255,255,255,0.95)',
                borderRadius: '8px',
                padding: '10px',
                border: '1px solid rgba(255,255,255,0.8)'
              }}>
                <SecondApproverSection load={firstLoad} onApprovalComplete={loadData} />
              </div>
            </section>
          )}

          {/* INVOICER ROLE CARD */}
          {(currentRole === 'invoicer' || !currentRole) && (
            <section style={{
              marginBottom: '1rem',
              background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
              borderRadius: '12px',
              padding: '3px',
              border: '1px solid #b91c1c',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
            }}>
              <h2 style={{
                fontSize: '1.05rem',
                fontWeight: 700,
                color: 'white',
                marginBottom: '0.5rem',
                textAlign: 'center',
                textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                letterSpacing: '0.5px',
                margin: '0.5rem 0'
              }}>🧾 INVOICER - Generate Invoice</h2>
              <div style={{
                background: 'rgba(255,255,255,0.95)',
                borderRadius: '8px',
                padding: '10px',
                border: '1px solid rgba(255,255,255,0.8)'
              }}>
                <InvoicerSection load={firstLoad} onInvoiceComplete={loadData} />
              </div>
            </section>
          )}

          {/* FINAL APPROVER ROLE CARD */}
          {(currentRole === 'final_approver' || !currentRole) && (
            <section style={{
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              borderRadius: '12px',
              padding: '3px',
              border: '1px solid #047857',
              boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)'
            }}>
              <h2 style={{
                fontSize: '1.05rem',
                fontWeight: 700,
                color: 'white',
                marginBottom: '0.5rem',
                textAlign: 'center',
                textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                letterSpacing: '0.5px',
                margin: '0.5rem 0'
              }}>🏁 FINAL APPROVER - Complete Process</h2>
              <div style={{
                background: 'rgba(255,255,255,0.95)',
                borderRadius: '8px',
                padding: '10px',
                border: '1px solid rgba(255,255,255,0.8)'
              }}>
                <FinalApproverSection load={firstLoad} onFinalApprovalComplete={loadData} />
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
