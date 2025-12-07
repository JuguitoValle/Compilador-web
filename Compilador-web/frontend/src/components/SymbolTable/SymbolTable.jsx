import React, { useState, useEffect, useMemo } from 'react';
import './SymbolTable.css';

const SymbolTable = ({ symbolTable }) => {
    // Usamos un Set para guardar los IDs o nombres de scopes expandidos
    const [expandedScopes, setExpandedScopes] = useState(new Set(['global']));

    // Efecto para expandir 'global' y sus hijos directos al cargar una nueva tabla
    useEffect(() => {
        if (symbolTable) {
            // Expandir el scope global
            const newExpanded = new Set([symbolTable.scope_name]);
            // Expandir también los hijos directos (nivel 1)
            if (symbolTable.children) {
                symbolTable.children.forEach(child => {
                    newExpanded.add(child.scope_name);
                });
            }
            setExpandedScopes(newExpanded);
        }
    }, [symbolTable]);

    const toggleScope = (scopeId) => {
        const newExpanded = new Set(expandedScopes);
        if (newExpanded.has(scopeId)) {
            newExpanded.delete(scopeId);
        } else {
            newExpanded.add(scopeId);
        }
        setExpandedScopes(newExpanded);
    };

    const expandAll = () => {
        const allScopes = new Set();
        const traverse = (table) => {
            // Usamos una clave única combinando nombre y nivel si es necesario
            // pero scope_name suele ser suficiente si es único
            allScopes.add(table.scope_name);
            if (table.children) {
                table.children.forEach(traverse);
            }
        };
        if (symbolTable) traverse(symbolTable);
        setExpandedScopes(allScopes);
    };

    const collapseAll = () => {
        setExpandedScopes(new Set(['global']));
    };

    // Función recursiva de renderizado
    const renderSymbolTable = (table, level = 0, index = 0) => {
        // Generamos una key única para evitar errores de React
        const uniqueKey = `${table.scope_name}-${level}-${index}`;
        const isExpanded = expandedScopes.has(table.scope_name);
        
        const symbolsList = Object.values(table.symbols || {});
        const hasChildren = table.children && table.children.length > 0;
        const hasSymbols = symbolsList.length > 0;

        return (
            <div key={uniqueKey} className="symbol-table-level" style={{ marginLeft: level > 0 ? '20px' : '0' }}>
                <div 
                    className={`scope-header ${isExpanded ? 'expanded' : ''}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleScope(table.scope_name);
                    }}
                >
                    <span className="toggle-icon">
                        {isExpanded ? '▼' : '►'}
                    </span>
                    <div className="scope-info">
                        <strong>{table.scope_name}</strong>
                        <span className="scope-badge">Nivel {level}</span>
                    </div>
                    <span className="symbol-count">
                        {symbolsList.length} var/func
                        {hasChildren && ` | ${table.children.length} sub-scopes`}
                    </span>
                </div>

                {isExpanded && (
                    <div className="scope-content">
                        {hasSymbols ? (
                            <table className="symbol-table">
                                <thead>
                                    <tr>
                                        <th>Nombre</th>
                                        <th>Tipo</th>
                                        <th>Dir. Mem</th>
                                        <th>Línea</th>
                                        <th>Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {symbolsList.map((symbol, idx) => (
                                        <tr key={idx} className={`
                                            ${!symbol.used ? 'unused' : ''}
                                            ${symbol.used && !symbol.initialized ? 'uninitialized' : ''}
                                        `}>
                                            <td>
                                                <span className="symbol-name">{symbol.name}</span>
                                                {symbol.symbol_type === 'function' && ' 🔧'}
                                            </td>
                                            <td>
                                                <span className={`data-type ${symbol.data_type}`}>
                                                    {symbol.data_type}
                                                </span>
                                            </td>
                                            <td className="mono-font">#{symbol.memory_address}</td>
                                            <td className="text-center">{symbol.line}</td>
                                            <td>
                                                <div className="status-container">
                                                    <span title="Inicializada" className={`status-icon ${symbol.initialized ? 'ok' : 'err'}`}>
                                                        {symbol.initialized ? 'Inic. ✅' : 'Inic. ❌'}
                                                    </span>
                                                    <span title="Usada" className={`status-icon ${symbol.used ? 'ok' : 'warn'}`}>
                                                        {symbol.used ? 'Usada ✅' : 'No Usada ⚠️'}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="empty-scope">
                                <span>(Sin variables declaradas en este nivel)</span>
                            </div>
                        )}

                        {/* RECURSIVIDAD: Renderizar hijos */}
                        {hasChildren && (
                            <div className="nested-scopes-container">
                                {table.children.map((childTable, childIndex) => 
                                    renderSymbolTable(childTable, level + 1, childIndex)
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    if (!symbolTable) {
        return (
            <div className="symbol-table-visualizer">
                <h3>📊 Tabla de Símbolos</h3>
                <div className="placeholder">
                    <p>Compila un programa para ver los Scopes.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="symbol-table-visualizer">
            <div className="header">
                <h3>📊 Tabla de Símbolos</h3>
                <div className="controls">
                    <button onClick={expandAll} className="btn-sm">Expandir Todo</button>
                    <button onClick={collapseAll} className="btn-sm">Colapsar Todo</button>
                </div>
            </div>

            <div className="summary-bar">
                <span className="summary-pill">Scopes Totales: {countScopes(symbolTable)}</span>
                <span className="summary-pill">Variables: {countVariables(symbolTable)}</span>
            </div>
            
            <div className="symbol-table-container">
                {renderSymbolTable(symbolTable)}
            </div>
        </div>
    );
};

// --- Helpers para conteo recursivo ---
const countScopes = (table) => {
    let count = 1; 
    if(table.children) {
        table.children.forEach(child => count += countScopes(child));
    }
    return count;
};

const countVariables = (table) => {
    let count = Object.values(table.symbols || {}).filter(s => s.symbol_type === 'variable').length;
    if(table.children) {
        table.children.forEach(child => count += countVariables(child));
    }
    return count;
};

export default SymbolTable;