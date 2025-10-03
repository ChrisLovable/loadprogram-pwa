import React, { useState, useEffect, useRef } from 'react';

interface PINModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPINValid: (driverName: string) => void;
}

const PINModal: React.FC<PINModalProps> = ({ isOpen, onClose, onPINValid }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (pin.length === 4) {
      handlePINSubmit();
    }
  }, [pin]);

  const handlePINSubmit = async () => {
    if (pin.length !== 4) return;

    setIsValidating(true);
    setError('');

    try {
      // Import the PIN validation function
      const { validateDriverPIN } = await import('../utils/driverPins');
      const driverName = validateDriverPIN(pin);

      if (driverName) {
        onPINValid(driverName);
        setPin('');
        setError('');
      } else {
        setError('Invalid PIN. Please try again.');
        setPin('');
      }
    } catch (error) {
      setError('Error validating PIN. Please try again.');
      setPin('');
    } finally {
      setIsValidating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handlePINSubmit();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 4) {
      setPin(value);
      setError('');
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0, 0, 0, 0.8)',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }} onClick={onClose}>
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '2rem',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
        border: '1px solid #e5e7eb',
        position: 'relative',
        textAlign: 'center'
      }} onClick={e => e.stopPropagation()}>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            color: '#6b7280',
            cursor: 'pointer',
            padding: '5px',
            borderRadius: '50%',
            width: '30px',
            height: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ×
        </button>

        {/* Header */}
        <div style={{
          marginBottom: '1.5rem'
        }}>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#1f2937',
            marginBottom: '0.5rem'
          }}>
            🚛 Driver Access
          </div>
          <div style={{
            fontSize: '1rem',
            color: '#6b7280'
          }}>
            Enter your 4-digit PIN to access the driver section
          </div>
        </div>

        {/* PIN Input */}
        <div style={{
          marginBottom: '1rem'
        }}>
          <input
            ref={inputRef}
            type="text"
            value={pin}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            placeholder="Enter PIN"
            maxLength={4}
            style={{
              width: '100%',
              padding: '1rem',
              fontSize: '1.5rem',
              fontWeight: '600',
              textAlign: 'center',
              letterSpacing: '0.5rem',
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
              background: '#f9fafb',
              outline: 'none',
              transition: 'all 0.2s ease'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#7c3aed';
              e.currentTarget.style.background = '#ffffff';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.background = '#f9fafb';
            }}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            color: '#dc2626',
            fontSize: '0.9rem',
            marginBottom: '1rem',
            padding: '0.5rem',
            background: '#fef2f2',
            borderRadius: '8px',
            border: '1px solid #fecaca'
          }}>
            {error}
          </div>
        )}

        {/* Loading State */}
        {isValidating && (
          <div style={{
            color: '#7c3aed',
            fontSize: '0.9rem',
            marginBottom: '1rem'
          }}>
            Validating PIN...
          </div>
        )}

        {/* Instructions */}
        <div style={{
          fontSize: '0.8rem',
          color: '#9ca3af',
          marginTop: '1rem'
        }}>
          Press Enter to submit • Press Escape to cancel
        </div>
      </div>
    </div>
  );
};

export default PINModal;
