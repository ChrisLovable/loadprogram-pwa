import { useState, useEffect } from 'react'
import DriverSection from './components/DriverSection'
import FirstApproverSection from './components/FirstApproverSection'
import SecondApproverSection from './components/SecondApproverSection'
import InvoicerSection from './components/InvoicerSection'
import FinalApproverSection from './components/FinalApproverSection'
import RoleSelector from './components/RoleSelector'
import Dashboard from './components/Dashboard'
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
  // const [firstApprovalData, setFirstApprovalData] = useState<any>(null)
  const [searchInvoice, setSearchInvoice] = useState('');
  const [searchSender, setSearchSender] = useState('');
  const [searchReceiver, setSearchReceiver] = useState('');
  const [searchTruckReg, setSearchTruckReg] = useState('');
  const [searchDriver, setSearchDriver] = useState('');
  const [dashboardResults, setDashboardResults] = useState<any[]>([]);
  const [tripDateFilter, setTripDateFilter] = useState('all');
  const [tripDateRange, setTripDateRange] = useState({ from: '', to: '' });
  const [invoiceDateFilter, setInvoiceDateFilter] = useState('all');
  const [invoiceDateRange, setInvoiceDateRange] = useState({ from: '', to: '' });
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [minimizedSearch, setMinimizedSearch] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showDashboard, setShowDashboard] = useState(false);

  const loadData = async () => {
    // Fetch loads from Supabase
    const { data, error } = await supabase.from('loads').select('*').order('created_at', { ascending: false });
    if (!error && data) setLoads(data);
    setLoading(false);
  }

  useEffect(() => {
    loadData()
    // Load first approval data from localStorage
    // const storedFirstApproval = localStorage.getItem('firstApprovalData')
    // if (storedFirstApproval) {
    //   setFirstApprovalData(JSON.parse(storedFirstApproval))
    // }
    // Optionally add realtime subscription here
  }, [])

  if (loading) return <div className="loading">Loading...</div>

  // Handle Textract completion
  const handleTextractComplete = (textractData: any) => {
    console.log('App received Textract data:', textractData)
    // setCurrentLoad(prev => ({
    //   ...prev,
    //   textract_data: textractData
    // }))
  }

  // Add this handler to add a new load when the driver submits
  const handleDriverSubmit = () => {
    loadData(); // Always refresh from Supabase after upload
  }

  // Add this handler to delete a load
  // const handleDeleteLoad = async (id: number) => {
  //   if (window.confirm('Are you sure you want to delete this load?')) {
  //     await supabase.from('loads').delete().eq('id', id);
  //     loadData();
  //   }
  // };

  // Helper for date filtering
  const isDateInRange = (dateStr: string, filter: string, range: any) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const today = new Date();
    if (filter === 'all') return true;
    if (filter === 'today') {
      return date.toDateString() === today.toDateString();
    }
    if (filter === 'last7') {
      const weekAgo = new Date();
      weekAgo.setDate(today.getDate() - 7);
      return date >= weekAgo && date <= today;
    }
    if (filter === 'last30') {
      const monthAgo = new Date();
      monthAgo.setDate(today.getDate() - 30);
      return date >= monthAgo && date <= today;
    }
    if (filter === 'custom') {
      if (!range.from || !range.to) return true;
      const from = new Date(range.from);
      const to = new Date(range.to);
      return date >= from && date <= to;
    }
    return true;
  };

  // Enhanced search handler
  const handleDashboardSearch = () => {
    setSearchLoading(true);
    setTimeout(() => { // Simulate loading
      let results = loads;
      if (searchInvoice.trim()) {
        results = results.filter(l =>
          l.parsed_data?.invoice?.invoiceNumber?.toLowerCase().includes(searchInvoice.trim().toLowerCase())
        );
      }
      if (searchSender.trim()) {
        results = results.filter(l =>
          l.parsed_data?.sender?.toLowerCase().includes(searchSender.trim().toLowerCase())
        );
      }
      if (searchReceiver.trim()) {
        results = results.filter(l =>
          l.parsed_data?.receiver?.toLowerCase().includes(searchReceiver.trim().toLowerCase())
        );
      }
      if (searchTruckReg.trim()) {
        results = results.filter(l =>
          l.parsed_data?.truckReg?.toLowerCase().includes(searchTruckReg.trim().toLowerCase())
        );
      }
      if (searchDriver.trim()) {
        results = results.filter(l =>
          l.driver_name?.toLowerCase().includes(searchDriver.trim().toLowerCase())
        );
      }
      // Trip Date filter
      if (tripDateFilter !== 'all' && (tripDateFilter === 'custom' ? (tripDateRange.from || tripDateRange.to) : true)) {
        results = results.filter(l =>
          isDateInRange(l.parsed_data?.date, tripDateFilter, tripDateRange)
        );
      }
      // Invoice Date filter
      if (invoiceDateFilter !== 'all' && (invoiceDateFilter === 'custom' ? (invoiceDateRange.from || invoiceDateRange.to) : true)) {
        results = results.filter(l =>
          isDateInRange(l.parsed_data?.invoice?.invoiceDate, invoiceDateFilter, invoiceDateRange)
        );
      }
      setDashboardResults(results);
      setSearchLoading(false);
    }, 400);
  };

  // Clear all filters
  const handleClearAll = () => {
    setSearchInvoice('');
    setSearchSender('');
    setSearchReceiver('');
    setSearchTruckReg('');
    setSearchDriver('');
    setTripDateFilter('all');
    setTripDateRange({ from: '', to: '' });
    setInvoiceDateFilter('all');
    setInvoiceDateRange({ from: '', to: '' });
    setDashboardResults([]);
  };

  // Find the first load in 'uploaded' status for First Approver
  // const firstLoad = loads.find(l => l.status === 'uploaded') || {
  //   ...currentLoad,
  //   first_approval: firstApprovalData
  // }

  return (
    <div className="phone-container">
      <div className="phone-screen">
        <div style={{
          width: '100%',
          height: '100%',
          background: '#000000',
          margin: 0,
          padding: 0,
          boxSizing: 'border-box',
          fontFamily: 'system-ui, sans-serif',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}>
      {/* Search Modal */}
      {showSearch && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.92)',
          backdropFilter: 'blur(8px)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '18px',
            boxShadow: '0 8px 32px 0 rgba(37,99,235,0.18)',
            padding: minimizedSearch ? '0.5rem 0.5rem 0.5rem 0.5rem' : '1.2rem 1rem 1rem 1rem',
            maxWidth: 330,
            width: '95vw',
            position: 'relative',
            maxHeight: '90vh',
            height: '90vh',
            display: 'flex',
            flexDirection: 'column',
            marginTop: '24px',
            transition: 'padding 0.2s',
            overflow: 'hidden',
          }}>
            {/* Modern glassy header */}
            <div style={{
              position: 'relative',
              background: 'rgba(236,245,255,0.85)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              borderTopLeftRadius: '18px',
              borderTopRightRadius: '18px',
              padding: '1.1rem 0.5rem 0.7rem 0.5rem',
              margin: '-1.2rem -1rem 0.7rem -1rem',
              boxShadow: '0 2px 12px 0 rgba(37,99,235,0.07)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              minHeight: 56,
            }}>
              <div style={{flex:1}}></div>
              <h2 style={{
                flex: 10,
                fontSize: minimizedSearch ? '1.08rem' : '1.18rem',
                fontWeight: 900,
                background: 'linear-gradient(90deg, #2563eb 0%, #38bdf8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '0.5px',
                textAlign: 'center',
                margin: 0,
                textShadow: '0 2px 8px rgba(37,99,235,0.13)',
                userSelect: 'none',
                lineHeight: 1.2,
              }}>
                <span style={{verticalAlign:'middle',marginRight:'0.4rem',fontSize:'1.2em'}}>🔍</span>Search Loads
              </h2>
              <button onClick={() => setShowSearch(false)} style={{
                flex:1,
                marginLeft: 'auto',
                background: 'rgba(255,255,255,0.7)',
                border: 'none',
                borderRadius: '50%',
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.35rem',
                color: '#2563eb',
                boxShadow: '0 2px 8px 0 rgba(37,99,235,0.10)',
                cursor: 'pointer',
                transition: 'background 0.18s, color 0.18s, box-shadow 0.18s',
                outline: 'none',
                position: 'relative',
                right: 0,
              }}
                onMouseOver={e => {e.currentTarget.style.background = '#2563eb';e.currentTarget.style.color='#fff';}}
                onMouseOut={e => {e.currentTarget.style.background = 'rgba(255,255,255,0.7)';e.currentTarget.style.color='#2563eb';}}
                aria-label="Close search modal"
              >
                ×
              </button>
            </div>
            <div style={{height:1,background:'linear-gradient(90deg,#2563eb22 0%,#38bdf822 100%)',margin:'0 0 0.7rem 0',borderRadius:2}}></div>
            {/* Minimized search fields if minimizedSearch is true */}
            {!minimizedSearch ? (
              <>
                <div style={{display:'flex',gap:'0.5rem',marginBottom:'0.5rem',flexWrap:'wrap',justifyContent:'center',width:'100%'}}>
                  <input type="text" placeholder="Invoice Number" value={searchInvoice} onChange={e => setSearchInvoice(e.target.value)} style={{padding:'0.4rem',borderRadius:'6px',border:'1px solid #ccc',fontSize:'0.85rem',width:'90px',boxSizing:'border-box',marginBottom:'0.3rem'}} />
                  <input type="text" placeholder="Sender" value={searchSender} onChange={e => setSearchSender(e.target.value)} style={{padding:'0.4rem',borderRadius:'6px',border:'1px solid #ccc',fontSize:'0.85rem',width:'90px',boxSizing:'border-box',marginBottom:'0.3rem'}} />
                  <input type="text" placeholder="Receiver" value={searchReceiver} onChange={e => setSearchReceiver(e.target.value)} style={{padding:'0.4rem',borderRadius:'6px',border:'1px solid #ccc',fontSize:'0.85rem',width:'90px',boxSizing:'border-box',marginBottom:'0.3rem'}} />
                </div>
                <div style={{display:'flex',gap:'0.5rem',marginBottom:'0.5rem',flexWrap:'wrap',justifyContent:'center',width:'100%'}}>
                  <input type="text" placeholder="Truck Reg" value={searchTruckReg} onChange={e => setSearchTruckReg(e.target.value)} style={{padding:'0.4rem',borderRadius:'6px',border:'1px solid #ccc',fontSize:'0.85rem',width:'90px',boxSizing:'border-box',marginBottom:'0.3rem'}} />
                  <input type="text" placeholder="Driver Name" value={searchDriver} onChange={e => setSearchDriver(e.target.value)} style={{padding:'0.4rem',borderRadius:'6px',border:'1px solid #ccc',fontSize:'0.85rem',width:'90px',boxSizing:'border-box',marginBottom:'0.3rem'}} />
                </div>
                <div style={{display:'flex',alignItems:'center',gap:'0.7rem',marginBottom:'0.5rem',width:'100%',justifyContent:'center'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'0.3rem'}}>
                    <label style={{fontWeight:700,fontSize:'0.93rem',color:'#2563eb'}}>Trip Date:</label>
                    <select value={tripDateFilter} onChange={e => setTripDateFilter(e.target.value)} style={{padding:'0.2rem',borderRadius:'6px',border:'1px solid #ccc',fontSize:'0.85rem'}}>
                      <option value="all">All</option>
                      <option value="today">Today</option>
                      <option value="last7">Last 7 Days</option>
                      <option value="last30">Last 30 Days</option>
                      <option value="custom">Custom Range</option>
                    </select>
                    {tripDateFilter === 'custom' && (
                      <>
                        <input type="date" value={tripDateRange.from} onChange={e => setTripDateRange(r => ({...r, from: e.target.value}))} style={{padding:'0.2rem',borderRadius:'6px',border:'1px solid #ccc',fontSize:'0.85rem'}} />
                        <span style={{fontWeight:600}}>to</span>
                        <input type="date" value={tripDateRange.to} onChange={e => setTripDateRange(r => ({...r, to: e.target.value}))} style={{padding:'0.2rem',borderRadius:'6px',border:'1px solid #ccc',fontSize:'0.85rem'}} />
                      </>
                    )}
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:'0.3rem'}}>
                    <label style={{fontWeight:700,fontSize:'0.93rem',color:'#2563eb'}}>Invoice Date:</label>
                    <select value={invoiceDateFilter} onChange={e => setInvoiceDateFilter(e.target.value)} style={{padding:'0.2rem',borderRadius:'6px',border:'1px solid #ccc',fontSize:'0.85rem'}}>
                      <option value="all">All</option>
                      <option value="today">Today</option>
                      <option value="last7">Last 7 Days</option>
                      <option value="last30">Last 30 Days</option>
                      <option value="custom">Custom Range</option>
                    </select>
                    {invoiceDateFilter === 'custom' && (
                      <>
                        <input type="date" value={invoiceDateRange.from} onChange={e => setInvoiceDateRange(r => ({...r, from: e.target.value}))} style={{padding:'0.2rem',borderRadius:'6px',border:'1px solid #ccc',fontSize:'0.85rem'}} />
                        <span style={{fontWeight:600}}>to</span>
                        <input type="date" value={invoiceDateRange.to} onChange={e => setInvoiceDateRange(r => ({...r, to: e.target.value}))} style={{padding:'0.2rem',borderRadius:'6px',border:'1px solid #ccc',fontSize:'0.85rem'}} />
                      </>
                    )}
                  </div>
                </div>
                <div style={{display:'flex',gap:'0.7rem',width:'100%',marginTop:'0.2rem',justifyContent:'center'}}>
                  <button
                    type="button"
                    onClick={() => { setMinimizedSearch(true); handleDashboardSearch(); }}
                    style={{
                      flex: 1,
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '14px',
                      padding: '0.5rem 0',
                      fontWeight: 900,
                      fontSize: '1.1rem',
                      letterSpacing: '0.5px',
                      boxShadow: '0 2px 8px rgba(37,99,235,0.13)',
                      cursor: 'pointer',
                      display: 'block',
                    }}
                  >
                    🔍 Search
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    style={{
                      flex: 1,
                      background: 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '14px',
                      padding: '0.5rem 0',
                      fontWeight: 900,
                      fontSize: '1rem',
                      letterSpacing: '0.5px',
                      boxShadow: '0 2px 8px rgba(239,68,68,0.13)',
                      cursor: 'pointer',
                      display: 'block',
                    }}
                  >
                    ❌ Clear All
                  </button>
                </div>
              </>
            ) : (
              <div style={{textAlign:'center',marginBottom:'0.3rem'}}>
                <button
                  type="button"
                  onClick={() => setMinimizedSearch(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2563eb',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    marginBottom: '0.2rem',
                    textDecoration: 'underline',
                  }}
                >Show Search Filters</button>
              </div>
            )}
            {/* Active filters summary */}
            {minimizedSearch && (
              <div style={{marginTop:'0.2rem',fontSize:'0.93rem',color:'#2563eb',fontWeight:600,textAlign:'center'}}>
                {searchInvoice && <span>Invoice: <b>{searchInvoice}</b> </span>}
                {searchSender && <span>Sender: <b>{searchSender}</b> </span>}
                {searchReceiver && <span>Receiver: <b>{searchReceiver}</b> </span>}
                {searchTruckReg && <span>Truck: <b>{searchTruckReg}</b> </span>}
                {searchDriver && <span>Driver: <b>{searchDriver}</b> </span>}
                {(tripDateFilter !== 'all' && (tripDateFilter === 'custom' ? (tripDateRange.from || tripDateRange.to) : true)) && <span>Trip Date: <b>{tripDateFilter === 'custom' ? `${tripDateRange.from} to ${tripDateRange.to}` : tripDateFilter}</b> </span>}
                {(invoiceDateFilter !== 'all' && (invoiceDateFilter === 'custom' ? (invoiceDateRange.from || invoiceDateRange.to) : true)) && <span>Invoice Date: <b>{invoiceDateFilter === 'custom' ? `${invoiceDateRange.from} to ${invoiceDateRange.to}` : invoiceDateFilter}</b> </span>}
              </div>
            )}
            {/* Search Results in modal */}
            <div style={{flex:1,overflowY:'auto',marginTop:'0.7rem',maxHeight:'70vh'}}>
              {searchLoading ? (
                <div style={{color:'#2563eb',fontWeight:700,textAlign:'center'}}>Searching...</div>
              ) : dashboardResults.length === 0 ? (
                <div style={{color:'#888',fontWeight:600,textAlign:'center'}}>No results found.<br/><span style={{fontWeight:400}}>Try different filters or check your spelling.</span></div>
              ) : (
                dashboardResults.map((load, idx) => (
                  <div key={load.id || idx} style={{
                    background:'#fff',
                    border:'2.5px solid #111',
                    borderRadius:'14px',
                    margin:'0 auto 1.3rem auto',
                    maxWidth:290,
                    boxShadow:'0 4px 16px rgba(37,99,235,0.08)',
                    padding:'1.1rem 1rem 0.7rem 1rem',
                    fontSize:'0.93rem',
                    color:'#222',
                    position:'relative',
                  }}>
                    {/* Documents Section */}
                    {load.photos && load.photos.length > 0 && (
                      <div style={{marginBottom:'0.9rem',padding:'0.7rem',background:'#f1f5f9',borderRadius:'8px',border:'1px solid #cbd5e1',display:'flex',alignItems:'center',gap:'0.5rem',flexWrap:'wrap'}}>
                        <span style={{fontWeight:700,color:'#0284c7',fontSize:'1rem',marginRight:'0.5rem'}}>Documents</span>
                        {load.photos.map((photoUrl: string, i: number) => (
                          <span key={i} style={{display:'inline-block',width:32,height:32,background:'#e0e7ef',borderRadius:'6px',overflow:'hidden',boxShadow:'0 1px 3px rgba(0,0,0,0.08)',border:'1px solid #cbd5e1',textAlign:'center',lineHeight:'32px',fontSize:'1.3rem',color:'#2563eb'}}>
                            <img src={photoUrl} alt={`Document ${i+1}`} style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '6px'}} onError={e => { if (!e.currentTarget.src.endsWith('/no-image.png')) e.currentTarget.src = '/no-image.png'; }} />
                          </span>
                        ))}
                      </div>
                    )}
                    {/* Role Players */}
                    <div style={{marginBottom:'0.7rem',padding:'0.7rem',background:'#e0f2fe',borderRadius:'8px',border:'1.5px solid #38bdf8'}}>
                      <div style={{fontWeight:700,color:'#2563eb',fontSize:'1rem',marginBottom:'0.2rem',letterSpacing:'0.5px'}}>Role Players</div>
                      <div style={{display:'flex',flexWrap:'wrap',gap:'0.5rem',fontSize:'0.93rem'}}>
                        <span>Driver: <b>{load.driver_name}</b></span>
                        <span>1st Approver: <b>{load.approved_by_1st || '-'}</b></span>
                        <span>2nd Approver: <b>{load.approved_by_2nd || '-'}</b></span>
                        <span>Invoicer: <b>{load.approved_by_invoicer || '-'}</b></span>
                        <span>Final Approver: <b>{load.approved_by_final || '-'}</b></span>
                      </div>
                      <div style={{fontSize:'0.85rem',color:'#666',marginTop:'0.2rem'}}>
                        {load.created_at && <span>Created: {load.created_at.slice(0,10)}</span>}
                        {load.updated_at && <span style={{marginLeft:'0.7rem'}}>Updated: {load.updated_at.slice(0,10)}</span>}
                      </div>
                    </div>
                    {/* Load Information */}
                    <div style={{marginBottom:'0.7rem',padding:'0.7rem',background:'#f1f5f9',borderRadius:'8px',border:'1.5px solid #cbd5e1'}}>
                      <div style={{fontWeight:700,color:'#0284c7',fontSize:'1rem',marginBottom:'0.2rem',letterSpacing:'0.5px'}}>Load Information</div>
                      <div style={{display:'flex',flexWrap:'wrap',gap:'0.5rem',fontSize:'0.93rem'}}>
                        <span>Trip Date: <b>{load?.parsed_data?.date || '-'}</b></span>
                        <span>Sender: <b>{load?.parsed_data?.sender || '-'}</b></span>
                        <span>Receiver: <b>{load?.parsed_data?.receiver || '-'}</b></span>
                        <span>Truck Reg: <b>{load?.parsed_data?.truckReg || '-'}</b></span>
                        <span>Trailer Reg: <b>{load?.parsed_data?.trailerReg || '-'}</b></span>
                        <span>Start KM: <b>{load?.parsed_data?.startKm || '-'}</b></span>
                        <span>End KM: <b>{load?.parsed_data?.endKm || '-'}</b></span>
                        <span>Trip KM: <b>{load?.parsed_data?.tripKm || '-'}</b></span>
                        <span># Animals: <b>{load?.parsed_data?.totalAnimals || '-'}</b></span>
                        <span>Running KMs: <b>{load?.parsed_data?.runningKms || '-'}</b></span>
                        <span>Comments: <b>{load?.parsed_data?.comments || '-'}</b></span>
                      </div>
                      {/* Image thumbnails at the bottom of Load Info */}
                      {load.photos && load.photos.length > 0 && (
                        <div style={{marginTop:'0.7rem',display:'flex',gap:'0.5rem',flexWrap:'wrap',justifyContent:'flex-start'}}>
                          {load.photos.map((photoUrl: string, i: number) => (
                            <img
                              key={i}
                              src={photoUrl}
                              alt={`Document ${i+1}`}
                              style={{
                                width: 44,
                                height: 44,
                                objectFit: 'cover',
                                borderRadius: '7px',
                                border: '1.5px solid #bae6fd',
                                boxShadow: '0 1px 4px rgba(37,99,235,0.10)',
                                transition: 'transform 0.15s',
                                cursor: 'pointer',
                              }}
                              onClick={() => { console.log('Thumbnail clicked:', photoUrl); setPreviewImage(photoUrl); }}
                              onMouseOver={e => e.currentTarget.style.transform = 'scale(1.12)'}
                              onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                              onError={e => { if (!e.currentTarget.src.endsWith('/no-image.png')) e.currentTarget.src = '/no-image.png'; }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Calculations */}
                    <div style={{marginBottom:'0.7rem',padding:'0.7rem',background:'#e0f2fe',borderRadius:'8px',border:'1.5px solid #38bdf8'}}>
                      <div style={{fontWeight:900,color:'#2563eb',fontSize:'1rem',marginBottom:'0.2rem',letterSpacing:'0.5px'}}>Calculations</div>
                      <div style={{display:'flex',flexDirection:'column',gap:'0.2rem',fontSize:'0.97rem'}}>
                        <span>Trip KM x Rate per Loaded KM: <b>R {load?.parsed_data?.tripKm && load?.parsed_data?.rate ? (Number(load?.parsed_data?.tripKm) * Number(load?.parsed_data?.rate)).toFixed(2) : '-'}</b></span>
                        <span># Animals x Rate per Animal: <b>R {load?.parsed_data?.totalAnimals && load?.parsed_data?.ratePerAnimal ? (Number(load?.parsed_data?.totalAnimals) * Number(load?.parsed_data?.ratePerAnimal)).toFixed(2) : '-'}</b></span>
                        <span>Running KMs x Running KM Rate: <b>R {load?.parsed_data?.runningKms && load?.parsed_data?.runningKmRate ? (Number(load?.parsed_data?.runningKms) * Number(load?.parsed_data?.runningKmRate)).toFixed(2) : '-'}</b></span>
                        <span>Subtotal: <b>R {load?.parsed_data?.subtotal || '-'}</b></span>
                        <span>VAT: <b>R {load?.parsed_data?.vat || '-'}</b></span>
                        <span>Total: <b>R {load?.parsed_data?.total || '-'}</b></span>
                      </div>
                    </div>
                    {/* Invoice Details */}
                    <div style={{marginBottom:'0.2rem',padding:'0.7rem',background:'#f0fdf4',borderRadius:'8px',border:'1.5px solid #4ade80'}}>
                      <div style={{fontWeight:900,color:'#059669',fontSize:'1rem',marginBottom:'0.2rem',letterSpacing:'0.5px'}}>Invoice Details</div>
                      <div style={{display:'flex',flexWrap:'wrap',gap:'0.5rem',fontSize:'0.93rem'}}>
                        <span>Invoice Date: <b>{load?.parsed_data?.invoice?.invoiceDate || '-'}</b></span>
                        <span>Invoice Number: <b>{load?.parsed_data?.invoice?.invoiceNumber || '-'}</b></span>
                        <span>Debtor: <b>{load?.parsed_data?.invoice?.invoiceMadeOutTo || '-'}</b></span>
                        <span>Invoice Subtotal: <b>R {load?.parsed_data?.invoice?.invoiceSubtotal || '-'}</b></span>
                        <span>Invoice VAT: <b>R {load?.parsed_data?.invoice?.invoiceVat || '-'}</b></span>
                        <span>Invoice Total: <b>R {load?.parsed_data?.invoice?.invoiceTotal || '-'}</b></span>
                        <span>Invoice Sent: <b>{load?.parsed_data?.invoice?.invoiceSent ? 'Yes' : 'No'}</b></span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      {previewImage && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.85)',
          zIndex: 4000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }} onClick={() => setPreviewImage(null)}>
          <div style={{
            position: 'relative',
            maxWidth: '100vw',
            maxHeight: '90vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }} onClick={e => e.stopPropagation()}>
            {/* Preview modal image: {previewImage} */}
            <img src={previewImage} alt="Preview" style={{
              maxWidth: '98vw',
              maxHeight: '88vh',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
              background: '#fff',
              display: 'block',
            }} onError={e => { if (!e.currentTarget.src.endsWith('/no-image.png')) e.currentTarget.src = '/no-image.png'; }} />
            <button onClick={() => setPreviewImage(null)} style={{
              position: 'absolute',
              top: -18,
              right: -18,
              background: 'rgba(255,255,255,0.85)',
              border: 'none',
              borderRadius: '50%',
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.7rem',
              color: '#2563eb',
              boxShadow: '0 2px 8px 0 rgba(37,99,235,0.10)',
              cursor: 'pointer',
              outline: 'none',
              zIndex: 10,
            }} aria-label="Close preview">×</button>
          </div>
        </div>
      )}

      {/* DASHBOARD MODAL */}
      {showDashboard && (
        <Dashboard loads={loads} onClose={() => setShowDashboard(false)} />
      )}

      {/* Results */}
      {/* Remove the block at/after line 520 that renders dashboardResults on the main screen. */}
      
      {/* Goliatskraal Banner */}
      <div style={{
        width: '100%',
        marginTop: '30px',
        marginBottom: '1rem',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        background: '#000000'
      }}>
        <img 
          src="/goliatskraal-banner.jpg" 
          alt="Goliatskraal Banner" 
          style={{
            width: '60%',
            height: 'auto',
            display: 'block',
            objectFit: 'contain',
            margin: '0 auto'
          }}
        />
      </div>
      
      {/* Main Content Container with Black Background */}
      <div style={{
        background: '#000000',
        borderRadius: '12px',
        padding: '1rem',
        marginTop: '-30px',
        marginBottom: '1rem'
      }}>
        <RoleSelector
          currentRole={currentRole}
          onRoleChange={setCurrentRole}
          loads={loads}
          onDashboardClick={() => setShowSearch(true)}
          onSummariesClick={() => setShowDashboard(true)}
        />
      </div>
      
      {/* FIRST APPROVER ROLE CARD */}
      {currentRole === 'first_approver' && (
        <>
          {loads.filter(l => l.status === 'uploaded').length > 0 && (
            loads.filter(l => l.status === 'uploaded').map(load => (
              <section key={load.id} style={{
                marginBottom: '1.2rem',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                borderRadius: '12px',
                padding: '3px',
                border: '1px solid #2563eb',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.13)',
                maxWidth: '90%',
                margin: '0 auto 1.2rem auto'
              }}>
                <h2 style={{
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  color: 'white',
                  marginBottom: '0.5rem',
                  textAlign: 'center',
                  textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                  letterSpacing: '0.5px',
                  margin: '0.5rem 0',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  borderRadius: '10px',
                  padding: '0.7rem 0'
                }}>✅ FIRST APPROVER - Review & Enter Details</h2>
                <div style={{
                  background: 'rgba(255,255,255,0.97)',
                  borderRadius: '8px',
                  padding: '10px',
                  border: '1px solid rgba(255,255,255,0.8)'
                }}>
                  <FirstApproverSection load={load} onApprovalComplete={loadData} />
                </div>
              </section>
            ))
          )}
        </>
      )}

      {/* SECOND APPROVER ROLE CARD */}
      {currentRole === 'second_approver' && (
        <>
          {loads.filter(l => l.status === 'first_approved').length > 0 && (
            loads.filter(l => l.status === 'first_approved').map(load => (
              <section key={load.id} style={{
                marginBottom: '1.2rem',
                background: 'linear-gradient(135deg, #a78bfa 0%, #6366f1 100%)',
                borderRadius: '12px',
                padding: '3px',
                border: '1.5px solid #7c3aed',
                boxShadow: '0 4px 16px rgba(124, 58, 237, 0.10)',
                maxWidth: '90%',
                margin: '0 auto 1.2rem auto'
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #a78bfa 0%, #6366f1 100%)',
                  borderRadius: '10px',
                  margin: '0 0 0.5rem 0',
                  padding: 0
                }}>
                  <h2 style={{
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    color: 'white',
                    textAlign: 'center',
                    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                    letterSpacing: '0.5px',
                    margin: 0,
                    background: 'transparent',
                    borderRadius: '10px',
                    padding: '0.7rem 0'
                  }}>📝 SECOND APPROVER - Final Review</h2>
                </div>
                <div style={{
                  background: 'rgba(255,255,255,0.97)',
                  borderRadius: '8px',
                  padding: '10px',
                  border: '1px solid rgba(255,255,255,0.8)'
                }}>
                  <SecondApproverSection load={load} onApprovalComplete={loadData} />
                </div>
              </section>
            ))
          )}
        </>
      )}

      {/* INVOICER ROLE CARD */}
      {currentRole === 'invoicer' && (
        <section style={{
          marginBottom: '1.2rem',
          background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
          borderRadius: '12px',
          padding: '3px',
          border: '1px solid #b91c1c',
          boxShadow: '0 4px 12px rgba(220, 38, 38, 0.13)',
          maxWidth: '90%',
          margin: '0 auto 1.2rem auto'
        }}>
          <h2 style={{
            fontSize: '1.05rem',
            fontWeight: 700,
            color: '#b91c1c',
            marginBottom: '0.5rem',
            textAlign: 'center',
            textShadow: '0 1px 2px rgba(0,0,0,0.1)',
            letterSpacing: '0.5px',
            margin: '0.5rem 0',
            background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
            borderRadius: '10px',
            padding: '0.7rem 0'
          }}>🧾 INVOICER - Generate Invoice</h2>
          <div style={{
            background: 'rgba(255,255,255,0.97)',
            borderRadius: '8px',
            padding: '10px',
            border: '1px solid rgba(255,255,255,0.8)'
          }}>
            {loads.filter(l => l.status === 'second_approved').length > 0 && (
              loads.filter(l => l.status === 'second_approved').map(load => (
                <InvoicerSection key={load.id} load={load} onInvoiceComplete={loadData} />
              ))
            )}
          </div>
        </section>
      )}

      {/* FINAL APPROVER ROLE CARD */}
      {currentRole === 'final_approver' && (
        <>
          {loads.filter(l => l.status === 'third_approved').length > 0 &&
            loads.filter(l => l.status === 'third_approved').map(load => (
              <section key={load.id} style={{
                background: 'linear-gradient(135deg, #d1fae5 0%, #bbf7d0 100%)',
                borderRadius: '12px',
                padding: '3px',
                border: '1px solid #047857',
                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.13)',
                marginBottom: '1.2rem',
                maxWidth: '90%',
                margin: '0 auto 1.2rem auto'
              }}>
                <h2 style={{
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  color: '#047857',
                  marginBottom: '0.5rem',
                  textAlign: 'center',
                  textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                  letterSpacing: '0.5px',
                  margin: '0.5rem 0',
                  background: 'linear-gradient(135deg, #d1fae5 0%, #bbf7d0 100%)',
                  borderRadius: '10px',
                  padding: '0.7rem 0'
                }}>📝 FINAL APPROVER - Sign Off</h2>
                <div style={{
                  background: 'rgba(255,255,255,0.97)',
                  borderRadius: '8px',
                  padding: '10px',
                  border: '1px solid rgba(255,255,255,0.8)'
                }}>
                  <FinalApproverSection load={load} onFinalApprovalComplete={loadData} />
                </div>
        </section>
            ))
          }
        </>
      )}

      {/* DRIVER ROLE MODAL */}
      {currentRole === 'driver' && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.45)',
          zIndex: 3000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '18px',
            boxShadow: '0 8px 32px 0 rgba(37,99,235,0.18)',
            padding: '0.8rem 0.5rem 0.7rem 0.5rem',
            maxWidth: 320,
            width: '95vw',
            position: 'relative',
          }}>
            <button onClick={() => setCurrentRole(null)} style={{
              position: 'absolute',
              top: 10,
              right: 10,
              background: 'rgba(255,255,255,0.7)',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.35rem',
              color: '#2563eb',
              boxShadow: '0 2px 8px 0 rgba(37,99,235,0.10)',
              cursor: 'pointer',
              transition: 'background 0.18s, color 0.18s, box-shadow 0.18s',
              outline: 'none',
              zIndex: 10,
            }}
              aria-label="Close driver modal"
            >
              ×
            </button>
            <DriverSection onUploadComplete={() => { setCurrentRole(null); handleDriverSubmit(); }} onTextractComplete={handleTextractComplete} />
      </div>
        </div>
      )}
      
        </div>
      </div>
    </div>
  )
}

export default App

