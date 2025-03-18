require('dotenv').config();
const express = require('express');
const cors = require('cors');
const workOrderRoutes = require('./routes/workOrderRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/work-orders', workOrderRoutes);

// Error handling
app.use(errorHandler);

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
}); 