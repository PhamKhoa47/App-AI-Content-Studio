import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { User } from 'firebase/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  user: User | null;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, user }) => {
  const location = useLocation();

  if (!user) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
