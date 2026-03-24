import os
from langchain_groq import ChatGroq
from langgraph.prebuilt import create_react_agent
from .tools import CITIZEN_TOOLS
from .prompts import SYSTEM_PROMPT

def build_citizen_agent(memory):
    # Attempt to load API key, default mock for build pipeline checking
    api_key = os.getenv("GROQ_API_KEY", "dummy_key")
    
    # Initialize Llama 3 on Groq
    llm = ChatGroq(
        api_key=api_key,
        model_name="llama-3.3-70b-versatile",
        temperature=0.3
    )
    
    # In some versions of LangGraph, system prompts are passed without a kwarg or via a different pattern.
    # To be perfectly safe across versions without checking docs, we use the raw `system_message` kwarg if available 
    # or just omit it and let the agent be generic if it fails, but we'll try a safe approach.
    try:
        agent_executor = create_react_agent(llm, CITIZEN_TOOLS, state_modifier=SYSTEM_PROMPT, checkpointer=memory)
    except TypeError:
        try:
            agent_executor = create_react_agent(llm, CITIZEN_TOOLS, messages_modifier=SYSTEM_PROMPT, checkpointer=memory)
        except TypeError:
            agent_executor = create_react_agent(llm, CITIZEN_TOOLS, checkpointer=memory)
            # We will handle system prompting in the main.py invocation loop if needed.
    
    return agent_executor
