from app.models.schemas import Quadruple, QuadrupleType
from typing import List, Tuple, Any, Optional
import re

class CodeOptimizer:
    def __init__(self):
        self.optimizations_applied = []
    
    def optimize(self, quadruples: List[Quadruple]) -> Tuple[List[Quadruple], List[str]]:
        self.optimizations_applied = []
        if not quadruples: return [], []
        
        current_quads = [q.copy() for q in quadruples]
        pass_count = 0
        max_passes = 10 
        
        print("=== INICIANDO OPTIMIZACIÓN ===")
        
        while pass_count < max_passes:
            pass_count += 1
            prev_quads_str = str([q.dict() for q in current_quads])
            
            try:
                current_quads = self.constant_propagation(current_quads)
                current_quads = self.constant_folding(current_quads)
                current_quads = self.jump_optimization(current_quads)
                current_quads = self.redundant_assignment_elimination(current_quads)
                current_quads = self.dead_code_elimination(current_quads)
            except Exception as e:
                print(f"Error en pase de optimización {pass_count}: {e}")
                # Si falla una optimización, salir con lo que tenemos para no colgar
                break
            
            if str([q.dict() for q in current_quads]) == prev_quads_str:
                self.log(f"🔄 Convergencia alcanzada en la pasada {pass_count}")
                break
        
        for i, quad in enumerate(current_quads):
            quad.index = i
            
        return current_quads, self.optimizations_applied
    
    # --- MÉTODOS DE OPTIMIZACIÓN (Sin cambios lógicos, solo robustez) ---

    def constant_propagation(self, quadruples: List[Quadruple]) -> List[Quadruple]:
        constant_map = {}
        optimized = []
        for quad in quadruples:
            new_quad = quad.copy()
            
            # Robustez: verificar que args existen
            if quad.arg1 and quad.arg1 in constant_map:
                new_quad.arg1 = constant_map[quad.arg1]
                self.log(f"Propagación: {quad.arg1} -> {constant_map[quad.arg1]}")
            if quad.arg2 and quad.arg2 in constant_map:
                new_quad.arg2 = constant_map[quad.arg2]
                self.log(f"Propagación: {quad.arg2} -> {constant_map[quad.arg2]}")
            
            if quad.quadruple_type == QuadrupleType.ASSIGNMENT:
                if self.is_constant(new_quad.arg1) and new_quad.result:
                    constant_map[new_quad.result] = new_quad.arg1
                elif new_quad.result in constant_map:
                    del constant_map[new_quad.result]
            elif quad.result and quad.result in constant_map:
                del constant_map[quad.result]
            
            optimized.append(new_quad)
        return optimized

    def constant_folding(self, quadruples: List[Quadruple]) -> List[Quadruple]:
        optimized = []
        for quad in quadruples:
            # Solo si ambos argumentos son constantes válidas
            if (quad.quadruple_type in [QuadrupleType.ARITHMETIC, QuadrupleType.COMPARISON] and
                self.is_constant(quad.arg1) and self.is_constant(quad.arg2)):
                
                res = self.evaluate_constant_expression(quad.arg1, quad.arg2, quad.operator)
                if res is not None:
                    new_quad = Quadruple(
                        index=quad.index, operator="=", arg1=str(res), 
                        result=quad.result, quadruple_type=QuadrupleType.ASSIGNMENT
                    )
                    optimized.append(new_quad)
                    self.log(f"Plegado: {quad.arg1} {quad.operator} {quad.arg2} -> {res}")
                    continue
            optimized.append(quad)
        return optimized

    def jump_optimization(self, quadruples: List[Quadruple]) -> List[Quadruple]:
        optimized = []
        i = 0
        while i < len(quadruples):
            quad = quadruples[i]
            # Optimización de if_false con constante
            if quad.operator == "if_false" and self.is_constant(quad.arg1):
                try:
                    val = float(quad.arg1)
                    if val != 0: 
                        self.log(f"Rama muerta eliminada (if_false {quad.arg1})")
                        i+=1; continue
                    else:
                        self.log(f"Salto optimizado a incondicional")
                        optimized.append(Quadruple(index=quad.index, operator="goto", result=quad.result, quadruple_type=QuadrupleType.JUMP))
                        i+=1; continue
                except: pass # Si falla conversión float, ignorar

            if (quad.quadruple_type == QuadrupleType.JUMP and i + 1 < len(quadruples) and 
                quadruples[i+1].quadruple_type == QuadrupleType.LABEL and quad.result == quadruples[i+1].result):
                self.log(f"Salto redundante eliminado a {quad.result}")
                i+=1; continue
            optimized.append(quad)
            i+=1
        return optimized

    def dead_code_elimination(self, quadruples: List[Quadruple]) -> List[Quadruple]:
        used = set()
        ref_labels = set()
        for q in quadruples:
            if q.arg1: used.add(q.arg1)
            if q.arg2: used.add(q.arg2)
            if q.operator == "if_false": used.add(q.arg1)
            if q.quadruple_type == QuadrupleType.WRITE: used.add(q.arg1) 
            if q.quadruple_type == QuadrupleType.JUMP: ref_labels.add(q.result)
            
        optimized = []
        for quad in quadruples:
            if (quad.quadruple_type in [QuadrupleType.ASSIGNMENT, QuadrupleType.ARITHMETIC] and
                self.is_temporary(quad.result) and quad.result not in used):
                self.log(f"Eliminación código muerto: {quad.result}")
                continue
            if (quad.quadruple_type == QuadrupleType.LABEL and quad.result and 
                not quad.result.startswith("func_") and quad.result not in ref_labels):
                self.log(f"Etiqueta muerta eliminada: {quad.result}")
                continue
            optimized.append(quad)
        return optimized

    def redundant_assignment_elimination(self, quadruples: List[Quadruple]) -> List[Quadruple]:
        optimized = []
        vals = {}
        for quad in quadruples:
            if quad.quadruple_type in [QuadrupleType.LABEL, QuadrupleType.JUMP, QuadrupleType.CALL, QuadrupleType.RETURN]:
                vals.clear(); optimized.append(quad); continue
            
            if quad.quadruple_type == QuadrupleType.ASSIGNMENT:
                if quad.result in vals and vals[quad.result] == quad.arg1:
                    self.log(f"Asignación redundante eliminada: {quad.result} = {quad.arg1}")
                    continue
                if quad.result: vals[quad.result] = quad.arg1
            elif quad.result in vals: 
                del vals[quad.result]
            optimized.append(quad)
        return optimized

    def is_constant(self, val):
        if not val: return False
        return bool(re.match(r'^-?\d+(\.\d+)?$', str(val))) or (str(val).startswith('"') and str(val).endswith('"'))
    
    def is_temporary(self, val):
        return val and str(val).startswith('t')

    def evaluate_constant_expression(self, a1, a2, op):
        try:
            v1, v2 = float(a1), float(a2)
            if op == '+': return v1 + v2
            elif op == '-': return v1 - v2
            elif op == '*': return v1 * v2
            elif op == '/': return v1 / v2 if v2 != 0 else 0
            elif op == '>': return 1 if v1 > v2 else 0
            elif op == '<': return 1 if v1 < v2 else 0
            elif op == '==': return 1 if v1 == v2 else 0
            return None
        except: return None

    def log(self, msg):
        if msg not in self.optimizations_applied: self.optimizations_applied.append(msg)