import React, { useState, useEffect } from 'react';
import { generatePDFInvoice } from '../utils/pdfGenerator';

interface InvoiceManagerProps {
  onClose: () => void;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  truckReg: string;
  sender: string;
  receiver: string;
  total: number;
  status: string;
  loadData: any;
}

const InvoiceManager: React.FC<InvoiceManagerProps> = ({ onClose }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);

  // Load invoices from localStorage (in a real app, this would be from a database)
  useEffect(() => {
    const savedInvoices = localStorage.getItem('generatedInvoices');
    if (savedInvoices) {
      setInvoices(JSON.parse(savedInvoices));
    }
  }, []);

  // Filter invoices based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredInvoices(invoices);
    } else {
      const filtered = invoices.filter(invoice =>
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.truckReg.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.receiver.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredInvoices(filtered);
    }
  }, [invoices, searchTerm]);

  const handleGenerateInvoice = (invoice: Invoice) => {
    generatePDFInvoice(invoice.loadData);
  };

  const handleDeleteInvoice = (invoiceId: string) => {
    const updatedInvoices = invoices.filter(inv => inv.id !== invoiceId);
    setInvoices(updatedInvoices);
    localStorage.setItem('generatedInvoices', JSON.stringify(updatedInvoices));
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: '#000000',
      zIndex: 6000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }} onClick={onClose}>
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        padding: '0',
        width: '90vw',
        maxWidth: '90vw',
        height: '85vh',
        maxHeight: '85vh',
        boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
        border: '1px solid #e5e7eb',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        marginLeft: '-40px'
      }} onClick={e => e.stopPropagation()}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            background: 'rgba(255,255,255,0.7)',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.35rem',
            color: '#059669',
            boxShadow: '0 2px 8px 0 rgba(5, 150, 105, 0.10)',
            cursor: 'pointer',
            transition: 'background 0.18s, color 0.18s, box-shadow 0.18s',
            outline: 'none',
            zIndex: 10,
          }}
          aria-label="Close invoice manager"
        >
          ×
        </button>

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
          color: 'white',
          padding: '1.5rem 2rem',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <div style={{
            fontSize: '1.2rem',
            fontWeight: 700,
            marginBottom: '1rem',
            textAlign: 'center',
            textShadow: '0 2px 4px rgba(0,0,0,0.2)',
            letterSpacing: '0.5px'
          }}>
            📋 Invoice Manager
          </div>
          
          {/* Search Bar */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            padding: '0 1rem'
          }}>
            <input
              type="text"
              placeholder="Search by invoice number, truck reg, sender, or receiver..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1,
                minWidth: '300px',
                padding: '0.5rem',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                fontSize: '0.8rem'
              }}
            />
          </div>
        </div>

        {/* Invoice List */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          background: '#fff',
          minHeight: 0
        }}>
          {filteredInvoices.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#6b7280',
              fontSize: '1rem'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
              <div>No invoices found</div>
              <div style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                {searchTerm ? 'Try adjusting your search terms' : 'Generate invoices from the invoicer section'}
              </div>
            </div>
          ) : (
            <div style={{ padding: '1rem' }}>
              {filteredInvoices.map((invoice) => (
                <div key={invoice.id} style={{
                  background: '#f8fafc',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginBottom: '1rem',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '0.5rem'
                  }}>
                    <div>
                      <div style={{
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        color: '#1f2937',
                        marginBottom: '0.25rem'
                      }}>
                        Invoice #{invoice.invoiceNumber}
                      </div>
                      <div style={{
                        fontSize: '0.9rem',
                        color: '#6b7280'
                      }}>
                        {invoice.date} • {invoice.truckReg}
                      </div>
                    </div>
                    <div style={{
                      background: invoice.status === 'Paid' ? '#10b981' : '#f59e0b',
                      color: 'white',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      fontWeight: 600
                    }}>
                      {invoice.status}
                    </div>
                  </div>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.5rem',
                    marginBottom: '1rem',
                    fontSize: '0.9rem',
                    color: '#374151'
                  }}>
                    <div><strong>From:</strong> {invoice.sender}</div>
                    <div><strong>To:</strong> {invoice.receiver}</div>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    justifyContent: 'flex-end'
                  }}>
                    <button
                      onClick={() => handleGenerateInvoice(invoice)}
                      style={{
                        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0.5rem 1rem',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(5, 150, 105, 0.3)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      📄 Download PDF
                    </button>
                    <button
                      onClick={() => handleDeleteInvoice(invoice.id)}
                      style={{
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0.5rem 1rem',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(239, 68, 68, 0.3)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          background: '#f8fafc',
          padding: '1rem 2rem',
          borderTop: '1px solid #e5e7eb',
          textAlign: 'center',
          fontSize: '0.8rem',
          color: '#6b7280',
          fontWeight: 500
        }}>
          Showing {filteredInvoices.length} of {invoices.length} invoices
        </div>
      </div>
    </div>
  );
};

export default InvoiceManager;
