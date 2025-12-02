import React from 'react';
import './CodeEditor.css';

const CodeEditor = ({ code, onChange, errors, isFloating, onCompile }) => {
  const handleChange = (event) => {
    onChange(event.target.value);
  };

  // Función para procesar el string de error del backend "TIPO|LINEA|MENSAJE"
  const parseError = (errorString) => {
    if (!errorString) return { type: 'General', line: '?', message: '' };
    
    const parts = errorString.split('|');
    if (parts.length >= 3) {
      return {
        type: parts[0],
        line: parts[1],
        message: parts.slice(2).join('|')
      };
    }
    return {
      type: 'General',
      line: '?',
      message: errorString
    };
  };

  const getErrorColorClass = (type) => {
    switch (type?.toLowerCase()) {
        case 'léxico': return 'error-lexical';
        case 'sintáctico': return 'error-syntactic';
        case 'semántico': return 'error-semantic';
        default: return 'error-general';
    }
  };

  return (
    <div className={`code-editor ${isFloating ? 'floating' : ''}`}>
      <div className="editor-header">
        <h3>Editor de Código</h3>
        {isFloating && (
            <button className="btn-mini-compile" onClick={onCompile} title="Compilar">
                ▶ Compilar
            </button>
        )}
      </div>

      <div className="editor-container">
        <textarea
          value={code}
          onChange={handleChange}
          className="code-textarea"
          placeholder="// Escribe tu código aquí..."
          spellCheck="false"
        />
      </div>
      
      {errors && errors.length > 0 && (
        <div className="errors-panel">
          <div className="errors-header">
            <h4>🚨 Lista de Errores ({errors.length})</h4>
          </div>
          <div className="errors-list">
            {errors.map((rawError, index) => {
                const err = parseError(rawError);
                const colorClass = getErrorColorClass(err.type);
                
                return (
                    <div key={index} className={`error-item ${colorClass}`}>
                      <div className="error-badges">
                          <span className="badge-type">{err.type}</span>
                          {err.line !== '0' && err.line !== '?' && (
                              <span className="badge-line">Línea {err.line}</span>
                          )}
                      </div>
                      <span className="error-message">{err.message}</span>
                    </div>
                );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeEditor;