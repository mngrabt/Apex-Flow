import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { hasAccess } from '../utils/accessControl';

export default function PrivateRoute() {
  const user = useAuthStore(state => state.user);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Allow access to protocol details and cash request details for everyone
  if (location.pathname.startsWith('/protocols/') || location.pathname.startsWith('/cash-requests/')) {
    return <Outlet />;
  }

  if (!hasAccess(user.id, location.pathname)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}