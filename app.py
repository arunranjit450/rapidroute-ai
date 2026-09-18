import hashlib
import io
import os
import re
from typing import Any
from uuid import uuid4

import streamlit as st
from dotenv import load_dotenv
from langchain.prompts import ChatPromptTemplate
from langchain.schema import Document
from langchain_chroma import Chroma
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pypdf import PdfReader

load_dotenv()

FALLBACK_MESSAGE = "I couldn't find this information in the provided syllabus."


@st.cache_resource
def get_embeddings() -> OpenAIEmbeddings:
    return OpenAIEmbeddings(model="text-embedding-3-small")


@st.cache_resource
def get_llm() -> ChatOpenAI:
    return ChatOpenAI(model="gpt-4o-mini", temperature=0)


def file_hash(file_bytes: bytes) -> str:
    return hashlib.sha256(file_bytes).hexdigest()


def extract_pdf_documents(file_name: str, file_bytes: bytes) -> list[Document]:
    reader = PdfReader(io.BytesIO(file_bytes))
    documents: list[Document] = []

    for page_number, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""
        text = text.strip()
        if text:
            documents.append(
                Document(
                    page_content=text,
                    metadata={"source": file_name, "page": page_number},
                )
            )

    return documents


def chunk_documents(documents: list[Document]) -> list[Document]:
    splitter = RecursiveCharacterTextSplitter(chunk_size=600, chunk_overlap=60)
    return splitter.split_documents(documents)


def build_vector_store(chunks: list[Document]) -> Chroma:
    return Chroma.from_documents(
        documents=chunks,
        embedding=get_embeddings(),
        collection_name=f"syllabus-{uuid4()}",
    )


def normalize_whitespace(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def format_sources(retrieved_docs: list[Document]) -> list[dict[str, Any]]:
    sources: list[dict[str, Any]] = []

    for doc in retrieved_docs:
        snippet = normalize_whitespace(doc.page_content)
        sources.append(
            {
                "page": doc.metadata.get("page", "Unknown"),
                "snippet": snippet[:300] + ("..." if len(snippet) > 300 else ""),
            }
        )

    return sources


def build_context(retrieved_docs: list[Document]) -> str:
    context_parts = []
    for index, doc in enumerate(retrieved_docs, start=1):
        page = doc.metadata.get("page", "Unknown")
        context_parts.append(f"[Chunk {index} | Page {page}]\n{doc.page_content}")
    return "\n\n".join(context_parts)


def answer_question(question: str, retrieved_docs: list[Document]) -> str:
    if not retrieved_docs:
        return FALLBACK_MESSAGE

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "You are a syllabus assistant. Use only the retrieved context to answer. "
                "Do not use outside knowledge or make assumptions. "
                f"If the answer is not explicitly in the context, respond exactly with: {FALLBACK_MESSAGE}",
            ),
            (
                "human",
                "Question:\n{question}\n\nRetrieved context:\n{context}",
            ),
        ]
    )

    messages = prompt.format_messages(
        question=question,
        context=build_context(retrieved_docs),
    )

    response = get_llm().invoke(messages)
    answer = (response.content or "").strip()

    return answer if answer else FALLBACK_MESSAGE


def initialize_session_state() -> None:
    st.session_state.setdefault("chat_history", [])
    st.session_state.setdefault("vector_store", None)
    st.session_state.setdefault("retriever", None)
    st.session_state.setdefault("indexed_file_hash", None)
    st.session_state.setdefault("indexed_file_name", None)
    st.session_state.setdefault("chunk_count", 0)


def index_uploaded_file(uploaded_file: Any) -> None:
    file_bytes = uploaded_file.getvalue()
    current_hash = file_hash(file_bytes)

    if st.session_state.indexed_file_hash == current_hash:
        return

    documents = extract_pdf_documents(uploaded_file.name, file_bytes)
    if not documents:
        st.session_state.vector_store = None
        st.session_state.retriever = None
        st.session_state.chat_history = []
        st.session_state.chunk_count = 0
        st.warning("No extractable text found in this PDF.")
        return

    chunks = chunk_documents(documents)
    vector_store = build_vector_store(chunks)

    st.session_state.vector_store = vector_store
    st.session_state.retriever = vector_store.as_retriever(search_kwargs={"k": 4})
    st.session_state.indexed_file_hash = current_hash
    st.session_state.indexed_file_name = uploaded_file.name
    st.session_state.chunk_count = len(chunks)
    st.session_state.chat_history = []


def main() -> None:
    st.set_page_config(page_title="Syllabus Assistant", page_icon="📘", layout="wide")
    st.title("📘 Syllabus Assistant")
    st.caption("Ask questions grounded strictly in your uploaded syllabus PDF.")

    if not os.getenv("OPENAI_API_KEY"):
        st.error("OPENAI_API_KEY is missing. Add it to a .env file and restart the app.")
        st.stop()

    initialize_session_state()

    with st.sidebar:
        st.header("Syllabus Upload")
        uploaded_file = st.file_uploader("Upload a PDF syllabus", type=["pdf"])

        if uploaded_file is not None:
            with st.spinner("Indexing syllabus..."):
                index_uploaded_file(uploaded_file)

            if st.session_state.retriever is not None:
                st.success(
                    f"Indexed {st.session_state.chunk_count} chunks from {st.session_state.indexed_file_name}."
                )

    for message in st.session_state.chat_history:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])
            if message["role"] == "assistant" and message.get("sources"):
                with st.expander("View sources"):
                    for idx, source in enumerate(message["sources"], start=1):
                        st.markdown(f"**Source {idx} — Page {source['page']}**")
                        st.write(source["snippet"])

    user_question = st.chat_input("Ask about topics, grading, schedule, policies, and deadlines")

    if not user_question:
        return

    st.session_state.chat_history.append({"role": "user", "content": user_question})
    with st.chat_message("user"):
        st.markdown(user_question)

    if st.session_state.retriever is None:
        answer = "Please upload a syllabus PDF first."
        sources = []
    else:
        retrieved_docs = st.session_state.retriever.invoke(user_question)
        answer = answer_question(user_question, retrieved_docs)
        sources = format_sources(retrieved_docs)

    assistant_message = {"role": "assistant", "content": answer, "sources": sources}
    st.session_state.chat_history.append(assistant_message)

    with st.chat_message("assistant"):
        st.markdown(answer)
        if sources:
            with st.expander("View sources"):
                for idx, source in enumerate(sources, start=1):
                    st.markdown(f"**Source {idx} — Page {source['page']}**")
                    st.write(source["snippet"])


if __name__ == "__main__":
    main()
