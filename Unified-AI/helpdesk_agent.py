import os
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from prompts import HELPDESK_TEMPLATE
from tavily import TavilyClient

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
TAVILY_API_KEY = os.environ.get("TAVILY_API_KEY")
MODEL_NAME = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")

def get_helpdesk_response(user_query: str) -> str:
    """Uses Tavily search to find official info and generates a response."""
    if not TAVILY_API_KEY:
        return "Search functionality is currently disabled (missing TAVILY_API_KEY)."

    try:
        # 1. Manually search using TavilyClient
        tavily_client = TavilyClient(api_key=TAVILY_API_KEY)
        restricted_query = f"{user_query} official website government india site:gov.in OR site:nic.in"
        search_result = tavily_client.search(query=restricted_query, search_depth="basic", max_results=3)
        
        # 2. Format the context
        context = ""
        for res in search_result.get("results", []):
            context += f"Source: {res['url']}\nContent: {res['content']}\n\n"
            
    except Exception as e:
        print(f"Tavily search error: {e}")
        context = "No specific official guidance could be retrieved at this moment."

    # 3. Generate response using ChatGroq
    llm = ChatGroq(api_key=GROQ_API_KEY, model_name=MODEL_NAME, temperature=0)
    prompt = ChatPromptTemplate.from_template(HELPDESK_TEMPLATE)
    
    chain = prompt | llm
    result = chain.invoke({
        "user_query": user_query,
        "context": context
    })
    
    return result.content

