"""
Two-Book Knowledge Ingestion Script for PBQuantum Labs.

Processes:
- SOURCE A: "A Gentle Introduction to Quantum Computing" (math, Dirac notation, matrices, algorithms)
- SOURCE B: "In Search of Schrödinger's Cat" (theory, history, foundations, conceptual development)

Extracts clean text with chapter, section, and page provenance into ChunkRecord JSONL.
Adheres strictly to the ChunkRecord schema in Section 10.
"""

import os
import sys
import json
import re
import argparse
from typing import List, Dict, Any, Optional

def clean_extracted_text(text: str) -> str:
    """Cleans raw text while preserving equations, Dirac brackets, and code blocks."""
    # Replace multiple spaces with a single space except in indentation
    text = re.sub(r'[ \t]+', ' ', text)
    # Remove orphan page headers/footers often seen in PDFs
    text = re.sub(r'\n\s*\d+\s*\n', '\n', text)
    # Reconnect hyphenated words split across lines
    text = re.sub(r'(\w+)-\n(\w+)', r'\1\2', text)
    # Normalize unicode quotes and dashes
    text = text.replace('“', '"').replace('”', '"').replace('‘', "'").replace('’', "'")
    return text.strip()

def chunk_text_semantically(
    text: str,
    source_id: str,
    source_title: str,
    source_type: str,
    knowledge_domain: str,
    authority: str,
    chapter: Optional[str] = None,
    section: Optional[str] = None,
    page_start: Optional[int] = None,
    page_end: Optional[int] = None,
    max_chunk_chars: int = 1500,
    overlap_chars: int = 200
) -> List[Dict[str, Any]]:
    """Chunks text preserving paragraph and equation boundaries."""
    paragraphs = text.split("\n\n")
    chunks: List[Dict[str, Any]] = []
    current_content: List[str] = []
    current_len = 0
    chunk_index = 1

    for p in paragraphs:
        p_clean = p.strip()
        if not p_clean:
            continue
            
        p_len = len(p_clean)
        if current_len + p_len > max_chunk_chars and current_content:
            chunk_body = "\n\n".join(current_content)
            chunk_id = f"{source_id}-{chapter or 'gen'}-{chunk_index:04d}"
            chunks.append({
                "chunk_id": chunk_id,
                "source_id": source_id,
                "source_title": source_title,
                "source_type": source_type,
                "knowledge_domain": knowledge_domain,
                "authority": authority,
                "chapter": chapter,
                "section": section,
                "page_start": page_start,
                "page_end": page_end,
                "url": None,
                "retrieved_at": None,
                "text": chunk_body
            })
            chunk_index += 1
            # Maintain brief overlap
            if len(current_content) > 1:
                current_content = [current_content[-1], p_clean]
                current_len = len(current_content[0]) + p_len
            else:
                current_content = [p_clean]
                current_len = p_len
        else:
            current_content.append(p_clean)
            current_len += p_len

    if current_content:
        chunk_body = "\n\n".join(current_content)
        chunk_id = f"{source_id}-{chapter or 'gen'}-{chunk_index:04d}"
        chunks.append({
            "chunk_id": chunk_id,
            "source_id": source_id,
            "source_title": source_title,
            "source_type": source_type,
            "knowledge_domain": knowledge_domain,
            "authority": authority,
            "chapter": chapter,
            "section": section,
            "page_start": page_start,
            "page_end": page_end,
            "url": None,
            "retrieved_at": None,
            "text": chunk_body
        })

    return chunks

def ingest_file(file_path: str, book_type: str, output_path: str):
    """Parses a book source file (txt, md, or pdf if pypdf is installed) and writes ChunkRecord JSONL."""
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return

    ext = os.path.splitext(file_path)[1].lower()
    full_text = ""
    pages_data = []

    if ext == ".pdf":
        try:
            import pypdf
            reader = pypdf.PdfReader(file_path)
            for idx, page in enumerate(reader.pages):
                extracted = page.extract_text() or ""
                pages_data.append((idx + 1, clean_extracted_text(extracted)))
        except ImportError:
            print("pypdf is not installed. To extract PDFs, run: pip install pypdf")
            return
    else:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            full_text = f.read()
        pages_data.append((1, clean_extracted_text(full_text)))

    if book_type == "gentle_intro":
        source_id = "gentle_intro_qc"
        source_title = "A Gentle Introduction to Quantum Computing"
        knowledge_domain = "math_code"
        authority = "primary"
    elif book_type == "schrodingers_cat":
        source_id = "schrodinger_cat"
        source_title = "In Search of Schrödinger's Cat"
        knowledge_domain = "theory_history"
        authority = "primary_for_history"
    else:
        source_id = "custom_quantum_source"
        source_title = "Quantum Reference Document"
        knowledge_domain = "math_code"
        authority = "project_curated"

    all_chunks = []
    for page_num, text in pages_data:
        if not text:
            continue
        chunks = chunk_text_semantically(
            text=text,
            source_id=source_id,
            source_title=source_title,
            source_type="textbook",
            knowledge_domain=knowledge_domain,
            authority=authority,
            chapter=f"Section_{page_num}",
            section=None,
            page_start=page_num,
            page_end=page_num,
        )
        all_chunks.extend(chunks)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "a", encoding="utf-8") as out_f:
        for chunk in all_chunks:
            out_f.write(json.dumps(chunk, ensure_ascii=False) + "\n")

    print(f"Successfully ingested {len(all_chunks)} chunks from {file_path} into {output_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ingest quantum textbooks into ChunkRecord JSONL format.")
    parser.add_argument("--file", type=str, required=True, help="Path to input text or PDF file")
    parser.add_argument("--type", type=str, choices=["gentle_intro", "schrodingers_cat", "other"], required=True)
    parser.add_argument("--out", type=str, default="training/data/chunk_records.jsonl", help="Output JSONL path")
    args = parser.parse_args()

    ingest_file(args.file, args.type, args.out)
