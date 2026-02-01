import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import mesasService, { Mesa, OcupacionZona } from '../../services/mesas.service';
import mozosService, { Mozo } from '../../services/mozos.service';
import cuentasService, { Cuenta } from '../../services/cuentas.service';
import './RestaurantePage.css';

interface DashboardStats {
  mesasOcupadas: number;
  mesasLibres: number;
  mozosActivos: number;
  cuentasAbiertas: number;
  ventasDia: number;
}

const RestaurantePage: React.FC = () => {
  const navigate = useNavigate();
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [mozos, setMozos] = useState<Mozo[]>([]);
  const [cuentasAbiertas, setCuentasAbiertas] = useState<Cuenta[]>([]);
  const [ocupacionZonas, setOcupacionZonas] = useState<OcupacionZona[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    mesasOcupadas: 0,
    mesasLibres: 0,
    mozosActivos: 0,
    cuentasAbiertas: 0,
    ventasDia: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      // Cargar datos en paralelo
      const [mesasData, mozosData, cuentasData, ocupacionData] = await Promise.all([
        mesasService.getMesas(),
        mozosService.getMozos(),
        cuentasService.getCuentas({ estado: 'ABIERTA' }),
        mesasService.getOcupacion()
      ]);

      setMesas(mesasData);
      setMozos(mozosData);
      setCuentasAbiertas(cuentasData);
      setOcupacionZonas(ocupacionData);

      // Calcular estadísticas
      const mesasOcupadas = mesasData.filter(m => m.estado === 'OCUPADA').length;
      const mesasLibres = mesasData.filter(m => m.estado === 'LIBRE' && m.activa).length;
      const mozosActivos = mozosData.filter(m => m.activo).length;
      
      // Calcular ventas del día
      const ventasHoy = await calcularVentasHoy();

      setStats({
        mesasOcupadas,
        mesasLibres,
        mozosActivos,
        cuentasAbiertas: cuentasData.length,
        ventasDia: ventasHoy
      });
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const calcularVentasHoy = async (): Promise<number> => {
    try {
      const hoy = new Date().toISOString().split('T')[0];
      const cuentasHoy = await cuentasService.getCuentas({ 
        estado: 'CERRADA',
        fecha: hoy 
      });
      
      return cuentasHoy.reduce((total, cuenta) => total + cuenta.total, 0);
    } catch (error) {
      console.error('Error calculando ventas:', error);
      return 0;
    }
  };

  const getColorOcupacion = (porcentaje: number): string => {
    if (porcentaje <= 30) return '#22c55e'; // Verde
    if (porcentaje <= 70) return '#eab308'; // Amarillo
    return '#ef4444'; // Rojo
  };

  if (loading) {
    return (
      <div className="restaurante-page">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Cargando panel de control...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="restaurante-page">
      <div className="page-header">
        <h1>🍽️ Panel de Control - Restaurante</h1>
        <p className="subtitle">Gestión completa del restaurante en tiempo real</p>
      </div>

      {/* Estadísticas principales */}
      <div className="stats-grid">
        <div className="stat-card mesas">
          <div className="stat-icon">🪑</div>
          <div className="stat-content">
            <h3>Mesas</h3>
            <div className="stat-numbers">
              <span className="occupied">{stats.mesasOcupadas} ocupadas</span>
              <span className="free">{stats.mesasLibres} libres</span>
            </div>
          </div>
        </div>

        <div className="stat-card mozos">
          <div className="stat-icon">👨‍🍳</div>
          <div className="stat-content">
            <h3>Mozos</h3>
            <div className="stat-numbers">
              <span className="active">{stats.mozosActivos} activos</span>
              <span className="working">{mozos.filter(m => (m.mesasActivas || 0) > 0).length} trabajando</span>
            </div>
          </div>
        </div>

        <div className="stat-card cuentas">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <h3>Cuentas Abiertas</h3>
            <div className="stat-numbers">
              <span className="main">{stats.cuentasAbiertas}</span>
            </div>
          </div>
        </div>

        <div className="stat-card ventas">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Ventas Hoy</h3>
            <div className="stat-numbers">
              <span className="main">${stats.ventasDia.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ocupación por zonas */}
      <div className="zona-section">
        <h2>Ocupación por Zonas</h2>
        <div className="zonas-grid">
          {ocupacionZonas.map(zona => (
            <div key={zona.zona} className="zona-card">
              <h3>{zona.zona}</h3>
              <div className="zona-stats">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${zona.porcentajeOcupacion}%`,
                      backgroundColor: getColorOcupacion(zona.porcentajeOcupacion)
                    }}
                  ></div>
                </div>
                <div className="zona-numbers">
                  <span>{zona.ocupadas}/{zona.total} mesas</span>
                  <span className="percentage">{zona.porcentajeOcupacion}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="quick-actions">
        <h2>Gestión Restaurante</h2>
        <div className="action-grid">
          <button 
            className="action-btn productos"
            onClick={() => navigate('/admin/productos')}
          >
            <div className="action-icon">🍕</div>
            <div className="action-text">
              <h3>Productos</h3>
              <p>Gestionar menú y categorías</p>
            </div>
          </button>

          <button 
            className="action-btn mesas"
            onClick={() => navigate('/admin/mesas')}
          >
            <div className="action-icon">🪑</div>
            <div className="action-text">
              <h3>Mesas</h3>
              <p>Administrar mesas y zonas</p>
            </div>
          </button>

          <button 
            className="action-btn mozos"
            onClick={() => navigate('/admin/mozos')}
          >
            <div className="action-icon">👨‍🍳</div>
            <div className="action-text">
              <h3>Mozos</h3>
              <p>Personal y estadísticas</p>
            </div>
          </button>

          <button 
            className="action-btn cuentas"
            onClick={() => navigate('/admin/cuentas')}
          >
            <div className="action-icon">📋</div>
            <div className="action-text">
              <h3>Cuentas</h3>
              <p>Gestionar órdenes y pagos</p>
            </div>
          </button>
        </div>
      </div>

      {/* Cuentas abiertas recientes */}
      {cuentasAbiertas.length > 0 && (
        <div className="recent-section">
          <h2>Cuentas Abiertas</h2>
          <div className="cuentas-list">
            {cuentasAbiertas.slice(0, 5).map(cuenta => (
              <div key={cuenta.id} className="cuenta-card">
                <div className="cuenta-info">
                  <span className="mesa">Mesa {cuenta.mesa.numero}</span>
                  <span className="mozo">{cuenta.mozo.nombre} {cuenta.mozo.apellido}</span>
                  <span className="clientes">{cuenta.numeroClientes} personas</span>
                </div>
                <div className="cuenta-stats">
                  <span className="items">{cuenta.items.length} items</span>
                  <span className="total">${cuenta.subtotal.toLocaleString()}</span>
                  <span className="tiempo">
                    {Math.round((new Date().getTime() - new Date(cuenta.fechaApertura).getTime()) / (1000 * 60))} min
                  </span>
                </div>
                <button 
                  className="ver-cuenta-btn"
                  onClick={() => navigate(`/admin/cuentas/${cuenta.id}`)}
                >
                  Ver
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantePage;