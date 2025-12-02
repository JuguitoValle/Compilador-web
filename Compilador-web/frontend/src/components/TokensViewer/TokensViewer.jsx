import React from 'react';
import './TokensViewer.css';

const TokensViewer = ({ tokens, errors }) => {
  if (!tokens || tokens.length === 0) {
    return (
      <div className="tokens-viewer">
        <h3>Tokens - Análisis Léxico</h3>
        <div className="placeholder">
          <p>Compila un programa para ver los tokens generados</p>
        </div>
      </div>
    );
  }

  // --- MODIFICACIÓN: TRADUCCIONES ---
  const typeTranslations = {
    'KEYWORD': 'PALABRA CLAVE',
    'IDENTIFIER': 'IDENTIFICADOR',
    'OPERATOR': 'OPERADOR',
    'DELIMITER': 'DELIMITADOR',
    'INTEGER': 'ENTERO',
    'FLOAT': 'FLOTANTE',
    'STRING': 'CADENA',
    'CHAR': 'CARACTER'
  };

  const getSpanishType = (type) => {
    return typeTranslations[type] || type;
  };
  // --- FIN DE LA MODIFICACIÓN ---

  const getTokenColor = (type) => {
    const colors = {
      'KEYWORD': '#d73a49',       // Rojo
      'IDENTIFIER': '#BB86FC',    // Morado (Tema)
      'OPERATOR': '#03DAC6',    // Cián (Tema)
      'DELIMITER': '#B0B0B0',   // Gris (Tema)
      'INTEGER': '#FF9800',     // Naranja
      'FLOAT': '#FF9800',      // Naranja
      'STRING': '#4CAF50',      // Verde
      'CHAR': '#4CAF50'        // Verde
    };
    return colors[type] || '#B0B0B0';
  };

  return (
    <div className="tokens-viewer">
      <h3>Tokens - Análisis Léxico</h3>
      
      <div className="tokens-info">
        <p>Total de tokens: {tokens.length}</p>
      </div>

      <div className="tokens-container">
        <table>
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Valor</th>
              <th>Línea</th>
              <th>Columna</th>
            </tr>
          </thead>
          <tbody>
            {tokens.map((token, index) => (
              <tr key={index}>
                <td>
                  <span 
                    className="token-type"
                    style={{ color: getTokenColor(token.type) }}
                  >
                    {/* Usamos la función de traducción */}
                    {getSpanishType(token.type)}
                  </span>
                </td>
                <td className="token-value">{token.value}</td>
                <td>{token.line}</td>
                <td>{token.column}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {errors && errors.length > 0 && (
        <div className="lexical-errors">
          <h4>Errores Léxicos:</h4>
          {errors.map((error, index) => (
            <div key={index} className="error-item">
              {error}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TokensViewer;