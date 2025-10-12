import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
  fallback?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole, 
  fallback 
}) => {
  const { currentUser, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!currentUser) {
    return fallback || (
      <div className="access-denied">
        <h2>Access Denied</h2>
        <p>Please sign in to access this page.</p>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="access-denied">
        <h2>Profile Not Found</h2>
        <p>Your user profile could not be loaded. This might be due to:</p>
        <ul style={{ textAlign: 'left', margin: '10px 0' }}>
          <li>Firestore permissions not allowing profile creation</li>
          <li>Network connectivity issues</li>
          <li>Database configuration problems</li>
        </ul>
        <p>Please check the browser console for detailed error messages and contact support.</p>
        <button 
          onClick={() => window.location.reload()} 
          style={{
            marginTop: '10px',
            padding: '8px 16px',
            backgroundColor: '#3513e1',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  // Check role requirements
  if (requiredRole) {
    const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    
    if (!requiredRoles.includes(userProfile.role)) {
      return fallback || (
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>
            You need {requiredRoles.length > 1 ? 'one of the following roles' : 'the'} {' '}
            <strong>{requiredRoles.join(' or ')}</strong> role to access this page.
          </p>
          <p>Your current role: <strong>{userProfile.role}</strong></p>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
