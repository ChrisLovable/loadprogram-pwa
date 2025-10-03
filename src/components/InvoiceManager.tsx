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
  const [isDesktop] = useState(window.innerWidth >= 1024);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);

  // Function to create a visual representation of PDF data
  const createPdfPreview = async (invoice: Invoice): Promise<string> => {
    try {
      // Create a canvas element
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set canvas dimensions to 90% of screen width
      const screenWidth = window.innerWidth;
      const targetWidth = Math.floor(screenWidth * 0.9);
      const targetHeight = Math.floor(targetWidth * 1.4); // A4 aspect ratio
      
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      
      if (!ctx) throw new Error('Could not get canvas context');
      
      // Create a PDF preview with invoice information
      const padding = 20;
      const contentWidth = targetWidth - (padding * 2);
      
      // Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetWidth, targetHeight);
      
      // Border
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, targetWidth - 2, targetHeight - 2);
      
      // Header
      ctx.fillStyle = '#7c3aed';
      ctx.fillRect(padding, padding, contentWidth, 60);
      
      // Header text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('INVOICE', targetWidth / 2, padding + 35);
      
      // Invoice details
      ctx.fillStyle = '#1f2937';
      ctx.font = '16px Arial';
      ctx.textAlign = 'left';
      
      let yPos = padding + 100;
      const lineHeight = 25;
      
      // Invoice number
      ctx.fillText(`Invoice #: ${invoice.invoice_number}`, padding, yPos);
      yPos += lineHeight;
      
      // Date
      ctx.fillText(`Date: ${new Date(invoice.pdf_invoice_generated_at).toLocaleDateString()}`, padding, yPos);
      yPos += lineHeight;
      
      // Truck registration
      if (invoice.truck_reg) {
        ctx.fillText(`Truck: ${invoice.truck_reg}`, padding, yPos);
        yPos += lineHeight;
      }
      
      // Debtor
      if (invoice.debtor_name) {
        ctx.fillText(`Debtor: ${invoice.debtor_name}`, padding, yPos);
        yPos += lineHeight;
      }
      
      // Sender/Receiver
      if (invoice.sender) {
        ctx.fillText(`From: ${invoice.sender}`, padding, yPos);
        yPos += lineHeight;
      }
      
      if (invoice.receiver) {
        ctx.fillText(`To: ${invoice.receiver}`, padding, yPos);
        yPos += lineHeight;
      }
      
      // Total
      if (invoice.total) {
        ctx.font = 'bold 18px Arial';
        ctx.fillText(`Total: R${invoice.total.toLocaleString()}`, padding, yPos + 20);
      }
      
      // PDF icon overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('📄', targetWidth / 2, targetHeight - 50);
      
      // Convert canvas to data URL
      return canvas.toDataURL('image/png', 0.8);
    } catch (error) {
      console.error('Error creating PDF preview:', error);
      throw error;
    }
  };

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

        if (data) {
          console.log('🔍 InvoiceManager - Raw data from database:', data);
          console.log('🔍 InvoiceManager - Number of loads with pdf_invoice:', data.length);
          
          const transformedInvoices: Invoice[] = data.map((load: any) => ({
            id: load.id,
            invoice_number: load.invoice_number || `INV-${load.id}`,
            pdf_invoice_generated_at: load.pdf_invoice_generated_at || load.created_at,
            truck_reg: load.truck_reg,
            sender: load.sender,
            receiver: load.receiver,
            total: load.parsed_data?.total || 0,
            status: load.status,
            debtor_name: load.debtor_name,
            pdf_invoice: load.pdf_invoice,
            pdf_invoice_filename: load.pdf_invoice_filename,
            loadData: load
          }));

          console.log('🔍 InvoiceManager - Transformed invoices:', transformedInvoices);
          setInvoices(transformedInvoices);
          setFilteredInvoices(transformedInvoices);

          // Convert PDFs to images
          const imagePromises = transformedInvoices.map(async (invoice) => {
            if (invoice.pdf_invoice) {
              try {
                const imageData = await createPdfPreview(invoice);
                return { invoiceId: invoice.id, imageData };
              } catch (error) {
                console.error(`Failed to create PDF preview for invoice ${invoice.id}:`, error);
                return null;
              }
            }
            return null;
          });

          const imageResults = await Promise.all(imagePromises);
          const imagesMap: {[key: number]: string} = {};
          
          imageResults.forEach(result => {
            if (result) {
              imagesMap[result.invoiceId] = result.imageData;
            }
          });

          // PDF images are no longer used in the compact design
        }
      } catch (error) {
        console.error('Error loading invoices:', error);
      }
    };

    loadInvoices();
  }, []);

  // Filter invoices based on search term
  useEffect(() => {
    console.log('🔍 InvoiceManager - Search term changed:', searchTerm);
    console.log('🔍 InvoiceManager - Total invoices available:', invoices.length);
    
    if (!searchTerm.trim()) {
      console.log('🔍 InvoiceManager - No search term, showing all invoices');
      setFilteredInvoices(invoices);
      return;
    }

    const filtered = invoices.filter(invoice => {
      const matches = 
        invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (invoice.debtor_name && invoice.debtor_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (invoice.truck_reg && invoice.truck_reg.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (invoice.sender && invoice.sender.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (invoice.receiver && invoice.receiver.toLowerCase().includes(searchTerm.toLowerCase()));
      
      console.log(`🔍 InvoiceManager - Invoice ${invoice.id} matches "${searchTerm}":`, matches);
      return matches;
    });
    
    console.log('🔍 InvoiceManager - Filtered results:', filtered.length, 'of', invoices.length);
    setFilteredInvoices(filtered);
  }, [searchTerm, invoices]);

  const handleGenerateInvoice = async (invoice: Invoice) => {
    try {
      if (invoice.pdf_invoice) {
        // Download existing PDF
        const link = document.createElement('a');
        link.href = `data:application/pdf;base64,${invoice.pdf_invoice}`;
        link.download = invoice.pdf_invoice_filename || `invoice-${invoice.invoice_number}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Generate new PDF
        const { pdfData, filename } = await generatePDFInvoice(invoice.loadData);
        const link = document.createElement('a');
        link.href = pdfData;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error generating/downloading invoice:', error);
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
        console.error('Error removing invoice:', error);
        return;
      }

      // Remove from local state
      setInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
      setFilteredInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
    } catch (error) {
      console.error('Error removing invoice:', error);
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
        

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            background: 'rgba(255,255,255,0.9)',
            border: '1px solid #e5e7eb',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
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
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                fontSize: '1rem',
                outline: 'none',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                transition: 'all 0.2s ease'
              }}
              onFocus={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
              }}
            />
          </div>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: isDesktop ? '2rem 3rem' : '1rem',
          background: '#f8fafc'
        }}>
          {filteredInvoices.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem 1rem',
              color: '#6b7280'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                No invoices found
              </div>
              <div style={{ fontSize: '1rem' }}>
                {searchTerm ? 'Try adjusting your search terms' : 'No invoices have been generated yet'}
              </div>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '2rem',
              maxWidth: '100%'
            }}>
              {filteredInvoices.map((invoice, index) => (
                <div key={invoice.id} style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                  borderRadius: '16px',
                  padding: '0',
                  border: '1px solid rgba(0,0,0,0.08)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  overflow: 'hidden',
                  position: 'relative'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.18)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)';
                }}>
                  {/* Card Header with Gradient */}
                  <div style={{
                    background: `linear-gradient(135deg, ${index % 2 === 0 ? '#7c3aed' : '#3b82f6'} 0%, ${index % 2 === 0 ? '#5b21b6' : '#1d4ed8'} 100%)`,
                    padding: '1.5rem',
                    color: 'white',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    {/* Decorative Pattern */}
                    <div style={{
                      position: 'absolute',
                      top: '-50%',
                      right: '-20%',
                      width: '200px',
                      height: '200px',
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: '50%',
                      opacity: 0.3
                    }} />
                    <div style={{
                      position: 'absolute',
                      bottom: '-30%',
                      left: '-10%',
                      width: '150px',
                      height: '150px',
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: '50%',
                      opacity: 0.4
                    }} />
                    
                    {/* Header Content */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      position: 'relative',
                      zIndex: 2
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '1.5rem',
                          fontWeight: 800,
                          marginBottom: '0.5rem',
                          textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                        }}>
                          #{invoice.invoice_number}
                        </div>
                        <div style={{
                          fontSize: '1rem',
                          opacity: 0.9,
                          marginBottom: '0.25rem'
                        }}>
                          📅 {new Date(invoice.pdf_invoice_generated_at).toLocaleDateString()}
                        </div>
                        <div style={{
                          fontSize: '0.9rem',
                          opacity: 0.8,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <span>🚛 {invoice.truck_reg || 'N/A'}</span>
                          {invoice.debtor_name && <span>• 👤 {invoice.debtor_name}</span>}
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div style={{
                        display: 'flex',
                        gap: '0.75rem',
                        alignItems: 'center'
                      }}>
                        <button
                          onClick={() => handleGenerateInvoice(invoice)}
                          style={{
                            background: 'rgba(255,255,255,0.2)',
                            color: 'white',
                            border: '1px solid rgba(255,255,255,0.3)',
                            borderRadius: '8px',
                            padding: '0.5rem 1rem',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                        >
                          📥 Download
                        </button>
                        <button
                          onClick={() => handleDeleteInvoice(invoice.id)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.2)',
                            color: 'white',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '8px',
                            padding: '0.5rem 1rem',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                        >
                          🗑️ Remove
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Card Body - Compact Design */}
                  <div style={{ padding: '1rem' }}>
                    {/* Compact Invoice Details */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: isDesktop ? 'repeat(3, 1fr)' : '1fr',
                      gap: '0.75rem',
                      marginBottom: '0.75rem'
                    }}>
                      {/* Invoice Info Card */}
                      <div style={{
                        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                        borderRadius: '8px',
                        padding: '0.75rem',
                        border: '1px solid #bae6fd',
                        textAlign: 'center'
                      }}>
                        <div style={{
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          color: '#0369a1',
                          marginBottom: '0.25rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          📄 Invoice
                        </div>
                        <div style={{
                          fontSize: '0.9rem',
                          fontWeight: 700,
                          color: '#0c4a6e'
                        }}>
                          #{invoice.invoice_number}
                        </div>
                        <div style={{
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          color: '#0369a1',
                          marginTop: '0.25rem'
                        }}>
                          {new Date(invoice.pdf_invoice_generated_at).toLocaleDateString()}
                        </div>
                      </div>

                      {/* Truck Info Card */}
                      <div style={{
                        background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                        borderRadius: '8px',
                        padding: '0.75rem',
                        border: '1px solid #bbf7d0',
                        textAlign: 'center'
                      }}>
                        <div style={{
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          color: '#166534',
                          marginBottom: '0.25rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          🚛 Truck
                        </div>
                        <div style={{
                          fontSize: '0.9rem',
                          fontWeight: 700,
                          color: '#14532d'
                        }}>
                          {invoice.truck_reg || 'N/A'}
                        </div>
                        <div style={{
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          color: '#166534',
                          marginTop: '0.25rem'
                        }}>
                          {invoice.debtor_name || 'N/A'}
                        </div>
                      </div>

                      {/* Total Card */}
                      <div style={{
                        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                        borderRadius: '8px',
                        padding: '0.75rem',
                        border: '1px solid #f59e0b',
                        textAlign: 'center'
                      }}>
                        <div style={{
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          color: '#92400e',
                          marginBottom: '0.25rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          💰 Total
                        </div>
                        <div style={{
                          fontSize: '1.1rem',
                          fontWeight: 800,
                          color: '#78350f'
                        }}>
                          {invoice.total ? `R${invoice.total.toLocaleString()}` : 'N/A'}
                        </div>
                      </div>
                    </div>

                    {/* Route Info */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: isDesktop ? 'repeat(2, 1fr)' : '1fr',
                      gap: '0.75rem'
                    }}>
                      {/* From Card */}
                      <div style={{
                        background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                        borderRadius: '8px',
                        padding: '0.75rem',
                        border: '1px solid #fecaca',
                        textAlign: 'center'
                      }}>
                        <div style={{
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          color: '#dc2626',
                          marginBottom: '0.25rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          📤 From
                        </div>
                        <div style={{
                          fontSize: '0.9rem',
                          fontWeight: 700,
                          color: '#991b1b',
                          wordBreak: 'break-word'
                        }}>
                          {invoice.sender || 'N/A'}
                        </div>
                      </div>

                      {/* To Card */}
                      <div style={{
                        background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                        borderRadius: '8px',
                        padding: '0.75rem',
                        border: '1px solid #bbf7d0',
                        textAlign: 'center'
                      }}>
                        <div style={{
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          color: '#166534',
                          marginBottom: '0.25rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          📥 To
                        </div>
                        <div style={{
                          fontSize: '0.9rem',
                          fontWeight: 700,
                          color: '#14532d',
                          wordBreak: 'break-word'
                        }}>
                          {invoice.receiver || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Enlarged Image Modal */}
      {enlargedImage && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.95)',
          zIndex: 7000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }} onClick={() => setEnlargedImage(null)}>
          <div style={{
            position: 'relative',
            maxWidth: '95vw',
            maxHeight: '95vh',
            background: '#fff',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
          }} onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setEnlargedImage(null)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'rgba(239, 68, 68, 0.9)',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                color: 'white',
                cursor: 'pointer',
                zIndex: 10
              }}
            >
              ×
            </button>
            <img
              src={enlargedImage}
              alt="Enlarged Invoice"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                borderRadius: '8px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceManager;