import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ProtectedRoute } from './components/ProtectedRoute';

// Páginas públicas
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegistroPage } from './pages/RegistroPage';

// Páginas cliente
import { NuevaReservaPage } from './pages/cliente/NuevaReservaPage';
import { MisReservasPage } from './pages/cliente/MisReservasPage';
import { EditarReservaPage } from './pages/cliente/EditarReservaPage';

// Páginas admin
import { AdminPanelPage } from './pages/admin/AdminPanelPage';
import { AdminNuevaReservaPage } from './pages/admin/AdminNuevaReservaPage';
import { AdminEditarReservaPage } from './pages/admin/AdminEditarReservaPage';
import { AdminClientesPage } from './pages/admin/AdminClientesPage';

// Componente para redirigir según rol
function RedirectByRole() {
  const { isResponsable, isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (isResponsable) {
    return <Navigate to="/admin" replace />;
  }
  
  return <Navigate to="/cliente/nueva-reserva" replace />;
}

function AppContent() {
  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegistroPage />} />
          
          {/* Redirigir según rol */}
          <Route path="/dashboard" element={<RedirectByRole />} />
          
          {/* Rutas protegidas de cliente */}
          <Route element={<ProtectedRoute />}>
            <Route path="/cliente" element={<Navigate to="/cliente/nueva-reserva" replace />} />
            <Route path="/cliente/nueva-reserva" element={<NuevaReservaPage />} />
            <Route path="/cliente/mis-reservas" element={<MisReservasPage />} />
            <Route path="/cliente/editar-reserva/:id" element={<EditarReservaPage />} />
          </Route>
          
          {/* Rutas protegidas de admin/responsable */}
          <Route element={<ProtectedRoute requiereResponsable />}>
            <Route path="/admin" element={<AdminPanelPage />} />
            <Route path="/admin/reservas" element={<AdminPanelPage />} />
            <Route path="/admin/nueva-reserva" element={<AdminNuevaReservaPage />} />
            <Route path="/admin/editar-reserva/:id" element={<AdminEditarReservaPage />} />
            <Route path="/admin/clientes" element={<AdminClientesPage />} />
            <Route path="/admin/empleados" element={<Navigate to="/admin/clientes" replace />} />
          </Route>
          
          {/* Ruta 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      
      {/* Toaster para notificaciones */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#3D2914',
            color: '#fff',
            borderRadius: '8px',
          },
          success: {
            iconTheme: {
              primary: '#4CAF50',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF5350',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
