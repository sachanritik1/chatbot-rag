import os
import tempfile
import streamlit as st
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings import SentenceTransformerEmbeddings
from langchain_community.vectorstores import Chroma
from qna_bot_openai import start_qa_loop
from moviepy import *

st.title("🔊📄 Audio + PDF Search Chat Assistant")

uploaded_file = st.file_uploader("Upload a PDF or audio file", type=["pdf", "mp3", "wav", "m4a","mp4", "mov", "mkv"])



def transcribe_video(video_path):
    import whisper
    model = whisper.load_model("base")

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as audio_tmp:
        audio_path = audio_tmp.name

    # Extract audio from video
    video = VideoFileClip(video_path)
    video.audio.write_audiofile(audio_path, codec='pcm_s16le')  # WAV format

    # Transcribe the extracted audio
    result = model.transcribe(audio_path)
    return result["text"]



def transcribe_audio(file_path):
    import whisper
    model = whisper.load_model("base")
    result = model.transcribe(file_path)
    return result["text"]

def read_pdf(file_path):
    loader = PyPDFLoader(file_path)
    pages = loader.load()
    
    content = "\n".join([page.page_content for page in pages])
    return content

#[['','',''],['','','']]

def handle_file(file_path):
    ext = os.path.splitext(file_path)[1].lower()
    if ext in ['.mp3', '.m4a', '.wav']:
        return transcribe_audio(file_path)
    elif ext == '.pdf':
        return read_pdf(file_path)
    elif ext in ['.mp4', '.mov', '.mkv']:
        return transcribe_video(file_path)
    else:
        st.error("Unsupported file type.")
        return None



def save_to_chroma(text, persist_dir="chroma_db"):
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=150,
        separators=["\n\n", "\n", ".", "!", "?", ",", " "]
    )
    texts = text_splitter.split_text(text)
    
    embedding_function = SentenceTransformerEmbeddings(model_name="all-MiniLM-L6-v2")
    vectordb = Chroma.from_texts(
        texts=texts,
        embedding=embedding_function,
        persist_directory=persist_dir
    )
    vectordb.persist()



# File upload handling
if uploaded_file:
    with tempfile.NamedTemporaryFile(delete=False, suffix=uploaded_file.name) as tmp_file:
        tmp_file.write(uploaded_file.read())
        tmp_path = tmp_file.name

    if st.button("⚡ Process and Start QA"):
        content = handle_file(tmp_path)
        if content:
            save_to_chroma(content)
            st.session_state["ready_for_qa"] = True
            st.success("File processed! You can now ask questions.")
            st.rerun()

# QA input section
if st.session_state.get("ready_for_qa", False):
    user_query = st.text_input("Enter your question")
    if user_query:
        result = start_qa_loop(user_query)
        st.write("**Answer:**", result['result'])
