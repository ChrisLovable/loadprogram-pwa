# PowerShell script to integrate WelcomeScreen into App.tsx

# Read the current App.tsx file
$content = Get-Content "src/App.tsx" -Raw

# Step 1: Add WelcomeScreen import after InvoiceManager import
$content = $content -replace "(import InvoiceManager from '\./components/InvoiceManager')", "`$1`nimport WelcomeScreen from './components/WelcomeScreen'"

# Step 2: Add showWelcomeScreen state after installState
$content = $content -replace "(const \[installState, setInstallState\] = useState\('idle' \| 'installing' \| 'success'\)\('idle'\))", "`$1`n  const [showWelcomeScreen, setShowWelcomeScreen] = useState(false)"

# Step 3: Add welcome screen useEffect after the PWA Installation handling useEffect
$welcomeUseEffect = @"
  // Show welcome screen on first visit
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    // Show welcome if user hasn't seen it and app isn't already installed
    if (!hasSeenWelcome && !isStandalone) {
      setShowWelcomeScreen(true);
    }
  }, []);
"@

$content = $content -replace "(\}, \[\]\);", "`$1`n$welcomeUseEffect"

# Step 4: Add handlers after handleInstallClick function
$handlers = @"
  const handleSkipWelcome = () => {
    localStorage.setItem('hasSeenWelcome', 'true');
    setShowWelcomeScreen(false);
  };

  const handleWelcomeInstall = () => {
    localStorage.setItem('hasSeenWelcome', 'true');
    handleInstallClick();
  };
"@

$content = $content -replace "(  };)", "`$1`n$handlers"

# Step 5: Add WelcomeScreen component before PWA Install Button
$welcomeComponent = @"
          {/* Welcome Screen */}
          {showWelcomeScreen && (
            <WelcomeScreen
              onInstall={handleWelcomeInstall}
              onSkip={handleSkipWelcome}
              installState={installState}
              showInstallButton={showInstallButton}
            />
          )}
"@

$content = $content -replace "(\s*{/\* PWA Install Button \*/})", "$welcomeComponent`n`$1"

# Write the modified content back to App.tsx
Set-Content "src/App.tsx" -Value $content -NoNewline

Write-Host "WelcomeScreen integration complete!"
