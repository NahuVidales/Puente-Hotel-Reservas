import React, { useState, useEffect } from 'react';
import mesasService, { Mesa, OcupacionZona } from '../../services/mesas.service';
import mozosService, { Mozo } from '../../services/mozos.service';
import cuentasService, { Cuenta } from '../../services/cuentas.service';
import productosService, { Producto, CategoriaProducto } from '../../services/productos.service';
import './RestaurantePage.css';

type TabType = 'dashboard' | 'mesas' | 'mozos' | 'productos' | 'cuentas';

interface TicketData {
  cuenta: Cuenta;
  visible: boolean;
}

interface DashboardStats {
  mesasOcupadas: number;
  mesasLibres: number;
  mozosActivos: number;
  cuentasAbiertas: number;
  cuentasCerradas: number;
  ventasDia: number;
  totalClientes: number;
}

interface HistoricoData {
  fecha: string;
  ventasTotal: number;
  cuentasCerradas: number;
  totalClientes: number;
  promedioTicket: number;
}

const RestaurantePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isToday, setIsToday] = useState(true);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [mozos, setMozos] = useState<Mozo[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<CategoriaProducto[]>([]);
  const [cuentasAbiertas, setCuentasAbiertas] = useState<Cuenta[]>([]);
  const [cuentasCerradasDia, setCuentasCerradasDia] = useState<Cuenta[]>([]);
  const [ocupacionZonas, setOcupacionZonas] = useState<OcupacionZona[]>([]);
  const [historicoData, setHistoricoData] = useState<HistoricoData | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    mesasOcupadas: 0,
    mesasLibres: 0,
    mozosActivos: 0,
    cuentasAbiertas: 0,
    cuentasCerradas: 0,
    ventasDia: 0,
    totalClientes: 0
  });
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'mesa' | 'mozo' | 'producto' | 'cuenta' | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  // Ticket state
  const [ticketData, setTicketData] = useState<TicketData | null>(null);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setIsToday(selectedDate === today);
    cargarDatos();
  }, [selectedDate]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      
      // Datos base siempre necesarios
      const [mesasData, mozosData, productosData, categoriasData, ocupacionData] = await Promise.all([
        mesasService.getMesas(),
        mozosService.getMozos(),
        productosService.getProductos(),
        productosService.getCategorias(),
        mesasService.getOcupacion()
      ]);

      setMesas(mesasData);
      setMozos(mozosData);
      setProductos(productosData);
      setCategorias(categoriasData);
      setOcupacionZonas(ocupacionData);

      // Cargar cuentas según fecha seleccionada
      let cuentasAbiertasData: Cuenta[] = [];
      let cuentasCerradasData: Cuenta[] = [];
      
      try {
        // Cuentas cerradas del día seleccionado
        cuentasCerradasData = await cuentasService.getCuentas({ 
          estado: 'CERRADA',
          fecha: selectedDate 
        });
      } catch (e) {
        console.log('No hay cuentas cerradas para esta fecha');
      }
      
      if (selectedDate === today) {
        // Si es hoy, cargar también las abiertas
        try {
          cuentasAbiertasData = await cuentasService.getCuentas({ estado: 'ABIERTA' });
        } catch (e) {
          console.log('No hay cuentas abiertas');
        }
      }
      
      setCuentasAbiertas(cuentasAbiertasData);
      setCuentasCerradasDia(cuentasCerradasData);

      // Calcular estadísticas
      const mesasOcupadas = mesasData.filter(m => m.estado === 'OCUPADA').length;
      const mesasLibres = mesasData.filter(m => m.estado === 'LIBRE' && m.activa).length;
      const mozosActivos = mozosData.filter(m => m.activo).length;
      
      // Calcular ventas y clientes del día
      const ventasDia = cuentasCerradasData.reduce((sum, c) => sum + (c.total || 0), 0);
      const totalClientes = cuentasCerradasData.reduce((sum, c) => sum + (c.numeroClientes || 0), 0);
      const promedioTicket = cuentasCerradasData.length > 0 ? ventasDia / cuentasCerradasData.length : 0;

      setStats({
        mesasOcupadas,
        mesasLibres,
        mozosActivos,
        cuentasAbiertas: cuentasAbiertasData.length,
        cuentasCerradas: cuentasCerradasData.length,
        ventasDia,
        totalClientes
      });

      // Guardar datos históricos
      setHistoricoData({
        fecha: selectedDate,
        ventasTotal: ventasDia,
        cuentasCerradas: cuentasCerradasData.length,
        totalClientes,
        promedioTicket
      });
      
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getColorOcupacion = (porcentaje: number): string => {
    if (porcentaje <= 30) return '#10b981';
    if (porcentaje <= 70) return '#f59e0b';
    return '#ef4444';
  };

  const openModal = (type: 'mesa' | 'mozo' | 'producto' | 'cuenta', item?: any) => {
    setModalType(type);
    setEditingItem(item || null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalType(null);
    setEditingItem(null);
  };

  // ==================== DASHBOARD TAB ====================
  const renderDashboard = () => {
    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr + 'T12:00:00');
      return date.toLocaleDateString('es-AR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    };

    return (
    <div className="dashboard-content">
      {/* Banner de fecha histórica */}
      {!isToday && (
        <div className="historico-banner">
          <span className="historico-icon">📅</span>
          <span>Viendo datos históricos de: <strong>{formatDate(selectedDate)}</strong></span>
        </div>
      )}

      {/* Stats principales */}
      <div className="stats-grid">
        {isToday && (
          <>
            <div className="stat-card blue">
              <div className="stat-icon">🪑</div>
              <div className="stat-info">
                <span className="stat-value">{stats.mesasOcupadas}/{stats.mesasOcupadas + stats.mesasLibres}</span>
                <span className="stat-label">Mesas Ocupadas</span>
              </div>
            </div>
            <div className="stat-card green">
              <div className="stat-icon">👨‍🍳</div>
              <div className="stat-info">
                <span className="stat-value">{stats.mozosActivos}</span>
                <span className="stat-label">Mozos Activos</span>
              </div>
            </div>
            <div className="stat-card orange">
              <div className="stat-icon">📋</div>
              <div className="stat-info">
                <span className="stat-value">{stats.cuentasAbiertas}</span>
                <span className="stat-label">Cuentas Abiertas</span>
              </div>
            </div>
          </>
        )}
        <div className="stat-card purple">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <span className="stat-value">${stats.ventasDia.toLocaleString()}</span>
            <span className="stat-label">{isToday ? 'Ventas Hoy' : 'Ventas del Día'}</span>
          </div>
        </div>
        <div className="stat-card teal">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <span className="stat-value">{stats.totalClientes}</span>
            <span className="stat-label">Clientes Atendidos</span>
          </div>
        </div>
        <div className="stat-card amber">
          <div className="stat-icon">🧾</div>
          <div className="stat-info">
            <span className="stat-value">{stats.cuentasCerradas}</span>
            <span className="stat-label">Cuentas Cerradas</span>
          </div>
        </div>
        {historicoData && historicoData.cuentasCerradas > 0 && (
          <div className="stat-card rose">
            <div className="stat-icon">📊</div>
            <div className="stat-info">
              <span className="stat-value">${Math.round(historicoData.promedioTicket).toLocaleString()}</span>
              <span className="stat-label">Ticket Promedio</span>
            </div>
          </div>
        )}
      </div>

      {/* Resumen del día */}
      {historicoData && (
        <div className="section-card resumen-dia">
          <h3>📈 Resumen {isToday ? 'del Día' : `del ${formatDate(selectedDate)}`}</h3>
          <div className="resumen-grid">
            <div className="resumen-item">
              <span className="resumen-label">Facturación Total</span>
              <span className="resumen-value verde">${historicoData.ventasTotal.toLocaleString()}</span>
            </div>
            <div className="resumen-item">
              <span className="resumen-label">Cuentas Cerradas</span>
              <span className="resumen-value">{historicoData.cuentasCerradas}</span>
            </div>
            <div className="resumen-item">
              <span className="resumen-label">Total Clientes</span>
              <span className="resumen-value">{historicoData.totalClientes}</span>
            </div>
            <div className="resumen-item">
              <span className="resumen-label">Ticket Promedio</span>
              <span className="resumen-value">${Math.round(historicoData.promedioTicket).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Ocupación por zonas - Solo mostrar si es hoy */}
      {isToday && (
        <div className="section-card">
          <h3>📍 Ocupación por Zonas</h3>
          <div className="zonas-grid">
            {ocupacionZonas.length > 0 ? ocupacionZonas.map(zona => (
              <div key={zona.zona} className="zona-item">
                <div className="zona-header">
                  <span className="zona-name">{zona.zona}</span>
                  <span className="zona-percent" style={{ color: getColorOcupacion(zona.porcentajeOcupacion) }}>
                    {zona.porcentajeOcupacion}%
                  </span>
                </div>
                <div className="progress-track">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${zona.porcentajeOcupacion}%`,
                      backgroundColor: getColorOcupacion(zona.porcentajeOcupacion)
                    }}
                  />
                </div>
                <span className="zona-detail">{zona.ocupadas} de {zona.total} mesas</span>
              </div>
            )) : (
              <p className="empty-message">No hay datos de ocupación disponibles</p>
            )}
          </div>
        </div>
      )}

      {/* Cuentas cerradas del día seleccionado */}
      {cuentasCerradasDia.length > 0 && (
        <div className="section-card">
          <h3>✅ Cuentas Cerradas {isToday ? 'Hoy' : ''}</h3>
          <div className="cuentas-preview">
            {cuentasCerradasDia.slice(0, 10).map(cuenta => (
              <div key={cuenta.id} className="cuenta-preview-item cerrada">
                <div className="cuenta-mesa">Mesa {cuenta.mesa?.numero || '?'}</div>
                <div className="cuenta-mozo">{cuenta.mozo?.nombre || 'Sin mozo'}</div>
                <div className="cuenta-clientes">{cuenta.numeroClientes} pers.</div>
                <div className="cuenta-total">${cuenta.total?.toLocaleString() || 0}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cuentas abiertas - Solo si es hoy */}
      {isToday && (
        <div className="section-card">
          <h3>🧾 Cuentas Abiertas</h3>
          {cuentasAbiertas.length > 0 ? (
            <div className="cuentas-preview">
              {cuentasAbiertas.slice(0, 5).map(cuenta => (
                <div key={cuenta.id} className="cuenta-preview-item">
                  <div className="cuenta-mesa">Mesa {cuenta.mesa?.numero || '?'}</div>
                  <div className="cuenta-mozo">{cuenta.mozo?.nombre || 'Sin mozo'}</div>
                  <div className="cuenta-total">${cuenta.subtotal?.toLocaleString() || 0}</div>
                  <div className="cuenta-tiempo">
                    {Math.round((new Date().getTime() - new Date(cuenta.fechaApertura).getTime()) / (1000 * 60))} min
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-message">No hay cuentas abiertas</p>
          )}
        </div>
      )}
    </div>
  );
  };

  // ==================== MESAS TAB ====================
  const renderMesas = () => (
    <div className="tab-content">
      <div className="tab-header">
        <h3>🪑 Gestión de Mesas</h3>
        <button className="btn-primary" onClick={() => openModal('mesa')}>
          + Nueva Mesa
        </button>
      </div>
      
      <div className="mesas-grid">
        {mesas.map(mesa => (
          <div 
            key={mesa.id} 
            className={`mesa-card ${mesa.estado?.toLowerCase() || 'libre'} ${!mesa.activa ? 'inactiva' : ''}`}
          >
            <div className="mesa-number">{mesa.numero}</div>
            <div className="mesa-capacidad">{mesa.capacidad} personas</div>
            <div className="mesa-zona">{mesa.zona}</div>
            <div className={`mesa-estado ${mesa.estado?.toLowerCase() || 'libre'}`}>
              {mesa.estado === 'OCUPADA' ? '🔴 Ocupada' : '🟢 Libre'}
            </div>
            <div className="mesa-actions">
              <button className="btn-small btn-edit" onClick={() => openModal('mesa', mesa)}>Editar</button>
              <button 
                className="btn-small btn-toggle"
                onClick={async () => {
                  await mesasService.updateMesa(mesa.id, { activa: !mesa.activa });
                  cargarDatos();
                }}
              >
                {mesa.activa ? 'Desactivar' : 'Activar'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ==================== MOZOS TAB ====================
  const renderMozos = () => (
    <div className="tab-content">
      <div className="tab-header">
        <h3>👨‍🍳 Gestión de Mozos</h3>
        <button className="btn-primary" onClick={() => openModal('mozo')}>
          + Nuevo Mozo
        </button>
      </div>

      <div className="mozos-list">
        {mozos.map(mozo => (
          <div key={mozo.id} className={`mozo-card ${mozo.activo ? 'activo' : 'inactivo'}`}>
            <div className="mozo-avatar">
              {mozo.nombre?.charAt(0)}{mozo.apellido?.charAt(0)}
            </div>
            <div className="mozo-info">
              <h4>{mozo.nombre} {mozo.apellido}</h4>
              <p>{mozo.telefono || 'Sin teléfono'}</p>
              <p className="mozo-dni">DNI: {mozo.dni}</p>
            </div>
            <div className="mozo-stats">
              <div className="mozo-stat">
                <span className="stat-num">{mozo.mesasActivas || 0}</span>
                <span className="stat-text">Mesas</span>
              </div>
            </div>
            <div className="mozo-actions">
              <button className="btn-small btn-edit" onClick={() => openModal('mozo', mozo)}>Editar</button>
              <button 
                className={`btn-small ${mozo.activo ? 'btn-danger' : 'btn-success'}`}
                onClick={async () => {
                  await mozosService.updateMozo(mozo.id, { activo: !mozo.activo });
                  cargarDatos();
                }}
              >
                {mozo.activo ? 'Desactivar' : 'Activar'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ==================== PRODUCTOS TAB ====================
  const renderProductos = () => (
    <div className="tab-content">
      <div className="tab-header">
        <h3>🍕 Gestión de Productos</h3>
        <button className="btn-primary" onClick={() => openModal('producto')}>
          + Nuevo Producto
        </button>
      </div>

      {categorias.map(categoria => {
        const productosCategoria = productos.filter(p => p.categoriaId === categoria.id);
        if (productosCategoria.length === 0) return null;
        
        return (
          <div key={categoria.id} className="categoria-section">
            <h4 className="categoria-title">
              <span className="categoria-emoji">📦</span>
              {categoria.nombre}
            </h4>
            <div className="productos-grid">
              {productosCategoria.map(producto => (
                <div key={producto.id} className={`producto-card ${!producto.disponible ? 'no-disponible' : ''}`}>
                  <div className="producto-header">
                    <span className="producto-nombre">{producto.nombre}</span>
                    <span className="producto-precio">${producto.precio.toLocaleString()}</span>
                  </div>
                  {producto.descripcion && (
                    <p className="producto-desc">{producto.descripcion}</p>
                  )}
                  <div className="producto-footer">
                    <span className={`disponibilidad ${producto.disponible ? 'si' : 'no'}`}>
                      {producto.disponible ? '✓ Disponible' : '✗ No disponible'}
                    </span>
                    <button className="btn-small btn-edit" onClick={() => openModal('producto', producto)}>
                      Editar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

  // ==================== CUENTAS TAB ====================
  const renderCuentas = () => (
    <div className="tab-content">
      <div className="tab-header">
        <h3>📋 Cuentas Abiertas</h3>
        <button className="btn-primary" onClick={() => openModal('cuenta')}>
          + Nueva Cuenta
        </button>
      </div>

      {cuentasAbiertas.length > 0 ? (
        <div className="cuentas-grid">
          {cuentasAbiertas.map(cuenta => (
            <div key={cuenta.id} className="cuenta-card-full">
              <div className="cuenta-header">
                <div className="cuenta-mesa-badge">Mesa {cuenta.mesa?.numero || '?'}</div>
                <div className="cuenta-time">
                  ⏱️ {Math.round((new Date().getTime() - new Date(cuenta.fechaApertura).getTime()) / (1000 * 60))} min
                </div>
              </div>
              <div className="cuenta-body">
                <div className="cuenta-info-row">
                  <span className="label">Mozo:</span>
                  <span>{cuenta.mozo?.nombre} {cuenta.mozo?.apellido}</span>
                </div>
                <div className="cuenta-info-row">
                  <span className="label">Clientes:</span>
                  <span>{cuenta.numeroClientes} personas</span>
                </div>
                <div className="cuenta-info-row">
                  <span className="label">Items:</span>
                  <span>{cuenta.items?.length || 0} productos</span>
                </div>
              </div>
              <div className="cuenta-footer">
                <div className="cuenta-subtotal">
                  <span className="label">Subtotal:</span>
                  <span className="amount">${cuenta.subtotal?.toLocaleString() || 0}</span>
                </div>
                <div className="cuenta-actions">
                  <button className="btn-small btn-view" onClick={() => openModal('cuenta', cuenta)}>
                    Ver Detalle
                  </button>
                  <button 
                    className="btn-small btn-success"
                    onClick={async () => {
                      if (window.confirm('¿Cerrar esta cuenta?')) {
                        try {
                          await cuentasService.cerrarCuenta(cuenta.id, 0);
                          const cuentaCerrada = await cuentasService.getCuenta(cuenta.id);
                          setTicketData({ cuenta: cuentaCerrada, visible: true });
                          cargarDatos();
                        } catch (error: any) {
                          console.error('Error al cerrar cuenta:', error);
                          alert(error.response?.data?.message || 'Error al cerrar la cuenta');
                        }
                      }
                    }}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <span className="empty-icon">📋</span>
          <p>No hay cuentas abiertas</p>
          <button className="btn-primary" onClick={() => openModal('cuenta')}>
            Abrir Nueva Cuenta
          </button>
        </div>
      )}
    </div>
  );

  // ==================== MODAL ====================
  const renderModal = () => {
    if (!showModal) return null;

    return (
      <div className="modal-overlay" onClick={closeModal}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>
              {modalType === 'mesa' && (editingItem ? 'Editar Mesa' : 'Nueva Mesa')}
              {modalType === 'mozo' && (editingItem ? 'Editar Mozo' : 'Nuevo Mozo')}
              {modalType === 'producto' && (editingItem ? 'Editar Producto' : 'Nuevo Producto')}
              {modalType === 'cuenta' && (editingItem ? 'Detalle de Cuenta' : 'Nueva Cuenta')}
            </h3>
            <button className="modal-close" onClick={closeModal}>×</button>
          </div>
          <div className="modal-body">
            {modalType === 'mesa' && <MesaForm mesa={editingItem} onSave={cargarDatos} onClose={closeModal} />}
            {modalType === 'mozo' && <MozoForm mozo={editingItem} onSave={cargarDatos} onClose={closeModal} />}
            {modalType === 'producto' && <ProductoForm producto={editingItem} categorias={categorias} onSave={cargarDatos} onClose={closeModal} />}
            {modalType === 'cuenta' && <CuentaForm cuenta={editingItem} mesas={mesas} mozos={mozos} onSave={cargarDatos} onClose={closeModal} />}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="restaurante-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando datos del restaurante...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="restaurante-page">
      <div className="page-header">
        <div className="header-content">
          <h1>🍽️ Restaurante Pilar</h1>
          <p>Panel de control en tiempo real</p>
        </div>
        <div className="header-actions">
          <div className="date-selector">
            <label>📅 Fecha:</label>
            <input 
              type="date" 
              value={selectedDate}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <button className="btn-refresh" onClick={cargarDatos}>
            🔄 Actualizar
          </button>
        </div>
      </div>

      <div className="tabs-nav">
        <button 
          className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button 
          className={`tab-btn ${activeTab === 'mesas' ? 'active' : ''}`}
          onClick={() => setActiveTab('mesas')}
        >
          🪑 Mesas
        </button>
        <button 
          className={`tab-btn ${activeTab === 'mozos' ? 'active' : ''}`}
          onClick={() => setActiveTab('mozos')}
        >
          👨‍🍳 Mozos
        </button>
        <button 
          className={`tab-btn ${activeTab === 'productos' ? 'active' : ''}`}
          onClick={() => setActiveTab('productos')}
        >
          🍕 Productos
        </button>
        <button 
          className={`tab-btn ${activeTab === 'cuentas' ? 'active' : ''}`}
          onClick={() => setActiveTab('cuentas')}
        >
          📋 Cuentas
        </button>
      </div>

      <div className="tab-container">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'mesas' && renderMesas()}
        {activeTab === 'mozos' && renderMozos()}
        {activeTab === 'productos' && renderProductos()}
        {activeTab === 'cuentas' && renderCuentas()}
      </div>

      {renderModal()}
      
      {/* Ticket de cuenta */}
      {ticketData?.visible && (
        <TicketCuenta 
          cuenta={ticketData.cuenta} 
          onClose={() => setTicketData(null)}
          onPrint={() => {
            const ticketElement = document.getElementById('ticket-print');
            if (ticketElement) {
              const printWindow = window.open('', '_blank', 'width=400,height=600');
              if (printWindow) {
                printWindow.document.write(`
                  <!DOCTYPE html>
                  <html>
                  <head>
                    <title>Ticket - Restaurante Pilar</title>
                    <style>
                      * { margin: 0; padding: 0; box-sizing: border-box; }
                      body { 
                        font-family: 'Courier New', Courier, monospace;
                        padding: 10px;
                        max-width: 80mm;
                        margin: 0 auto;
                      }
                      .ticket-header { text-align: center; margin-bottom: 10px; }
                      .ticket-logo { font-size: 2rem; }
                      .ticket-restaurant-name { 
                        font-family: Georgia, serif;
                        font-size: 1.8rem;
                        font-weight: bold;
                        color: #8B4513;
                        letter-spacing: 3px;
                      }
                      .ticket-subtitle { font-style: italic; font-size: 0.85rem; color: #666; }
                      .ticket-divider { text-align: center; color: #ccc; margin: 8px 0; font-size: 0.8rem; }
                      .ticket-divider.decorative { color: #D2691E; letter-spacing: 4px; }
                      .ticket-info-section { text-align: center; }
                      .ticket-info-section p { font-size: 0.75rem; color: #666; margin: 2px 0; }
                      .ticket-cuenta-info { margin: 8px 0; }
                      .ticket-row { display: flex; justify-content: space-between; font-size: 0.85rem; margin: 3px 0; }
                      .ticket-row.small { font-size: 0.75rem; color: #666; }
                      .ticket-bold { font-weight: bold; }
                      .ticket-items-header { 
                        display: grid; 
                        grid-template-columns: 40px 1fr 70px; 
                        font-size: 0.75rem; 
                        font-weight: bold;
                        color: #666;
                        text-transform: uppercase;
                      }
                      .ticket-item { 
                        display: grid; 
                        grid-template-columns: 40px 1fr 70px; 
                        font-size: 0.85rem; 
                        margin: 4px 0;
                      }
                      .ticket-item-qty { color: #8B4513; font-weight: bold; }
                      .ticket-item-price { text-align: right; }
                      .ticket-row.total { font-size: 1.1rem; font-weight: bold; margin-top: 5px; }
                      .ticket-total-amount { font-size: 1.2rem; color: #8B4513; }
                      .ticket-footer { text-align: center; margin-top: 10px; }
                      .ticket-thanks { font-family: Georgia, serif; font-weight: bold; color: #8B4513; }
                      .ticket-comeback { font-size: 0.8rem; color: #666; font-style: italic; }
                      .ticket-social p { font-size: 0.7rem; color: #888; margin: 2px 0; }
                      .ticket-legal { font-size: 0.65rem; color: #aaa; margin-top: 10px; font-style: italic; }
                      @media print {
                        body { padding: 0; }
                      }
                    </style>
                  </head>
                  <body>
                    ${ticketElement.innerHTML}
                  </body>
                  </html>
                `);
                printWindow.document.close();
                printWindow.focus();
                setTimeout(() => {
                  printWindow.print();
                  printWindow.close();
                }, 250);
              }
            }
          }}
        />
      )}
    </div>
  );
};

// ==================== FORMS ====================

const MesaForm: React.FC<{ mesa?: Mesa; onSave: () => void; onClose: () => void }> = ({ mesa, onSave, onClose }) => {
  const [form, setForm] = useState<{
    numero: number;
    capacidad: number;
    zona: 'FRENTE' | 'GALERIA' | 'SALON';
    activa: boolean;
  }>({
    numero: mesa?.numero || 0,
    capacidad: mesa?.capacidad || 4,
    zona: mesa?.zona || 'SALON',
    activa: mesa?.activa ?? true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mesa) {
        await mesasService.updateMesa(mesa.id, { numero: form.numero, capacidad: form.capacidad, zona: form.zona, activa: form.activa });
      } else {
        await mesasService.createMesa({ numero: form.numero, capacidad: form.capacidad, zona: form.zona });
      }
      onSave();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar la mesa');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form">
      <div className="form-group">
        <label>Número de Mesa</label>
        <input 
          type="number" 
          value={form.numero}
          onChange={e => setForm({ ...form, numero: parseInt(e.target.value) })}
          required
        />
      </div>
      <div className="form-group">
        <label>Capacidad (personas)</label>
        <input 
          type="number" 
          value={form.capacidad}
          onChange={e => setForm({ ...form, capacidad: parseInt(e.target.value) })}
          min={1}
          max={20}
          required
        />
      </div>
      <div className="form-group">
        <label>Zona</label>
        <select value={form.zona} onChange={e => setForm({ ...form, zona: e.target.value as 'FRENTE' | 'GALERIA' | 'SALON' })}>
          <option value="SALON">Salón Principal</option>
          <option value="FRENTE">Frente</option>
          <option value="GALERIA">Galería</option>
        </select>
      </div>
      <div className="form-group checkbox">
        <label>
          <input 
            type="checkbox" 
            checked={form.activa}
            onChange={e => setForm({ ...form, activa: e.target.checked })}
          />
          Mesa activa
        </label>
      </div>
      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
        <button type="submit" className="btn-primary">Guardar</button>
      </div>
    </form>
  );
};

const MozoForm: React.FC<{ mozo?: Mozo; onSave: () => void; onClose: () => void }> = ({ mozo, onSave, onClose }) => {
  const [form, setForm] = useState({
    nombre: mozo?.nombre || '',
    apellido: mozo?.apellido || '',
    dni: mozo?.dni || '',
    telefono: mozo?.telefono || '',
    activo: mozo?.activo ?? true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mozo) {
        await mozosService.updateMozo(mozo.id, { nombre: form.nombre, apellido: form.apellido, telefono: form.telefono, activo: form.activo });
      } else {
        await mozosService.createMozo({ nombre: form.nombre, apellido: form.apellido, dni: form.dni, telefono: form.telefono });
      }
      onSave();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar el mozo');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form">
      <div className="form-row">
        <div className="form-group">
          <label>Nombre</label>
          <input 
            type="text" 
            value={form.nombre}
            onChange={e => setForm({ ...form, nombre: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>Apellido</label>
          <input 
            type="text" 
            value={form.apellido}
            onChange={e => setForm({ ...form, apellido: e.target.value })}
            required
          />
        </div>
      </div>
      <div className="form-group">
        <label>Teléfono</label>
        <input 
          type="tel" 
          value={form.telefono}
          onChange={e => setForm({ ...form, telefono: e.target.value })}
        />
      </div>
      {!mozo && (
        <div className="form-group">
          <label>DNI</label>
          <input 
            type="text" 
            value={form.dni}
            onChange={e => setForm({ ...form, dni: e.target.value })}
            required
          />
        </div>
      )}
      <div className="form-group checkbox">
        <label>
          <input 
            type="checkbox" 
            checked={form.activo}
            onChange={e => setForm({ ...form, activo: e.target.checked })}
          />
          Mozo activo
        </label>
      </div>
      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
        <button type="submit" className="btn-primary">Guardar</button>
      </div>
    </form>
  );
};

const ProductoForm: React.FC<{ producto?: Producto; categorias: CategoriaProducto[]; onSave: () => void; onClose: () => void }> = ({ producto, categorias, onSave, onClose }) => {
  const [form, setForm] = useState({
    nombre: producto?.nombre || '',
    descripcion: producto?.descripcion || '',
    precio: producto?.precio || 0,
    categoriaId: producto?.categoriaId || (categorias[0]?.id || 0),
    disponible: producto?.disponible ?? true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (producto) {
        await productosService.updateProducto(producto.id, form);
      } else {
        await productosService.createProducto(form);
      }
      onSave();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar el producto');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form">
      <div className="form-group">
        <label>Nombre del Producto</label>
        <input 
          type="text" 
          value={form.nombre}
          onChange={e => setForm({ ...form, nombre: e.target.value })}
          required
        />
      </div>
      <div className="form-group">
        <label>Descripción</label>
        <textarea 
          value={form.descripcion}
          onChange={e => setForm({ ...form, descripcion: e.target.value })}
          rows={3}
        />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Precio ($)</label>
          <input 
            type="number" 
            value={form.precio}
            onChange={e => setForm({ ...form, precio: parseFloat(e.target.value) })}
            min={0}
            step={0.01}
            required
          />
        </div>
        <div className="form-group">
          <label>Categoría</label>
          <select 
            value={form.categoriaId} 
            onChange={e => setForm({ ...form, categoriaId: parseInt(e.target.value) })}
          >
            {categorias.map(cat => (
              <option key={cat.id} value={cat.id}>
                📦 {cat.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="form-group checkbox">
        <label>
          <input 
            type="checkbox" 
            checked={form.disponible}
            onChange={e => setForm({ ...form, disponible: e.target.checked })}
          />
          Producto disponible
        </label>
      </div>
      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
        <button type="submit" className="btn-primary">Guardar</button>
      </div>
    </form>
  );
};

const CuentaForm: React.FC<{ cuenta?: Cuenta; mesas: Mesa[]; mozos: Mozo[]; onSave: () => void; onClose: () => void }> = ({ cuenta, mesas, mozos, onSave, onClose }) => {
  const [form, setForm] = useState({
    mesaId: cuenta?.mesaId || (mesas.find(m => m.estado === 'LIBRE')?.id || 0),
    mozoId: cuenta?.mozoId || (mozos.find(m => m.activo)?.id || 0),
    numeroClientes: cuenta?.numeroClientes || 2
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!cuenta) {
        await cuentasService.createCuenta(form);
      }
      onSave();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al crear la cuenta');
    }
  };

  if (cuenta) {
    return (
      <div className="cuenta-detalle">
        <div className="detalle-info">
          <p><strong>Mesa:</strong> {cuenta.mesa?.numero}</p>
          <p><strong>Mozo:</strong> {cuenta.mozo?.nombre} {cuenta.mozo?.apellido}</p>
          <p><strong>Clientes:</strong> {cuenta.numeroClientes}</p>
          <p><strong>Apertura:</strong> {new Date(cuenta.fechaApertura).toLocaleString()}</p>
        </div>
        <div className="detalle-items">
          <h4>Items del pedido:</h4>
          {cuenta.items?.length > 0 ? (
            <ul>
              {cuenta.items.map((item, idx) => (
                <li key={idx}>
                  {item.cantidad}x {item.producto?.nombre || 'Producto'} - ${(item.precioUnitario * item.cantidad).toLocaleString()}
                </li>
              ))}
            </ul>
          ) : (
            <p>Sin items aún</p>
          )}
        </div>
        <div className="detalle-totales">
          <p><strong>Subtotal:</strong> ${cuenta.subtotal?.toLocaleString()}</p>
          <p><strong>Total:</strong> ${cuenta.total?.toLocaleString()}</p>
        </div>
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="form">
      <div className="form-group">
        <label>Mesa</label>
        <select 
          value={form.mesaId} 
          onChange={e => setForm({ ...form, mesaId: parseInt(e.target.value) })}
        >
          {mesas.filter(m => m.estado === 'LIBRE' && m.activa).map(mesa => (
            <option key={mesa.id} value={mesa.id}>
              Mesa {mesa.numero} - {mesa.zona} ({mesa.capacidad} pers.)
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label>Mozo</label>
        <select 
          value={form.mozoId} 
          onChange={e => setForm({ ...form, mozoId: parseInt(e.target.value) })}
        >
          {mozos.filter(m => m.activo).map(mozo => (
            <option key={mozo.id} value={mozo.id}>
              {mozo.nombre} {mozo.apellido}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label>Número de Clientes</label>
        <input 
          type="number" 
          value={form.numeroClientes}
          onChange={e => setForm({ ...form, numeroClientes: parseInt(e.target.value) })}
          min={1}
          max={20}
          required
        />
      </div>
      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
        <button type="submit" className="btn-primary">Abrir Cuenta</button>
      </div>
    </form>
  );
};

// ==================== TICKET CUENTA ====================
const TicketCuenta: React.FC<{ cuenta: Cuenta; onClose: () => void; onPrint: () => void }> = ({ cuenta, onClose, onPrint }) => {
  const fechaCierre = cuenta.fechaCierre ? new Date(cuenta.fechaCierre) : new Date();
  const fechaApertura = new Date(cuenta.fechaApertura);
  
  // Calcular duración en minutos
  const duracionMs = fechaCierre.getTime() - fechaApertura.getTime();
  const duracionMin = Math.round(duracionMs / 60000);
  const horas = Math.floor(duracionMin / 60);
  const minutos = duracionMin % 60;
  const duracionTexto = horas > 0 ? `${horas}h ${minutos}min` : `${minutos} min`;

  // Agrupar items por producto
  const itemsAgrupados = cuenta.items?.reduce((acc, item) => {
    const key = item.productoId;
    if (!acc[key]) {
      acc[key] = { ...item, cantidad: 0, precioTotal: 0 };
    }
    acc[key].cantidad += item.cantidad;
    acc[key].precioTotal += item.precioUnitario * item.cantidad;
    return acc;
  }, {} as Record<number, typeof cuenta.items[0]>) || {};

  return (
    <div className="ticket-overlay" onClick={onClose}>
      <div className="ticket-container" onClick={e => e.stopPropagation()}>
        <div className="ticket-paper" id="ticket-print">
          {/* Header del ticket */}
          <div className="ticket-header">
            <div className="ticket-logo">🍽️</div>
            <h1 className="ticket-restaurant-name">PILAR</h1>
            <p className="ticket-subtitle">Restaurante & Cafetería</p>
            <div className="ticket-divider decorative">✦ ✦ ✦</div>
          </div>

          {/* Info del establecimiento */}
          <div className="ticket-info-section">
            <p className="ticket-address">Av. Principal 1234</p>
            <p className="ticket-phone">Tel: (011) 4567-8900</p>
            <p className="ticket-cuit">CUIT: 30-12345678-9</p>
          </div>

          <div className="ticket-divider">━━━━━━━━━━━━━━━━━━━━━━━━</div>

          {/* Datos de la cuenta */}
          <div className="ticket-cuenta-info">
            <div className="ticket-row">
              <span>Ticket N°:</span>
              <span className="ticket-bold">#{cuenta.id.toString().padStart(6, '0')}</span>
            </div>
            <div className="ticket-row">
              <span>Mesa:</span>
              <span className="ticket-bold">{cuenta.mesa?.numero || '-'}</span>
            </div>
            <div className="ticket-row">
              <span>Fecha:</span>
              <span>{fechaCierre.toLocaleDateString('es-AR')}</span>
            </div>
            <div className="ticket-row">
              <span>Hora:</span>
              <span>{fechaCierre.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="ticket-row">
              <span>Atendido por:</span>
              <span>{cuenta.mozo?.nombre} {cuenta.mozo?.apellido?.charAt(0)}.</span>
            </div>
            <div className="ticket-row">
              <span>Comensales:</span>
              <span>{cuenta.numeroClientes}</span>
            </div>
          </div>

          <div className="ticket-divider">━━━━━━━━━━━━━━━━━━━━━━━━</div>

          {/* Items */}
          <div className="ticket-items-section">
            <div className="ticket-items-header">
              <span>Cant.</span>
              <span>Descripción</span>
              <span>Importe</span>
            </div>
            <div className="ticket-divider thin">------------------------</div>
            {Object.values(itemsAgrupados).map((item, idx) => (
              <div key={idx} className="ticket-item">
                <span className="ticket-item-qty">{item.cantidad}x</span>
                <span className="ticket-item-name">{item.producto?.nombre || 'Producto'}</span>
                <span className="ticket-item-price">${item.precioTotal.toLocaleString('es-AR')}</span>
              </div>
            ))}
            {(!cuenta.items || cuenta.items.length === 0) && (
              <div className="ticket-item empty">
                <span>- Sin consumiciones -</span>
              </div>
            )}
          </div>

          <div className="ticket-divider">━━━━━━━━━━━━━━━━━━━━━━━━</div>

          {/* Totales */}
          <div className="ticket-totals">
            <div className="ticket-row subtotal">
              <span>Subtotal:</span>
              <span>${cuenta.subtotal?.toLocaleString('es-AR') || '0'}</span>
            </div>
            {cuenta.propina > 0 && (
              <div className="ticket-row propina">
                <span>Propina:</span>
                <span>${cuenta.propina.toLocaleString('es-AR')}</span>
              </div>
            )}
            <div className="ticket-divider thin">------------------------</div>
            <div className="ticket-row total">
              <span>TOTAL:</span>
              <span className="ticket-total-amount">${cuenta.total?.toLocaleString('es-AR') || '0'}</span>
            </div>
          </div>

          <div className="ticket-divider">━━━━━━━━━━━━━━━━━━━━━━━━</div>

          {/* Promedio y duración */}
          <div className="ticket-extra-info">
            <div className="ticket-row small">
              <span>Promedio por persona:</span>
              <span>${cuenta.numeroClientes > 0 ? Math.round((cuenta.total || 0) / cuenta.numeroClientes).toLocaleString('es-AR') : '0'}</span>
            </div>
            <div className="ticket-row small">
              <span>Tiempo de estancia:</span>
              <span>{duracionTexto}</span>
            </div>
          </div>

          <div className="ticket-divider decorative">✦ ✦ ✦</div>

          {/* Footer */}
          <div className="ticket-footer">
            <p className="ticket-thanks">¡Gracias por su visita!</p>
            <p className="ticket-comeback">Esperamos verlo pronto</p>
            <div className="ticket-social">
              <p>📷 @restaurantepilar</p>
              <p>🌐 www.restaurantepilar.com</p>
            </div>
            <p className="ticket-legal">* Este ticket no es válido como factura</p>
          </div>
        </div>

        {/* Botones de acción (no se imprimen) */}
        <div className="ticket-actions">
          <button className="btn-ticket-print" onClick={onPrint}>
            🖨️ Imprimir
          </button>
          <button className="btn-ticket-close" onClick={onClose}>
            ✕ Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default RestaurantePage;
