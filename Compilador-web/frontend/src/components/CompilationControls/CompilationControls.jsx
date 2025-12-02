import React from 'react';
import './CompilationControls.css';

const CompilationControls = ({ 
  onCompile, 
  onStepByStep, 
  onToggleFloating, 
  loading, 
  isFloating, 
  hasResult 
}) => {
  return (
    <div className="compilation-controls">
      {/* Título condicional */}
      <h3>{isFloating ? 'Editor' : 'Controles de Compilación'}</h3>
      
      <div className="controls-actions">
        <button 
          className="btn-primary" 
          onClick={onCompile} 
          disabled={loading}
        >
          {loading ? '...' : '▶ Compilar'}
        </button>

        <button 
          className="btn-secondary" 
          onClick={onStepByStep}
          disabled={!hasResult || loading}
        >
          👣 Paso a Paso
        </button>

        {/* Solo mostramos el botón de ACTIVAR modo flotante aquí.
            El de desactivar ahora está en el Header. */}
        {!isFloating && hasResult && (
          <button 
            className="btn-toggle" 
            onClick={onToggleFloating}
            title="Desacoplar editor"
          >
            👁️ Flotante
          </button>
        )}
      </div>

      {!isFloating && (
          <div className="status-bar">
            Estado: {loading ? 'Procesando...' : hasResult ? 'Compilación Exitosa' : 'Listo'}
          </div>
      )}
    </div>
  );
};

export default CompilationControls;