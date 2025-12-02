from fastapi import APIRouter, HTTPException
from app.models.schemas import CompileRequest, CompileResponse
from app.compiler.lexer import Lexer
from app.compiler.parser import Parser
from app.compiler.semantic import SemanticAnalyzer
from app.compiler.intermediate import IntermediateCodeGenerator
from app.compiler.generator import CodeGenerator
from app.compiler.optimizer import CodeOptimizer
from app.models.schemas import SymbolTable 
import time
import re

router = APIRouter()

def format_errors(error_list, error_type):
    structured_errors = []
    line_pattern = re.compile(r'(?:l[íi]nea|line)\s*[:]?\s*(\d+)', re.IGNORECASE)
    for msg in error_list:
        line_num = 0
        match = line_pattern.search(msg)
        if match: line_num = int(match.group(1))
        structured_errors.append({"type": error_type, "line": line_num, "message": msg})
    return structured_errors

@router.post("/compile", response_model=CompileResponse)
async def compile_code(request: CompileRequest):
    start_time = time.time()
    print("=== COMPILACIÓN FORZADA (Optimiza incluso con errores) ===")
    
    metrics = {
        "compilation_time": 0, "tokens_count": 0, "ast_nodes_count": 0,
        "symbols_count": 0, "quadruples_count": 0, "temporals_count": 0,
        "errors_count": 0, "warnings_count": 0, "optimization_reduction": 0
    }
    
    # Acumuladores de errores
    raw_lexer_err, raw_parser_err, raw_semantic_err, raw_gen_err = [], [], [], []
    semantic_warn = []
    
    tokens, ast, symbol_table = [], None, None
    intermediate_code, optimized_code, optimization_log = [], [], []
    object_code = ""

    # 1. LÉXICO
    try:
        tokens, raw_lexer_err = Lexer().tokenize(request.code)
        metrics["tokens_count"] = len(tokens)
    except Exception as e: raw_lexer_err.append(str(e))

    # 2. SINTÁCTICO (Si hay tokens)
    if tokens:
        try:
            ast, raw_parser_err = Parser().parse(tokens)
            # Truco: Si hay AST parcial, úsalo. Si es None, no podemos seguir.
        except Exception as e: raw_parser_err.append(str(e))

    # 3. SEMÁNTICO (Solo para tabla de símbolos y errores, no detiene flujo)
    if ast:
        try:
            sem = SemanticAnalyzer()
            res = sem.analyze(ast)
            raw_semantic_err = res.errors
            semantic_warn = res.warnings
            symbol_table = res.symbol_table
            metrics["symbols_count"] = len(symbol_table.symbols) if symbol_table else 0
        except Exception as e:
            raw_semantic_err.append(f"Fallo análisis semántico: {e}")
            symbol_table = SymbolTable() # Tabla vacía para no romper el siguiente paso

    # 4. INTERMEDIO (CRÍTICO: Generar pase lo que pase)
    if ast:
        try:
            # Usamos una tabla vacía si la semántica falló
            st_to_use = symbol_table if symbol_table else SymbolTable()
            gen = IntermediateCodeGenerator(st_to_use)
            
            # generate() ahora atrapa sus propios errores internos y devuelve lo que pudo
            ic_result = gen.generate(ast)
            intermediate_code = ic_result.quadruples
            metrics["quadruples_count"] = len(intermediate_code)
            
        except Exception as e:
            raw_gen_err.append(f"Fallo generación intermedia: {e}")

    # 5. OPTIMIZACIÓN (Si hay ALGO de código intermedio, optimizarlo)
    if intermediate_code:
        try:
            opt = CodeOptimizer()
            optimized_code, optimization_log = opt.optimize(intermediate_code)
            
            # Calcular métricas
            orig = len(intermediate_code)
            new_l = len(optimized_code)
            if orig > 0:
                metrics["optimization_reduction"] = ((orig - new_l) / orig) * 100
        except Exception as e:
            semantic_warn.append(f"Error optimizando: {e}")
            optimized_code = intermediate_code # Fallback al original

    # 6. CÓDIGO OBJETO
    quads_final = optimized_code if optimized_code else intermediate_code
    if quads_final:
        try:
            st_to_use = symbol_table if symbol_table else SymbolTable()
            object_code = CodeGenerator(st_to_use).generate(quads_final)
        except Exception as e:
            raw_gen_err.append(f"Error código objeto: {e}")

    # Serializar errores
    final_errors = []
    final_errors.extend(format_errors(raw_lexer_err, "Léxico"))
    final_errors.extend(format_errors(raw_parser_err, "Sintáctico"))
    final_errors.extend(format_errors(raw_semantic_err, "Semántico"))
    final_errors.extend(format_errors(raw_gen_err, "Generación"))
    
    serialized_errors = [f"{e['type']}|{e['line']}|{e['message']}" for e in final_errors]

    metrics["errors_count"] = len(serialized_errors)
    metrics["warnings_count"] = len(semantic_warn)
    metrics["compilation_time"] = (time.time() - start_time) * 1000

    return CompileResponse(
        success=len(serialized_errors) == 0,
        tokens=tokens,
        ast=ast,
        symbol_table=symbol_table,
        intermediate_code=intermediate_code,
        optimized_code=optimized_code,
        optimization_log=optimization_log,
        object_code=object_code,
        errors=serialized_errors,
        warnings=semantic_warn,
        metrics=metrics
    )