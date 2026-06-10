import { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Search } from 'lucide-react';
import '../styles/map-picker.css';

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const LocationMarker = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position ? <Marker position={position} /> : null;
};

const MapPicker = ({ location, onLocationChange }) => {
  const [position, setPosition] = useState(
    location ? { lat: location.lat, lng: location.lng } : null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const mapRef = useRef(null);

  // Default center: Tashkent, Uzbekistan
  const defaultCenter = [41.2995, 69.2401];

  const handlePositionChange = (pos) => {
    setPosition(pos);
    if (onLocationChange) {
      onLocationChange({ lat: pos.lat, lng: pos.lng });
    }
  };

  const handleSearch = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const data = await response.json();
      if (data.length > 0) {
        const { lat, lon } = data[0];
        const newPos = { lat: parseFloat(lat), lng: parseFloat(lon) };
        handlePositionChange(newPos);
        if (mapRef.current) {
          mapRef.current.flyTo(newPos, 16);
        }
      }
    } catch (err) {
      console.error('Search error:', err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch(e);
    }
  };

  return (
    <div className="map-picker">
      <div className="map-search-form">
        <div className="map-search-input-wrapper">
          <Search size={16} className="map-search-icon" />
          <input
            type="text"
            placeholder="Manzilni qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="map-search-input"
          />
        </div>
        <button type="button" className="map-search-btn" onClick={handleSearch}>
          Qidirish
        </button>
      </div>

      <div className="map-container">
        <MapContainer
          center={position || defaultCenter}
          zoom={13}
          ref={mapRef}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={position} setPosition={handlePositionChange} />
        </MapContainer>
      </div>

      {position && (
        <div className="map-coords">
          <MapPin size={14} />
          <span>
            {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
          </span>
        </div>
      )}
    </div>
  );
};

export default MapPicker;
