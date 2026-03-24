import os
from langchain_groq import ChatGroq
from langgraph.prebuilt import create_react_agent
from .tools import WARD_TOOLS
from .prompts import SYSTEM_PROMPT

def build_ward_agent(memory):
    api_key = os.getenv("GROQ_API_KEY", "dummy_key")
    llm = ChatGroq(
        api_key=api_key,
        model_name="llama-3.3-70b-versatile",
        temperature=0.1
    )
    
    try:
        agent_executor = create_react_agent(llm, WARD_TOOLS, state_modifier=SYSTEM_PROMPT, checkpointer=memory)
    except TypeError:
        try:
            agent_executor = create_react_agent(llm, WARD_TOOLS, messages_modifier=SYSTEM_PROMPT, checkpointer=memory)
        except TypeError:
            agent_executor = create_react_agent(llm, WARD_TOOLS, checkpointer=memory)
    
    return agent_executor
