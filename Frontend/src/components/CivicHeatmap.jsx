import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat'; // imports leaflet.heat plugin onto L.heatLayer
import 'leaflet/dist/leaflet.css';
import api from '../utils/api';

// A sub-component that adds the heat layer using useMap hook
const HeatLayer = ({ points }) => {
    const map = useMap();

    useEffect(() => {
        if (!points || points.length === 0) return;

        const heat = L.heatLayer(points, {
            radius: 25,
            blur: 15,
            maxZoom: 14,
            gradient: {
                0.2: '#0ea5e9', // Sky blue for resolved
                0.4: '#10b981', // Emerald for flagged/review
                0.6: '#f59e0b', // Amber for in progress
                0.8: '#ef4444', // Red for reported/high intensity
                1.0: '#9f1239'  // Rose dark
            }
        }).addTo(map);

        return () => {
            map.removeLayer(heat);
        };
    }, [map, points]);

    return null;
};

// Component to handle auto-zooming to a specific bounding box
const MapFitter = ({ bounds }) => {
    const map = useMap();
    useEffect(() => {
        if (bounds) {
            map.fitBounds(bounds, { padding: [20, 20] });
        }
    }, [map, bounds]);
    return null;
};

const CivicHeatmap = ({ targetType, targetId, showPolygons = true }) => {
    const [points, setPoints] = useState([]);
    const [geoJson, setGeoJson] = useState(null);
    const [bounds, setBounds] = useState(null);
    const [loading, setLoading] = useState(true);

    const defaultCenter = [28.6139, 77.2090]; // Delhi

    useEffect(() => {
        const fetchMapData = async () => {
            if (!targetId && targetType !== 'city') return;
            setLoading(true);
            try {
                // 1. Fetch Heatmap point data
                const heatRes = await api.get(`/map/heatmap/${targetType}/${targetId}`);
                setPoints(heatRes.data); // Array of [lat, lng, intensity]

                // 2. Fetch Polygon data if requested
                if (showPolygons) {
                    if (targetType === 'city') {
                        const geoRes = await api.get(`/map/wards/${targetId}`);
                        setGeoJson(geoRes.data);
                        // Fit bounds to entire city isn't provided directly by the endpoint, 
                        // so we just rely on default center and zoom for city
                    }
                    // To do a single ward geometry, we could add a new endpoint, 
                    // but for simplicity, we'll fetch all city wards and filter out the target ward
                    else if (targetType === 'ward') {
                        // Fetch Delhi (City ID 2) ward boundaries
                        const geoRes = await api.get(`/map/wards/2`);

                        // Filter for just this ward
                        const feature = geoRes.data.features.find(f => f.properties.ward_id === targetId);

                        if (feature) {
                            setGeoJson({
                                type: 'FeatureCollection',
                                features: [feature]
                            });

                            // Calculate bounds manually from coordinates
                            // GeoJSON Polygon coordinates: [[[lng,lat], [lng,lat]...]]
                            let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
                            feature.geometry.coordinates[0].forEach(([lng, lat]) => {
                                if (lat < minLat) minLat = lat;
                                if (lat > maxLat) maxLat = lat;
                                if (lng < minLng) minLng = lng;
                                if (lng > maxLng) maxLng = lng;
                            });
                            setBounds([[minLat, minLng], [maxLat, maxLng]]);
                        }
                    }
                }
            } catch (err) {
                console.error("Map Data fetch error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchMapData();
    }, [targetType, targetId, showPolygons]);

    if (loading) {
        return <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-500 rounded-xl border border-slate-700">Loading Map Data...</div>;
    }

    // Styling for the GeoJSON ward boundaries
    const geoJsonStyle = {
        color: '#FFFFFF', // Bright White
        weight: 2,
        opacity: 0.9,
        fillColor: '#4f46e5',
        fillOpacity: 0.05
    };

    const onEachFeature = (feature, layer) => {
        if (feature.properties && feature.properties.ward_id) {
            layer.bindTooltip(`${feature.properties.name || feature.properties.ward_id}`, {
            permanent: true, // Permanent labels like admin view
            direction: 'center',
            className: '!bg-[#1F2937]/80 !backdrop-blur-sm !border !border-white/20 !text-white !font-bold !text-[10px] !rounded-md !px-2 !py-0.5 !shadow-xl'
        });
        }
    };

    return (
        <MapContainer
            center={defaultCenter}
            zoom={11}
            style={{ height: '100%', width: '100%', background: '#0f172a' }}
            className="rounded-xl overflow-hidden shadow-inner"
            preferCanvas={true}
        >
            <TileLayer
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                crossOrigin={true}
            />
            {geoJson && <GeoJSON data={geoJson} style={geoJsonStyle} onEachFeature={onEachFeature} />}
            {points.length > 0 && <HeatLayer points={points} />}
            {bounds && <MapFitter bounds={bounds} />}
        </MapContainer>
    );
};

export default CivicHeatmap;
