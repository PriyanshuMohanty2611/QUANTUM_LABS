import re
from typing import Dict, Any, Optional
from app.schemas.ai import TTSRequest, TTSResponse

class TTSService:
    """Application-layer Text-to-Speech service providing replaceable provider abstraction."""

    def __init__(self):
        self._phonetic_dictionary = {
            "|0⟩": "ket zero",
            "|1⟩": "ket one",
            "|ψ⟩": "ket psi",
            "|φ⟩": "ket phi",
            "|Φ⁺⟩": "ket phi plus",
            "|Φ⁻⟩": "ket phi minus",
            "|Ψ⁺⟩": "ket psi plus",
            "|Ψ⁻⟩": "ket psi minus",
            "|+⟩": "ket plus",
            "|-⟩": "ket minus",
            "⟨0|": "bra zero",
            "⟨1|": "bra one",
            "⟨ψ|": "bra psi",
            "Qiskit": "kiss-kit",
            "qubit": "cue-bit",
            "qubits": "cue-bits",
            "Hadamard": "hah-dah-mard",
            "Schrödinger": "shrow-ding-er",
            "Bloch": "block",
            "Hermitian": "her-mish-an",
            "VQE": "V-Q-E",
            "QAOA": "Q-A-O-A",
            "POVM": "P-O-V-M",
        }

    def prepare_speech(self, request: TTSRequest) -> TTSResponse:
        """Sanitizes quantum equations and code blocks into speech-friendly text with phonetic hints."""
        text = request.text

        # Strip code blocks
        text = re.sub(r"```[\s\S]*?```", " [Code snippet displayed on screen] ", text)

        # Strip inline code formatting
        text = re.sub(r"`([^`]+)`", r"\1", text)

        # Replace Dirac kets/bras using phonetic map
        for symbol, phonetic in self._phonetic_dictionary.items():
            text = text.replace(symbol, phonetic)

        # Strip markdown headers, bullets, bold, italics
        text = re.sub(r"[#*_\-]", " ", text)
        clean_speech = re.sub(r"\s+", " ", text).strip()

        return TTSResponse(
            provider="web_speech_api",
            speech_text=clean_speech,
            phonetic_hints=self._phonetic_dictionary,
        )
