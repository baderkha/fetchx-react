import React from 'react';
import { createRoot } from 'react-dom/client';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import App from './App';
import './styles.css';

const muiTheme = createTheme({
  shape: { borderRadius: 0 },
  typography: {
    fontFamily:
      '"Avenir Next", "SF Pro Display", "SF Pro Text", "Plus Jakarta Sans", Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize: 12,
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiButton: { styleOverrides: { root: { minHeight: 28 } } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          boxShadow: 'none',
          '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
          '&:hover .MuiOutlinedInput-notchedOutline': { border: 'none' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { border: 'none' },
        },
      },
    },
    MuiPaper: { styleOverrides: { root: { boxShadow: 'none', border: 0 } } },
    MuiDialog: { styleOverrides: { paper: { boxShadow: 'none', border: 0 } } },
  },
});

createRoot(document.getElementById('root')).render(
  <ThemeProvider theme={muiTheme}>
    <CssBaseline />
    <App />
  </ThemeProvider>
);
