import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';

import markerIconPng from "leaflet/dist/images/marker-icon.png";
import markerShadowPng from "leaflet/dist/images/marker-shadow.png";
const defaultIcon = L.icon({
    iconUrl: markerIconPng,
    shadowUrl: markerShadowPng,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

const API_BASE_URL = "https://tracker-web-2hon.onrender.com/api"; 

function App() {
  const [searchNumber, setSearchNumber] = useState('');
  const [activeNumber, setActiveNumber] = useState('');
  const [locationHistory, setLocationHistory] = useState([]);
  const [currentLocation, setCurrentLocation] = useState([23.8103, 90.4125]);
  const [mySimulatedNumber, setMySimulatedNumber] = useState('01608296025');
  const [readableAddress, setReadableAddress] = useState('ঠিকানা খোঁজা হচ্ছে...');
  const [latestData, setLatestData] = useState(null);
  const [operatorStatus, setOperatorStatus] = useState('READY / IDLE');

  const getReadableAddress = async (lat, lng) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      const data = await response.json();
      if (data && data.display_name) {
        setReadableAddress(data.display_name);
      } else {
        setReadableAddress("ঠিকানা পাওয়া যায়নি");
      }
    } catch (error) {
      setReadableAddress("ঠিকানা লোড করতে ব্যর্থ");
    }
  };

  const fetchLocationData = async (number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/location/${number}`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        const paths = data.map(p => [p.latitude, p.longitude]);
        setLocationHistory(paths);
        
        const latest = data[data.length - 1];
        setLatestData(latest);
        setCurrentLocation([latest.latitude, latest.longitude]);
        getReadableAddress(latest.latitude, latest.longitude);
      } else {
        alert("এই নম্বরের কোনো ট্র্যাকিং রেকর্ড পাওয়া যায়নি!");
        setLocationHistory([]);
        setLatestData(null);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (activeNumber) {
      fetchLocationData(activeNumber);
      const interval = setInterval(() => {
        fetchLocationData(activeNumber);
      }, 10000); 
      return () => clearInterval(interval);
    }
  }, [activeNumber]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchNumber.trim()) return;
    setActiveNumber(searchNumber.trim());
    setOperatorStatus('READY / IDLE');
  };

  const triggerOperatorTrack = async () => {
    if (!activeNumber) {
      alert("অনুগ্রহ করে প্রথমে একটি টার্গেট নম্বর সার্চ করুন!");
      return;
    }
    
    setOperatorStatus("AWAITING CONSENT...");
    
    try {
      const response = await fetch(`${API_BASE_URL}/operator-track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: activeNumber })
      });
      const result = await response.json();
      
      if (response.ok) {
        setOperatorStatus("SUCCESS (LOCATED)");
        fetchLocationData(activeNumber);
      } else {
        setOperatorStatus("FAILED (REFUSED)");
        alert(result.error || "অপারেটর থেকে রেসপন্স পাওয়া যায়নি।");
      }
    } catch (error) {
      setOperatorStatus("CONNECTION ERROR");
      console.error(error);
    }
  };

  const sendTestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(`${API_BASE_URL}/location`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phoneNumber: mySimulatedNumber,
              latitude: latitude,
              longitude: longitude
            })
          });
          if (response.ok) {
            alert(`মোবাইল নম্বর ${mySimulatedNumber} এর লাইভ লোকেশন মঙ্গোডিবি-তে সেভ করা হয়েছে!`);
            if (activeNumber === mySimulatedNumber) fetchLocationData(mySimulatedNumber);
          }
        } catch (error) {
          alert("ডাটা পাঠাতে সমস্যা হয়েছে!");
        }
      });
    } else {
      alert("জিপিএস পারমিশন দিন!");
    }
  };

  return (
    <div style={{ fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif', padding: '15px', backgroundColor: '#1a1d20', color: '#fff', minHeight: '100vh' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #343a40', paddingBottom: '10px', marginBottom: '15px' }}>
        <h2 style={{ margin: 0, color: '#00f0ff', letterSpacing: '1px' }}>🎯 CYBER TRACKING CONTROL CENTER</h2>
        <span style={{ fontSize: '14px', color: '#6c757d' }}>SYSTEM STATUS: <span style={{ color: '#28a745', fontWeight: 'bold' }}>ONLINE</span></span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
        <div style={{ backgroundColor: '#212529', padding: '15px', borderRadius: '8px', border: '1px solid #343a40' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#ffc107' }}>টার্গেট মোবাইল নম্বর অনুসন্ধান (Search Target)</h4>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              placeholder="মোবাইল নম্বর দিয়ে সার্চ দিন..." 
              value={searchNumber}
              onChange={(e) => setSearchNumber(e.target.value)}
              style={{ flex: 1, padding: '10px', borderRadius: '5px', border: '1px solid #495057', backgroundColor: '#343a40', color: '#fff', fontSize: '14px' }}
            />
            <button type="submit" style={{ padding: '10px 25px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>SEARCH TARGET</button>
          </form>
        </div>

        <div style={{ backgroundColor: '#212529', padding: '15px', borderRadius: '8px', border: '1px solid #343a40' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#00f0ff' }}>জিপিএস ডিভাইস সিমুলেটর (GPS Data Feed)</h4>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input 
              type="text" 
              value={mySimulatedNumber} 
              onChange={(e) => setMySimulatedNumber(e.target.value)} 
              style={{ padding: '10px', borderRadius: '5px', border: '1px solid #495057', backgroundColor: '#343a40', color: '#fff' }}
            />
            <button onClick={sendTestLocation} style={{ padding: '10px 20px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>লোকেশন ডাটা ফিড করুন</button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '15px' }}>
        
        <div style={{ height: '65vh', borderRadius: '10px', overflow: 'hidden', border: '2px solid #00f0ff', boxShadow: '0 0 15px rgba(0, 240, 255, 0.2)' }}>
          <MapContainer center={currentLocation} zoom={15} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png" 
            />
            {locationHistory.length > 0 && (
              <Marker position={currentLocation} icon={defaultIcon}>
                <Popup style={{ color: '#000' }}>টার্গেট মোবাইল: {activeNumber}</Popup>
              </Marker>
            )}
            <Polyline positions={locationHistory} color="#ff0055" weight={5} opacity={0.8} />
          </MapContainer>
        </div>

        <div style={{ backgroundColor: '#212529', padding: '15px', borderRadius: '10px', border: '1px solid #343a40', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <h3 style={{ margin: 0, color: '#ff0055', borderBottom: '1px solid #343a40', paddingBottom: '5px' }}>⚡ TARGET REPORT</h3>
          
          {activeNumber ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
              <div>
                <span style={{ color: '#6c757d', block: 'inline' }}>TARGET NO:</span>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffc107' }}>{activeNumber}</div>
              </div>

              <div style={{ background: '#1a1d20', padding: '12px', borderRadius: '5px', border: '1px solid #00f0ff' }}>
                <span style={{ color: '#00f0ff', fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>📡 MOBILE OPERATOR LBS INTERCEPT</span>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px' }}>
                  <span style={{ color: '#6c757d' }}>GATEWAY STATUS:</span>
                  <span style={{ color: operatorStatus.includes('SUCCESS') ? '#28a745' : operatorStatus.includes('AWAITING') ? '#ffc107' : '#dc3545', fontWeight: 'bold' }}>{operatorStatus}</span>
                </div>
                <button onClick={triggerOperatorTrack} style={{ width: '100%', padding: '8px', backgroundColor: '#00f0ff', color: '#000', border: 'none', borderRadius: '4px', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer' }}>
                  PING TELECOM GATEWAY (USSD)
                </button>
              </div>
              
              <div>
                <span style={{ color: '#6c757d' }}>CURRENT ADDDRESS (লাইভ ঠিকানা):</span>
                <div style={{ color: '#00f0ff', marginTop: '3px', lineHeight: '1.4', fontWeight: 'bold' }}>{readableAddress}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: '#1a1d20', padding: '10px', borderRadius: '5px' }}>
                <div>
                  <span style={{ color: '#6c757d', fontSize: '11px' }}>LATITUDE</span>
                  <div style={{ color: '#fff', fontWeight: 'bold' }}>{currentLocation[0].toFixed(6)}</div>
                </div>
                <div>
                  <span style={{ color: '#6c757d', fontSize: '11px' }}>LONGITUDE</span>
                  <div style={{ color: '#fff', fontWeight: 'bold' }}>{currentLocation[1].toFixed(6)}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ background: '#1a1d20', padding: '8px', borderRadius: '5px', textAlign: 'center' }}>
                  <span style={{ color: '#6c757d', fontSize: '11px' }}>EST. SPEED</span>
                  <div style={{ color: '#28a745', fontWeight: 'bold', fontSize: '16px' }}>
                    {locationHistory.length > 1 ? "12 km/h" : "0 km/h"}
                  </div>
                </div>
                <div style={{ background: '#1a1d20', padding: '8px', borderRadius: '5px', textAlign: 'center' }}>
                  <span style={{ color: '#6c757d', fontSize: '11px' }}>BATTERY</span>
                  <div style={{ color: '#28a745', fontWeight: 'bold', fontSize: '16px' }}>82%</div>
                </div>
              </div>

              <div>
                <span style={{ color: '#6c757d' }}>LAST PING TIME (সর্বশেষ আপডেট):</span>
                <div style={{ color: '#fff', marginTop: '2px' }}>
                  {latestData ? new Date(latestData.timestamp).toLocaleString() : 'N/A'}
                </div>
              </div>

              <div style={{ background: '#1a1d20', padding: '10px', borderRadius: '5px', maxHeight: '100px', overflowY: 'auto' }}>
                <span style={{ color: '#6c757d', fontSize: '11px' }}>LOG HISTORY (PING COUNT: {locationHistory.length})</span>
                <div style={{ fontSize: '12px', marginTop: '5px', color: '#a1a1a1' }}>
                  {locationHistory.map((log, index) => (
                    <div key={index} style={{ marginBottom: '3px' }}>
                      🟢 Ping #{index+1}: {log[0].toFixed(4)}, {log[1].toFixed(4)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ color: '#6c757d', textAlign: 'center', marginTop: '50px' }}>
              অনুসন্ধানের জন্য উপরে একটি mobile নম্বর লিখে সার্চ করুন।
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default App;