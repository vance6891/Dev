import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // or loading spinner
  }

  return user ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;