import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import NewBattle from './pages/NewBattle';
import BattleResults from './pages/BattleResults';
import History from './pages/History';
import Pricing from './pages/Pricing';
import Settings from './pages/Settings';
import AdminPanel from './pages/AdminPanel';
import Login from './pages/Login';
import OnboardingModal from './components/OnboardingModal';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { BattleProvider } from './contexts/BattleContext';

function App() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Show onboarding on first visit
  React.useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('pba_onboarding_seen');
    if (!hasSeenOnboarding) {
      setTimeout(() => setShowOnboarding(true), 2000);
    }
  }, []);

  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('pba_onboarding_seen', 'true');
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <AuthProvider>
          <Router>
            <BattleProvider>
              <ErrorBoundary>
                <Routes>
                  <Route path="/" element={<ErrorBoundary><LandingPage /></ErrorBoundary>} />
                  <Route path="/login" element={<ErrorBoundary><Login /></ErrorBoundary>} />
                  <Route path="/dashboard" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
                  <Route path="/battle/new" element={<ErrorBoundary><NewBattle /></ErrorBoundary>} />
                  <Route path="/battle/:id/results" element={<ErrorBoundary><BattleResults /></ErrorBoundary>} />
                  <Route path="/history" element={<ErrorBoundary><History /></ErrorBoundary>} />
                  <Route path="/pricing" element={<ErrorBoundary><Pricing /></ErrorBoundary>} />
                  <Route path="/settings" element={<ErrorBoundary><Settings /></ErrorBoundary>} />
                  <Route path="/admin" element={<ErrorBoundary><AdminPanel /></ErrorBoundary>} />
                </Routes>
              </ErrorBoundary>
              <Toaster 
                position="top-right"
                toastOptions={{
                  className: 'dark:bg-gray-800 dark:text-white',
                }}
              />
              <OnboardingModal 
                isOpen={showOnboarding} 
                onClose={handleCloseOnboarding} 
              />
            </BattleProvider>
          </Router>
        </AuthProvider>
      </div>
    </ThemeProvider>
  );
}

export default App;