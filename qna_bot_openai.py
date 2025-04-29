from langchain.vectorstores import Chroma
from langchain.embeddings import SentenceTransformerEmbeddings
from langchain.llms import OpenAI
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from dotenv import load_dotenv
import os

# Load from .env file
load_dotenv()

# Access the variables
openai_api_key = os.getenv("OPEN_AI_API_KEY")

def start_qa_loop(query,chroma_path="chroma_db", openai_api_key=openai_api_key):
    
    # Load Chroma vector DB
    embedding_function = SentenceTransformerEmbeddings(model_name="all-MiniLM-L6-v2")
    vectordb = Chroma(
        persist_directory=chroma_path,
        embedding_function=embedding_function
    )
    prompt_template = """
You are a helpful assistant that answers user questions strictly based on the provided context extracted from a audio, video or PDF file.

Context: {context}

Question: {question}

Answer: Do not use any outside knowledge or assumptions. Stick only to the given context.
"""
    # Load OpenAI model
    llm = OpenAI(
        openai_api_key=openai_api_key,
        temperature=0.7,
        max_tokens=512,
        top_p=1,
        verbose=False
    )
    prompt = PromptTemplate(template=prompt_template,input_variables=["context", "question"])
    # Set up RetrievalQA chain
    qa_chain = RetrievalQA.from_chain_type(
        llm=llm,
        retriever=vectordb.as_retriever(search_type="mmr",search_kwargs={"k": 10}),
        return_source_documents=True,
        chain_type_kwargs={"prompt": prompt}

    )
    result = qa_chain(query)
    return result

