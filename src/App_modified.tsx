import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import DriverSection from './components/DriverSection'
import FirstApproverSection from './components/FirstApproverSection'

import SecondApproverSection from './components/SecondApproverSection'
import InvoicerSection from './components/InvoicerSection'
import FinalApproverSection from './components/FinalApproverSection'
import RoleSelector from './components/RoleSelector'
import Dashboard from './components/Dashboard'
import InvoiceManager from './components/InvoiceManager'
import WelcomeScreen from './components/WelcomeScreen'
import './App.css'


import { supabase } from './lib/supabase';


// const DEMO_LOAD = {
//   id: 999,
//   ocr_data: null, // No hardcoded values - let OCR populate them
//   textract_data: null // AWS Textract data will be stored here
// }

function App() {
  const [loads, setLoads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // const [currentLoad, setCurrentLoad] = useState(DEMO_LOAD)
  const [currentRole, setCurrentRole] = useState<string | null>(null)
  
  // PWA Installation state
  const [showInstallButton, setShowInstallButton] = useState(false)
  const [installState, setInstallState] = useState<'idle' | 'installing' | 'success'>('idle')
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(false)
  
  // Debug: Monitor currentRole changes
  useEffect(() => {
    console.log('🔴 App - currentRole changed to:', currentRole);
    if (currentRole === 'driver') {
      console.log('🔴 App - Rendering Driver section...');
      console.log('🔴 App - Driver section should be visible now');
    }
  }, [currentRole]);

  // PWA Installation handling
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setShowInstallButton(true);
    };

    const handleAppInstalled = () => {
      console.log('PWA was installed');
      setInstallState('success');
      setShowInstallButton(false);
      
      // Reset after showing success
      setTimeout(() => {
        setInstallState('idle');
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallButton(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Show welcome screen on first visit
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    // Show welcome if user hasn't seen it and app isn't already installed
    if (!hasSeenWelcome && !isStandalone) {
      setShowWelcomeScreen(true);
    }
  }, []);

  const handleInstallClick = async () => {
    if (installState === 'installing') return;
    
    setInstallState('installing');
    
    // Use the global function from index.html
    if ((window as any).showInstallPrompt) {
      (window as any).showInstallPrompt();
    }
  };

  const handleSkipWelcome = () => {
    localStorage.setItem('hasSeenWelcome', 'true');
    setShowWelcomeScreen(false);
  };

  const handleWelcomeInstall = () => {
    localStorage.setItem('hasSeenWelcome', 'true');
    handleInstallClick();
  };

  // Service Worker Update Check
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        // Check for updates every 30 seconds
        const updateInterval = setInterval(() => {
          registration.update();
        }, 30000);

        // Clean up interval on unmount
        return () => clearInterval(updateInterval);
      });
    }
  }, []);
