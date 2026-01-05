import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './AuthPages.css';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isResponsable } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Por favor, completa todos los campos');
      return;
    }

    setLoading(true);

    try {
      await login(email, password);
      toast.success('¡Bienvenido!');
      
      // Redirigir según el rol
      // Necesitamos verificar el rol después del login
      const usuarioGuardado = localStorage.getItem('usuario');
      if (usuarioGuardado) {
        const usuario = JSON.parse(usuarioGuardado);
        if (usuario.rol === 'RESPONSABLE') {
          navigate('/admin');
        } else {
          navigate('/cliente/nueva-reserva');
        }
      }
    } catch (error: any) {
      const mensaje = error.response?.data?.error || 'Error al iniciar sesión';
      toast.error(mensaje);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Iniciar Sesión</h1>
            <p>Ingresa tus credenciales para acceder</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Email o usuario
              </label>
              <input
                type="text"
                id="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Contraseña
              </label>
              <input
                type="password"
                id="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tu contraseña"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              disabled={loading}
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              ¿No tienes una cuenta?{' '}
              <Link to="/registro">Regístrate aquí</Link>
            </p>
          </div>
        </div>

        <div className="auth-decoration">
          <div className="decoration-content">
            <h2>Bienvenido a Restaurante Puente</h2>
            <p>Reserva tu mesa y disfruta de una experiencia gastronómica única</p>
          </div>
        </div>
      </div>
    </div>
  );
}
