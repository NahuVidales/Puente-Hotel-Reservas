import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Header.css';

export function Header() {
  const { usuario, isAuthenticated, isResponsable, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="header">
      <div className="container header-content">
        <Link to="/" className="header-logo">
          <span className="logo-icon">🍽️</span>
          <span className="logo-text">Viejo Puente</span>
        </Link>

        <nav className="header-nav">
          {isAuthenticated ? (
            <>
              {isResponsable ? (
                // Menú para responsables
                <>
                  <Link to="/admin" className="nav-link">Panel</Link>
                  <Link to="/admin/clientes" className="nav-link">Clientes</Link>
                </>
              ) : (
                // Menú para clientes
                <>
                  <Link to="/cliente/nueva-reserva" className="nav-link">Nueva Reserva</Link>
                  <Link to="/cliente/mis-reservas" className="nav-link">Mis Reservas</Link>
                </>
              )}
              
              <div className="header-user">
                <span className="user-greeting">
                  Hola, {usuario?.nombre}
                </span>
                <Link to="/mi-perfil" className="btn btn-secondary btn-sm">
                  Mi Perfil
                </Link>
                <button onClick={handleLogout} className="btn btn-secondary btn-sm">
                  Cerrar sesión
                </button>
              </div>
            </>
          ) : (
            <div className="header-auth">
              <Link to="/login" className="btn btn-secondary btn-sm">
                Iniciar sesión
              </Link>
              <Link to="/registro" className="btn btn-primary btn-sm">
                Registrarse
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
