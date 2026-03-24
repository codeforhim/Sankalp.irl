import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, GeoJSON, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, Navigation, CheckCircle, AlertTriangle } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

// Fix Leaflet's default icon path issues in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// A component to handle map clicks and drop a pin
const LocationMarker = ({ position, setPosition }) => {
    useMapEvents({
        click(e) {
            setPosition(e.latlng);
        },
    });

    return position === null ? null : (
        <Marker position={position}></Marker>
    );
};

const LocationPickerModal = ({ onClose, forceOpen = false }) => {
    const { user, updateUser } = useAuth();
    // Default center to Delhi
    const defaultCenter = [28.6139, 77.2090];
    const [position, setPosition] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [wardPolygons, setWardPolygons] = useState(null);
    const [selectedWardInfo, setSelectedWardInfo] = useState(null);

    // Fetch ward boundaries on mount
    useEffect(() => {
        const fetchWards = async () => {
            try {
                // Delhi City ID is 2 in this database
                const res = await api.get('/map/wards/2');
                setWardPolygons(res.data);
            } catch (err) {
                console.error("Failed to load ward boundaries:", err);
            }
        };
        fetchWards();
    }, []);

    const handleConfirm = async () => {
        if (!position) return;
        setLoading(true);
        setResult(null);

        try {
            const res = await api.patch('/auth/user/update-location', {
                latitude: position.lat,
                longitude: position.lng
            });

            setResult({ success: true, message: res.data.message, ward: res.data.ward_id });
            
            // Update auth context so the rest of the app knows the ward_id
            if (updateUser) {
                updateUser({
                    latitude: position.lat,
                    longitude: position.lng,
                    ward_id: res.data.ward_id,
                    ward_name: res.data.ward_name 
                });
            }

            // If it was forced, we wait a second before closing so they see the success message
            setTimeout(() => {
                onClose();
            }, 2000);

        } catch (err) {
            setResult({ success: false, message: err.response?.data?.message || 'Failed to update location' });
        } finally {
            setLoading(false);
        }
    };

    const handleDetectLocation = () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setPosition({
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude
                    });
                },
                (err) => {
                    console.error("Geolocation error:", err);
                    alert("Could not get your location. Please click on the map manually.");
                }
            );
        } else {
            alert("Geolocation is not supported by your browser");
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
                
                {/* Header */}
                <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center">
                            <MapPin className="w-5 h-5 mr-2 text-indigo-400" />
                            {forceOpen ? "Welcome! Please Set Your Location" : "Update Your Location"}
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">
                            {forceOpen 
                                ? "To assure complaints route to the correct municipal ward, we need your primary location."
                                : "Click on the map or use GPS to set your primary ward."}
                        </p>
                    </div>
                </div>

                {/* Map Area */}
                <div className="h-[400px] w-full relative bg-slate-800">
                    <MapContainer 
                        center={defaultCenter} 
                        zoom={11} 
                        style={{ height: '100%', width: '100%' }}
                        className="z-0"
                        preferCanvas={true}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                            crossOrigin={true}
                        />
                        {wardPolygons && (
                            <GeoJSON 
                                data={wardPolygons} 
                                style={{
                                    color: '#FFFFFF', // Bright White for high contrast
                                    weight: 2,
                                    opacity: 0.9,
                                    fillColor: '#4f46e5',
                                    fillOpacity: 0.05,
                                }}
                                onEachFeature={(feature, layer) => {
                                    if (feature.properties && feature.properties.ward_id) {
                                        layer.bindTooltip(`${feature.properties.name || feature.properties.ward_id}`, {
                                            permanent: true, // Always visible like admin side
                                            direction: 'center',
                                            className: '!bg-[#1F2937]/80 !backdrop-blur-sm !border !border-white/20 !text-white !font-bold !text-[10px] !rounded-md !px-2 !py-0.5 !shadow-xl'
                                        });

                                        layer.on({
                                            mouseover: (e) => {
                                                const l = e.target;
                                                l.setStyle({ fillOpacity: 0.4, weight: 3, color: '#FF9933' });
                                            },
                                            mouseout: (e) => {
                                                const l = e.target;
                                                l.setStyle({ fillOpacity: 0.05, weight: 2, color: '#4f46e5' });
                                            },
                                            click: (e) => {
                                                setPosition(e.latlng);
                                                setSelectedWardInfo({
                                                    ward_id: feature.properties.ward_id,
                                                    name: feature.properties.name
                                                });
                                                // Prevent event from bubbling to map click
                                                L.DomEvent.stopPropagation(e);
                                            }
                                        });
                                    }
                                }}
                            />
                        )}
                        <LocationMarker position={position} setPosition={(latlng) => {
                            setPosition(latlng);
                            setSelectedWardInfo(null); // Reset ward info if they click outside a polygon
                        }} />
                    </MapContainer>

                    {/* Overlay GPS Button */}
                    <button 
                        onClick={handleDetectLocation}
                        className="absolute bottom-4 left-4 z-[9999] bg-white text-slate-800 px-4 py-2 rounded-xl font-bold text-sm shadow-lg border border-slate-200 flex items-center hover:bg-slate-100 transition"
                    >
                        <Navigation className="w-4 h-4 mr-2 text-indigo-500" />
                        Use My GPS
                    </button>
                </div>

                {/* Footer Controls */}
                <div className="p-5 border-t border-slate-800 bg-slate-900 flex flex-col space-y-4">
                    
                    {result && (
                        <div className={`p-3 rounded-lg flex items-start text-sm ${result.success ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                            {result.success ? <CheckCircle className="w-4 h-4 mr-2 mt-0.5 shrink-0" /> : <AlertTriangle className="w-4 h-4 mr-2 mt-0.5 shrink-0" />}
                            <div>
                                <p className="font-bold">{result.success ? `Success: Assigned to Ward ${result.ward}` : 'Error'}</p>
                                <p className="opacity-80">{result.message}</p>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between items-center">
                        <div className="text-sm font-medium">
                            {position ? (
                                <div className="flex flex-col">
                                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                                        <CheckCircle className="w-4 h-4" /> Location Selected
                                    </span>
                                    <span className="text-xs text-slate-300 font-medium">
                                        {selectedWardInfo ? `${selectedWardInfo.name}` : `Searching ward...`}
                                    </span>
                                </div>
                            ) : (
                                <span className="text-amber-500 flex items-center">
                                    <AlertTriangle className="w-4 h-4 mr-2" />
                                    No location selected
                                </span>
                            )}
                        </div>
                        <div className="flex gap-3">
                            {!forceOpen && (
                                <button 
                                    onClick={onClose}
                                    className="px-5 py-2.5 rounded-xl font-semibold text-sm text-slate-300 hover:bg-slate-800 transition"
                                >
                                    Cancel
                                </button>
                            )}
                            <button 
                                onClick={handleConfirm}
                                disabled={!position || loading || result?.success}
                                className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition shadow-lg ${!position || loading || result?.success ? 'bg-indigo-900/50 text-indigo-300 cursor-not-allowed border border-indigo-500/30' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20'}`}
                            >
                                {loading ? 'Saving...' : 'Confirm Location'}
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default LocationPickerModal;
