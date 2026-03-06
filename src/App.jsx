import React from 'react';
import { FetchXProvider } from './context/FetchXContext';
import { MainPage } from './pages/MainPage';

/**
 * App.jsx - Refactored from monolith to clean Provider/Main layout.
 */
function App() {
  return (
    <FetchXProvider>
      <MainPage />
    </FetchXProvider>
  );
}

export default App;
