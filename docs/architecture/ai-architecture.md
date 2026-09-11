# PBQuantum Labs — AI Intelligence Layer Architecture

This document describes the design, implementation, and operational procedures for the source-grounded **AI Intelligence Layer** in PBQuantum Labs.

---

## 1. Core Principles & Philosophy

1. **Additive Only**: Built strictly as a non-invasive intelligence layer around the existing QuantumLab application. The underlying IBM Qiskit Aer simulation engine, circuit canvas, and curriculum modules remain untouched.
2. **Zero Fake Data & Execution**: The LLM is **never** the source of truth for deterministic quantum computations. Statevectors, amplitudes, Born rule probabilities, Bloch sphere angles, and measurement shot counts are computed deterministically by IBM Qiskit Aer.
3. **Epistemic Authority Hierarchy**:
   - **Math & Code (Primary)**: *A Gentle Introduction to Quantum Computing* (Rieffel & Polak).
   - **Theory & History (Primary)**: *In Search of Schrödinger's Cat* (Gribbin).
   - **Curriculum & Lab Context**: PBQuantum Labs 36 Domain Specifications.
   - **Current APIs & Hardware**: Curated web allowlist (Qiskit 1.0+ official documentation).

---

## 2. System Execution Flow

```
[Student in Next.js UI]
        │  (User question + Canvas Circuit + Page Context + Depth Level)
        ▼
[Next.js API Proxy /api/copilot]
        │
   ┌────┴───────────────────────────────────────┐
   │ (Primary)                                  │ (Fallback)
   ▼                                            ▼
[FastAPI /api/v1/ai/chat]              [Direct Groq LPU Call]
   │
   ├─► 1. Query Router (14 Categories)
   ├─► 2. Deterministic Quantum Tools (Qiskit Aer)
   ├─► 3. RAG Knowledge Store (Authority-Weighted BM25)
   ├─► 4. Provider Dispatcher (Groq / Local / Mock)
   ├─► 5. TTS Pronunciation Sanitizer
   │
   ▼
[Structured Response: Answer + Citations + Tool Results + Proposal + Audio Text]
        │
        ▼
[Copilot Drawer UI: Markdown + Qiskit Code + Tool Badges + Apply to Canvas + Voice]
```

---

## 3. Knowledge Sources & ChunkRecord Schema

Every stored piece of evidence conforms to the deterministic `ChunkRecord` schema:

```json
{
  "chunk_id": "rieffel-ch02-0001",
  "source_id": "gentle_intro_qc",
  "source_title": "A Gentle Introduction to Quantum Computing",
  "source_type": "textbook",
  "knowledge_domain": "math_code",
  "authority": "primary",
  "chapter": "Chapter 2: Single-Qubit Systems",
  "section": "2.1 The Quantum State Vector",
  "page_start": 17,
  "page_end": 24,
  "url": null,
  "retrieved_at": null,
  "text": "The general pure single-qubit state is |ψ⟩ = α|0⟩ + β|1⟩..."
}
```

### Knowledge Ingestion Pipeline
To ingest new or complete text/PDF versions of the two textbooks:
```bash
python training/scripts/ingest_books.py --file path/to/book.pdf --type gentle_intro --out training/data/chunk_records.jsonl
python training/scripts/ingest_books.py --file path/to/cat.pdf --type schrodingers_cat --out training/data/chunk_records.jsonl
```

---

## 4. Deterministic Quantum Tools Bridge

Implemented in `apps/api/app/services/ai/tools/quantum_tools.py`:

| Tool Name | Engine | Function |
| :--- | :--- | :--- |
| `inspect_circuit` | Qiskit | Extracts depth, gate counts, qubit registers. |
| `validate_circuit` | Schema/Qiskit | Verifies index bounds and unitary validity. |
| `run_simulation` | Qiskit Aer | Executes simulation shots and returns count distributions. |
| `get_statevector` | `Statevector` | Calculates complex amplitudes (Re, Im, Mag, Phase). |
| `get_bloch_vector`| Linear Algebra | Computes 3D Cartesian $(x, y, z)$ and spherical $(\theta, \phi)$ angles. |
| `generate_qiskit` | Transpiler | Generates modern, valid Python Qiskit 1.0 code. |
| `debug_circuit` | Static Analysis | Detects unused qubits, missing measurements, and depth hazards. |

---

## 5. Kaggle T4 QLoRA Fine-Tuning Pipeline

The fine-tuning pipeline is implemented in `training/kaggle/quantumlab_t4_training.ipynb`.

### Execution Steps on Kaggle:
1. Create a new Kaggle Notebook with **GPU T4 x2** or **GPU T4 (16GB)** accelerator.
2. Upload the `training/data/seed_benchmark.jsonl` dataset (or let the notebook automatically discover it from `/kaggle/input`).
3. Run the notebook cells sequentially:
   - **Step 1–2**: GPU verification & dependency install (`transformers`, `peft`, `bitsandbytes`, `trl`).
   - **Step 3–4**: Dynamic input scanning in `/kaggle/input` and dataset validation.
   - **Step 5**: 4-bit NF4 quantized base model loading (`Qwen/Qwen2.5-7B-Instruct`).
   - **Step 6**: Baseline evaluation logging on test prompts (`/kaggle/working/eval/base_results.json`).
   - **Step 7–8**: QLoRA configuration ($r=16, \alpha=32$) and `SFTTrainer` setup.
   - **Step 9**: Execute fine-tuning and export adapters to `/kaggle/working/quantumlab-qlora-adapter`.
   - **Step 10**: Fine-tuned evaluation logging (`/kaggle/working/eval/finetuned_results.json`) and comparative assessment.

---

## 6. Text-to-Speech (TTS) Service

Application-layer voice synthesis:
1. `apps/api/app/services/ai/tts.py` transforms mathematical notation:
   - $|0\rangle \to$ `"ket zero"`
   - $|\psi\rangle \to$ `"ket psi"`
   - $|+\rangle \to$ `"ket plus"`
   - $\sum \to$ `"sum over"`
   - Strips code blocks and raw symbols.
2. `QuantumCopilotDrawer.tsx` uses the browser's native `window.speechSynthesis` API for zero-latency, private, client-side audio playback with Play/Stop toggle.

---

## 7. Security & Environment Configuration

| Variable | Location | Required In | Description |
| :--- | :--- | :--- | :--- |
| `GROQ_API_KEY` | `.env.local` | Server-side only | Groq API key for LPU high-speed inference. |
| `GROQ_MODEL` | `.env.local` | Server-side only | Default LLM model (`llama-3.3-70b-versatile` or `qwen3.8-27b`). |
| `LLM_PROVIDER` | `apps/api/.env` | Server-side only | Provider choice (`groq`, `local`, or `mock`). |
| `LOCAL_LLM_URL`| `apps/api/.env` | Server-side only | Optional endpoint for local Ollama / vLLM inference. |
| `NEXT_PUBLIC_API_URL` | `apps/web/.env.local` | Frontend | URL of the FastAPI backend (`http://localhost:8000`). |

> **Security Note:** Provider credentials are never exposed to client-side bundles or logged to disk. `.env.local` is ignored by `.gitignore`.
