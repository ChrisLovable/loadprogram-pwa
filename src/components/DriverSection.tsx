import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { extractLoadDocumentData, OCRResult } from '../lib/ocr'

interface DriverSectionProps {
  onUploadComplete: () => void
  onTextractComplete?: (textractData: any) => void
}

const MAX_PHOTOS = 5

const DriverSection: React.FC<DriverSectionProps> = ({ onUploadComplete, onTextractComplete }) => {
  const [driverName, setDriverName] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [visionLoading, setVisionLoading] = useState(false)
  const [visionError, setVisionError] = useState<string | null>(null)
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null)


  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    if (photos.length >= MAX_PHOTOS) return
    const newPhoto = files[0]
    const newPhotos = [...photos, newPhoto].slice(0, MAX_PHOTOS)
    setPhotos(newPhotos)
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
    if (idx === 0) setOcrResult(null)
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
      setVisionError(null)
      
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
      setVisionResult(data)
      
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
      
      // Temporarily disabled Supabase calls due to DNS/certificate issues
      console.log('Supabase upload disabled - simulating success')
      const mockLoadId = Math.floor(Math.random() * 1000) + 1
      
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setDriverName('')
      setPhotos([])
      setOcrResult(null)
      setVisionResult(null)
      setVisionError(null)
      alert(`Load #${mockLoadId} uploaded and analyzed! (Simulated - Supabase disabled)`)
      onUploadComplete()
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
          />
        </div>
        <div className="form-group">
          <label>Take/Upload Photos (up to 5):</label>
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            disabled={photos.length >= MAX_PHOTOS}
            style={{display:'none'}}
            id="file-input"
          />
          <div style={{display:'flex',gap:'0.5rem',marginTop:'0.5rem'}}>
            <button type="button" style={{flex:1,fontSize:'0.98rem',background:'#6b7280',color:'white',border:'none',borderRadius:'8px',padding:'0.7rem 1.2rem',fontWeight:700,cursor:'pointer',boxShadow:'0 2px 8px rgba(107,114,128,0.3)'}} onClick={handleOpenCamera}>
              📷 Open Camera
            </button>
            <button type="button" style={{flex:1,fontSize:'0.98rem',background:'#6b7280',color:'white',border:'none',borderRadius:'8px',padding:'0.7rem 1.2rem',fontWeight:700,cursor:'pointer',boxShadow:'0 2px 8px rgba(107,114,128,0.3)'}} onClick={() => document.getElementById('file-input')?.click()}>
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
            fontSize: '1.1rem',
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
