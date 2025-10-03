# Script to integrate WelcomeScreen into App.tsx

# Step 1: Add WelcomeScreen import after InvoiceManager import
sed -i '11a import WelcomeScreen from '\''./components/WelcomeScreen'\''' src/App.tsx

# Step 2: Add showWelcomeScreen state after installState
sed -i '33a const [showWelcomeScreen, setShowWelcomeScreen] = useState(false)' src/App.tsx

# Step 3: Add welcome screen useEffect after the PWA Installation handling useEffect
sed -i '74a\
  // Show welcome screen on first visit\
  useEffect(() => {\
    const hasSeenWelcome = localStorage.getItem('\''hasSeenWelcome'\'');\
    const isStandalone = window.matchMedia('\''(display-mode: standalone)'\'').matches;\
    \
    // Show welcome if user hasn'\''t seen it and app isn'\''t already installed\
    if (!hasSeenWelcome && !isStandalone) {\
      setShowWelcomeScreen(true);\
    }\
  }, []);' src/App.tsx

# Step 4: Add handlers after handleInstallClick function
sed -i '85a\
  const handleSkipWelcome = () => {\
    localStorage.setItem('\''hasSeenWelcome'\'', '\''true'\'');\
    setShowWelcomeScreen(false);\
  };\
\
  const handleWelcomeInstall = () => {\
    localStorage.setItem('\''hasSeenWelcome'\'', '\''true'\'');\
    handleInstallClick();\
  };' src/App.tsx

# Step 5: Add WelcomeScreen component before PWA Install Button
sed -i '467i\
          {/* Welcome Screen */}\
          {showWelcomeScreen && (\
            <WelcomeScreen\
              onInstall={handleWelcomeInstall}\
              onSkip={handleSkipWelcome}\
              installState={installState}\
              showInstallButton={showInstallButton}\
            />\
          )}' src/App.tsx

echo "WelcomeScreen integration complete!"
