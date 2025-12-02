import React from 'react';
import './QuadruplesViewer.css';

const QuadruplesViewer = ({ intermediateCode }) => {
    // Diccionario de traducción para los badges
    const typeTranslations = {
        arithmetic: 'Aritmética',
        assignment: 'Asignación',
        comparison: 'Comparación',
        jump: 'Salto',
        label: 'Etiqueta',
        return: 'Retorno',
        write: 'Escritura',
        call: 'Llamada',
        parameter: 'Parámetro'
    };

    if (!intermediateCode || intermediateCode.length === 0) {
        return (
            <div className="quadruples-visualizer">
                <h3>🔄 Código Intermedio - Cuádruplos</h3>
                <div className="placeholder">
                    <p>Compila un programa para visualizar los Cuádruplos</p>
                </div>
            </div>
        );
    }

    const getRowClass = (quad) => {
        const baseClass = 'quadruple-row';
        const typeClass = `type-${quad.quadruple_type}`;
        return `${baseClass} ${typeClass}`;
    };

    return (
        <div className="quadruples-visualizer">
            <h3>🔄 Código Intermedio - Cuádruplos</h3>
            
            <div className="quadruples-summary">
                <span className="summary-item">
                    Total: {intermediateCode.length} cuádruplos
                </span>
                <span className="summary-item">
                    Temporales: {intermediateCode.filter(q => q.result?.startsWith('t')).length}
                </span>
                <span className="summary-item">
                    Etiquetas: {intermediateCode.filter(q => q.quadruple_type === 'label').length}
                </span>
            </div>

            <div className="quadruples-container">
                <table className="quadruples-table">
                    <thead>
                        <tr>
                            <th className="col-index">#</th>
                            <th className="col-op">Operador</th>
                            <th className="col-arg1">Arg1</th>
                            <th className="col-arg2">Arg2</th>
                            <th className="col-res">Resultado</th>
                            <th className="col-type">Tipo</th>
                        </tr>
                    </thead>
                    <tbody>
                        {intermediateCode.map((quad, index) => (
                            <tr key={index} className={getRowClass(quad)}>
                                <td className="quad-index col-index">{quad.index}</td>
                                
                                {/* Operador alineado a la izquierda sin iconos */}
                                <td className="quad-operator col-op">
                                    <span className="operator-text">
                                        {quad.operator || '-'}
                                    </span>
                                </td>

                                <td className="quad-arg col-arg1">{quad.arg1 || '-'}</td>
                                <td className="quad-arg col-arg2">{quad.arg2 || '-'}</td>
                                
                                <td className="quad-result col-res">
                                    {quad.result ? (
                                        <span className={`result-value 
                                            ${quad.result.startsWith('t') ? 'temporal' : ''}
                                            ${quad.result.startsWith('label') ? 'label' : ''}
                                            ${quad.quadruple_type === 'label' ? 'label-def' : ''}
                                        `}>
                                            {quad.result}
                                        </span>
                                    ) : '-'}
                                </td>

                                {/* Columna TIPO traducida */}
                                <td className="quad-type col-type">
                                    {/* Mantiene la clase en inglés para los colores, muestra texto en español */}
                                    <span className={`type-badge ${quad.quadruple_type}`}>
                                        {typeTranslations[quad.quadruple_type] || quad.quadruple_type}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="quadruples-legend">
                <h4>Leyenda:</h4>
                <div className="legend-items">
                    <span className="legend-item arithmetic">Aritméticos</span>
                    <span className="legend-item assignment">Asignaciones</span>
                    <span className="legend-item comparison">Comparaciones</span>
                    <span className="legend-item jump">Saltos</span>
                    <span className="legend-item label">Etiquetas</span>
                    <span className="legend-item return">Returns</span>
                    <span className="legend-item write">Print</span>
                </div>
            </div>
        </div>
    );
};

export default QuadruplesViewer;