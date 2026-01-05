import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './HomePage.css';

export function HomePage() {
  const { isAuthenticated, isResponsable } = useAuth();

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title">Restaurante Puente Hotel</h1>
          <p className="hero-subtitle">
            Donde cada comida se convierte en un momento especial
          </p>
          
          {!isAuthenticated ? (
            <div className="hero-buttons">
              <Link to="/registro" className="btn btn-primary btn-lg">
                Registrarse
              </Link>
              <Link to="/login" className="btn btn-outline btn-lg">
                Iniciar Sesión
              </Link>
            </div>
          ) : (
            <div className="hero-buttons">
              {isResponsable ? (
                <Link to="/admin" className="btn btn-primary btn-lg">
                  Ir al Panel
                </Link>
              ) : (
                <Link to="/cliente/nueva-reserva" className="btn btn-primary btn-lg">
                  Hacer una Reserva
                </Link>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <h2 className="section-title">¿Por qué elegirnos?</h2>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🍳</div>
              <h3>Cocina de Calidad</h3>
              <p>
                Ingredientes frescos y recetas tradicionales con un toque moderno
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🏛️</div>
              <h3>Ambiente Único</h3>
              <p>
                Ladrillo visto e iluminación cálida para momentos inolvidables
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📅</div>
              <h3>Reservas Fáciles</h3>
              <p>
                Sistema online simple para reservar tu mesa en minutos
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Horarios Section */}
      <section className="horarios">
        <div className="container">
          <div className="horarios-card">
            <h2>Horarios de Atención</h2>
            <div className="horarios-grid">
              <div className="horario-item">
                <span className="dia">Martes a Sábado</span>
                <span className="turno">Almuerzo y Cena</span>
              </div>
              <div className="horario-item cerrado">
                <span className="dia">Domingo y Lunes</span>
                <span className="turno">Cerrado</span>
              </div>
            </div>
            <p className="horarios-nota">
              Reserva con hasta 30 días de anticipación
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="cta">
          <div className="container">
            <h2>¿Listo para visitarnos?</h2>
            <p>Crea tu cuenta y reserva tu mesa ahora</p>
            <Link to="/registro" className="btn btn-primary btn-lg">
              Comenzar
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
