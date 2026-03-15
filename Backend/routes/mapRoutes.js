const express = require('express');
const router = express.Router();
const mapController = require('../controllers/mapController');

// Map Route - Could be public, or restricted. Making it public for easy consumption by front page maps
router.get('/city/:city_id', mapController.getMapDataByCity);

// Ward Geometry GeoJSON
router.get('/wards/:city_id', mapController.getWardGeometries);

// Heatmap Data endpoints (returns [lat, lng, intensity])
router.get('/heatmap/:target_type/:target_id', mapController.getHeatmapData);

module.exports = router;
