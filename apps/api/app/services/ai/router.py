import re
from typing import Dict, List, Any, Optional
from app.schemas.ai import QueryCategory

class QueryRouter:
    """Intelligent Query Router classifying questions and determining execution pathways."""

    @staticmethod
    def route(query: str, has_circuit: bool = False) -> Dict[str, Any]:
        q = query.lower()

        category: QueryCategory = "conceptual"
        knowledge_domain = "math_code"
        needs_simulation = False
        suggested_tools: List[str] = []
        visualization_intent: Optional[str] = None

        # 1. Visualization requests
        if any(w in q for w in ["bloch sphere", "bloch vector", "sphere view", "visualize state", "3d sphere"]):
            category = "visualization"
            visualization_intent = "bloch_sphere"
            suggested_tools.append("get_bloch_vector")
            needs_simulation = has_circuit

        elif any(w in q for w in ["probability", "probabilities", "probability chart", "measurement counts", "histogram", "shot counts"]):
            category = "simulation"
            visualization_intent = "probability_chart"
            suggested_tools.extend(["run_simulation", "get_probabilities"])
            needs_simulation = has_circuit

        elif any(w in q for w in ["statevector", "amplitudes", "state vector view"]):
            category = "simulation"
            visualization_intent = "statevector_view"
            suggested_tools.append("get_statevector")
            needs_simulation = has_circuit

        # 2. Simulation & execution questions
        elif any(w in q for w in ["simulate", "run simulation", "run circuit", "run this", "when i run", "execute circuit", "what is the outcome", "what happens"]):
            category = "simulation"
            suggested_tools.extend(["run_simulation", "get_probabilities"])
            needs_simulation = True

        # 3. Circuit & debugging questions
        elif any(w in q for w in ["debug", "error in circuit", "why does my circuit", "unused qubit", "fix circuit"]):
            category = "debugging"
            suggested_tools.append("debug_circuit")

        elif any(w in q for w in ["inspect circuit", "circuit depth", "gate count", "how many gates"]):
            category = "circuit"
            suggested_tools.append("inspect_circuit")

        # 4. Code generation questions
        elif any(w in q for w in ["qiskit code", "python code", "write qiskit", "write code", "how to code"]):
            category = "code"
            knowledge_domain = "math_code"
            suggested_tools.append("generate_qiskit")

        # 5. Mathematical derivations
        elif any(w in q for w in ["derive", "proof", "matrix", "dirac notation", "inner product", "unitary", "eigenvalue", "born rule", "normalization"]):
            category = "mathematical"
            knowledge_domain = "math_code"

        # 6. History & foundations
        elif any(w in q for w in ["history", "schrödinger", "schrodinger", "einstein", "bohr", "heisenberg", "planck", "aspect", "1926", "1935", "paradox", "cat"]):
            category = "history"
            knowledge_domain = "theory_history"

        elif any(w in q for w in ["philosophy", "copenhagen", "many worlds", "interpret", "interpretations", "reality"]):
            category = "theory"
            knowledge_domain = "theory_history"

        # 7. Current API & documentation
        elif any(w in q for w in ["qiskit 1.0", "primitives v2", "sampler v2", "estimator v2", "aersimulator api", "current api", "latest release"]):
            category = "current_information"
            knowledge_domain = "api_docs"

        # 8. Intuitive questions
        elif any(w in q for w in ["like i'm 5", "simple analogy", "intuitive", "easy explanation", "real world"]):
            category = "intuitive"

        return {
            "category": category,
            "knowledge_domain": knowledge_domain,
            "needs_simulation": needs_simulation,
            "suggested_tools": suggested_tools,
            "visualization_intent": visualization_intent,
        }
