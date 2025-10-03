import React, { useState, useEffect, useRef } from 'react';

interface AdminPINModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPINValid: (userName: string, userRole: string) => void;
  targetRole?: string | null;
}

const AdminPINModal: React.FC<AdminPINModalProps> = ({ isOpen, onClose, onPINValid, targetRole }) => {
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
      // Import the admin PIN validation function
      const { validateAdminPIN } = await import('../utils/adminUsers');
      const userData = validateAdminPIN(pin);

      if (userData) {
        onPINValid(userData.name, userData.role);
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
      background: 'rgba(0, 0, 0, 0.9)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }} onClick={onClose}>
      <div style={{
        background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
        borderRadius: '24px',
        padding: '3rem 2rem',
        width: '90vw',
        maxWidth: '800px',
        boxShadow: '0 32px 64px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1)',
        border: '1px solid rgba(255,255,255,0.2)',
        position: 'relative',
        textAlign: 'center',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)'
      }} onClick={e => e.stopPropagation()}>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(107, 114, 128, 0.1)',
            border: 'none',
            fontSize: '20px',
            color: '#6b7280',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
            e.currentTarget.style.color = '#ef4444';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(107, 114, 128, 0.1)';
            e.currentTarget.style.color = '#6b7280';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          ×
        </button>

        {/* Header */}
        <div style={{
          marginBottom: '2rem'
        }}>
          <div style={{
            fontSize: '2rem',
            fontWeight: 800,
            color: '#1f2937',
            marginBottom: '0.5rem',
            textShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            👨‍💼 Admin Access
          </div>
          <div style={{
            fontSize: '1.1rem',
            color: '#6b7280',
            fontWeight: 500
          }}>
            Enter your 4-digit PIN to access {targetRole ? targetRole.replace('_', ' ') : 'this role'}
          </div>
        </div>

        {/* PIN Input */}
        <div style={{
          marginBottom: '1.5rem'
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
              padding: '1.5rem',
              fontSize: '2rem',
              fontWeight: '700',
              textAlign: 'center',
              letterSpacing: '1rem',
              border: '3px solid #e5e7eb',
              borderRadius: '16px',
              background: 'linear-gradient(145deg, #ffffff 0%, #f9fafb 100%)',
              outline: 'none',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.1)'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#7c3aed';
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.1), 0 8px 24px rgba(124, 58, 237, 0.2)';
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.background = 'linear-gradient(145deg, #ffffff 0%, #f9fafb 100%)';
              e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.1)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            color: '#dc2626',
            fontSize: '1rem',
            marginBottom: '1.5rem',
            padding: '1rem',
            background: 'linear-gradient(145deg, #fef2f2 0%, #fee2e2 100%)',
            borderRadius: '12px',
            border: '2px solid #fecaca',
            fontWeight: 600,
            boxShadow: '0 4px 12px rgba(220, 38, 38, 0.1)'
          }}>
            {error}
          </div>
        )}

        {/* Loading State */}
        {isValidating && (
          <div style={{
            color: '#7c3aed',
            fontSize: '1rem',
            marginBottom: '1.5rem',
            padding: '1rem',
            background: 'linear-gradient(145deg, #f3f4f6 0%, #e5e7eb 100%)',
            borderRadius: '12px',
            fontWeight: 600,
            boxShadow: '0 4px 12px rgba(124, 58, 237, 0.1)'
          }}>
            Validating PIN...
          </div>
        )}

        {/* Instructions */}
        <div style={{
          fontSize: '0.9rem',
          color: '#9ca3af',
          marginTop: '1.5rem',
          padding: '1rem',
          background: 'rgba(107, 114, 128, 0.05)',
          borderRadius: '12px',
          fontWeight: 500
        }}>
          Press Enter to submit • Press Escape to cancel
        </div>

        {/* Admin Users List */}
        <div style={{
          marginTop: '1.5rem',
          padding: '1.5rem',
          background: 'linear-gradient(145deg, #f8fafc 0%, #e2e8f0 100%)',
          borderRadius: '16px',
          fontSize: '0.9rem',
          color: '#475569',
          fontWeight: 500,
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontWeight: 700, marginBottom: '0.75rem', color: '#334155' }}>Admin Users:</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
            <div>Sebastiaan Steyn - 1111</div>
            <div>Adelaide - 2222</div>
            <div>Chris de Vries - 3333</div>
            <div>Andries Steyn - 4444</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPINModal;
