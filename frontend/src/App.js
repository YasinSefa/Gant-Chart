import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Alert } from '@mui/material';
import axios from 'axios';
import GantChart from './components/GantChart';
import Search from './components/Search';

function App() {
  const [data, setData] = useState([]);
  const [highlightedOrder, setHighlightedOrder] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  console.log(data);

  const fetchData = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/work-orders');
      setData(response.data);
    } catch (error) {
      setError('Error fetching data from the server');
      console.error('Error:', error);
    }
  };

  const handleSearch = async (orderNumber) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/work-orders/${orderNumber}`);
      if (response.data.length > 0) {
        setHighlightedOrder(orderNumber);
        setError(null);
      } else {
        setError('Work order not found');
        setHighlightedOrder(null);
      }
    } catch (error) {
      setError('Error searching for work order');
      setHighlightedOrder(null);
      console.error('Error:', error);
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Production Planning Gantt Chart
        </Typography>

        <Search onSearch={handleSearch} />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <GantChart data={data} highlightedOrder={highlightedOrder} />
      </Box>
    </Container>
  );
}

export default App;
