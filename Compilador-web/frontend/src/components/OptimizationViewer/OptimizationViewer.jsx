import React from 'react';
import './OptimizationViewer.css';

const OptimizationViewer = ({ original, optimized, log }) => {
    if (!original || !optimized) {
        return (
            <div className="optimization-viewer">
                <h3>Optimización de Código</h3>
                <div className="placeholder">
                    <p>Compila un programa para visualizar las optimizaciones</p>
                </div>
            </div>
        );
    }

    const reduction = original.length > 0 
        ? ((original.length - optimized.length) / original.length) * 100 
        : 0;

    return (
        <div className="optimization-viewer">
            <h3>Optimización de Código</h3>
            
            {/* 1. Estadísticas */}
            <div className="optimization-stats">
                <div className="stat-card">
                    <span className="stat-value">{original.length}</span>
                    <span className="stat-label">Cuádruplos Originales</span>
                </div>
                <div className="stat-card optimized">
                    <span className="stat-value">{optimized.length}</span>
                    <span className="stat-label">Cuádruplos Optimizados</span>
                </div>
                <div className={`stat-card reduction ${reduction > 0 ? 'positive' : 'neutral'}`}>
                    <span className="stat-value">{reduction.toFixed(1)}%</span>
                    <span className="stat-label">Reducción</span>
                </div>
            </div>

            {/* 2. Bitácora de Optimizaciones */}
            <div className="optimization-log-section">
                <h4>🛠️ Bitácora de Optimizaciones Aplicadas</h4>
                <div className="optimization-log-container">
                    {log && log.length > 0 ? (
                        <ul className="log-list">
                            {log.map((entry, index) => (
                                <li key={index} className="log-entry">
                                    <span className="log-icon">✅</span>
                                    {entry}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="no-optimizations">No se encontraron optimizaciones posibles.</p>
                    )}
                </div>
            </div>

            {/* 3. Comparación de Código */}
            <div className="comparison-view">
                <div className="code-column">
                    <h4>📄 Original</h4>
                    <div className="code-container">
                        {original.map((quad, index) => (
                            <div key={index} className="quadruple-line">
                                <span className="quad-index">[{quad.index}]</span>
                                <span className="quad-operator">{quad.operator}</span>
                                <span className="quad-arg">{quad.arg1 || '_'}</span>
                                <span className="quad-arg">{quad.arg2 || '_'}</span>
                                <span className="quad-result">{quad.result || '_'}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="code-column">
                    <h4>🚀 Optimizado</h4>
                    <div className="code-container optimized-bg">
                        {optimized.map((quad, index) => (
                            <div key={index} className="quadruple-line optimized">
                                <span className="quad-index">[{quad.index}]</span>
                                <span className="quad-operator">{quad.operator}</span>
                                <span className="quad-arg">{quad.arg1 || '_'}</span>
                                <span className="quad-arg">{quad.arg2 || '_'}</span>
                                <span className="quad-result">{quad.result || '_'}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OptimizationViewer;