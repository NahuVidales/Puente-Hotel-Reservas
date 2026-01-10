import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { Usuario } from '../types';
import toast from 'react-hot-toast';
import './AuthPages.css';

export function MiPerfilPage() {
  const navigate = useNavigate();
  const passwordSectionRef = useRef<HTMLDivElement>(null);

  // Datos personales
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [guardandoDatos, setGuardandoDatos] = useState(false);

  // Cambiar contraseña
  const [mostrarCambioPassword, setMostrarCambioPassword] = useState(false);
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [cambiandoPassword, setCambiandoPassword] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    // Cuando se abre la sección de cambio de password, hacer scroll
    if (mostrarCambioPassword && passwordSectionRef.current) {
      setTimeout(() => {
        passwordSectionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 100);
    }
  }, [mostrarCambioPassword]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const usuario = await authService.getUsuarioActual();
      if (usuario) {
        setNombre(usuario.nombre);
        setApellido(usuario.apellido);
        setTelefono(usuario.telefono);
        setEmail(usuario.email);
      }
    } catch (error) {
      toast.error('Error al cargar datos del perfil');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCambioPassword = () => {
    setMostrarCambioPassword(!mostrarCambioPassword);
    // Si se cierra, limpiar campos
    if (mostrarCambioPassword) {
      setPasswordActual('');
      setPasswordNueva('');
      setPasswordConfirm('');
    }
  };

  const handleGuardarDatos = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (!nombre.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    if (!apellido.trim()) {
      toast.error('El apellido es obligatorio');
      return;
    }
    if (!telefono.trim()) {
      toast.error('El teléfono es obligatorio');
      return;
    }
    if (!email.trim()) {
      toast.error('El email es obligatorio');
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('El email debe ser válido (ejemplo: usuario@dominio.com)');
      return;
    }

    setGuardandoDatos(true);
    try {
      await authService.actualizarPerfil({
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        telefono: telefono.trim(),
        email: email.trim()
      });

      toast.success('Perfil actualizado correctamente');
    } catch (error: any) {
      const mensaje = error.response?.data?.error || 'Error al actualizar perfil';
      toast.error(mensaje);
    } finally {
      setGuardandoDatos(false);
    }
  };

  const handleCambiarPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (!passwordActual.trim()) {
      toast.error('La contraseña actual es obligatoria');
      return;
    }
    if (!passwordNueva.trim()) {
      toast.error('La nueva contraseña es obligatoria');
      return;
    }
    if (!passwordConfirm.trim()) {
      toast.error('La confirmación de contraseña es obligatoria');
      return;
    }

    if (passwordNueva.length < 4) {
      toast.error('La contraseña nueva debe tener al menos 4 caracteres');
      return;
    }

    if (passwordNueva !== passwordConfirm) {
      toast.error('La nueva contraseña y la confirmación no coinciden');
      return;
    }

    setCambiandoPassword(true);
    try {
      await authService.cambiarContrasena(passwordActual, passwordNueva);

      toast.success('Contraseña actualizada correctamente');

      // Limpiar campos
      setPasswordActual('');
      setPasswordNueva('');
      setPasswordConfirm('');
    } catch (error: any) {
      const mensaje = error.response?.data?.error || 'Error al cambiar contraseña';
      toast.error(mensaje);
    } finally {
      setCambiandoPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="container">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p>Cargando perfil...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="mi-perfil-wrapper">
        <div className="mi-perfil-header">
          <h1>Mi Perfil</h1>
          <p>Administra tu información personal y seguridad</p>
        </div>

        <div className="mi-perfil-container">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p>Cargando perfil...</p>
            </div>
          ) : (
            <form onSubmit={handleGuardarDatos} className="mi-perfil-form">
              {/* SECCIÓN: Datos Personales */}
              <div className="mi-perfil-card">
                <h2 className="mi-perfil-section-title">Datos Personales</h2>

                <div className="mi-perfil-grid">
                  <div className="form-group">
                    <label className="form-label">Nombre *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Tu nombre"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Apellido *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={apellido}
                      onChange={(e) => setApellido(e.target.value)}
                      placeholder="Tu apellido"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Teléfono *</label>
                    <input
                      type="tel"
                      className="form-input"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="Tu teléfono"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email *</label>
                    <input
                      type="email"
                      className="form-input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                    />
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="mi-perfil-buttons">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={guardandoDatos}
                  >
                    {guardandoDatos ? 'Guardando...' : 'Guardar Cambios'}
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleToggleCambioPassword}
                  >
                    {mostrarCambioPassword ? 'Cancelar' : 'Cambiar Contraseña'}
                  </button>
                </div>
              </div>

              {/* SECCIÓN: Cambiar Contraseña (Colapsable) */}
              {mostrarCambioPassword && (
                <div
                  ref={passwordSectionRef}
                  className="mi-perfil-card mi-perfil-password-section"
                >
                  <h2 className="mi-perfil-section-title">Cambiar Contraseña</h2>

                  <div className="mi-perfil-grid">
                    <div className="form-group">
                      <label className="form-label">Contraseña Actual *</label>
                      <input
                        type="password"
                        className="form-input"
                        value={passwordActual}
                        onChange={(e) => setPasswordActual(e.target.value)}
                        placeholder="Tu contraseña actual"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Nueva Contraseña *</label>
                      <input
                        type="password"
                        className="form-input"
                        value={passwordNueva}
                        onChange={(e) => setPasswordNueva(e.target.value)}
                        placeholder="Nueva contraseña (mín. 4 caracteres)"
                      />
                    </div>

                    <div className="form-group form-group-full">
                      <label className="form-label">Confirmar Nueva Contraseña *</label>
                      <input
                        type="password"
                        className="form-input"
                        value={passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                        placeholder="Confirma la nueva contraseña"
                      />
                    </div>
                  </div>

                  <div className="mi-perfil-buttons mi-perfil-buttons-final">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleCambiarPassword}
                      disabled={cambiandoPassword}
                    >
                      {cambiandoPassword ? 'Cambiando...' : 'Cambiar Contraseña'}
                    </button>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>
      </div>

      <style>{`
        .mi-perfil-wrapper {
          padding: 2rem 1rem;
          min-height: calc(100vh - 200px);
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .mi-perfil-header {
          text-align: center;
          margin-bottom: 2rem;
          max-width: 600px;
        }

        .mi-perfil-header h1 {
          margin: 0 0 0.5rem 0;
          color: #333;
          font-size: 2.5rem;
          font-weight: 700;
        }

        .mi-perfil-header p {
          margin: 0;
          color: #666;
          font-size: 1.1rem;
        }

        .mi-perfil-container {
          width: 100%;
          max-width: 950px;
          margin: 0 auto;
        }

        .mi-perfil-form {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .mi-perfil-card {
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 2rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          transition: box-shadow 0.3s ease;
        }

        .mi-perfil-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .mi-perfil-password-section {
          animation: slideDown 0.3s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .mi-perfil-section-title {
          margin: 0 0 1.5rem 0;
          color: #333;
          font-size: 1.3rem;
          font-weight: 600;
          border-bottom: 2px solid #8b5a3c;
          padding-bottom: 0.75rem;
        }

        .mi-perfil-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group-full {
          grid-column: 1 / -1;
        }

        .form-label {
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #333;
          font-size: 0.95rem;
        }

        .form-input {
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
          transition: all 0.3s ease;
          font-family: inherit;
        }

        .form-input:focus {
          outline: none;
          border-color: #8b5a3c;
          box-shadow: 0 0 0 3px rgba(139, 90, 60, 0.1);
        }

        .mi-perfil-buttons {
          display: flex;
          gap: 1rem;
          justify-content: flex-start;
          flex-wrap: wrap;
          margin-top: 2rem;
        }

        .mi-perfil-buttons-final {
          justify-content: center;
          margin-top: 1.5rem;
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 600;
          white-space: nowrap;
        }

        .btn-primary {
          background: #8b5a3c;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #6d4630;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(139, 90, 60, 0.3);
        }

        .btn-secondary {
          background: #f5f5f5;
          color: #333;
          border: 1px solid #ddd;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #efefef;
          border-color: #8b5a3c;
          color: #8b5a3c;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        /* Mobile responsivo */
        @media (max-width: 768px) {
          .mi-perfil-wrapper {
            padding: 1rem;
          }

          .mi-perfil-header h1 {
            font-size: 1.8rem;
          }

          .mi-perfil-header p {
            font-size: 0.95rem;
          }

          .mi-perfil-card {
            padding: 1.5rem;
          }

          .mi-perfil-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .mi-perfil-buttons {
            flex-direction: column;
            gap: 0.75rem;
          }

          .btn {
            width: 100%;
          }

          .mi-perfil-buttons-final {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}
