import React from 'react'

interface RoleSelectorProps {
  currentRole: string | null
  onRoleChange: (role: string) => void
  loads: any[]
  onDashboardClick: () => void
  onSummariesClick: () => void
  onSummaryClick: () => void
  onInvoicesClick: () => void
  currentUser: {name: string, type: 'driver' | 'admin', role: string} | null
  onLogout: () => void
}

const RoleSelector: React.FC<RoleSelectorProps> = ({ currentRole, onRoleChange, loads, onDashboardClick, onSummariesClick, onSummaryClick, onInvoicesClick, currentUser, onLogout }) => {

  // Calculate queue counts for each role
  const queueCounts: { [key: string]: number } = {
    driver: loads.filter(l => l.status === 'draft' || l.status === 'rejected').length,
    first_approver: loads.filter(l => l.status === 'uploaded').length,
    second_approver: loads.filter(l => l.status === 'first_approved').length,
    invoicer: loads.filter(l => l.status === 'second_approved').length,
    final_approver: loads.filter(l => l.status === 'third_approved').length,
  };

  // Debug: Log queue counts and load statuses
  console.log('🔍 RoleSelector - Queue counts:', queueCounts);
  console.log('🔍 RoleSelector - All loads:', loads.map(l => ({ id: l.id, status: l.status, driver_name: l.driver_name })));
  console.log('🔍 RoleSelector - Loads with status "uploaded":', loads.filter(l => l.status === 'uploaded'));
  console.log('🔍 RoleSelector - Current user:', currentUser);
  console.log('🔍 RoleSelector - User type:', currentUser?.type);

  const handleRoleClick = (role: string) => {
    console.log('🔴 LATEST VERSION - Role clicked:', role);
    if (role === currentRole) return // Already selected
    
    // Check access permissions
    console.log('🔍 RoleSelector - Checking access for role:', role, 'User type:', currentUser?.type);
    if (currentUser?.type === 'driver' && role !== 'driver') {
      console.log('🔴 ACCESS DENIED: Driver trying to access non-driver role:', role);
      return; // Drivers can only access driver role
    }
    console.log('🔍 RoleSelector - ACCESS GRANTED for role:', role);
    
    console.log('🔴 Direct role access - Changing role to:', role);
    onRoleChange(role)
    
    // Store current user info in localStorage
    localStorage.setItem('currentUser', JSON.stringify({ 
      role: role, 
      name: currentUser?.name || 'User',
      type: currentUser?.type || 'admin'
    }))
    
    // Auto-scroll to first card for approver roles
    if (role === 'first_approver' || role === 'second_approver' || role === 'final_approver') {
      setTimeout(() => {
        console.log(`🔍 Looking for ${role} card...`);
        
        let targetCard;
        
        if (role === 'first_approver') {
          targetCard = document.querySelector('section[data-first-approver-card="true"]') ||
                      document.querySelector('section[style*="3b82f6"]') || 
                      document.querySelector('section[style*="2563eb"]');
        } else if (role === 'second_approver') {
          targetCard = document.querySelector('section[data-second-approver-card="true"]') ||
                      document.querySelector('section[style*="a78bfa"]') || 
                      document.querySelector('section[style*="8b5cf6"]');
        } else if (role === 'final_approver') {
          targetCard = document.querySelector('section[data-final-approver-card="true"]') ||
                      document.querySelector('section[style*="f59e0b"]') || 
                      document.querySelector('section[style*="d97706"]');
        }
        
        if (targetCard) {
          console.log(`✅ Found ${role} card, scrolling...`);
          targetCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          console.log(`❌ ${role} card not found, scrolling to top`);
          window.scrollTo({ top: 300, behavior: 'smooth' });
        }
      }, 300);
    }
  }

  const roleButtons = [
    { key: 'driver', name: 'Driver', color: 'linear-gradient(135deg, #000000 0%, #0ea5e9 50%, #1e3a8a 100%)', borderColor: '#3b82f6', icon: '🚛' },
    { key: 'first_approver', name: 'First Approver', color: 'linear-gradient(135deg, #000000 0%, #0ea5e9 50%, #1e3a8a 100%)', borderColor: '#3b82f6', icon: '✅' },
    { key: 'second_approver', name: 'Second Approver', color: 'linear-gradient(135deg, #000000 0%, #0ea5e9 50%, #1e3a8a 100%)', borderColor: '#3b82f6', icon: '🔍' },
    { key: 'invoicer', name: 'Invoice', color: 'linear-gradient(135deg, #000000 0%, #0ea5e9 50%, #1e3a8a 100%)', borderColor: '#3b82f6', icon: '📄' },
    { key: 'final_approver', name: 'Final Approver', color: 'linear-gradient(135deg, #000000 0%, #0ea5e9 50%, #1e3a8a 100%)', borderColor: '#3b82f6', icon: '🏁' }
  ];

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      borderRadius: '12px',
      padding: '1.5rem',
      marginTop: '0px',
      marginBottom: '1rem'
    }}>
      {/* Role Buttons - Vertical Stack at 80% width */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.9rem',
        marginBottom: '2rem',
        alignItems: 'center'
      }}>
        {roleButtons.map((role) => {
          const isDisabled = currentUser?.type === 'driver' && role.key !== 'driver';
          
          return (
            <button
              key={role.key}
              type="button"
              onClick={() => handleRoleClick(role.key)}
              disabled={isDisabled}
              style={{
                background: currentRole === role.key 
                  ? role.color 
                  : isDisabled 
                    ? 'linear-gradient(135deg, #000000 0%, #4b5563 100%)'
                    : role.color,
                color: currentRole === role.key ? '#222' : '#000000',
                borderRadius: '20px',
                padding: '0.4rem 0.8rem',
                fontWeight: 900,
                fontSize: '1rem',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                opacity: isDisabled ? 0.5 : 1,
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.5rem',
                width: '90vw',
                maxWidth: '320px',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                boxShadow: `
                  0 25px 50px rgba(0,0,0,0.6),
                  0 12px 24px rgba(0,0,0,0.4),
                  0 6px 12px rgba(0,0,0,0.3),
                  inset 0 3px 6px rgba(255,255,255,0.4),
                  inset 0 -3px 6px rgba(0,0,0,0.3),
                  inset 0 0 20px rgba(255,255,255,0.1),
                  0 0 0 2px rgba(255,255,255,0.15)
                `,
                border: '2px solid rgba(255,255,255,0.2)',
                transform: 'perspective(1000px) rotateX(5deg)',
                filter: 'saturate(1.4) contrast(1.3) brightness(1.1) hue-rotate(5deg)'
              }}
              onMouseOver={() => {}}
              onMouseOut={() => {}}
            >
              <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <span style={{fontSize:'1.5em'}}>{role.icon}</span>
                <span>{role.name}</span>
              </div>
              {role.key !== 'driver' && (
                <span style={{
                  background: currentRole === role.key ? '#fff' : '#ef4444',
                  color: currentRole === role.key ? '#222' : '#ffffff',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  fontWeight: 700,
                }}>{queueCounts[role.key]}</span>
              )}
            </button>
          )
        })}
      </div>
      
      {/* Dashboard and Search in 2-column layout */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginTop: '0.9rem'
      }}>
        <button
          type="button"
          onClick={onSummariesClick}
          style={{
            flex: 1,
            background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(34, 197, 94, 0.8) 50%, rgba(22, 163, 74, 0.9) 100%)',
            color: '#000000',
            border: '2px solid rgba(255,255,255,0.2)',
            borderRadius: '16px',
            padding: '0.3rem 0.5rem',
            fontWeight: 900,
            fontSize: '0.85rem',
            textShadow: '2px 2px 4px rgba(0,0,0,0.5), 1px 1px 2px rgba(0,0,0,0.3), 0 0 8px rgba(0,0,0,0.2)',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: `
              0 25px 50px rgba(0,0,0,0.6),
              0 12px 24px rgba(0,0,0,0.4),
              0 6px 12px rgba(0,0,0,0.3),
              inset 0 3px 6px rgba(255,255,255,0.4),
              inset 0 -3px 6px rgba(0,0,0,0.3),
              inset 0 0 20px rgba(255,255,255,0.1),
              0 0 0 2px rgba(255,255,255,0.15)
            `,
            height: '60px',
            transform: 'perspective(1000px) rotateX(5deg)',
            filter: 'saturate(1.2) contrast(1.1)'
          }}
          onMouseOver={() => {}}
          onMouseOut={() => {}}
        >
          <span style={{position:'relative',zIndex:4,display:'flex',flexDirection:'column',alignItems:'center',gap:'0.2rem'}}>
            <span style={{fontSize:'1.2em'}}>📊</span>
            <span>Dashboard</span>
          </span>
        </button>
        
        <button
          type="button"
          onClick={onDashboardClick}
          style={{
            flex: 1,
            background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(236, 72, 153, 0.8) 50%, rgba(190, 24, 93, 0.9) 100%)',
            color: '#000000',
            border: '2px solid rgba(255,255,255,0.2)',
            borderRadius: '16px',
            padding: '0.3rem 0.5rem',
            fontWeight: 900,
            fontSize: '0.85rem',
            textShadow: '2px 2px 4px rgba(0,0,0,0.5), 1px 1px 2px rgba(0,0,0,0.3), 0 0 8px rgba(0,0,0,0.2)',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: `
              0 25px 50px rgba(0,0,0,0.6),
              0 12px 24px rgba(0,0,0,0.4),
              0 6px 12px rgba(0,0,0,0.3),
              inset 0 3px 6px rgba(255,255,255,0.4),
              inset 0 -3px 6px rgba(0,0,0,0.3),
              inset 0 0 20px rgba(255,255,255,0.1),
              0 0 0 2px rgba(255,255,255,0.15)
            `,
            height: '60px',
            transform: 'perspective(1000px) rotateX(5deg)',
            filter: 'saturate(1.2) contrast(1.1)'
          }}
          onMouseOver={() => {}}
          onMouseOut={() => {}}
        >
          <span style={{position:'relative',zIndex:4,display:'flex',flexDirection:'column',alignItems:'center',gap:'0.2rem'}}>
            <span style={{fontSize:'1.2em'}}>🔍</span>
            <span>Search Loads</span>
          </span>
        </button>
      </div>

      {/* Summary and Invoices buttons */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginTop: '0.4rem'
      }}>
        <button
          type="button"
          onClick={onSummaryClick}
          style={{
            flex: 1,
            background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(168, 85, 247, 0.8) 50%, rgba(124, 58, 237, 0.9) 100%)',
            color: '#000000',
            border: '2px solid rgba(255,255,255,0.2)',
            borderRadius: '16px',
            padding: '0.3rem 0.5rem',
            fontWeight: 900,
            fontSize: '0.85rem',
            textShadow: '2px 2px 4px rgba(0,0,0,0.5), 1px 1px 2px rgba(0,0,0,0.3), 0 0 8px rgba(0,0,0,0.2)',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: `
              0 25px 50px rgba(0,0,0,0.6),
              0 12px 24px rgba(0,0,0,0.4),
              0 6px 12px rgba(0,0,0,0.3),
              inset 0 3px 6px rgba(255,255,255,0.4),
              inset 0 -3px 6px rgba(0,0,0,0.3),
              inset 0 0 20px rgba(255,255,255,0.1),
              0 0 0 2px rgba(255,255,255,0.15)
            `,
            height: '60px',
            transform: 'perspective(1000px) rotateX(5deg)',
            filter: 'saturate(1.2) contrast(1.1)'
          }}
          onMouseOver={() => {}}
          onMouseOut={() => {}}
        >
          <span style={{position:'relative',zIndex:4, display:'flex', flexDirection:'column', alignItems:'center', gap:'0.2rem'}}>
            <span>📈</span>
            <span>Summary</span>
          </span>
        </button>
        
        <button
          type="button"
          onClick={onInvoicesClick}
          style={{
            flex: 1,
            background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(251, 191, 36, 0.8) 50%, rgba(217, 119, 6, 0.9) 100%)',
            color: '#000000',
            border: '2px solid rgba(255,255,255,0.2)',
            borderRadius: '16px',
            padding: '0.3rem 0.5rem',
            fontWeight: 900,
            fontSize: '0.85rem',
            textShadow: '2px 2px 4px rgba(0,0,0,0.5), 1px 1px 2px rgba(0,0,0,0.3), 0 0 8px rgba(0,0,0,0.2)',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: `
              0 25px 50px rgba(0,0,0,0.6),
              0 12px 24px rgba(0,0,0,0.4),
              0 6px 12px rgba(0,0,0,0.3),
              inset 0 3px 6px rgba(255,255,255,0.4),
              inset 0 -3px 6px rgba(0,0,0,0.3),
              inset 0 0 20px rgba(255,255,255,0.1),
              0 0 0 2px rgba(255,255,255,0.15)
            `,
            height: '60px',
            transform: 'perspective(1000px) rotateX(5deg)',
            filter: 'saturate(1.2) contrast(1.1)'
          }}
          onMouseOver={() => {}}
          onMouseOut={() => {}}
        >
          <span style={{position:'relative',zIndex:4, display:'flex', flexDirection:'column', alignItems:'center', gap:'0.2rem'}}>
            <span>📋</span>
            <span>Search Invoices</span>
          </span>
        </button>
        
      </div>
      
      {/* Logout Button - Below the 2x2 grid */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-start',
        marginTop: '0.4rem'
      }}>
        <button
          type="button"
          onClick={onLogout}
          style={{
            background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(239, 68, 68, 0.8) 50%, rgba(220, 38, 38, 0.9) 100%)',
            color: '#000000',
            border: '2px solid rgba(255,255,255,0.2)',
            borderRadius: '16px',
            padding: '0.3rem 1rem',
            fontWeight: 900,
            fontSize: '0.85rem',
            textShadow: '2px 2px 4px rgba(0,0,0,0.5), 1px 1px 2px rgba(0,0,0,0.3), 0 0 8px rgba(0,0,0,0.2)',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: `
              0 25px 50px rgba(0,0,0,0.6),
              0 12px 24px rgba(0,0,0,0.4),
              0 6px 12px rgba(0,0,0,0.3),
              inset 0 3px 6px rgba(255,255,255,0.4),
              inset 0 -3px 6px rgba(0,0,0,0.3),
              inset 0 0 20px rgba(255,255,255,0.1),
              0 0 0 2px rgba(255,255,255,0.15)
            `,
            height: '60px',
            transform: 'perspective(1000px) rotateX(5deg)',
            filter: 'saturate(1.2) contrast(1.1)',
            minWidth: '120px'
          }}
          onMouseOver={() => {}}
          onMouseOut={() => {}}
        >
          <span style={{position:'relative',zIndex:4, display:'flex', flexDirection:'column', alignItems:'center', gap:'0.2rem'}}>
            <span>🚪</span>
            <span>Logout / Login</span>
          </span>
        </button>
      </div>
    </div>
  )
}

export default RoleSelector