// src/App.jsx
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { collection, query, where, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from './firebase';
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

function App() {
  const [searchNumber, setSearchNumber] = useState(''); // সার্চ বক্সে টাইপ করা নম্বর
  const [activeNumber, setActiveNumber] = useState(''); // বর্তমানে যে নম্বরটি ম্যাপে দেখা যাচ্ছে
  const [locationHistory, setLocationHistory] = useState([]);
  const [currentLocation, setCurrentLocation] = useState([23.8103, 90.4125]); // Default: Dhaka

  // টেস্ট করার জন্য ডেমো মোবাইল নম্বর স্টেট
  const [mySimulatedNumber, setMySimulatedNumber] = useState('01711223344');

  // ফায়ারবেজ থেকে নির্দিষ্ট মোবাইল নম্বরের ডাটা ফিল্টার করে আনা
  useEffect(() => {
    if (!activeNumber) return; // কোনো নম্বর সার্চ না করলে ম্যাপ খালি থাকবে

    // শুধুমাত্র activeNumber এর ডাটা খোঁজার কুয়েরি
    const q = query(
      collection(db, "locations"), 
      where("phoneNumber", "==", activeNumber)
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedPoints = [];
      querySnapshot.forEach((doc) => {
        fetchedPoints.push({ id: doc.id, ...doc.data() });
      });

      // সময় অনুযায়ী ডাটাগুলো সর্ট (Sort) করা
      fetchedPoints.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      const paths = fetchedPoints.map(p => [p.latitude, p.longitude]);
      
      setLocationHistory(paths);
      if (paths.length > 0) {
        setCurrentLocation(paths[paths.length - 1]); // সর্বশেষ লোকেশন সেট করা
      } else {
        alert("এই নম্বরের কোনো লোকেশন রেকর্ড পাওয়া যায়নি!");
      }
    });

    return () => unsubscribe();
  }, [activeNumber]);

  // সার্চ বাটন ক্লিক হ্যান্ডলার
  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchNumber.trim()) {
      alert("অনুগ্রহ করে একটি মোবাইল নম্বর লিখুন!");
      return;
    }
    setActiveNumber(searchNumber.trim());
  };

  // টেস্ট ডাটা পাঠানোর ফাংশন (মোবাইল নম্বরসহ)
  const sendTestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        
        // ফায়ারবেজে মোবাইল নম্বরসহ ডাটা পাঠানো
        addDoc(collection(db, "locations"), {
          phoneNumber: mySimulatedNumber,
          latitude: latitude,
          longitude: longitude,
          timestamp: new Date().toISOString()
        });
        alert(`${mySimulatedNumber} নম্বরের জন্য জিপিএস ডাটা পাঠানো হয়েছে!`);
      }, (error) => {
        alert("লোকেশন অ্যাক্সেস করা যায়নি!");
      });
    } else {
      alert("জিপিএস সাপোর্ট করে না।");
    }
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '15px' }}>
      
      {/* হেডার এবং সার্চ বক্স */}
      <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '15px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h2 style={{ margin: '0 0 15px 0', color: '#333' }}>Mobile Number Tracker</h2>
        
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="text" 
            placeholder="মোবাইল নম্বর দিয়ে খুঁজুন (যেমন: 01711223344)" 
            value={searchNumber}
            onChange={(e) => setSearchNumber(e.target.value)}
            style={{ flex: 1, padding: '10px', fontSize: '16px', borderRadius: '5px', border: '1px solid #ccc' }}
          />
          <button 
            type="submit" 
            style={{ padding: '10px 20px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}
          >
            Search
          </button>
        </form>
      </div>

      {/* টেস্ট ডাটা সিমুলেটর (পরীক্ষা করার সুবিধার্থে) */}
      <div style={{ background: '#e9ecef', padding: '10px', borderRadius: '5px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <strong>সিমুলেটর:</strong>
        <input 
          type="text" 
          value={mySimulatedNumber}
          onChange={(e) => setMySimulatedNumber(e.target.value)}
          placeholder="টেস্ট নম্বর"
          style={{ padding: '5px', borderRadius: '3px', border: '1px solid #ccc' }}
        />
        <button onClick={sendTestLocation} style={{ padding: '5px 10px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>
          লোকেশন ডাটা পাঠান
        </button>
      </div>

      {/* বর্তমানে কার লোকেশন দেখা যাচ্ছে তা ট্র্যাকিং স্ট্যাটাস */}
      {activeNumber && (
        <div style={{ marginBottom: '10px', color: '#555' }}>
          Showing tracking history for: <strong>{activeNumber}</strong>
        </div>
      )}

      {/* ম্যাপ */}
      <div style={{ height: '70vh', width: '100%', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
        <MapContainer center={currentLocation} zoom={15} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* সর্বশেষ লোকেশন মার্কার */}
          {locationHistory.length > 0 && (
            <Marker position={currentLocation} icon={defaultIcon}>
              <Popup>
                মোবাইল নম্বর: {activeNumber} <br />
                সর্বশেষ অবস্থান: <br />
                Lat: {currentLocation[0].toFixed(5)}, Lng: {currentLocation[1].toFixed(5)}
              </Popup>
            </Marker>
          )}

          {/* হিস্ট্রির রাস্তা দেখানোর জন্য লাইন */}
          <Polyline positions={locationHistory} color="blue" weight={4} opacity={0.7} />
        </MapContainer>
      </div>
    </div>
  );
}

export default App;