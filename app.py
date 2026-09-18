import hashlib
import os
from typing import Iterable
from io import BytesIO

import streamlit as st
from dotenv import load_dotenv
from langchain.schema import HumanMessage, SystemMessage
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from pypdf import PdfReader


load_dotenv()

FALLBACK_RESPONSE = "I couldn't find this information in the provided syllabus."
SYSTEM_PROMPT = (
    "You are a syllabus assistant. Answer strictly using ONLY the retrieved syllabus context. "
    "Do not use outside knowledge, assumptions, or guesses. "
    f"If the answer is not explicitly present in the context, respond exactly with: {FALLBACK_RESPONSE}"
)


@st.cache_resource(show_spinner=False)
def get_embeddings() -> OpenAIEmbeddings:
    return OpenAIEmbeddings(model="text-embedding-3-small")


@st.cache_resource(show_spinner=False)
def get_llm() -> ChatOpenAI:
    return ChatOpenAI(model="gpt-4o-mini", temperature=0)


def extract_pdf_pages(file_bytes: bytes) -> list[tuple[int, str]]:
    reader = PdfReader(BytesIO(file_bytes))
    pages: list[tuple[int, str]] = []
    for index, page in enumerate(reader.pages, start=1):
        text = (page.extract_text() or "").strip()
        if text:
            pages.append((index, text))
    return pages


@st.cache_resource(show_spinner=True)
def build_retriever(file_hash: str, page_numbers: tuple[int, ...], page_texts: tuple[str, ...]):
    del file_hash  # part of cache key

    documents = [
        {
            "page_content": text,
            "metadata": {"page": page_num},
        }
        for page_num, text in zip(page_numbers, page_texts)
    ]

    splitter = RecursiveCharacterTextSplitter(chunk_size=600, chunk_overlap=60)
    chunks = splitter.create_documents(
        [doc["page_content"] for doc in documents],
        metadatas=[doc["metadata"] for doc in documents],
    )

    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=get_embeddings(),
        collection_name=f"syllabus-{hashlib.md5(str(page_numbers).encode()).hexdigest()}",
    )

    return vectorstore.as_retriever(search_kwargs={"k": 4})


def format_context(docs: Iterable) -> str:
    sections = []
    for i, doc in enumerate(docs, start=1):
        page = doc.metadata.get("page", "Unknown")
        sections.append(f"[Source {i} | Page {page}]\n{doc.page_content}")
    return "\n\n".join(sections)


def ensure_openai_key() -> bool:
    if os.getenv("OPENAI_API_KEY"):
        return True
    st.error("OPENAI_API_KEY is missing. Add it to your .env file and restart the app.")
    return False


def init_session_state() -> None:
    st.session_state.setdefault("messages", [])
    st.session_state.setdefault("active_file_hash", None)


def reset_conversation_for_new_file(file_hash: str) -> None:
    if st.session_state["active_file_hash"] != file_hash:
        st.session_state["messages"] = []
        st.session_state["active_file_hash"] = file_hash


def main() -> None:
    st.set_page_config(page_title="Syllabus Assistant", page_icon="📘", layout="wide")
    st.title("📘 Syllabus Assistant")
    st.caption("Ask questions grounded strictly in your uploaded syllabus PDF.")

    init_session_state()

    with st.sidebar:
        st.header("Upload Syllabus")
        uploaded_file = st.file_uploader("Upload a PDF syllabus", type=["pdf"])
        st.markdown(
            "- Embeddings: `text-embedding-3-small`\n"
            "- LLM: `gpt-4o-mini`\n"
            "- Retrieval: top 4 chunks"
        )

    if not uploaded_file:
        st.info("Upload a syllabus PDF to start chatting.")
        return

    if not ensure_openai_key():
        return

    file_bytes = uploaded_file.getvalue()
    file_hash = hashlib.md5(file_bytes).hexdigest()

    pages = extract_pdf_pages(file_bytes)
    if not pages:
        st.warning("No readable text was found in this PDF.")
        return

    page_numbers = tuple(page for page, _ in pages)
    page_texts = tuple(text for _, text in pages)

    reset_conversation_for_new_file(file_hash)

    with st.spinner("Indexing syllabus..."):
        retriever = build_retriever(file_hash, page_numbers, page_texts)

    for message in st.session_state["messages"]:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])
            if message["role"] == "assistant":
                sources = message.get("sources", [])
                if sources:
                    with st.expander("View retrieved sources"):
                        for idx, src in enumerate(sources, start=1):
                            st.markdown(
                                f"**Source {idx}** (Page {src['page']})\n\n"
                                f"{src['snippet']}"
                            )

    user_query = st.chat_input("Ask something about the syllabus...")
    if not user_query:
        return

    st.session_state["messages"].append({"role": "user", "content": user_query})

    with st.chat_message("user"):
        st.markdown(user_query)

    retrieved_docs = retriever.invoke(user_query)
    context = format_context(retrieved_docs)

    history = [
        HumanMessage(content=msg["content"])
        for msg in st.session_state["messages"][-8:]
        if msg["role"] == "user"
    ]

    response = get_llm().invoke(
        [
            SystemMessage(content=SYSTEM_PROMPT),
            SystemMessage(content=f"Retrieved context:\n\n{context}"),
            *history,
            HumanMessage(content=user_query),
        ]
    )

    answer = response.content.strip() if isinstance(response.content, str) else FALLBACK_RESPONSE
    if not answer:
        answer = FALLBACK_RESPONSE

    source_payload = [
        {
            "page": doc.metadata.get("page", "Unknown"),
            "snippet": (doc.page_content[:400] + "...") if len(doc.page_content) > 400 else doc.page_content,
        }
        for doc in retrieved_docs
    ]

    st.session_state["messages"].append(
        {"role": "assistant", "content": answer, "sources": source_payload}
    )

    with st.chat_message("assistant"):
        st.markdown(answer)
        if source_payload:
            with st.expander("View retrieved sources"):
                for idx, src in enumerate(source_payload, start=1):
                    st.markdown(f"**Source {idx}** (Page {src['page']})\n\n{src['snippet']}")


if __name__ == "__main__":
    main()
