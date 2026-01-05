import './Footer.css';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container footer-content">
        <div className="footer-info">
          <h4>🍽️ Restaurante Puente</h4>
          <p>Un lugar especial para momentos inolvidables</p>
        </div>
        
        <div className="footer-horarios">
          <h5>Horarios de atención</h5>
          <p>Martes a Sábado</p>
          <p>Almuerzo y Cena</p>
        </div>

        <div className="footer-contacto">
          <h5>Contacto</h5>
          <p>📍 Dirección del restaurante</p>
          <p>📞 Teléfono de contacto</p>
        </div>
      </div>
      
      <div className="footer-bottom">
        <div className="container">
          <p>© {year} Restaurante Puente. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
