import React from 'react'
import InvoicerSection from './InvoicerSection'

interface InvoicerModalProps {
  isOpen: boolean
  onClose: () => void
  loads: any[]
  onInvoiceComplete: () => void
  onDeleteLoad: (loadId: number) => void
}

const InvoicerModal: React.FC<InvoicerModalProps> = ({ 
  isOpen, 
  onClose, 
  loads, 
  onInvoiceComplete, 
  onDeleteLoad 
}) => {
  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        width: '1200px',
        maxWidth: '95vw',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        position: 'relative'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            color: 'white',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
            transition: 'all 0.2s ease',
            zIndex: 10
          }}
          onMouseOver={e => {
            e.currentTarget.style.transform = 'scale(1.1)'
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.4)'
          }}
          onMouseOut={e => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)'
          }}
        >
          ✕
        </button>

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
          borderRadius: '12px 12px 0 0',
          padding: '20px',
          borderBottom: '1px solid #fecaca'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#b91c1c',
            textAlign: 'center',
            margin: 0,
            textShadow: '0 1px 2px rgba(0,0,0,0.1)',
            letterSpacing: '0.5px'
          }}>
            🧾 INVOICER - Generate Invoice
          </h2>
        </div>

        {/* Content */}
        <div style={{
          padding: '30px',
          minHeight: '400px'
        }}>
          {loads.filter(l => l.status === 'second_approved').length > 0 ? (
            loads.filter(l => l.status === 'second_approved').map((load, index) => (
              <InvoicerSection 
                key={load.id} 
                load={load} 
                onInvoiceComplete={onInvoiceComplete} 
                onDeleteLoad={onDeleteLoad}
                index={index}
              />
            ))
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: '#666',
              fontSize: '1.1rem'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '20px' }}>📋</div>
              <div>No loads ready for invoicing</div>
              <div style={{ fontSize: '0.9rem', marginTop: '10px', color: '#999' }}>
                Loads need to be approved by the Second Approver first
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default InvoicerModal

