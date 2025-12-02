from app.models.schemas import (
    ASTNode, Quadruple, IntermediateCode, QuadrupleType, 
    SymbolTable
)
from typing import List, Optional, Dict, Tuple

class IntermediateCodeGenerator:
    def __init__(self, symbol_table: SymbolTable):
        self.symbol_table = symbol_table
        self.quadruples: List[Quadruple] = []
        self.temporal_counter = 0
        self.label_counter = 0
    
    def generate(self, ast: ASTNode) -> IntermediateCode:
        """Genera código intermedio a partir del AST, ignorando errores semánticos"""
        print("=== GENERANDO CÓDIGO INTERMEDIO (MODO ROBUSTO) ===")
        
        # Reiniciar contadores y lista
        self.quadruples = []
        self.temporal_counter = 0
        self.label_counter = 0
        
        if not ast:
            return IntermediateCode()
        
        try:
            self.visit_node(ast)
        except Exception as e:
            print(f"⚠️ Error recuperable en generación: {e}")
            # No relanzamos el error, permitimos que devuelva lo que haya logrado generar
        
        print(f"=== GENERACIÓN COMPLETADA: {len(self.quadruples)} cuádruplos ===")
        
        return IntermediateCode(
            quadruples=self.quadruples,
            temporal_counter=self.temporal_counter,
            label_counter=self.label_counter
        )
    
    def visit_node(self, node: ASTNode) -> str:
        """Visita un nodo y devuelve el nombre de la variable/temporal donde quedó el resultado"""
        if not node:
            return "null"
            
        method_name = f'visit_{node.type.lower()}'
        visitor = getattr(self, method_name, self.visit_default)
        try:
            result = visitor(node)
            # Si un visitante devuelve None, devolvemos un placeholder para no romper la cadena
            return str(result) if result is not None else "void"
        except Exception as e:
            print(f"Error visitando nodo {node.type}: {e}")
            return "error_gen"
    
    def visit_default(self, node: ASTNode) -> str:
        if node.children:
            for child in node.children:
                self.visit_node(child)
        return "void"
    
    def visit_program(self, node: ASTNode) -> str:
        if node.children:
            for child in node.children:
                self.visit_node(child)
        return "void"
    
    def visit_functiondeclaration(self, node: ASTNode) -> str:
        function_name = node.value or "anon"
        func_label = f"func_{function_name}"
        self.add_quadruple(QuadrupleType.LABEL, result=func_label)
        
        if node.children:
            self.visit_node(node.children[0]) # Block
        
        # Return implícito por seguridad
        if function_name == "main" or (node.data_type and node.data_type == "void"):
            self.add_quadruple(QuadrupleType.RETURN, result="0")
            
        return "void"
    
    def visit_block(self, node: ASTNode) -> str:
        if node.children:
            for child in node.children:
                self.visit_node(child)
        return "void"
    
    def visit_variabledeclaration(self, node: ASTNode) -> str:
        if not node.children: return "void"
        
        variable_name = node.children[0].value
        
        # Si tiene inicialización (int x = 10;)
        if len(node.children) > 1 and node.children[1].type != "Empty":
            expr_result = self.visit_node(node.children[1])
            self.add_quadruple(
                QuadrupleType.ASSIGNMENT,
                arg1=expr_result,
                result=variable_name
            )
        return variable_name
    
    def visit_assignment(self, node: ASTNode) -> str:
        if not node.children: return "void"
        
        variable_name = node.children[0].value
        
        if len(node.children) > 1:
            expr_result = self.visit_node(node.children[1])
            self.add_quadruple(
                QuadrupleType.ASSIGNMENT,
                arg1=expr_result,
                result=variable_name
            )
            return variable_name
        return "void"
    
    def visit_binaryexpression(self, node: ASTNode) -> str:
        if not node.children or len(node.children) < 2:
            return "error_expr"
        
        # Aquí forzamos la generación aunque los hijos devuelvan cosas raras
        left_operand = self.visit_node(node.children[0]) or "null"
        right_operand = self.visit_node(node.children[1]) or "null"
        operator = node.value
        
        temp_var = self.new_temporal()
        
        # Clasificar tipo de operación
        if operator in ['+', '-', '*', '/']:
            q_type = QuadrupleType.ARITHMETIC
        elif operator in ['>', '<', '>=', '<=', '==', '!=']:
            q_type = QuadrupleType.COMPARISON
        else:
            q_type = QuadrupleType.ARITHMETIC
            
        self.add_quadruple(
            q_type,
            operator=operator,
            arg1=left_operand,
            arg2=right_operand,
            result=temp_var
        )
        return temp_var
    
    def visit_identifier(self, node: ASTNode) -> str:
        # Devuelve el nombre de la variable TAL CUAL, exista o no en la tabla de símbolos.
        # Esto permite que el código intermedio se genere incluso si hay error semántico.
        return node.value if node.value else "unknown_id"
    
    def visit_literal(self, node: ASTNode) -> str:
        return node.value if node.value else "0"
    
    def visit_stringliteral(self, node: ASTNode) -> str:
        return f'"{node.value}"'
    
    def visit_ifstatement(self, node: ASTNode) -> str:
        if not node.children: return "void"
        
        condition_result = self.visit_node(node.children[0])
        
        false_label = self.new_label("else")
        self.add_quadruple(
            QuadrupleType.JUMP,
            operator="if_false",
            arg1=condition_result,
            result=false_label
        )
        
        # Bloque True
        if len(node.children) > 1:
            self.visit_node(node.children[1])
            
        end_label = None
        if len(node.children) > 2: # Tiene Else
            end_label = self.new_label("end_if")
            self.add_quadruple(QuadrupleType.JUMP, result=end_label)
        
        self.add_quadruple(QuadrupleType.LABEL, result=false_label)
        
        # Bloque Else
        if len(node.children) > 2:
            self.visit_node(node.children[2])
            self.add_quadruple(QuadrupleType.LABEL, result=end_label)
            
        return "void"

    def visit_whilestatement(self, node: ASTNode) -> str:
        start_label = self.new_label("while_start")
        self.add_quadruple(QuadrupleType.LABEL, result=start_label)
        
        if node.children:
            condition_result = self.visit_node(node.children[0])
            end_label = self.new_label("while_end")
            
            self.add_quadruple(
                QuadrupleType.JUMP,
                operator="if_false",
                arg1=condition_result,
                result=end_label
            )
            
            if len(node.children) > 1:
                self.visit_node(node.children[1])
                
            self.add_quadruple(QuadrupleType.JUMP, result=start_label)
            self.add_quadruple(QuadrupleType.LABEL, result=end_label)
            
        return "void"

    def visit_printstatement(self, node: ASTNode) -> str:
        if node.children:
            res = self.visit_node(node.children[0])
            self.add_quadruple(QuadrupleType.WRITE, arg1=res)
        return "void"

    def visit_returnstatement(self, node: ASTNode) -> str:
        val = "0"
        if node.children:
            val = self.visit_node(node.children[0])
        self.add_quadruple(QuadrupleType.RETURN, arg1=val)
        return "void"

    # --- Helpers ---
    def add_quadruple(self, quad_type, operator="", arg1=None, arg2=None, result=None):
        # Conversión a string segura para evitar errores de tipo en el backend
        s_arg1 = str(arg1) if arg1 is not None else None
        s_arg2 = str(arg2) if arg2 is not None else None
        s_res  = str(result) if result is not None else None
        
        quad = Quadruple(
            index=len(self.quadruples),
            operator=operator,
            arg1=s_arg1,
            arg2=s_arg2,
            result=s_res,
            quadruple_type=quad_type
        )
        self.quadruples.append(quad)

    def new_temporal(self) -> str:
        t = f"t{self.temporal_counter}"
        self.temporal_counter += 1
        return t
    
    def new_label(self, prefix) -> str:
        l = f"{prefix}_{self.label_counter}"
        self.label_counter += 1
        return l