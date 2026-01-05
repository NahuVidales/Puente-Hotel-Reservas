import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  requiereResponsable?: boolean;
}

export function ProtectedRoute({ requiereResponsable = false }: ProtectedRouteProps) {
  const { isAuthenticated, isResponsable, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiereResponsable && !isResponsable) {
    return <Navigate to="/cliente" replace />;
  }

  return <Outlet />;
}
