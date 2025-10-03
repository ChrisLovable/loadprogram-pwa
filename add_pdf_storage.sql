-- Add PDF storage column to loads table
-- This will store the generated PDF invoice as a base64 string

ALTER TABLE loads 
ADD COLUMN pdf_invoice BYTEA,
ADD COLUMN pdf_invoice_filename VARCHAR(255),
ADD COLUMN pdf_invoice_generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN invoice_number VARCHAR(50),
ADD COLUMN debtor_name VARCHAR(255);

-- Add index for faster searching
CREATE INDEX idx_loads_invoice_number ON loads(invoice_number);
CREATE INDEX idx_loads_debtor_name ON loads(debtor_name);
CREATE INDEX idx_loads_pdf_generated_at ON loads(pdf_invoice_generated_at);

-- Add comments for documentation
COMMENT ON COLUMN loads.pdf_invoice IS 'Generated PDF invoice stored as binary data';
COMMENT ON COLUMN loads.pdf_invoice_filename IS 'Original filename of the generated PDF';
COMMENT ON COLUMN loads.pdf_invoice_generated_at IS 'Timestamp when PDF was generated';
COMMENT ON COLUMN loads.invoice_number IS 'Invoice number for searching';
COMMENT ON COLUMN loads.debtor_name IS 'Debtor/client name for searching';


