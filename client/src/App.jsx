import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import MaintenanceNotice from './components/MaintenanceNotice';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import RecipeDetail from './pages/RecipeDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import ContributorDashboard from './pages/ContributorDashboard';
import ExplorerDashboard from './pages/ExplorerDashboard';

export default function App() {
  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
          <div className="flex flex-col min-h-screen bg-stone-50 text-stone-900 selection:bg-orange-500 selection:text-white">
            <MaintenanceNotice />
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* Public & Explorer Browsing Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/recipes/:id" element={<RecipeDetail />} />

                {/* Authentication Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Role Protected Dashboards */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/contributor"
                  element={
                    <ProtectedRoute allowedRoles={['contributor', 'admin']}>
                      <ContributorDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/explorer"
                  element={
                    <ProtectedRoute allowedRoles={['explorer', 'admin']}>
                      <ExplorerDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
}
