import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import HotelBusinessBuyersGuide from './components/HotelBusinessBuyersGuide';

const theme = createTheme();

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="App">
        <HotelBusinessBuyersGuide />
      </div>
    </ThemeProvider>
  );
}

export default App;