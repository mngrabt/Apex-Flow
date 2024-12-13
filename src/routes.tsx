import { useEffect } from 'react';
import { Routes as RouterRoutes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import { useRequestStore } from './store/request';
import { useTenderStore } from './store/tender';
import { useProtocolStore } from './store/protocol';
import { useArchiveStore } from './store/archive';
import { useCalendarStore } from './store/calendar';
import { useTaskStore } from './store/task';
import { useSupplierStore } from './store/supplier';
import { useSupplierApplicationStore } from './store/supplierApplication';

// Components
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import ApplicationDetails from './components/applications/ApplicationDetails';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Requests from './pages/Requests';
import Tenders from './pages/Tenders';
import TenderDetails from './pages/TenderDetails';
import Protocols from './pages/Protocols';
import ProtocolDetails from './pages/ProtocolDetails';
import Archive from './pages/Archive';
import Finances from './pages/Finances';
import Calendar from './pages/Calendar';
import Database from './pages/Database';
import Applications from './pages/Applications';
import CashRequestDetails from './pages/CashRequestDetails';
import SupplierDetails from './pages/SupplierDetails';

export default function Routes() {
  const user = useAuthStore(state => state.user);
  const { fetchRequests } = useRequestStore();
  const { fetchTenders } = useTenderStore();
  const { fetchProtocols } = useProtocolStore();
  const { fetchArchivedProtocols } = useArchiveStore();
  const { fetchEvents } = useCalendarStore();
  const { fetchTasks } = useTaskStore();
  const { fetchSuppliers } = useSupplierStore();
  const { fetchApplications } = useSupplierApplicationStore();

  // Check for specific users
  const isSherzod = user?.id === '00000000-0000-0000-0000-000000000009';
  const isDinara = user?.id === '00000000-0000-0000-0000-000000000006';
  const isAkmal = user?.id === '00000000-0000-0000-0000-000000000008';
  const isUmar = user?.id === '00000000-0000-0000-0000-000000000007';

  useEffect(() => {
    // Only fetch data if user is logged in
    if (user) {
      const fetchData = async () => {
        try {
          // For suppliers, only fetch necessary data
          if (user.role === 'S') {
            await Promise.all([
              fetchTenders(),
              fetchRequests(), // Needed for tender details
              fetchSuppliers(), // Needed for category filtering
              fetchApplications() // Added applications fetch
            ]);
          } else {
            await Promise.all([
              fetchRequests(),
              fetchTenders(),
              fetchProtocols(),
              fetchArchivedProtocols(),
              fetchEvents(),
              fetchTasks(),
              fetchSuppliers(),
              fetchApplications() // Added applications fetch
            ]);
          }
        } catch (error) {
          console.error('Error fetching initial data:', error);
        }
      };

      fetchData();
    }
  }, [user, fetchRequests, fetchTenders, fetchProtocols, fetchArchivedProtocols, fetchEvents, fetchTasks, fetchSuppliers, fetchApplications]);

  return (
    <RouterRoutes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<PrivateRoute />}>
        <Route element={<Layout />}>
          {/* Root route with conditional redirects */}
          <Route path="/" element={
            user?.role === 'S' ? (
              <Navigate to="/tenders" replace />
            ) : isSherzod ? (
              <Navigate to="/finances" replace />
            ) : isDinara ? (
              <Navigate to="/archive" replace />
            ) : isAkmal || isUmar ? (
              <Navigate to="/calendar" replace />
            ) : (
              <Dashboard />
            )
          } />
          
          {/* Regular routes for all users */}
          <Route path="/tenders" element={<Tenders />} />
          <Route path="/tenders/:id" element={<TenderDetails />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/applications/:id" element={<ApplicationDetails />} />
          <Route path="/requests" element={<Requests />} />
          
          {/* Routes not accessible to suppliers */}
          {user?.role !== 'S' && (
            <>
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/protocols" element={<Protocols />} />
              <Route path="/protocols/:id" element={<ProtocolDetails />} />
              <Route path="/cash-requests/:id" element={<CashRequestDetails />} />
              <Route path="/archive" element={<Archive />} />
              <Route path="/finances" element={<Finances />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/database" element={<Database />} />
              <Route path="/database/:id" element={<SupplierDetails />} />
            </>
          )}
        </Route>
      </Route>
    </RouterRoutes>
  );
} 