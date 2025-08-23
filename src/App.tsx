import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
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
      <AuthProvider>
        <BattleProvider>
          <Router>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/battle/new" element={<NewBattle />} />
                <Route path="/battle/:id/results" element={<BattleResults />} />
                <Route path="/history" element={<History />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/admin" element={<AdminPanel />} />
              </Routes>
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
            </div>
          </Router>
        </BattleProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;