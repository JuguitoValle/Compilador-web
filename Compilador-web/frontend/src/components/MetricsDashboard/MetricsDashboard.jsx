import React from 'react';
import './MetricsDashboard.css';

const MetricsDashboard = ({ metrics }) => {
  if (!metrics) {
    return (
      <div className="metrics-dashboard">
        <h3>Métricas de Compilación</h3>
        <div className="placeholder">
          <p>No hay métricas disponibles</p>
        </div>
      </div>
    );
  }

  // Formatear el tiempo de compilación
  const compilationTime = metrics.compilation_time
    ? parseFloat(metrics.compilation_time).toFixed(4)
    : 'N/A';

  // Analizar la reducción para aplicar estilos.
  // Ahora tomamos el valor que App.jsx aseguró que exista.
  const reductionValue = parseFloat(metrics.optimization_reduction || 0);
  const isPositiveReduction = reductionValue > 0;

  return (
    <div className="metrics-dashboard">
      <h3>Métricas de Compilación</h3>
      
      <div className="metrics-grid">
        <div className="metric-card">
          <h4>Tiempo de Compilación</h4>
          <div className="metric-value">{compilationTime} ms</div>
        </div>
        
        <div className="metric-card">
          <h4>Tokens Generados</h4>
          <div className="metric-value">{metrics.tokens_count || '0'}</div>
        </div>
        
        <div className="metric-card">
          <h4>Líneas de Código Intermedio</h4>
          <div className="metric-value">
            {metrics.quadruples_count || '0'}
          </div>
        </div>
        
        {/* Tarjeta condicional para Reducción */}
        <div className={`metric-card ${isPositiveReduction ? 'positive-reduction' : ''}`}>
          <h4>Reducción por Optimización</h4>
          <div className="metric-value">
            {reductionValue.toFixed(1)}%
          </div>
        </div>
        
        <div className="metric-card">
          <h4>Símbolos en Tabla</h4>
          <div className="metric-value">
            {metrics.symbols_count || '0'}
          </div>
        </div>
        
        {/* Tarjeta condicional para Errores */}
        <div className={`metric-card ${metrics.errors_count > 0 ? 'has-errors' : ''}`}>
          <h4>Errores Encontrados</h4>
          <div className={`metric-value ${metrics.errors_count > 0 ? 'error' : ''}`}>
            {metrics.errors_count || '0'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricsDashboard;