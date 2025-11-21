import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import LoadingSpinner from './components/LoadingSpinner';
import Navbar from './components/Navbar';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import Applications from './pages/Applications/Applications';
import ApplyLater from './pages/ApplyLater/ApplyLater';
import JobsList from './pages/Jobs/JobsList';
import JobDetail from './pages/Jobs/JobDetail';
import AddJob from './pages/Admin/AddJob';
import SchedulerTest from './pages/SchedulerTest';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return user ? children : <Navigate to="/login" />;
};

// Public Route Component (redirect if already logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return !user ? children : <Navigate to="/dashboard" />;
};

function AppContent() {
  const { user } = useAuth();

  return (
    <div className="App">
      {user && <Navbar />}
      <main className={user ? 'main-with-navbar' : 'main-full'}>
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } 
          />
          
          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/applications" 
            element={
              <ProtectedRoute>
                <Applications />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/apply-later" 
            element={
              <ProtectedRoute>
                <ApplyLater />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/jobs" 
            element={
              <ProtectedRoute>
                <JobsList />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/jobs/:id" 
            element={
              <ProtectedRoute>
                <JobDetail />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/add-job" 
            element={
              <ProtectedRoute>
                <AddJob />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/scheduler-test" 
            element={
              <ProtectedRoute>
                <SchedulerTest />
              </ProtectedRoute>
            } 
          />
          
          {/* Default Route */}
          <Route 
            path="/" 
            element={<Navigate to={user ? "/dashboard" : "/login"} />} 
          />
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;