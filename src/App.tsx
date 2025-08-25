import React from 'react';
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
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { BattleProvider } from './contexts/BattleContext';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <AuthProvider>
            <Router>
              <BattleProvider>
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
                <Toaster position="top-right" />
              </BattleProvider>
            </Router>
          </AuthProvider>
        </div>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;