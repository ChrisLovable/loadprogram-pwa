import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase';

interface DriverSectionProps {
  onUploadComplete: () => void
  onTextractComplete?: (textractData: any) => void
}

const MAX_PHOTOS = 5

const DriverSection: React.FC<DriverSectionProps> = ({ onUploadComplete, onTextractComplete }) => {
  const [driverName, setDriverName] = useState('Driver 1')
  const [photos, setPhotos] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [visionLoading, setVisionLoading] = useState(false)
  const [visionError, setVisionError] = useState<string | null>(null)
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [uploadCompleted, setUploadCompleted] = useState(false)
  
  // Debug: Monitor showSuccess state changes
  useEffect(() => {
    console.log('🎉 showSuccess state changed to:', showSuccess);
    if (showSuccess) {
      console.log('🎉 Rendering success message...');
      console.log('🎉 Current showSuccess value:', showSuccess);
    }
  }, [showSuccess]);

  // Get current user from localStorage
  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('currentUser') || '{}');
    } catch { return {}; }
  })();
  // If current user is driver, auto-fill and lock driverName
  useEffect(() => {
    if (currentUser.role === 'driver' && currentUser.name) {
      setDriverName(currentUser.name);
    }
  }, [currentUser.role, currentUser.name]);


  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    let newPhotos = [...photos]
    for (let i = 0; i < files.length && newPhotos.length < MAX_PHOTOS; i++) {
      newPhotos.push(files[i])
    }
    setPhotos(newPhotos.slice(0, MAX_PHOTOS))
    // No automatic OCR - will happen on submit
  }

  // Open camera for photo capture
  const handleOpenCamera = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.capture = 'environment' // Use rear camera
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files
      if (files && files.length > 0) {
        handlePhotoChange({ target: { files } } as any)
      }
    }
    input.click()
  }

  const handleRemovePhoto = (idx: number) => {
    const newPhotos = photos.filter((_, i) => i !== idx)
    setPhotos(newPhotos)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('SUBMIT BUTTON CLICKED!')
    e.preventDefault()
    console.log('Driver name:', driverName, 'Photos:', photos.length)
    if (!driverName || photos.length < 1) {
      alert('Please enter your name and take at least 1 photo')
      return
    }
    console.log('Validation passed, starting submit process...')
    console.log('🚀 STEP 1: Starting upload process...');
    setUploading(true)
    setVisionLoading(true)
    try {
      // Test basic network connectivity first
      console.log('Testing network connectivity...');
      try {
        const networkTest = await fetch('https://httpbin.org/get', { 
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        });
        if (!networkTest.ok) {
          throw new Error('Network test failed');
        }
        console.log('Network connectivity test passed');
      } catch (error) {
        console.error('Network connectivity test failed:', error);
        alert('No internet connection detected. Please check your network and try again.');
        setUploading(false);
        setVisionLoading(false);
        return;
      }

      // Test Supabase connection
      console.log('Testing Supabase connection...');
        const { error: testError } = await supabase.from('loads').select('count').limit(1);
      if (testError) {
        console.error('Supabase connection test failed:', testError);
        alert('Database connection failed. Please check your internet connection and try again.');
        setUploading(false);
        setVisionLoading(false);
        return;
      }
      console.log('Supabase connection test passed');
      // First, analyze the document with AWS Textract
      console.log('🚀 STEP 2: Starting AWS Textract analysis on submit...')
      setVisionError(null as string | null);
      // Convert image to base64
      const reader = new FileReader()
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string
          const base64 = result.split(',')[1]
          resolve(base64)
        }
        reader.onerror = reject
      })
      reader.readAsDataURL(photos[0])
      const base64Image = await base64Promise
      console.log('🔍 Base64 image length:', base64Image.length)
      console.log('🔍 Base64 image preview:', base64Image.substring(0, 50) + '...')
      // Call AWS Textract with retry logic
      console.log('Calling AWS Textract API...')
      const lambdaEndpoint = 'https://b5nahrxq89.execute-api.us-east-1.amazonaws.com/prod/';
      
      let textractData = null;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries && !textractData) {
        try {
          const requestBody = {
            image: base64Image
          }
          console.log('🔍 Request body keys:', Object.keys(requestBody))
          console.log('🔍 Image data length:', requestBody.image.length)
          
          const res = await fetch(lambdaEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
            signal: AbortSignal.timeout(30000) // 30 second timeout
          })
          
          console.log('AWS Textract response status:', res.status)
          
          if (!res.ok) {
            const errorText = await res.text()
            console.error(`AWS Textract API error (attempt ${retryCount + 1}):`, res.status, errorText)
            
            if (retryCount === maxRetries - 1) {
              // Final attempt failed, try fallback
              console.log('AWS Textract failed, trying fallback OCR...')
              const { fallbackOCR } = await import('../utils/ocrFallback')
              textractData = await fallbackOCR(photos[0])
              console.log('Fallback OCR result:', textractData)
              break
            }
            
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000))
            retryCount++
            continue
          }
          
          const data = await res.json()
          textractData = data
          console.log('AWS Textract success on attempt:', retryCount + 1)
          console.log('🚀 STEP 2.5: AWS Textract completed, processing response...')
          break
          
    } catch (error) {
          console.error(`AWS Textract network error (attempt ${retryCount + 1}):`, error)
          
          if (retryCount === maxRetries - 1) {
            // Final attempt failed, try fallback
            console.log('AWS Textract network failed, trying fallback OCR...')
            try {
              const { fallbackOCR } = await import('../utils/ocrFallback')
              textractData = await fallbackOCR(photos[0])
              console.log('Fallback OCR result:', textractData)
            } catch (fallbackError) {
              console.error('Fallback OCR also failed:', fallbackError)
              setVisionError('OCR processing failed. Please try again or contact support.')
              throw fallbackError
            }
            break
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000))
          retryCount++
        }
      }
      
      // Process the textractData that was already parsed above
      console.log('🚀 STEP 2.6: Processing parsed Textract data...')
      console.log('Raw AWS Textract response:', textractData)
      // Parse the response body if it's a string
      if (textractData.body && typeof textractData.body === 'string') {
        textractData = JSON.parse(textractData.body)
      }
      console.log('Parsed Textract data on submit:', textractData)
      
      // Lambda function now handles sender/receiver parsing correctly
      console.log('✅ Using Lambda function parsed data directly')
      
      console.log('📊 OCR Result keys:', Object.keys(textractData || {}));
      console.log('📊 Truck Reg from OCR:', textractData?.truckReg || textractData?.truck_reg);
      console.log('📊 Trailer Reg from OCR:', textractData?.trailerReg || textractData?.trailer_reg);
      console.log('📊 Sender from OCR:', textractData?.sender);
      console.log('📊 Receiver from OCR:', textractData?.receiver);
      console.log('📊 Table data from OCR:', textractData?.table);
      console.log('📊 Packages from OCR:', textractData?.table?.[0]?.packages);
      console.log('📊 Description from OCR:', textractData?.table?.[0]?.description);
      console.log('📊 Raw text from AWS Textract:', textractData?.raw_text);
      console.log('📊 Raw text length:', textractData?.raw_text?.length);
      
      // If registration numbers are empty, try fallback OCR
      if ((!textractData?.truckReg && !textractData?.truck_reg) || 
          (!textractData?.trailerReg && !textractData?.trailer_reg)) {
        console.log('🚨 AWS Textract failed to extract registration numbers, trying fallback OCR...');
        try {
          const { fallbackOCR } = await import('../utils/ocrFallback')
          const fallbackData = await fallbackOCR(photos[0])
          console.log('📊 Fallback OCR result:', fallbackData);
          
          // Merge fallback data with AWS Textract data
          if (fallbackData) {
            textractData = {
              ...textractData,
              truckReg: fallbackData.truck_reg || textractData.truckReg || textractData.truck_reg,
              trailerReg: fallbackData.trailer_reg || textractData.trailerReg || textractData.trailer_reg,
              truck_reg: fallbackData.truck_reg || textractData.truck_reg,
              trailer_reg: fallbackData.trailer_reg || textractData.trailer_reg,
            }
            console.log('📊 Merged OCR data:', textractData);
          }
        } catch (fallbackError) {
          console.error('Fallback OCR failed:', fallbackError);
        }
      }
      
      // Pass Textract data to parent component for use in FirstApprover
      if (onTextractComplete) {
        console.log('DriverSection calling onTextractComplete from submit with:', textractData)
        onTextractComplete(textractData)
      } else {
        console.error('onTextractComplete callback not available!')
      }
      // Fix date format: convert '14-09-25' to '2014-09-25' if needed, or set to null if invalid
      let safeDate: string | null = null;
      if (textractData.date) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(textractData.date)) {
          safeDate = textractData.date;
        } else if (/^\d{2}-\d{2}-\d{2}$/.test(textractData.date)) {
          const [yy, mm, dd] = textractData.date.split('-');
          const yyyy = parseInt(yy, 10) < 50 ? '20' + yy : '19' + yy;
          safeDate = `${yyyy}-${mm}-${dd}`;
        } else {
          safeDate = new Date().toISOString().slice(0, 10);
        }
      }
      console.log('🚀 STEP 3: AWS Textract completed, starting photo upload...');
      // --- Upload photos to Supabase Storage ---
      console.log('Starting photo upload to Supabase Storage...');
      console.log('Photos to upload:', photos.length);
      const uploadedPhotoUrls: string[] = [];
      const failedUploads: string[] = [];
      for (let i = 0; i < photos.length; i++) {
        const file = photos[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
        const filePath = `loads/${fileName}`; // Upload to loads folder inside loads bucket
        console.log(`Uploading file: ${file.name} as ${filePath}`);
        console.log('Uploading to bucket: loads, filePath:', filePath);
        const { data: uploadData, error: uploadError } = await supabase.storage.from('loads').upload(filePath, file, { upsert: false });
        console.log('Upload result:', uploadData, uploadError);
        if (uploadError) {
          console.error('Upload error:', uploadError);
          console.error('Error details:', {
            message: uploadError.message,
            name: uploadError.name
          });
          
          // Check if it's a network error
          if (uploadError.message.includes('Failed to fetch') || uploadError.message.includes('NetworkError')) {
            alert('Network error: Unable to connect to storage. Please check your internet connection and try again.');
          } else {
            alert('Upload error: ' + uploadError.message);
          }
          failedUploads.push(file.name);
          continue;
        }
        // Use signed URL instead of public URL (works regardless of bucket policy)
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage.from('loads').createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year expiry
        console.log('Signed URL result:', signedUrlData, signedUrlError);
        if (signedUrlData && signedUrlData.signedUrl) {
          uploadedPhotoUrls.push(signedUrlData.signedUrl);
          console.log('Uploaded and got signed URL:', signedUrlData.signedUrl);
          console.log('TESTING SIGNED URL IMMEDIATELY:', signedUrlData.signedUrl);
          // Test the URL immediately
          fetch(signedUrlData.signedUrl)
            .then(response => console.log('SIGNED URL test result:', response.status, response.ok))
            .catch(error => console.error('SIGNED URL test failed:', error));
        } else {
          console.error('No public URL for', file.name);
          failedUploads.push(file.name);
        }
      }
      console.log('Photo upload completed. Success:', uploadedPhotoUrls.length, 'Failed:', failedUploads.length);
      console.log('Uploaded URLs:', uploadedPhotoUrls);
      console.log('Failed uploads:', failedUploads);
      
      if (failedUploads.length === photos.length) {
        console.error('All photo uploads failed');
        alert('All photo uploads failed. Please try again.');
        setUploading(false);
        setVisionLoading(false);
        return;
      }
      if (failedUploads.length > 0) {
        console.warn('Some photos failed to upload:', failedUploads);
        alert('Some photos failed to upload: ' + failedUploads.join(', '));
      }
      // --- Insert new load into Supabase ---
      console.log('Inserting load data into Supabase...');
      console.log('Load data:', {
        driver_name: driverName,
        submitted_by: currentUser.name || driverName,
        status: 'uploaded',
        date: safeDate,
        sender: textractData.sender || null,
        receiver: textractData.receiver || null,
        truck_reg: textractData.truckReg || textractData.truck_reg || null,
        trailer_reg: textractData.trailerReg || textractData.trailer_reg || null,
        parsed_table: textractData.table || null,
        parsed_data: textractData || null,
        photos: uploadedPhotoUrls,
      });
      
      console.log('🚀 STEP 4: Photo upload completed, saving to database...');
      const { data: insertData, error } = await supabase.from('loads').insert([
        {
          driver_name: driverName,
          submitted_by: currentUser.name || driverName,
          status: 'uploaded',
          date: safeDate,
          sender: textractData.sender || null,
          receiver: textractData.receiver || null,
          truck_reg: textractData.truckReg || textractData.truck_reg || null,
          trailer_reg: textractData.trailerReg || textractData.trailer_reg || null,
          parsed_table: textractData.table || null,
          parsed_data: textractData || null,
          photos: uploadedPhotoUrls,
        }
      ]);
      
      console.log('Supabase insert result:', { insertData, error });
      
      if (error) {
        console.error('Supabase insert error:', error);
        alert('Error saving to DB: ' + error.message);
      } else {
        console.log('🚀 STEP 5: SUCCESS! Upload completed successfully!');
        console.log('🎉 Setting showSuccess to true...');
        // Show success message
        setShowSuccess(true);
        setUploadCompleted(true);
        console.log('🎉 showSuccess set to true, should trigger useEffect');
        
        setDriverName('Driver 1');
        setVisionError(null);
        setPhotos([]);
        const fileInput = document.getElementById('file-input') as HTMLInputElement | null;
        if (fileInput) fileInput.value = '';
        
        // Delay the onUploadComplete callback to allow success message to show
        setTimeout(() => {
          if (onUploadComplete && uploadCompleted) {
            console.log('🎉 Calling onUploadComplete callback after delay');
            onUploadComplete();
            setUploadCompleted(false); // Reset flag
          }
        }, 1000); // 1 second delay to let success message appear
        
        // Auto-hide success message after 5 seconds (increased from 3)
        setTimeout(() => {
          console.log('🎉 Auto-hiding success message after 5 seconds');
          setShowSuccess(false);
          // If upload was completed and callback hasn't been called yet, call it now
          if (uploadCompleted && onUploadComplete) {
            console.log('🎉 Calling onUploadComplete callback from auto-hide timeout');
            onUploadComplete();
            setUploadCompleted(false); // Reset flag
          }
        }, 5000);
      }
    } catch (error) {
      console.error('🚨 CRITICAL ERROR - DriverSection upload failed:', error);
      console.error('🚨 Error type:', typeof error);
      console.error('🚨 Error constructor:', error?.constructor?.name);
      console.error('🚨 Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        name: error instanceof Error ? error.name : 'Unknown',
        // cause: error instanceof Error ? error.cause : 'No cause',
        toString: error?.toString?.()
      });
      
      // Log the current state
      console.error('🚨 Current state at error:', {
        driverName,
        photosCount: photos.length,
        uploading,
        visionLoading,
        showSuccess,
        visionError: visionError
      });
      
      // More specific error handling
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          console.error('🚨 Network error - check internet connection');
          alert('Network error. Please check your internet connection and try again.');
        } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          console.error('🚨 Authentication error - check Supabase credentials');
          alert('Authentication error. Please check your credentials.');
        } else if (error.message.includes('404')) {
          console.error('🚨 Resource not found - check Supabase URL and bucket');
          alert('Resource not found. Please check your configuration.');
        } else {
          console.error('🚨 Unknown error:', error.message);
          alert('Upload failed: ' + error.message);
        }
      } else {
        console.error('🚨 Non-Error object thrown:', error);
        alert('Upload failed. See console for details.');
      }
    } finally {
      setUploading(false)
      setVisionLoading(false)
    }
  }



  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 100%)',
      borderRadius: '24px',
      padding: '2rem',
      marginBottom: '1rem',
      boxShadow: `
        0 20px 60px rgba(0,0,0,0.15),
        0 8px 32px rgba(0,0,0,0.1),
        0 4px 16px rgba(0,0,0,0.05),
        inset 0 1px 0 rgba(255,255,255,0.4),
        inset 0 -1px 0 rgba(0,0,0,0.1)
      `,
      border: '2px solid rgba(255,255,255,0.3)',
      backdropFilter: 'blur(20px) saturate(180%)',
      position: 'relative',
      overflow: 'hidden',
      transform: 'perspective(1000px) rotateX(2deg)',
      transition: 'all 0.3s ease'
    }}>
      {/* Watery Glass Overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 20% 20%, rgba(255,255,255,0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 80%, rgba(255,255,255,0.05) 0%, transparent 50%),
          radial-gradient(circle at 40% 60%, rgba(255,255,255,0.08) 0%, transparent 50%)
        `,
        borderRadius: '24px',
        pointerEvents: 'none',
        zIndex: 1
      }}></div>

      {/* 3D Watery Header */}
      <div style={{
        background: `
          linear-gradient(135deg, 
            rgba(255,107,107,0.9) 0%, 
            rgba(238,90,82,0.8) 25%,
            rgba(255,107,107,0.9) 50%,
            rgba(238,90,82,0.8) 75%,
            rgba(255,107,107,0.9) 100%
          )
        `,
        color: 'white',
        borderRadius: '16px',
        padding: '1rem 1.5rem',
        textAlign: 'center',
        fontWeight: 700,
        fontSize: '1.3rem',
        letterSpacing: '0.8px',
        marginBottom: '2rem',
        boxShadow: `
          0 8px 32px rgba(255,107,107,0.4),
          0 4px 16px rgba(255,107,107,0.2),
          inset 0 2px 0 rgba(255,255,255,0.3),
          inset 0 -2px 0 rgba(0,0,0,0.1)
        `,
        textShadow: '0 2px 4px rgba(0,0,0,0.2)',
        position: 'relative',
        transform: 'perspective(1000px) rotateX(-1deg)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.2)',
        zIndex: 2
      }}>
        🚛 Driver Upload
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '60%',
          background: `
            linear-gradient(to bottom, 
              rgba(255,255,255,0.2) 0%, 
              rgba(255,255,255,0.1) 50%,
              transparent 100%
            )
          `,
          borderRadius: '16px 16px 0 0',
          animation: 'waterShimmer 3s ease-in-out infinite'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '40%',
          background: `
            linear-gradient(to top, 
              rgba(0,0,0,0.1) 0%, 
              transparent 100%
            )
          `,
          borderRadius: '0 0 16px 16px'
        }}></div>
      </div>

      <form onSubmit={handleSubmit} style={{position: 'relative', zIndex: 3}}>
        <div style={{marginBottom: '1.5rem'}}>
          <label style={{
            fontSize: '1.1rem',
            fontWeight: 700,
            color: '#1f2937',
            marginBottom: '0.8rem',
            display: 'block',
            textShadow: '0 1px 2px rgba(255,255,255,0.5)'
          }}>Driver Name:</label>
          <div style={{position: 'relative'}}>
          <input
            type="text"
            value={driverName}
            onChange={e => setDriverName(e.target.value)}
              placeholder="Enter driver name"
            required
              readOnly={currentUser.role === 'driver'}
              style={{
                width: '180px',
                padding: '1rem 1.2rem',
                borderRadius: '16px',
                border: '2px solid rgba(255,255,255,0.3)',
                fontSize: '1.1rem',
                background: currentUser.role === 'driver' 
                  ? 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0.05) 100%)'
                  : 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 100%)',
                color: '#1f2937',
                fontWeight: currentUser.role === 'driver' ? 600 : 500,
                boxShadow: `
                  0 8px 32px rgba(0,0,0,0.1),
                  0 4px 16px rgba(0,0,0,0.05),
                  inset 0 2px 0 rgba(255,255,255,0.4),
                  inset 0 -1px 0 rgba(0,0,0,0.05)
                `,
                backdropFilter: 'blur(15px) saturate(150%)',
                transition: 'all 0.3s ease',
                outline: 'none',
                transform: 'perspective(1000px) rotateX(1deg)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(59,130,246,0.6)';
                e.target.style.transform = 'perspective(1000px) rotateX(0deg) scale(1.02)';
                e.target.style.boxShadow = `
                  0 12px 40px rgba(59,130,246,0.2),
                  0 6px 20px rgba(59,130,246,0.1),
                  inset 0 2px 0 rgba(255,255,255,0.5),
                  inset 0 -1px 0 rgba(0,0,0,0.05)
                `;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255,255,255,0.3)';
                e.target.style.transform = 'perspective(1000px) rotateX(1deg) scale(1)';
                e.target.style.boxShadow = `
                  0 8px 32px rgba(0,0,0,0.1),
                  0 4px 16px rgba(0,0,0,0.05),
                  inset 0 2px 0 rgba(255,255,255,0.4),
                  inset 0 -1px 0 rgba(0,0,0,0.05)
                `;
              }}
            />
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `
                radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1) 0%, transparent 50%),
                radial-gradient(circle at 70% 70%, rgba(255,255,255,0.05) 0%, transparent 50%)
              `,
              borderRadius: '16px',
              pointerEvents: 'none',
              zIndex: 1
            }}></div>
          </div>
        </div>
        
        <div style={{marginBottom: '1.2rem'}}>
          <label style={{
            fontSize: '0.95rem',
            fontWeight: 700,
            color: '#333',
            marginBottom: '0.5rem',
            display: 'block'
          }}>Take/Upload Photos (up to 5):</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoChange}
            disabled={photos.length >= MAX_PHOTOS}
            style={{display:'none'}}
            id="file-input"
          />
          <div style={{display:'flex',gap:'0.8rem',marginTop:'0.8rem'}}>
            <button 
              type="button" 
              onClick={handleOpenCamera}
              style={{
                flex: 1,
                fontSize: '1rem',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '0.8rem 1.2rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(59,130,246,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(59,130,246,0.4), inset 0 1px 0 rgba(255,255,255,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(59,130,246,0.3), inset 0 1px 0 rgba(255,255,255,0.2)';
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
                <div style={{ fontSize: '1.5rem' }}>📷</div>
                <div>Open Camera</div>
              </div>
          </button>
            <button 
              type="button" 
              onClick={() => document.getElementById('file-input')?.click()}
              style={{
                flex: 1,
                fontSize: '1rem',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '0.8rem 1.2rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(16,185,129,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(16,185,129,0.4), inset 0 1px 0 rgba(255,255,255,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(16,185,129,0.3), inset 0 1px 0 rgba(255,255,255,0.2)';
              }}
            >
              🖼️ Choose from Phone Gallery
          </button>
          </div>
          <div style={{display:'flex',gap:'0.5rem',marginTop:'0.8rem',flexWrap:'wrap'}}>
            {photos.map((file, idx) => (
              <div key={idx} style={{
                position: 'relative',
                width: 60,
                height: 60,
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.9)',
                border: '2px solid rgba(59,130,246,0.3)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.1)';
              }}
              >
                <img 
                  src={URL.createObjectURL(file)} 
                  alt={`photo-${idx+1}`} 
                  onClick={() => setEnlargedImage(URL.createObjectURL(file))}
                  style={{
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover',
                    borderRadius: '10px'
                  }}
                />
                <button 
                  type="button" 
                  onClick={() => handleRemovePhoto(idx)}
                  style={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    background: 'rgba(239,68,68,0.9)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: 20,
                    height: 20,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                    fontWeight: 'bold'
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
        {visionError && (
          <div style={{
            color:'#dc2626',
            background:'rgba(239,68,68,0.1)',
            padding:'0.8rem 1rem',
            borderRadius:'12px',
            marginTop:'1rem',
            border:'1px solid rgba(239,68,68,0.2)',
            boxShadow:'0 2px 8px rgba(239,68,68,0.1)'
          }}>
            <strong>AWS Textract Error:</strong> {visionError}
          </div>
        )}
        
        <button 
          type="button" 
          onClick={async () => {
            console.log('SUBMIT BUTTON CLICKED!')
            console.log('Driver name:', driverName, 'Photos:', photos.length)
            
            if (!driverName || photos.length < 1) {
              alert('Please enter your name and take at least 1 photo')
              return
            }
            
            console.log('Validation passed, starting submit process...')
            await handleSubmit({ preventDefault: () => {} } as any)
          }}
          disabled={uploading || visionLoading}
          style={{
            background: uploading || visionLoading 
              ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)' 
              : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '16px',
            padding: '1.2rem 1.5rem',
            fontWeight: 700,
            fontSize: '1.1rem',
            cursor: uploading || visionLoading ? 'not-allowed' : 'pointer',
            width: '100%',
            marginTop: '1.5rem',
            boxShadow: uploading || visionLoading 
              ? '0 4px 16px rgba(156,163,175,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
              : '0 6px 24px rgba(245,158,11,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
            textShadow: '0 1px 2px rgba(0,0,0,0.1)',
            transition: 'all 0.2s ease',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            if (!uploading && !visionLoading) {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 8px 28px rgba(245,158,11,0.5), inset 0 1px 0 rgba(255,255,255,0.2)';
            }
          }}
          onMouseLeave={(e) => {
            if (!uploading && !visionLoading) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 6px 24px rgba(245,158,11,0.4), inset 0 1px 0 rgba(255,255,255,0.2)';
            }
          }}
        >
          {uploading ? '📤 Uploading & Analyzing...' : visionLoading ? '🔎 Analyzing Document...' : '📸 Submit Photos'}
        </button>
      </form>


      {/* Success Message - Simplified for debugging */}
      {showSuccess && (
        <>
          {console.log('🎉 Success message JSX is rendering!')}
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#10b981',
            borderRadius: '12px',
            padding: '2rem',
            color: 'white',
            textAlign: 'center',
            zIndex: 9999,
            maxWidth: '120px',
            width: '120px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            border: '2px solid #059669'
          }}>
            {/* Close X Button */}
            <button
              onClick={() => {
                console.log('🎉 Close button clicked, hiding success message');
                setShowSuccess(false);
                // If upload was completed and callback hasn't been called yet, call it now
                if (uploadCompleted && onUploadComplete) {
                  console.log('🎉 Calling onUploadComplete callback from close button');
                  onUploadComplete();
                  setUploadCompleted(false); // Reset flag
                }
              }}
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                color: 'white',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                zIndex: 10000
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              ×
            </button>
          <div style={{
            fontSize: '2rem',
            marginBottom: '1rem'
          }}>
            ✅
          </div>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            marginBottom: '1rem'
          }}>
            Successfully Submitted!
          </div>
          <div style={{
            fontSize: '1rem',
            opacity: 0.9
          }}>
            Photos uploaded and processed successfully
          </div>
          </div>
        </>
      )}

      {/* Image Enlargement - Top Positioned */}
      {enlargedImage && (
        <div 
          style={{
            position: 'fixed',
            top: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            background: 'white',
            borderRadius: '12px',
            padding: '0.5rem',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            border: '2px solid #667eea',
            maxWidth: '90vw',
            maxHeight: '70vh'
          }}
        >
          <div style={{ position: 'relative' }}>
            <img 
              src={enlargedImage} 
              alt="Enlarged photo" 
              style={{
                width: '100%',
                maxWidth: '350px',
                height: 'auto',
                objectFit: 'contain',
                borderRadius: '8px',
                display: 'block'
              }}
            />
        <button 
              onClick={() => setEnlargedImage(null)}
              style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}
            >
              ×
        </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DriverSection
