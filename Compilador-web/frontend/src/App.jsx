import React, { useState } from 'react';
import CodeEditor from './components/CodeEditor/CodeEditor';
import ASTVisualizer from './components/ASTVisualizer/ASTVisualizer';
import SymbolTable from './components/SymbolTable/SymbolTable';
import QuadruplesViewer from './components/QuadruplesViewer/QuadruplesViewer';
import OptimizationViewer from './components/OptimizationViewer/OptimizationViewer';
import MetricsDashboard from './components/MetricsDashboard/MetricsDashboard';
import CompilationControls from './components/CompilationControls/CompilationControls';
import TokensViewer from './components/TokensViewer/TokensViewer';
import ObjectCodeViewer from './components/ObjectCodeViewer/ObjectCodeViewer';
import { compileCode } from './services/CompilerApi';
import './styles/App.css';

const DEFAULT_CODE = `// Escribe tu código aquí
function main() {
    int contador = 0;
    int limite = 5;
    float pi = 3.1416;
    bool activo = true;

    print("Inicio del programa");

    if (activo) {
        string mensaje_if = "Entrando al ciclo";
        int incremento = 1;
        
        print(mensaje_if);
      
        contador = contador + incremento;
    } else {
        string error = "Sistema inactivo";
        int codigo_error = 404;
        
        print(error);
        print(codigo_error);
    }
    while (contador < limite) {
        float calculo = contador * pi;
        print(calculo);
        
        contador = contador + 1;
    }

    print("Fin del programa");
    return 0;
}`;

function App() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [compilationResult, setCompilationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('editor');
  const [isFloating, setIsFloating] = useState(false);

  const handleCompile = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await compileCode(code);
      setCompilationResult(result);
      
      // Cambiar automáticamente a una pestaña relevante si no es flotante
      if (!isFloating) {
          setActiveTab('metrics'); // Vamos a métricas para ver los resultados
      }
    } catch (err) {
      setError(err.message || 'Error al compilar el código');
    } finally {
      setLoading(false);
    }
  };

  const handleStepByStep = () => {
    if (compilationResult) setActiveTab('quadruples');
  };

  const toggleFloatingMode = () => {
    setIsFloating(!isFloating);
  };

  const handleReset = () => {
    if (window.confirm("¿Estás seguro de que deseas reiniciar todo? Se perderá el código actual.")) {
        setCode(DEFAULT_CODE);
        setCompilationResult(null);
        setError(null);
        setActiveTab('editor');
        setIsFloating(false);
    }
  };

  return (
    <div className={`app ${isFloating ? 'mode-floating' : ''}`}>
      <header className="app-header">
        <div className="header-left">
            <div className="header-title-group">
                <h1>Compilador Interactivo</h1>
                <p>Lenguajes y Autómatas II | Equipo</p>
            </div>
            
            <button className="btn-reset" onClick={handleReset} title="Reiniciar todo">
                🔄 Reiniciar
            </button>
        </div>

        {isFloating && (
            <button className="btn-exit-floating" onClick={toggleFloatingMode}>
                ✕ Salir del Modo Flotante
            </button>
        )}
      </header>

      <div className="app-layout">
        <div className="left-panel">
          {!isFloating && (
            <CompilationControls 
                onCompile={handleCompile}
                onStepByStep={handleStepByStep}
                onToggleFloating={toggleFloatingMode}
                loading={loading}
                isFloating={isFloating}
                hasResult={!!compilationResult}
            />
          )}
          
          <CodeEditor 
            code={code}
            onChange={setCode}
            errors={compilationResult?.errors || []}
            isFloating={isFloating}
            onCompile={handleCompile} 
          />
        </div>

        <div className="right-panel">
          <div className="tabs">
            <button className={activeTab === 'tokens' ? 'active' : ''} onClick={() => setActiveTab('tokens')}>Tokens</button>
            <button className={activeTab === 'ast' ? 'active' : ''} onClick={() => setActiveTab('ast')}>AST</button>
            <button className={activeTab === 'symbols' ? 'active' : ''} onClick={() => setActiveTab('symbols')}>Tabla de Símbolos</button>
            <button className={activeTab === 'quadruples' ? 'active' : ''} onClick={() => setActiveTab('quadruples')}>Cuádruplos</button>
            <button className={activeTab === 'optimization' ? 'active' : ''} onClick={() => setActiveTab('optimization')}>Optimización</button>
            <button className={activeTab === 'objectCode' ? 'active' : ''} onClick={() => setActiveTab('objectCode')}>Código Python</button>
            <button className={activeTab === 'metrics' ? 'active' : ''} onClick={() => setActiveTab('metrics')}>Métricas</button>
          </div>

          <div className="tab-content">
            {activeTab === 'tokens' && <TokensViewer tokens={compilationResult?.tokens} errors={compilationResult?.errors} />}
            {activeTab === 'ast' && <ASTVisualizer ast={compilationResult?.ast} code={code} />}
            {activeTab === 'symbols' && <SymbolTable symbolTable={compilationResult?.symbol_table} />}
            {activeTab === 'quadruples' && <QuadruplesViewer intermediateCode={compilationResult?.intermediate_code} optimizedQuadruples={compilationResult?.optimized_code} />}
            
            {activeTab === 'optimization' && (
              <OptimizationViewer 
                original={compilationResult?.intermediate_code} 
                optimized={compilationResult?.optimized_code}
                log={compilationResult?.optimization_log} 
              />
            )}
            
            {activeTab === 'objectCode' && <ObjectCodeViewer objectCode={compilationResult?.object_code} />}
            {activeTab === 'metrics' && <MetricsDashboard metrics={compilationResult?.metrics} />}
          </div>

          {error && <div className="error-message">Error: {error}</div>}
        </div>
      </div>
    </div>
  );
}

export default App;