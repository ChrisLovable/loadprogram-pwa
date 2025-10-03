import React, { useState, useEffect } from 'react';
import { generatePDFInvoice } from '../utils/pdfGenerator';
import { supabase } from '../lib/supabase';

interface InvoiceManagerProps {
  onClose: () => void;
}

interface Invoice {
  id: number;
  invoice_number: string;
  pdf_invoice_generated_at: string;
  truck_reg?: string;
  sender?: string;
  receiver?: string;
  total?: number;
  status: string;
  debtor_name?: string;
  pdf_invoice?: string;
  pdf_invoice_filename?: string;
  loadData?: any;
}

const InvoiceManager: React.FC<InvoiceManagerProps> = ({ onClose }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  // Load invoices from database
  useEffect(() => {
    const loadInvoices = async () => {
      try {
        const { data, error } = await supabase
          .from('loads')
          .select('*')
          .not('pdf_invoice', 'is', null)
          .order('pdf_invoice_generated_at', { ascending: false });
        
        if (error) {
          console.error('Error loading invoices:', error);
          return;
        }
        
        // Transform data to match Invoice interface
        const transformedInvoices = data?.map(load => ({
          id: load.id,
          invoice_number: load.invoice_number || `INV-${load.id}`,
          pdf_invoice_generated_at: load.pdf_invoice_generated_at,
          truck_reg: load.truck_reg || load.parsed_data?.truckReg,
          sender: load.sender || load.parsed_data?.sender,
          receiver: load.receiver || load.parsed_data?.receiver,
          total: load.parsed_data?.total || load.first_approval?.total_invoice,
          status: 'Generated',
          debtor_name: load.debtor_name,
          pdf_invoice: load.pdf_invoice,
          pdf_invoice_filename: load.pdf_invoice_filename,
          loadData: load
        })) || [];
        
        setInvoices(transformedInvoices);
      } catch (error) {
        console.error('Error loading invoices:', error);
      }
    };
    
    loadInvoices();
  }, []);

  // Filter invoices based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredInvoices(invoices);
    } else {
      const filtered = invoices.filter(invoice =>
        invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (invoice.debtor_name && invoice.debtor_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (invoice.truck_reg && invoice.truck_reg.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (invoice.sender && invoice.sender.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (invoice.receiver && invoice.receiver.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredInvoices(filtered);
    }
  }, [invoices, searchTerm]);

  const handleGenerateInvoice = async (invoice: Invoice) => {
    if (invoice.pdf_invoice) {
      // Download existing PDF
      const link = document.createElement('a');
      link.href = invoice.pdf_invoice;
      link.download = invoice.pdf_invoice_filename || `invoice_${invoice.invoice_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (invoice.loadData) {
      // Generate new PDF
      await generatePDFInvoice(invoice.loadData);
    }
  };

  const handleDeleteInvoice = async (invoiceId: number) => {
    try {
      const { error } = await supabase
        .from('loads')
        .update({
          pdf_invoice: null,
          pdf_invoice_filename: null,
          pdf_invoice_generated_at: null,
          invoice_number: null,
          debtor_name: null
        })
        .eq('id', invoiceId);
      
      if (error) {
        console.error('Error deleting invoice:', error);
        return;
      }
      
      // Update local state
      const updatedInvoices = invoices.filter(inv => inv.id !== invoiceId);
      setInvoices(updatedInvoices);
    } catch (error) {
      console.error('Error deleting invoice:', error);
    }
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
      padding: isDesktop ? '40px' : '20px',
    }} onClick={onClose}>
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        padding: '0',
        width: isDesktop ? '1200px' : '90vw',
        maxWidth: isDesktop ? '1200px' : '90vw',
        height: isDesktop ? '800px' : '85vh',
        maxHeight: isDesktop ? '800px' : '85vh',
        boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
        border: '1px solid #e5e7eb',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }} onClick={e => e.stopPropagation()}>
        
        {/* Layout Toggle Button */}
        <button
          onClick={() => setIsDesktop(!isDesktop)}
          style={{
            position: 'absolute',
            top: '15px',
            left: '15px',
            background: 'rgba(255,255,255,0.9)',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            padding: '0.5rem 1rem',
            fontSize: '0.8rem',
            cursor: 'pointer',
            zIndex: 10,
            fontWeight: 600,
            color: '#374151',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,1)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.9)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {isDesktop ? '📱 Mobile View' : '🖥️ Desktop View'}
        </button>

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
          padding: isDesktop ? '2rem 3rem' : '1.5rem 2rem',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <div style={{
            fontSize: isDesktop ? '1.5rem' : '1.2rem',
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
              placeholder="Search by invoice number or debtor name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1,
                minWidth: isDesktop ? '400px' : '300px',
                maxWidth: isDesktop ? '600px' : '400px',
                padding: isDesktop ? '0.75rem' : '0.5rem',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.1)',
                color: '#374151',
                fontSize: isDesktop ? '1rem' : '0.8rem'
              }}
            />
          </div>
        </div>

        {/* Invoice List */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          background: '#fff',
          minHeight: 0,
          padding: isDesktop ? '2rem' : '1rem'
        }}>
          {filteredInvoices.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#6b7280',
              fontSize: isDesktop ? '1.2rem' : '1rem'
            }}>
              <div style={{ fontSize: isDesktop ? '4rem' : '3rem', marginBottom: '1rem' }}>📄</div>
              <div>No invoices found</div>
              <div style={{ fontSize: isDesktop ? '1rem' : '0.8rem', marginTop: '0.5rem' }}>
                {searchTerm ? 'Try adjusting your search terms' : 'Generate invoices from the invoicer section'}
              </div>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: isDesktop ? 'repeat(auto-fill, minmax(300px, 1fr))' : '1fr',
              gap: isDesktop ? '2rem' : '1rem',
              maxWidth: isDesktop ? 'none' : '100%'
            }}>
              {filteredInvoices.map((invoice) => (
                <div key={invoice.id} style={{
                  background: '#f8fafc',
                  borderRadius: '8px',
                  padding: isDesktop ? '1.5rem' : '1rem',
                  border: '1px solid #e5e7eb',
                  boxShadow: isDesktop 
                    ? '0 4px 20px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)' 
                    : '0 1px 3px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => {
                  if (isDesktop) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.1)';
                  }
                }}
                onMouseOut={(e) => {
                  if (isDesktop) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)';
                  }
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '0.5rem'
                  }}>
                    <div>
                      <div style={{
                        fontSize: isDesktop ? '1.3rem' : '1.1rem',
                        fontWeight: 700,
                        color: '#1f2937',
                        marginBottom: '0.25rem'
                      }}>
                        Invoice #{invoice.invoice_number}
                      </div>
                      <div style={{
                        fontSize: isDesktop ? '1rem' : '0.9rem',
                        color: '#6b7280'
                      }}>
                        {new Date(invoice.pdf_invoice_generated_at).toLocaleDateString()} • {invoice.truck_reg || 'N/A'}
                      </div>
                    </div>
                    <div style={{
                      background: invoice.status === 'Paid' ? '#10b981' : '#f59e0b',
                      color: 'white',
                      padding: isDesktop ? '0.5rem 1rem' : '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: isDesktop ? '0.9rem' : '0.8rem',
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
                    fontSize: isDesktop ? '1rem' : '0.9rem',
                    color: '#374151'
                  }}>
                    <div><strong>Debtor:</strong> {invoice.debtor_name || 'N/A'}</div>
                    <div><strong>Total:</strong> R {invoice.total ? invoice.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</div>
                  </div>
                  {(invoice.sender || invoice.receiver) && (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.5rem',
                      marginBottom: '1rem',
                      fontSize: isDesktop ? '0.9rem' : '0.8rem',
                      color: '#6b7280'
                    }}>
                      {invoice.sender && <div><strong>From:</strong> {invoice.sender}</div>}
                      {invoice.receiver && <div><strong>To:</strong> {invoice.receiver}</div>}
                    </div>
                  )}
                  
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
                        padding: isDesktop ? '0.75rem 1.5rem' : '0.5rem 1rem',
                        fontSize: isDesktop ? '0.9rem' : '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        minWidth: isDesktop ? '120px' : 'auto'
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
                        padding: isDesktop ? '0.75rem 1.5rem' : '0.5rem 1rem',
                        fontSize: isDesktop ? '0.9rem' : '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        minWidth: isDesktop ? '100px' : 'auto'
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
                      🗑️ Remove
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
          padding: isDesktop ? '1.5rem 3rem' : '1rem 2rem',
          borderTop: '1px solid #e5e7eb',
          textAlign: 'center',
          fontSize: isDesktop ? '1rem' : '0.8rem',
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