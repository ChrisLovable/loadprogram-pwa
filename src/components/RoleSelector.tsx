import React, { useState } from 'react'

interface RoleSelectorProps {
  currentRole: string | null
  onRoleChange: (role: string) => void
}

const ROLE_PINS = {
  'driver': '1111',
  'first_approver': '2222',
  'second_approver': '3333',
  'invoicer': '4444',
  'final_approver': '5555'
}

const ROLE_NAMES = {
  'driver': '📸 Driver',
  'first_approver': '✅ First Approver',
  'second_approver': '📝 Second Approver',
  'invoicer': '🧾 Invoicer',
  'final_approver': '🏁 Final Approver'
}

const ROLE_COLORS: { [key: string]: string } = {
  'driver': '#6b7280',
  'first_approver': '#2563eb',
  'second_approver': '#0284c7',
  'invoicer': '#dc2626',
  'final_approver': '#059669'
}

const RoleSelector: React.FC<RoleSelectorProps> = ({ currentRole, onRoleChange }) => {
  const [showPinEntry, setShowPinEntry] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')

  const handleRoleClick = (role: string) => {
    if (role === currentRole) return // Already selected
    setSelectedRole(role)
    setPin('')
    setPinError('')
    setShowPinEntry(true)
  }

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (pin === ROLE_PINS[selectedRole as keyof typeof ROLE_PINS]) {
      onRoleChange(selectedRole)
      setShowPinEntry(false)
      setPin('')
      setPinError('')
    } else {
      setPinError('Incorrect PIN. Please try again.')
      setPin('')
    }
  }

  const handleLogout = () => {
    onRoleChange('')
    setShowPinEntry(false)
    setPin('')
    setPinError('')
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '1rem',
      marginBottom: '1rem',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      border: '1px solid #e5e7eb'
    }}>
      <div style={{
        fontWeight: 700,
        fontSize: '1.05rem',
        color: '#374151',
        marginBottom: '1rem',
        textAlign: 'center'
      }}>
        🔐 Role Selection
      </div>

      {/* Current Role Display */}
      {currentRole && (
        <div style={{
          background: ROLE_COLORS[currentRole as keyof typeof ROLE_COLORS],
          color: 'white',
          padding: '0.8rem',
          borderRadius: '8px',
          textAlign: 'center',
          fontWeight: 700,
          marginBottom: '1rem',
          fontSize: '1rem'
        }}>
          Current Role: {ROLE_NAMES[currentRole as keyof typeof ROLE_NAMES]}
        </div>
      )}

      {/* Role Selection Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '0.5rem',
        marginBottom: '1rem'
      }}>
        {Object.entries(ROLE_NAMES).map(([role, name]) => (
          <button
            key={role}
            type="button"
            onClick={() => handleRoleClick(role)}
            disabled={role === currentRole}
            style={{
              background: role === currentRole ? ROLE_COLORS[role] : 'white',
              color: role === currentRole ? 'white' : ROLE_COLORS[role],
              border: `2px solid ${ROLE_COLORS[role]}`,
              borderRadius: '8px',
              padding: '0.6rem',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: role === currentRole ? 'not-allowed' : 'pointer',
              opacity: role === currentRole ? 1 : 0.8,
              transition: 'all 0.2s'
            }}
          >
            {name}
          </button>
        ))}
      </div>

      {/* Logout Button */}
      {currentRole && (
        <button
          type="button"
          onClick={handleLogout}
          style={{
            background: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '0.5rem 1rem',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            width: '100%'
          }}
        >
          🚪 Logout
        </button>
      )}

      {/* PIN Entry Modal */}
      {showPinEntry && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            width: '300px',
            maxWidth: '90vw',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
          }}>
            <form onSubmit={handlePinSubmit}>
              <div style={{
                textAlign: 'center',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  color: ROLE_COLORS[selectedRole as keyof typeof ROLE_COLORS],
                  marginBottom: '0.5rem'
                }}>
                  {ROLE_NAMES[selectedRole as keyof typeof ROLE_NAMES]}
                </div>
                <div style={{
                  fontSize: '0.9rem',
                  color: '#6b7280'
                }}>
                  Enter your PIN to access this role
                </div>
              </div>

              <input
                type="password"
                value={pin}
                onChange={e => setPin(e.target.value)}
                placeholder="Enter 4-digit PIN"
                maxLength={4}
                style={{
                  width: '100%',
                  padding: '1rem',
                  fontSize: '1.5rem',
                  textAlign: 'center',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  letterSpacing: '0.5rem'
                }}
                autoFocus
              />

              {pinError && (
                <div style={{
                  color: '#dc2626',
                  fontSize: '0.9rem',
                  textAlign: 'center',
                  marginBottom: '1rem',
                  fontWeight: 600
                }}>
                  {pinError}
                </div>
              )}

              <div style={{display: 'flex', gap: '0.5rem'}}>
                <button
                  type="button"
                  onClick={() => setShowPinEntry(false)}
                  style={{
                    flex: 1,
                    background: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pin.length !== 4}
                  style={{
                    flex: 1,
                    background: pin.length === 4 ? ROLE_COLORS[selectedRole as keyof typeof ROLE_COLORS] : '#d1d5db',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.8rem',
                    fontWeight: 600,
                    cursor: pin.length === 4 ? 'pointer' : 'not-allowed'
                  }}
                >
                  Access Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default RoleSelector
