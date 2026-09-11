import time
import math
import numpy as np
from typing import Dict, List, Any, Optional, Tuple
from qiskit import QuantumCircuit
from qiskit.quantum_info import Statevector, partial_trace

from app.schemas.quantum import QuantumIR, QuantumOperation, SimulationOptions, SimulationResult
from app.schemas.ai import QuantumToolExecution
from app.services.quantum.backends.qiskit_aer import QiskitAerBackend
from app.services.quantum.ir_validator import IRValidator, CircuitValidationError

class QuantumToolBridge:
    """Deterministic tool bridge wrapping QuantumLab's Qiskit Aer engine.
    Ensures the AI NEVER guesses statevectors, probabilities, or counts.
    """

    def __init__(self):
        self._backend = QiskitAerBackend()

    def validate_circuit(self, circuit: QuantumIR) -> QuantumToolExecution:
        """Validates Quantum IR structure, gate compatibility, and qubit boundaries."""
        start = time.time()
        try:
            self._backend.validate(circuit)
            elapsed = round((time.time() - start) * 1000, 2)
            return QuantumToolExecution(
                tool_name="validate_circuit",
                success=True,
                data={
                    "valid": True,
                    "numQubits": circuit.numQubits,
                    "numClbits": circuit.numClbits,
                    "operationCount": len(circuit.operations),
                    "gates": [op.gate for op in circuit.operations],
                },
                execution_time_ms=elapsed,
            )
        except Exception as e:
            elapsed = round((time.time() - start) * 1000, 2)
            return QuantumToolExecution(
                tool_name="validate_circuit",
                success=False,
                error=str(e),
                execution_time_ms=elapsed,
            )

    def run_simulation(self, circuit: QuantumIR, options: Optional[SimulationOptions] = None) -> QuantumToolExecution:
        """Executes circuit on Qiskit Aer backend and returns exact simulation data."""
        start = time.time()
        opts = options or SimulationOptions(shots=1024, mode="both")
        try:
            res: SimulationResult = self._backend.run(circuit, opts)
            elapsed = round((time.time() - start) * 1000, 2)

            return QuantumToolExecution(
                tool_name="run_simulation",
                success=True,
                data={
                    "numQubits": res.numQubits,
                    "shots": res.shots,
                    "circuitDepth": res.circuitDepth,
                    "probabilities": res.probabilities,
                    "counts": res.counts,
                    "statevectorLength": len(res.statevector) if res.statevector else 0,
                    "statevector": [amp.model_dump() for amp in res.statevector[:8]] if res.statevector else None,
                    "durationMs": res.durationMs,
                },
                execution_time_ms=elapsed,
            )
        except Exception as e:
            elapsed = round((time.time() - start) * 1000, 2)
            return QuantumToolExecution(
                tool_name="run_simulation",
                success=False,
                error=str(e),
                execution_time_ms=elapsed,
            )

    def get_statevector(self, circuit: QuantumIR) -> QuantumToolExecution:
        """Calculates exact complex statevector amplitudes using Qiskit quantum_info Statevector."""
        start = time.time()
        try:
            eval_qc, _ = self._backend.compile_ir(circuit)
            sv = Statevector.from_instruction(eval_qc)
            num_q = circuit.numQubits
            amplitudes = []

            for i in range(1 << num_q):
                bitstring = format(i, f"0{num_q}b")
                amp = sv.data[i]
                mag = float(np.abs(amp) ** 2)
                if mag > 1e-7 or num_q <= 3:
                    amplitudes.append({
                        "state": bitstring,
                        "real": round(float(np.real(amp)), 6),
                        "imag": round(float(np.imag(amp)), 6),
                        "magnitude": round(mag, 6),
                        "phase": round(float(np.angle(amp)), 6),
                    })

            elapsed = round((time.time() - start) * 1000, 2)
            return QuantumToolExecution(
                tool_name="get_statevector",
                success=True,
                data={"amplitudes": amplitudes, "dimension": 1 << num_q},
                execution_time_ms=elapsed,
            )
        except Exception as e:
            return QuantumToolExecution(
                tool_name="get_statevector",
                success=False,
                error=str(e),
                execution_time_ms=round((time.time() - start) * 1000, 2),
            )

    def get_probabilities(self, circuit: QuantumIR) -> QuantumToolExecution:
        """Calculates exact Born rule probabilities |alpha|^2."""
        start = time.time()
        try:
            eval_qc, _ = self._backend.compile_ir(circuit)
            sv = Statevector.from_instruction(eval_qc)
            probs = sv.probabilities_dict()
            clean_probs = {k: round(float(v), 6) for k, v in probs.items() if v > 1e-6}

            elapsed = round((time.time() - start) * 1000, 2)
            return QuantumToolExecution(
                tool_name="get_probabilities",
                success=True,
                data={"probabilities": clean_probs, "normalizationCheck": round(sum(clean_probs.values()), 6)},
                execution_time_ms=elapsed,
            )
        except Exception as e:
            return QuantumToolExecution(
                tool_name="get_probabilities",
                success=False,
                error=str(e),
                execution_time_ms=round((time.time() - start) * 1000, 2),
            )

    def get_bloch_vector(self, circuit: QuantumIR, qubit_index: int = 0) -> QuantumToolExecution:
        """Calculates exact (x, y, z) Bloch coordinates and polar/azimuthal angles for a qubit."""
        start = time.time()
        try:
            if qubit_index >= circuit.numQubits or qubit_index < 0:
                raise ValueError(f"Qubit index {qubit_index} out of range (0 to {circuit.numQubits - 1})")

            eval_qc, _ = self._backend.compile_ir(circuit)
            sv = Statevector.from_instruction(eval_qc)

            if circuit.numQubits == 1:
                amp0, amp1 = sv.data[0], sv.data[1]
                re_prod = float(amp0.real * amp1.real + amp0.imag * amp1.imag)
                im_prod = float(amp0.real * amp1.imag - amp0.imag * amp1.real)
                x = round(2.0 * re_prod, 5)
                y = round(2.0 * im_prod, 5)
                z = round(float(abs(amp0) ** 2 - abs(amp1) ** 2), 5)
                purity = 1.0
            else:
                # Multi-qubit partial trace to get reduced density matrix
                other_qubits = [q for q in range(circuit.numQubits) if q != qubit_index]
                rho = partial_trace(sv, other_qubits).data
                x = round(float(2.0 * np.real(rho[0, 1])), 5)
                y = round(float(2.0 * np.imag(rho[1, 0])), 5)
                z = round(float(np.real(rho[0, 0] - rho[1, 1])), 5)
                purity = round(float(np.real(np.trace(rho @ rho))), 5)

            r = round(float(np.sqrt(x**2 + y**2 + z**2)), 5)
            theta_rad = math.acos(max(-1.0, min(1.0, z / (r if r > 1e-6 else 1.0))))
            phi_rad = math.atan2(y, x)
            if phi_rad < 0:
                phi_rad += 2 * math.pi

            elapsed = round((time.time() - start) * 1000, 2)
            return QuantumToolExecution(
                tool_name="get_bloch_vector",
                success=True,
                data={
                    "qubitIndex": qubit_index,
                    "x": x,
                    "y": y,
                    "z": z,
                    "length": r,
                    "purity": purity,
                    "thetaRad": round(theta_rad, 4),
                    "thetaDeg": round(math.degrees(theta_rad), 2),
                    "phiRad": round(phi_rad, 4),
                    "phiDeg": round(math.degrees(phi_rad), 2),
                },
                execution_time_ms=elapsed,
            )
        except Exception as e:
            return QuantumToolExecution(
                tool_name="get_bloch_vector",
                success=False,
                error=str(e),
                execution_time_ms=round((time.time() - start) * 1000, 2),
            )

    def inspect_circuit(self, circuit: QuantumIR) -> QuantumToolExecution:
        """Inspects circuit structure, gate counts, entanglement, and depth."""
        start = time.time()
        try:
            gate_counts = {}
            two_qubit_gates = 0
            has_measurement = False

            for op in circuit.operations:
                g = op.gate.lower()
                gate_counts[g] = gate_counts.get(g, 0) + 1
                if g in ["cx", "cz", "swap"]:
                    two_qubit_gates += 1
                if g == "measure":
                    has_measurement = True

            eval_qc, _ = self._backend.compile_ir(circuit)
            depth = eval_qc.depth()

            elapsed = round((time.time() - start) * 1000, 2)
            return QuantumToolExecution(
                tool_name="inspect_circuit",
                success=True,
                data={
                    "numQubits": circuit.numQubits,
                    "numClbits": circuit.numClbits,
                    "totalOperations": len(circuit.operations),
                    "gateCounts": gate_counts,
                    "twoQubitGateCount": two_qubit_gates,
                    "hasMeasurement": has_measurement,
                    "circuitDepth": depth,
                    "entanglingCircuit": two_qubit_gates > 0,
                },
                execution_time_ms=elapsed,
            )
        except Exception as e:
            return QuantumToolExecution(
                tool_name="inspect_circuit",
                success=False,
                error=str(e),
                execution_time_ms=round((time.time() - start) * 1000, 2),
            )

    def generate_qiskit(self, circuit: QuantumIR) -> QuantumToolExecution:
        """Generates clean, verified Python Qiskit 1.0+ code representing the circuit."""
        start = time.time()
        try:
            lines = [
                "from qiskit import QuantumCircuit",
                "from qiskit_aer import AerSimulator",
                "",
                f"# Initialize quantum circuit with {circuit.numQubits} qubits and {circuit.numClbits} classical bits",
                f"qc = QuantumCircuit({circuit.numQubits}, {circuit.numClbits})",
            ]

            for op in circuit.operations:
                g = op.gate.lower()
                t = op.targets
                c = op.controls or []
                p = op.params or []

                if g == "h":
                    lines.append(f"qc.h({t[0]})")
                elif g == "x":
                    lines.append(f"qc.x({t[0]})")
                elif g == "y":
                    lines.append(f"qc.y({t[0]})")
                elif g == "z":
                    lines.append(f"qc.z({t[0]})")
                elif g == "s":
                    lines.append(f"qc.s({t[0]})")
                elif g == "t":
                    lines.append(f"qc.t({t[0]})")
                elif g == "rx":
                    lines.append(f"qc.rx({p[0] if p else 0.0}, {t[0]})")
                elif g == "ry":
                    lines.append(f"qc.ry({p[0] if p else 0.0}, {t[0]})")
                elif g == "rz":
                    lines.append(f"qc.rz({p[0] if p else 0.0}, {t[0]})")
                elif g == "cx":
                    ctrl = c[0] if c else t[0]
                    tgt = t[0] if c else t[1]
                    lines.append(f"qc.cx({ctrl}, {tgt})")
                elif g == "cz":
                    ctrl = c[0] if c else t[0]
                    tgt = t[0] if c else t[1]
                    lines.append(f"qc.cz({ctrl}, {tgt})")
                elif g == "swap":
                    lines.append(f"qc.swap({t[0]}, {t[1]})")
                elif g in ["toffoli", "ccx"]:
                    ctrl1, ctrl2 = c[0], c[1]
                    lines.append(f"qc.ccx({ctrl1}, {ctrl2}, {t[0]})")
                elif g == "measure":
                    cl = op.clbits[0] if op.clbits else 0
                    lines.append(f"qc.measure({t[0]}, {cl})")
                elif g == "barrier":
                    lines.append(f"qc.barrier({t})")

            lines.extend([
                "",
                "# Execute on AerSimulator",
                "simulator = AerSimulator()",
                "result = simulator.run(qc, shots=1024).result()",
                "counts = result.get_counts()",
                "print('Measurement counts:', counts)",
            ])

            code_str = "\n".join(lines)
            elapsed = round((time.time() - start) * 1000, 2)
            return QuantumToolExecution(
                tool_name="generate_qiskit",
                success=True,
                data={"code": code_str},
                execution_time_ms=elapsed,
            )
        except Exception as e:
            return QuantumToolExecution(
                tool_name="generate_qiskit",
                success=False,
                error=str(e),
                execution_time_ms=round((time.time() - start) * 1000, 2),
            )

    def debug_circuit(self, circuit: QuantumIR) -> QuantumToolExecution:
        """Inspects for circuit anomalies, redundant identities, and disconnected qubits."""
        start = time.time()
        warnings = []
        info = []

        try:
            # 1. Check for consecutive self-inverse gates (H-H = I, X-X = I)
            for i in range(len(circuit.operations) - 1):
                op1 = circuit.operations[i]
                op2 = circuit.operations[i + 1]
                if op1.gate == op2.gate and op1.gate in ["h", "x", "y", "z", "swap"]:
                    if op1.targets == op2.targets and op1.controls == op2.controls:
                        warnings.append(
                            f"Redundant consecutive operations: two '{op1.gate.upper()}' gates on target {op1.targets} cancel each other (Identity)."
                        )

            # 2. Check for unused qubits
            used_qubits = set()
            for op in circuit.operations:
                used_qubits.update(op.targets)
                if op.controls:
                    used_qubits.update(op.controls)

            unused = set(range(circuit.numQubits)) - used_qubits
            if unused:
                warnings.append(f"Qubits {sorted(list(unused))} are initialized but never operated on.")

            # 3. Check for measurements before gates
            measured_qubits = set()
            for op in circuit.operations:
                if op.gate == "measure":
                    measured_qubits.update(op.targets)
                elif any(q in measured_qubits for q in op.targets):
                    warnings.append(f"Gate '{op.gate.upper()}' applied to qubit {op.targets} after measurement.")

            elapsed = round((time.time() - start) * 1000, 2)
            return QuantumToolExecution(
                tool_name="debug_circuit",
                success=True,
                data={
                    "isClean": len(warnings) == 0,
                    "warnings": warnings,
                    "operationCount": len(circuit.operations),
                    "usedQubits": sorted(list(used_qubits)),
                },
                execution_time_ms=elapsed,
            )
        except Exception as e:
            return QuantumToolExecution(
                tool_name="debug_circuit",
                success=False,
                error=str(e),
                execution_time_ms=round((time.time() - start) * 1000, 2),
            )
