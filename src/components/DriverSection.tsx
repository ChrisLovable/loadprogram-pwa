import { useState } from 'react'
import { supabase } from '../lib/supabase';
import React from 'react'; // Added for useEffect

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

  // Get current user from localStorage
  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('currentUser') || '{}');
    } catch { return {}; }
  })();
  // If current user is driver, auto-fill and lock driverName
  React.useEffect(() => {
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
    setUploading(true)
    setVisionLoading(true)
    try {
      // First, analyze the document with AWS Textract
      console.log('Starting AWS Textract analysis on submit...')
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
      // Call AWS Textract
      console.log('Calling AWS Textract API...')
      const res = await fetch('https://b5nahrxq89.execute-api.us-east-1.amazonaws.com/prod/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Image
        })
      })
      console.log('AWS Textract response status:', res.status)
      if (!res.ok) {
        const errorText = await res.text()
        console.error('AWS Textract API error:', res.status, errorText)
        setVisionError(`AWS Textract API error: ${res.status} ${errorText}`)
        throw new Error(`AWS Textract API error: ${res.status} ${errorText}`)
      }
      const data = await res.json()
      console.log('Raw AWS Textract response:', data)
      // Parse the response body if it's a string
      let textractData = data
      if (data.body && typeof data.body === 'string') {
        textractData = JSON.parse(data.body)
      }
      console.log('Parsed Textract data on submit:', textractData)
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
      // --- Upload photos to Supabase Storage ---
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
        if (uploadError) {
          console.error('Upload error:', uploadError);
          alert('Upload error: ' + uploadError.message);
          failedUploads.push(file.name);
          continue;
        }
        // Use signed URL instead of public URL (works regardless of bucket policy)
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage.from('loads').createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year expiry
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
      if (failedUploads.length === photos.length) {
        alert('All photo uploads failed. Please try again.');
        setUploading(false);
        setVisionLoading(false);
        return;
      }
      if (failedUploads.length > 0) {
        alert('Some photos failed to upload: ' + failedUploads.join(', '));
      }
      // --- Insert new load into Supabase ---
      const { error } = await supabase.from('loads').insert([
        {
          driver_name: driverName,
          submitted_by: currentUser.name || driverName,
          status: 'uploaded',
          date: safeDate,
          sender: textractData.sender || null,
          receiver: textractData.receiver || null,
          truck_reg: textractData.truckReg || null,
          trailer_reg: textractData.trailerReg || null,
          parsed_table: textractData.tableData || null,
          parsed_data: textractData || null,
          photos: uploadedPhotoUrls,
        }
      ]);
      if (error) {
        alert('Error saving to DB: ' + error.message);
      } else {
        alert('Saved to DB!');
        setDriverName('Driver 1');
        setVisionError(null);
        setPhotos([]);
        const fileInput = document.getElementById('file-input') as HTMLInputElement | null;
        if (fileInput) fileInput.value = '';
        if (onUploadComplete) onUploadComplete();
      }
    } catch (error) {
      console.error('DriverSection upload failed:', error)
      alert('Upload failed. See console for details.')
    } finally {
      setUploading(false)
      setVisionLoading(false)
    }
  }



  return (
    <div className="driver-section-content">
      <form onSubmit={handleSubmit} className="driver-form">
        <div className="form-group">
          <label>Driver Name:</label>
          <input
            type="text"
            value={driverName}
            onChange={e => setDriverName(e.target.value)}
            placeholder="Enter driver name"
            required
            className="driver-input"
            readOnly={currentUser.role === 'driver'}
            style={currentUser.role === 'driver' ? { background: '#f3f4f6', color: '#333', fontWeight: 600 } : {}}
          />
        </div>
        {currentUser.role === 'driver' && currentUser.name && (
          <div style={{fontSize:'0.98rem',color:'#2563eb',fontWeight:600,marginBottom:'0.5rem'}}>Submitted by: {currentUser.name}</div>
        )}
        <div className="form-group">
          <label>Take/Upload Photos (up to 5):</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoChange}
            disabled={photos.length >= MAX_PHOTOS}
            style={{display:'none'}}
            id="file-input"
          />
          <div style={{display:'flex',gap:'0.5rem',marginTop:'0.5rem'}}>
            <button type="button" style={{flex:1,fontSize:'1rem',background:'#6b7280',color:'white',border:'none',borderRadius:'8px',padding:'0.7rem 1.2rem',fontWeight:700,cursor:'pointer',boxShadow:'0 2px 8px rgba(107,114,128,0.3)'}} onClick={handleOpenCamera}>
              📷 Open Camera
            </button>
            <button type="button" style={{flex:1,fontSize:'1rem',background:'#6b7280',color:'white',border:'none',borderRadius:'8px',padding:'0.7rem 1.2rem',fontWeight:700,cursor:'pointer',boxShadow:'0 2px 8px rgba(107,114,128,0.3)'}} onClick={() => document.getElementById('file-input')?.click()}>
              🖼️ Choose from Gallery
          </button>
          </div>
          <div className="photo-thumbnails">
            {photos.map((file, idx) => (
              <div key={idx} className="photo-thumb">
                <img 
                  src={URL.createObjectURL(file)} 
                  alt={`photo-${idx+1}`} 
                  onClick={() => setEnlargedImage(URL.createObjectURL(file))}
                  style={{cursor: 'pointer'}}
                />
                <button type="button" onClick={() => handleRemovePhoto(idx)}>&times;</button>
              </div>
            ))}
          </div>
        </div>
        {visionError && (
          <div style={{color:'#c00',background:'#fff0f0',padding:'0.7rem',borderRadius:'8px',marginTop:'0.5rem'}}>
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
            background: visionLoading ? '#94a3b8' : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '1rem',
            fontWeight: 700,
            fontSize: '1rem',
            cursor: uploading || visionLoading ? 'not-allowed' : 'pointer',
            width: '100%',
            marginTop: '1rem'
          }}
        >
          {uploading ? '📤 Uploading & Analyzing...' : visionLoading ? '🔎 Analyzing Document...' : '📸 Submit Load'}
        </button>
      </form>

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
