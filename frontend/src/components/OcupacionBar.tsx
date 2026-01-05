import { getColorOcupacion } from '../utils/helpers';
import './OcupacionBar.css';

interface OcupacionBarProps {
  porcentaje: number;
  personasReservadas: number;
  capacidadTotal: number;
  mostrarDetalles?: boolean;
}

export function OcupacionBar({
  porcentaje,
  personasReservadas,
  capacidadTotal,
  mostrarDetalles = true
}: OcupacionBarProps) {
  const colorClass = getColorOcupacion(porcentaje);

  return (
    <div className="ocupacion-container">
      <div className="ocupacion-bar">
        <div
          className={`ocupacion-fill ${colorClass}`}
          style={{ width: `${Math.min(porcentaje, 100)}%` }}
        />
      </div>
      {mostrarDetalles && (
        <div className="ocupacion-info">
          <span className={`ocupacion-porcentaje ${colorClass}`}>
            {porcentaje}% ocupado
          </span>
          <span className="ocupacion-detalle">
            {personasReservadas} / {capacidadTotal} personas
          </span>
        </div>
      )}
    </div>
  );
}
