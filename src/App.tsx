import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { PrivateRoute } from '@/components/PrivateRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import BookingList from '@/pages/BookingList';
import BookingDetail from '@/pages/BookingDetail';
import BookingCalendar from '@/pages/BookingCalendar';
import ClientList from '@/pages/ClientList';
import ClientDetail from '@/pages/ClientDetail';
import NotFound from '@/pages/NotFound';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Toaster position="top-right" />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/bookings"
              element={
                <PrivateRoute>
                  <AppLayout>
                    <BookingList />
                  </AppLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/bookings/:id"
              element={
                <PrivateRoute>
                  <AppLayout>
                    <BookingDetail />
                  </AppLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/calendar"
              element={
                <PrivateRoute>
                  <AppLayout>
                    <BookingCalendar />
                  </AppLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/clients"
              element={
                <PrivateRoute>
                  <AppLayout>
                    <ClientList />
                  </AppLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/clients/:id"
              element={
                <PrivateRoute>
                  <AppLayout>
                    <ClientDetail />
                  </AppLayout>
                </PrivateRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
