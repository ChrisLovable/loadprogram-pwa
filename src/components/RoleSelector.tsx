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
}

const RoleSelector: React.FC<RoleSelectorProps> = ({ currentRole, onRoleChange, loads, onDashboardClick, onSummariesClick, onSummaryClick, onInvoicesClick, currentUser }) => {

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
    
    // Check access permissions
    if (currentUser?.type === 'driver' && role !== 'driver') {
      console.log('🔴 Driver trying to access non-driver role:', role);
      return; // Drivers can only access driver role
    }
    
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

  const roles = [
    { key: 'driver', name: 'Driver', color: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderColor: '#34d399', icon: '🚛' },
    { key: 'first_approver', name: 'First Approver', color: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', borderColor: '#60a5fa', icon: '✅' },
    { key: 'second_approver', name: 'Second Approver', color: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)', borderColor: '#c4b5fd', icon: '🔍' },
    { key: 'invoicer', name: 'Invoice', color: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', borderColor: '#fbbf24', icon: '📄' },
    { key: 'final_approver', name: 'Final Approver', color: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', borderColor: '#fbbf24', icon: '🏁' }
  ];

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      borderRadius: '12px',
      padding: '1rem',
      marginTop: '-30px',
      marginBottom: '1rem'
    }}>
      {/* Role Buttons */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '0.7rem',
        marginBottom: '1rem'
      }}>
        {roles.map((role) => {
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
                    ? 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
                    : role.color,
                color: currentRole === role.key ? '#222' : 'white',
                border: `2.5px solid ${currentRole === role.key ? '#fff' : role.borderColor}`,
                borderRadius: '16px',
                padding: '0.5rem 0.8rem',
                fontWeight: 900,
                fontSize: '0.85rem',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: isDisabled ? 0.5 : 1,
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.2rem'
              }}
              onMouseOver={(e) => {
                if (!isDisabled && currentRole !== role.key) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.3)';
                }
              }}
              onMouseOut={(e) => {
                if (!isDisabled && currentRole !== role.key) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              <span style={{fontSize:'1.2em'}}>{role.icon}</span>
              <span>{role.name}</span>
              {role.key !== 'driver' && (
                <span style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  background: currentRole === role.key ? '#fff' : '#ef4444',
                  color: currentRole === role.key ? '#222' : 'white',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '0 6px',
                }}>{queueCounts[role.key]}</span>
              )}
            </button>
          )
        })}
      </div>
      
      {/* Dashboard and Search in 2-column layout */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginTop: '20px'
      }}>
        <button
          type="button"
          onClick={onSummariesClick}
          style={{
            flex: 1,
            background: 'linear-gradient(135deg, #4f8cff 0%, #2563eb 100%)',
            color: '#222',
            border: '2.5px solid #60a5fa',
            borderRadius: '16px',
            padding: '0.5rem 1.2rem',
            fontWeight: 900,
            fontSize: '0.85rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(79, 140, 255, 0.4)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
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
            background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
            color: '#222',
            border: '2.5px solid #f472b6',
            borderRadius: '16px',
            padding: '0.5rem 1.2rem',
            fontWeight: 900,
            fontSize: '0.85rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(236, 72, 153, 0.4)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
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
        gap: '1rem',
        marginTop: '0.5rem'
      }}>
        <button
          type="button"
          onClick={onSummaryClick}
          style={{
            flex: 1,
            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            color: '#222',
            border: '2.5px solid #a78bfa',
            borderRadius: '16px',
            padding: '0.5rem 1.2rem',
            fontWeight: 900,
            fontSize: '0.85rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(139, 92, 246, 0.4)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <span style={{position:'relative',zIndex:4, display:'flex', flexDirection:'column', alignItems:'center', gap:'0.2rem'}}>
            <span>📊</span>
            <span>Summary</span>
          </span>
        </button>
        
        <button
          type="button"
          onClick={onInvoicesClick}
          style={{
            flex: 1,
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: '#222',
            border: '2.5px solid #fbbf24',
            borderRadius: '16px',
            padding: '0.5rem 1.2rem',
            fontWeight: 900,
            fontSize: '0.85rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(245, 158, 11, 0.4)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <span style={{position:'relative',zIndex:4, display:'flex', flexDirection:'column', alignItems:'center', gap:'0.2rem'}}>
            <span>📋</span>
            <span>Search Invoices</span>
          </span>
        </button>
      </div>
    </div>
  )
}

export default RoleSelector