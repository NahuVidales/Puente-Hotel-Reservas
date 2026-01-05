import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { validarEmail, validarTelefono } from '../utils/helpers';
import toast from 'react-hot-toast';
import './AuthPages.css';

export function RegistroPage() {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    email: '',
    password: '',
    confirmarPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { registro } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validarFormulario = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio';
    }

    if (!formData.apellido.trim()) {
      newErrors.apellido = 'El apellido es obligatorio';
    }

    if (!formData.telefono.trim()) {
      newErrors.telefono = 'El teléfono es obligatorio';
    } else if (!validarTelefono(formData.telefono)) {
      newErrors.telefono = 'El teléfono no es válido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es obligatorio';
    } else if (!validarEmail(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es obligatoria';
    } else if (formData.password.length < 4) {
      newErrors.password = 'La contraseña debe tener al menos 4 caracteres';
    }

    if (formData.password !== formData.confirmarPassword) {
      newErrors.confirmarPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validarFormulario()) {
      toast.error('Por favor, corrige los errores del formulario');
      return;
    }

    setLoading(true);

    try {
      await registro({
        nombre: formData.nombre.trim(),
        apellido: formData.apellido.trim(),
        telefono: formData.telefono.trim(),
        email: formData.email.trim(),
        password: formData.password
      });
      
      toast.success('¡Registro exitoso! Bienvenido');
      navigate('/cliente/nueva-reserva');
    } catch (error: any) {
      const mensaje = error.response?.data?.error || 'Error al registrar usuario';
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
            <h1>Crear Cuenta</h1>
            <p>Regístrate para hacer reservas</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="nombre">
                  Nombre
                </label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  className={`form-input ${errors.nombre ? 'error' : ''}`}
                  value={formData.nombre}
                  onChange={handleChange}
                  placeholder="Tu nombre"
                />
                {errors.nombre && <span className="form-error">{errors.nombre}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="apellido">
                  Apellido
                </label>
                <input
                  type="text"
                  id="apellido"
                  name="apellido"
                  className={`form-input ${errors.apellido ? 'error' : ''}`}
                  value={formData.apellido}
                  onChange={handleChange}
                  placeholder="Tu apellido"
                />
                {errors.apellido && <span className="form-error">{errors.apellido}</span>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="telefono">
                Teléfono
              </label>
              <input
                type="tel"
                id="telefono"
                name="telefono"
                className={`form-input ${errors.telefono ? 'error' : ''}`}
                value={formData.telefono}
                onChange={handleChange}
                placeholder="Tu número de teléfono"
              />
              {errors.telefono && <span className="form-error">{errors.telefono}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className={`form-input ${errors.email ? 'error' : ''}`}
                value={formData.email}
                onChange={handleChange}
                placeholder="tu@email.com"
                autoComplete="email"
              />
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="password">
                  Contraseña
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  className={`form-input ${errors.password ? 'error' : ''}`}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Mínimo 4 caracteres"
                  autoComplete="new-password"
                />
                {errors.password && <span className="form-error">{errors.password}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="confirmarPassword">
                  Confirmar contraseña
                </label>
                <input
                  type="password"
                  id="confirmarPassword"
                  name="confirmarPassword"
                  className={`form-input ${errors.confirmarPassword ? 'error' : ''}`}
                  value={formData.confirmarPassword}
                  onChange={handleChange}
                  placeholder="Repite tu contraseña"
                  autoComplete="new-password"
                />
                {errors.confirmarPassword && <span className="form-error">{errors.confirmarPassword}</span>}
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              disabled={loading}
            >
              {loading ? 'Registrando...' : 'Crear Cuenta'}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              ¿Ya tienes una cuenta?{' '}
              <Link to="/login">Inicia sesión aquí</Link>
            </p>
          </div>
        </div>

        <div className="auth-decoration">
          <div className="decoration-content">
            <h2>Únete a Restaurante Puente</h2>
            <p>Crea tu cuenta y comienza a disfrutar de nuestras reservas online</p>
          </div>
        </div>
      </div>
    </div>
  );
}
