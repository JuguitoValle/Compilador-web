import React, { useState, useEffect, useRef } from 'react';
import { Tree } from 'react-d3-tree';
import { saveSvgAsPng } from 'save-svg-as-png'; // Importamos la librería
import './ASTVisualizer.css';

// --- FUNCIÓN DE TRADUCCIÓN ---
const traducirNombreNodo = (nombre) => {
  const traducciones = {
    'Program': 'Programa',
    'Function': 'Función',
    'Block': 'Bloque',
    'VariableDeclaration': 'DeclaraciónVar',
    'Identifier': 'Identificador',
    'BinaryExpression': 'ExpresiónBinaria',
    'Literal': 'Literal',
    'If': 'SiCondicional',
    'Return': 'Retorno',
    'Print': 'Imprimir',
    'String': 'Cadena',
    'VarDecl': 'DeclaraciónVar', 
    'BinaryOp': 'OperaciónBinaria'
  };
  return traducciones[nombre] || nombre; 
};

// --- FUNCIÓN PARA OBTENER VALOR ---
const getNodeDisplayValue = (node) => {
  if (!node) return '';
  if (node.type === 'Identifier') return node.value || node.name || '';
  if (node.type === 'BinaryExpression') return node.operator || node.value || '';
  if ((node.type === 'Literal' || node.type === 'String') && node.value !== undefined) return node.value;
  if (node.value !== undefined) return node.value;
  return '';
};

// Función para transformar el AST
const transformASTtoTreeData = (node) => {
  if (!node) return null;

  let nodeClass = node.type.toLowerCase();
  if (node.type.includes('Decl')) nodeClass += ' decl';
  if (node.type.includes('Op')) nodeClass += ' operator';
  if (node.type === 'Literal' || node.type === 'String') nodeClass += ' literal';
  if (node.type === 'Function' || node.type === 'Block' || node.type === 'If' || node.type === 'Return' || node.type === 'Print') nodeClass += ' control';
  if (node.type === 'Program') nodeClass += ' program';

  const newNode = {
    name: node.type,
    attributes: {
      displayValue: getNodeDisplayValue(node), 
    },
    nodeClass: nodeClass, 
    children: [],
  };

  for (const key in node) {
    if (Object.hasOwnProperty.call(node, key)) {
      const value = node[key];
      if (Array.isArray(value)) {
        value.forEach(child => {
          if (typeof child === 'object' && child !== null && child.type) {
            const transformedChild = transformASTtoTreeData(child);
            if (transformedChild) newNode.children.push(transformedChild);
          }
        });
      } 
      else if (typeof value === 'object' && value !== null && value.type && key !== 'loc') {
        const transformedChild = transformASTtoTreeData(value);
        if (transformedChild) newNode.children.push(transformedChild);
      }
    }
  }
  newNode.children = newNode.children.filter(child => child !== null);
  return newNode;
};


const ASTVisualizer = ({ ast }) => {
  const [treeData, setTreeData] = useState(null);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  // Referencia al contenedor principal del gráfico
  const containerRef = useRef();

  useEffect(() => {
    if (ast) {
      const transformedData = transformASTtoTreeData(ast);
      if (transformedData) {
        setTreeData([transformedData]);
      } else {
        setTreeData(null);
      }
    } else {
      setTreeData(null);
    }
  }, [ast]);

  useEffect(() => {
    if (containerRef.current && treeData) {
      const dimensions = containerRef.current.getBoundingClientRect();
      setTranslate({
        x: dimensions.width / 2,
        y: dimensions.height / 5, 
      });
    }
  }, [treeData]);

  // --- NUEVO: FUNCIÓN DE DESCARGA ---
  const handleDownloadImage = () => {
    if (!containerRef.current) return;
    
    // Encuentra el elemento <svg> dentro del contenedor
    const svgElement = containerRef.current.querySelector('svg');
    if (!svgElement) {
        console.error("No se encontró el elemento SVG para descargar.");
        return;
    }

    const options = {
        scale: 2, // Escala para mejor calidad
        encoderOptions: 1, // Calidad máxima
        backgroundColor: '#FFFFFF', // Asegura fondo blanco
    };

    saveSvgAsPng(svgElement, "ast-diagram.png", options)
        .then(() => {
            console.log("Imagen descargada con éxito.");
        })
        .catch((error) => {
            console.error("Error al descargar la imagen:", error);
            alert("Hubo un error al intentar descargar la imagen.");
        });
  };

  // Nodo renderizado
  const renderCustomNode = ({ nodeDatum, toggleNode }) => (
    <g>
      <circle r={15} onClick={toggleNode} className={`node-circle ${nodeDatum.nodeClass}`} />
      <text className="node-text-name" x="20" y="5" onClick={toggleNode}>
        {traducirNombreNodo(nodeDatum.name)}
      </text>
      {nodeDatum.attributes?.displayValue !== '' && nodeDatum.attributes?.displayValue !== undefined && (
        <text className="node-text-value" x="20" y="25">
          ({nodeDatum.attributes.displayValue})
        </text>
      )}
    </g>
  );

  return (
    <div className="ast-visualizer">
      <div className="ast-header">
          <h3>Árbol de Sintaxis Abstracta (AST)</h3>
          {/* --- NUEVO: Botón de descarga --- */}
          {ast && (
              <button className="download-button" onClick={handleDownloadImage}>
                  Descargar Imagen (PNG)
              </button>
          )}
      </div>

      {!ast ? (
        <div className="placeholder">
          <p>Compila un programa para visualizar el Árbol AST</p>
        </div>
      ) : (
        <>
          <div className="tree-container" ref={containerRef}>
            {treeData && containerRef.current && (
              <Tree
                data={treeData}
                separation={{ siblings: 1.5, nonSiblings: 1.5 }}
                orientation="vertical"
                translate={translate}
                nodeSize={{ x: 200, y: 120 }}
                renderCustomNodeElement={renderCustomNode}
                pathFunc="step"
                depthFactor={100}
                zoomable={true}
                scaleExtent={{ min: 0.1, max: 2 }}
              />
            )}
          </div>
          <ASTJsonViewer ast={ast} />
        </>
      )}
    </div>
  );
};

// Componente ASTJsonViewer (Sin cambios)
const ASTJsonViewer = ({ ast }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [jsonContent, setJsonContent] = useState('');
  useEffect(() => {
    if (ast) {
      try { setJsonContent(JSON.stringify(ast, null, 2)); } 
      catch (e) { setJsonContent('Error al parsear AST a JSON.'); }
    } else { setJsonContent(''); }
  }, [ast]);
  return (
    <div className="ast-json-viewer">
      <button 
        className={`json-toggle-button ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="toggle-icon">{isOpen ? '▼' : '►'}</span> Ver AST en formato JSON (Depuración)
      </button>
      {isOpen && (
        <pre className="json-content">
          {jsonContent || 'AST no disponible o vacío.'}
        </pre>
      )}
    </div>
  );
};

export default ASTVisualizer;