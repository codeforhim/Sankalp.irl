const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const mapRoutes = require('./routes/mapRoutes');
const publicRoutes = require('./routes/publicRoutes');
const welfareRoutes = require('./routes/welfareRoutes');
const communicationRoutes = require('./routes/communicationRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/auth', authRoutes);
app.use('/complaints', complaintRoutes);
app.use('/map', mapRoutes);
app.use('/public', publicRoutes);
app.use('/welfare', welfareRoutes);
app.use('/communication', communicationRoutes);

// Basic Route for Healthcheck
app.get('/', (req, res) => {
    res.send('AI Governance API is running with PostGIS enabled');
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
