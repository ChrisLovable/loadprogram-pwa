import React, { useState } from 'react'

interface RoleSelectorProps {
  currentRole: string | null
  onRoleChange: (role: string) => void
  loads: any[]
  onDashboardClick: () => void
  onSummariesClick: () => void
}

// const ROLE_PINS = {
//   'driver': '1111',
//   'first_approver': '2222',
//   'second_approver': '3333',
//   'invoicer': '4444',
//   'final_approver': '5555'
// }

const ROLE_NAMES = {
  'driver': 'Driver',
  'first_approver': '1st Approver',
  'second_approver': '2nd Approver',
  'invoicer': 'Invoicing',
  'final_approver': 'Final Approver'
}

const ROLE_ICONS = {
  'driver': '🚛',
  'first_approver': '✅',
  'second_approver': '🔍',
  'invoicer': '💰',
  'final_approver': '📋'
}

const ROLE_COLORS: { [key: string]: string } = {
  'driver': '#ff0000',
  'first_approver': '#2563eb',
  'second_approver': '#8b5cf6',
  'invoicer': '#6b7280',
  'final_approver': '#059669'
}

const USERS = {
  driver: [
    { pin: '1111', name: 'Alice Driver' },
    { pin: '1112', name: 'Bob Driver' },
    // Add more drivers as needed
  ],
  first_approver: [
    { pin: '2222', name: 'Carol 1st Approver' },
    { pin: '2223', name: 'Dave 1st Approver' },
    // Add more 1st approvers as needed
  ],
  second_approver: [
    { pin: '3333', name: 'Eve 2nd Approver' },
    // Add more 2nd approvers as needed
  ],
  invoicer: [
    { pin: '4444', name: 'Frank Invoicer' },
    // Add more invoicers as needed
  ],
  final_approver: [
    { pin: '5555', name: 'Grace Final Approver' },
    // Add more final approvers as needed
  ],
};

const RoleSelector: React.FC<RoleSelectorProps> = ({ currentRole, onRoleChange, loads, onDashboardClick, onSummariesClick }) => {
  const [showPinEntry, setShowPinEntry] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')

  // Calculate queue counts for each role
  const queueCounts: { [key: string]: number } = {
    driver: loads.filter(l => l.status === 'draft' || l.status === 'rejected').length,
    first_approver: loads.filter(l => l.status === 'uploaded').length,
    second_approver: loads.filter(l => l.status === 'first_approved').length,
    invoicer: loads.filter(l => l.status === 'second_approved').length,
    final_approver: loads.filter(l => l.status === 'third_approved').length,
  }

  const handleRoleClick = (role: string) => {
    console.log('🔴 LATEST VERSION - Role clicked:', role);
    if (role === currentRole) return // Already selected
    setSelectedRole(role)
    setPin('')
    setPinError('')
    setShowPinEntry(true)
  }

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Find user for selectedRole and pin
    const user = USERS[selectedRole as keyof typeof USERS]?.find(u => u.pin === pin);
    if (user) {
      onRoleChange(selectedRole)
      setShowPinEntry(false)
      setPin('')
      setPinError('')
      // Store current user info in localStorage
      localStorage.setItem('currentUser', JSON.stringify({ role: selectedRole, name: user.name }))
      
      // Scroll to show the first approval card after a short delay
      setTimeout(() => {
        const phoneScreen = document.querySelector('.phone-screen');
        if (phoneScreen) {
          phoneScreen.scrollTo({
            top: 200, // Scroll down to show cards below buttons
            behavior: 'smooth'
          });
        }
      }, 300); // Small delay to ensure cards are rendered
    } else {
      setPinError('Incorrect PIN. Please try again.')
      setPin('')
    }
  }

  // const handleLogout = () => {
  //   onRoleChange('')
  //   setShowPinEntry(false)
  //   setPin('')
  //   setPinError('')
  // }

  return (
    <div style={{
      background: '#111',
      borderRadius: '12px',
      padding: '1rem',
      marginBottom: '1rem',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      border: '1px solid #222'
    }}>
      {/* Remove Current Role display */}

      {/* Role Selection Grid */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem', // Increased spacing between role buttons
        marginBottom: '1rem'
      }}>
        {Object.entries(ROLE_NAMES).map(([role, name]) => {
          let roleBackground = 'white';
          if (role === 'driver') roleBackground = 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)';
          if (role === 'first_approver') roleBackground = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
          if (role === 'second_approver') roleBackground = 'linear-gradient(135deg, #a78bfa 0%, #6366f1 100%)';
          if (role === 'invoicer') roleBackground = 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)';
          if (role === 'final_approver') roleBackground = 'linear-gradient(135deg, #bbf7d0 0%, #22c55e 100%)';
          return (
            <button
              key={role}
              type="button"
              onClick={() => handleRoleClick(role)}
              disabled={role === currentRole}
              style={{
                background: roleBackground,
                color: '#222',
                border: '1.5px solid #111',
                borderRadius: '32px',
                padding: '0.8rem 1.2rem',
                fontWeight: 900,
                fontSize: '1.45rem',
                fontFamily: 'inherit',
                cursor: role === currentRole ? 'not-allowed' : 'pointer',
                opacity: role === currentRole ? 1 : 0.8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                minHeight: 0,
                height: 'auto',
                boxShadow: '0 12px 48px 0 rgba(37,99,235,0.32), 0 4px 16px 0 rgba(255,255,255,0.22) inset, 0 2.5px 0 0 #fff, 0 1.5px 0 0 #fff inset',
                backdropFilter: 'blur(18px)',
                WebkitBackdropFilter: 'blur(18px)',
                backgroundBlendMode: 'overlay',
                position: 'relative',
                overflow: 'hidden',
                transition: 'box-shadow 0.2s, transform 0.1s',
                transform: 'translateY(0)',
                outline: 'none',
              }}
              onMouseDown={e => e.currentTarget.style.transform = 'translateY(2px)'}
              onMouseUp={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <span style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'linear-gradient(120deg, rgba(255,255,255,0.48) 0%, rgba(255,255,255,0.18) 100%)',
                borderRadius: '32px',
                pointerEvents: 'none',
                zIndex: 1
              }} />
              <span style={{
                position: 'absolute',
                top: '10px',
                left: '24px',
                width: '65%',
                height: '22px',
                background: 'linear-gradient(90deg, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.18) 100%)',
                borderRadius: '16px',
                filter: 'blur(2.5px)',
                opacity: 0.8,
                pointerEvents: 'none',
                zIndex: 2
              }} />
              <span style={{
                position: 'absolute',
                bottom: '10px',
                right: '24px',
                width: '45%',
                height: '14px',
                background: 'linear-gradient(90deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.01) 100%)',
                borderRadius: '12px',
                filter: 'blur(2.5px)',
                opacity: 0.6,
                pointerEvents: 'none',
                zIndex: 2
              }} />
              <span style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'linear-gradient(120deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 100%)',
                borderRadius: '32px',
                pointerEvents: 'none',
                zIndex: 3,
                animation: 'shine 2.5s linear infinite',
                backgroundSize: '200% 100%',
                backgroundPosition: '200% 0',
              }} />
              <span style={{flex:1,textAlign:'left',fontWeight:900,fontSize:'1.45rem',color:'#222',letterSpacing:'0.5px',fontFamily:'inherit',position:'relative',zIndex:4}}>{ROLE_ICONS[role as keyof typeof ROLE_ICONS]} {name}</span>
              <span style={{
                marginLeft: '0.5rem',
                background: '#f43f5e',
                color: 'white',
                borderRadius: '50%',
                minWidth: 22,
                height: 22,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.95rem',
                fontWeight: 700,
                boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
                zIndex: 4,
                padding: '0 6px',
              }}>{queueCounts[role]}</span>
            </button>
          )
        })}
        <button
          type="button"
          onClick={onSummariesClick}
          style={{
            marginTop: '20px', // Move Summaries button down by 20px
            background: 'linear-gradient(135deg, #4f8cff 0%, #2563eb 100%)',
            color: '#222',
            border: '2.5px solid #60a5fa',
            borderRadius: '16px',
            padding: '0.8rem 1.2rem',
            fontWeight: 900,
            fontSize: '1.45rem',
            fontFamily: 'inherit',
            cursor: 'pointer',
            boxShadow: '0 8px 32px 0 rgba(37,99,235,0.25), 0 2px 8px 0 rgba(255,255,255,0.18) inset, 0 1.5px 0 0 #fff, 0 0.5px 0 0 #fff inset',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            backgroundBlendMode: 'overlay',
            position: 'relative',
            overflow: 'hidden',
            transition: 'box-shadow 0.2s, transform 0.1s',
            transform: 'translateY(0)',
            outline: 'none',
          }}
          onMouseDown={e => e.currentTarget.style.transform = 'translateY(2px)'}
          onMouseUp={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <span style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(120deg, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0.12) 100%)',
            borderRadius: '16px',
            pointerEvents: 'none',
            zIndex: 1
          }} />
          <span style={{
            position: 'absolute',
            top: '8px',
            left: '18px',
            width: '60%',
            height: '18px',
            background: 'linear-gradient(90deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.08) 100%)',
            borderRadius: '12px',
            filter: 'blur(1.5px)',
            opacity: 0.7,
            pointerEvents: 'none',
            zIndex: 2
          }} />
          <span style={{
            position: 'absolute',
            bottom: '8px',
            right: '18px',
            width: '40%',
            height: '10px',
            background: 'linear-gradient(90deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.01) 100%)',
            borderRadius: '8px',
            filter: 'blur(1.5px)',
            opacity: 0.5,
            pointerEvents: 'none',
            zIndex: 2
          }} />
          <span style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(120deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)',
            borderRadius: '16px',
            pointerEvents: 'none',
            zIndex: 3,
            animation: 'shine 2.5s linear infinite',
            backgroundSize: '200% 100%',
            backgroundPosition: '200% 0',
          }} />
          <span style={{position:'relative',zIndex:4}}>📈 Summaries</span>
        </button>
        <button
          type="button"
          onClick={onDashboardClick}
          style={{
            marginTop: '-5px', // Move Search button up by 5px
            background: 'linear-gradient(135deg, #4f8cff 0%, #2563eb 100%)',
            color: '#222',
            border: '1.5px solid #111',
            borderRadius: '16px',
            padding: '0.8rem 1.2rem',
            fontWeight: 900,
            fontSize: '1.45rem',
            fontFamily: 'inherit',
            cursor: 'pointer',
            boxShadow: '0 8px 32px 0 rgba(37,99,235,0.25), 0 2px 8px 0 rgba(255,255,255,0.18) inset, 0 1.5px 0 0 #fff, 0 0.5px 0 0 #fff inset',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            backgroundBlendMode: 'overlay',
            position: 'relative',
            overflow: 'hidden',
            transition: 'box-shadow 0.2s, transform 0.1s',
            transform: 'translateY(0)',
            outline: 'none',
          }}
          onMouseDown={e => e.currentTarget.style.transform = 'translateY(2px)'}
          onMouseUp={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <span style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(120deg, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0.12) 100%)',
            borderRadius: '16px',
            pointerEvents: 'none',
            zIndex: 1
          }} />
          <span style={{
            position: 'absolute',
            top: '8px',
            left: '18px',
            width: '60%',
            height: '18px',
            background: 'linear-gradient(90deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.08) 100%)',
            borderRadius: '12px',
            filter: 'blur(1.5px)',
            opacity: 0.7,
            pointerEvents: 'none',
            zIndex: 2
          }} />
          <span style={{
            position: 'absolute',
            bottom: '8px',
            right: '18px',
            width: '40%',
            height: '10px',
            background: 'linear-gradient(90deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.01) 100%)',
            borderRadius: '8px',
            filter: 'blur(1.5px)',
            opacity: 0.5,
            pointerEvents: 'none',
            zIndex: 2
          }} />
          <span style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(120deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)',
            borderRadius: '16px',
            pointerEvents: 'none',
            zIndex: 3,
            animation: 'shine 2.5s linear infinite',
            backgroundSize: '200% 100%',
            backgroundPosition: '200% 0',
          }} />
          <span style={{position:'relative',zIndex:4}}>🔍 Search</span>
        </button>
      </div>

      {/* Logout Button */}
      {/* Removed Logout button and its containing logic */}

      {/* PIN Entry Modal */}
      {showPinEntry && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(30,41,59,0.45)',
          backdropFilter: 'blur(8px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.85)',
            borderRadius: '16px',
            border: '1.5px solid #e0e7ef',
            boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
            padding: '1.2rem 1rem 1rem 1rem',
            width: '200px',
            maxWidth: '95vw',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
          }}>
            <form onSubmit={handlePinSubmit} style={{width:'100%'}}>
              <div style={{
                textAlign: 'center',
                marginBottom: '1rem',
              }}>
                <div style={{
                  fontSize: '1rem',
                  fontWeight: 800,
                  color: '#fff',
                  background: `linear-gradient(90deg, ${ROLE_COLORS[selectedRole as keyof typeof ROLE_COLORS]} 0%, #047857 100%)`,
                  borderRadius: '8px',
                  padding: '0.5rem 0',
                  marginBottom: '0.3rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                  letterSpacing: '0.3px',
                  textShadow: '0 1px 2px rgba(0,0,0,0.10)'
                }}>
                  {ROLE_NAMES[selectedRole as keyof typeof ROLE_NAMES]}
                </div>
                <div style={{
                  fontSize: '0.9rem',
                  color: '#334155',
                  fontWeight: 600,
                  letterSpacing: '0.1px',
                  marginTop: '0.1rem',
                }}>
                  Enter your PIN to access this role
                </div>
              </div>
              <input
                type="password"
                value={pin}
                onChange={e => setPin(e.target.value)}
                placeholder=""
                maxLength={4}
                style={{
                  width: '60px',
                  padding: '0.8rem',
                  fontSize: '1.4rem',
                  textAlign: 'center',
                  border: `2px solid ${ROLE_COLORS[selectedRole as keyof typeof ROLE_COLORS]}`,
                  borderRadius: '8px',
                  marginBottom: '0.8rem',
                  letterSpacing: '0.4rem',
                  background: 'rgba(255,255,255,0.7)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                  color: '#222',
                  fontWeight: 700,
                  outline: 'none',
                  display: 'block',
                  marginLeft: 'auto',
                  marginRight: 'auto',
                }}
                autoFocus
              />
              {pinError && (
                <div style={{
                  color: '#dc2626',
                  fontSize: '1.05rem',
                  textAlign: 'center',
                  marginBottom: '1rem',
                  fontWeight: 700
                }}>
                  {pinError}
                </div>
              )}
              <div style={{display: 'flex', gap: '0.7rem', marginTop: '0.2rem'}}>
                <button
                  type="button"
                  onClick={() => { setShowPinEntry(false); setPin(''); setPinError(''); }}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #cbd5e1 0%, #64748b 100%)',
                    color: '#222',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '0.9rem 0',
                    fontWeight: 700,
                    fontSize: '1.08rem',
                    boxShadow: '0 2px 8px rgba(100,116,139,0.13)',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pin.length !== 4}
                  style={{
                    flex: 1,
                    background: pin.length === 4 ? `linear-gradient(135deg, ${ROLE_COLORS[selectedRole as keyof typeof ROLE_COLORS]} 0%, #047857 100%)` : '#d1d5db',
                    color: pin.length === 4 ? '#fff' : '#888',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '0.9rem 0',
                    fontWeight: 700,
                    fontSize: '1.08rem',
                    boxShadow: pin.length === 4 ? '0 2px 8px rgba(16,185,129,0.13)' : 'none',
                    cursor: pin.length === 4 ? 'pointer' : 'not-allowed',
                    transition: 'background 0.2s',
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
