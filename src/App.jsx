// src/App.jsx
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';

// Leaflet মার্কার আইকন ফিক্স
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
  const [currentLocation, setCurrentLocation] = useState([23.8103, 90.4125]); // Default Dhaka
  const [mySimulatedNumber, setMySimulatedNumber] = useState('01608296025');

  // আমাদের নতুন Node.js ব্যাকএন্ড থেকে লোকেশন ডাটা ফেচ করা
  const fetchLocationData = async (number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/location/${number}`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        const paths = data.map(p => [p.latitude, p.longitude]);
        setLocationHistory(paths);
        setCurrentLocation(paths[paths.length - 1]); // লেটেস্ট লোকেশন
      } else {
        alert("এই নম্বরের কোনো লোকেশন রেকর্ড পাওয়া যায়নি!");
        setLocationHistory([]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("ডাটা লোড করতে সমস্যা হয়েছে!");
    }
  };

  useEffect(() => {
    if (activeNumber) {
      fetchLocationData(activeNumber);
      
      // প্রতি ১০ সেকেন্ড পর পর স্বয়ংক্রিয়ভাবে ডাটা রিফ্রেশ করা (Real-time Feel)
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
  };

  // আমাদের নতুন ব্যাকএন্ড এপিআই-তে লোকেশন ডাটা পাঠানো
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
          const result = await response.json();
          if (response.ok) {
            alert(`${mySimulatedNumber} নম্বরের জন্য ডাটা পাঠানো হয়েছে!`);
          } else {
            alert("সার্ভার এরর: " + result.error);
          }
        } catch (error) {
          console.error("Error sending data:", error);
          alert("সার্ভারে ডাটা পাঠানো যায়নি!");
        }
      });
    } else {
      alert("জিপিএস সাপোর্ট করে না।");
    }
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '15px' }}>
      {/* ডিজাইন আগের মতোই থাকবে */}
      <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
        <h2>Custom Node.js + MongoDB Tracker</h2>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="text" 
            placeholder="মোবাইল নম্বর লিখুন" 
            value={searchNumber}
            onChange={(e) => setSearchNumber(e.target.value)}
            style={{ flex: 1, padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
          />
          <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Search</button>
        </form>
      </div>

      <div style={{ background: '#e9ecef', padding: '10px', borderRadius: '5px', marginBottom: '15px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <strong>সিমুলেটর:</strong>
        <input type="text" value={mySimulatedNumber} onChange={(e) => setMySimulatedNumber(e.target.value)} style={{ padding: '5px' }} />
        <button onClick={sendTestLocation} style={{ padding: '5px 10px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '3px' }}>লোকেশন পাঠান</button>
      </div>

      {activeNumber && <div style={{ marginBottom: '10px' }}>Active Tracking: <strong>{activeNumber}</strong></div>}

      <div style={{ height: '65vh', width: '100%', borderRadius: '10px', overflow: 'hidden' }}>
        <MapContainer center={currentLocation} zoom={15} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {locationHistory.length > 0 && (
            <Marker position={currentLocation} icon={defaultIcon}>
              <Popup>মোবাইল: {activeNumber}</Popup>
            </Marker>
          )}
          <Polyline positions={locationHistory} color="red" weight={4} />
        </MapContainer>
      </div>
    </div>
  );
}

export default App;