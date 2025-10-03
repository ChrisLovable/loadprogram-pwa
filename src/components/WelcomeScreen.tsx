import React, { useState, useEffect } from 'react';

interface WelcomeScreenProps {
  onInstall: () => void;
  onSkip: () => void;
  installState: 'idle' | 'installing' | 'success';
  showInstallButton: boolean;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ 
  onInstall, 
  onSkip, 
  installState, 
  showInstallButton 
}) => {
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');
  const [showManualInstructions, setShowManualInstructions] = useState(false);

  useEffect(() => {
    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform('ios');
    } else if (/android/.test(userAgent)) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }
  }, []);

  const getInstallInstructions = () => {
    switch (platform) {
      case 'ios':
        return {
          title: "📱 Install on iPhone/iPad",
          steps: [
            "Tap the Share button (📤) at the bottom of Safari",
            "Scroll down and tap 'Add to Home Screen'",
            "Tap 'Add' to confirm"
          ]
        };
      case 'android':
        return {
          title: "🤖 Install on Android",
          steps: [
            "Tap the menu button (⋮) in Chrome",
            "Select 'Install app' or 'Add to Home screen'",
            "Tap 'Install' to confirm"
          ]
        };
      default:
        return {
          title: "💻 Install on Desktop",
          steps: [
            "Click the install button below",
            "Follow your browser's installation prompt",
            "The app will be added to your desktop"
          ]
        };
    }
  };

  const benefits = [
    {
      icon: "⚡",
      title: "Faster Loading",
      description: "Access instantly without opening browser"
    },
    {
      icon: "📱",
      title: "Home Screen Access",
      description: "Launch like any other app"
    },
    {
      icon: "🔄",
      title: "Offline Capability",
      description: "Works even without internet connection"
    },
    {
      icon: "🔔",
      title: "Push Notifications",
      description: "Stay updated with real-time alerts"
    }
  ];

  const instructions = getInstallInstructions();

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      color: 'white',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    }}>
      {/* Close button */}
      <button
        onClick={onSkip}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'rgba(255, 255, 255, 0.2)',
          border: 'none',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          color: 'white',
          fontSize: '20px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(10px)',
        }}
      >
        ✕
      </button>

      {/* Main content */}
      <div style={{
        textAlign: 'center',
        maxWidth: '400px',
        width: '100%',
      }}>
        {/* App Icon */}
        <div style={{
          width: '80px',
          height: '80px',
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '20px',
          margin: '0 auto 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '40px',
          backdropFilter: 'blur(10px)',
        }}>
          🚛
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: '28px',
          fontWeight: '700',
          marginBottom: '10px',
          textShadow: '0 2px 4px rgba(0,0,0,0.3)',
        }}>
          Welcome to Load Program
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: '16px',
          opacity: 0.9,
          marginBottom: '30px',
          lineHeight: '1.5',
        }}>
          Install this app to your home screen for the best experience
        </p>

        {/* Benefits */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '15px',
          marginBottom: '30px',
        }}>
          {benefits.map((benefit, index) => (
            <div key={index} style={{
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '15px',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>
                {benefit.icon}
              </div>
              <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                {benefit.title}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>
                {benefit.description}
              </div>
            </div>
          ))}
        </div>

        {/* Install Button */}
        {showInstallButton && (
          <button
            onClick={onInstall}
            disabled={installState === 'installing'}
            style={{
              background: installState === 'installing' 
                ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                : installState === 'success'
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              color: installState === 'success' ? 'white' : '#1f2937',
              border: 'none',
              padding: '16px 32px',
              borderRadius: '16px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: installState === 'installing' ? 'not-allowed' : 'pointer',
              boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
              transition: 'all 0.3s ease',
              transform: installState === 'success' ? 'scale(1.05)' : 'scale(1)',
              minWidth: '200px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '20px',
            }}
            onMouseOver={(e) => {
              if (installState === 'idle') {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
                e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.3)';
              }
            }}
            onMouseOut={(e) => {
              if (installState === 'idle') {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.2)';
              }
            }}
          >
            {installState === 'installing' && '⏳ Installing...'}
            {installState === 'success' && '✅ Successfully Installed!'}
            {installState === 'idle' && '📱 Install App'}
          </button>
        )}

        {/* Manual Instructions Toggle */}
        {!showInstallButton && (
          <button
            onClick={() => setShowManualInstructions(!showManualInstructions)}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              marginBottom: '20px',
            }}
          >
            📋 Show Installation Instructions
          </button>
        )}

        {/* Manual Instructions */}
        {showManualInstructions && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '20px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            textAlign: 'left',
            marginBottom: '20px',
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '700',
              marginBottom: '15px',
              textAlign: 'center',
            }}>
              {instructions.title}
            </h3>
            <ol style={{
              paddingLeft: '20px',
              fontSize: '14px',
              lineHeight: '1.6',
            }}>
              {instructions.steps.map((step, index) => (
                <li key={index} style={{ marginBottom: '8px' }}>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Skip Button */}
        <button
          onClick={onSkip}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '10px',
            fontSize: '14px',
            cursor: 'pointer',
            opacity: 0.8,
            transition: 'opacity 0.3s ease',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.opacity = '0.8';
          }}
        >
          Skip for now
        </button>
      </div>
    </div>
  );
};

export default WelcomeScreen;
