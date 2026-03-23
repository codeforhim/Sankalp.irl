from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import os
import uvicorn

# LangGraph Memory
from langgraph.checkpoint.memory import MemorySaver

# Import agent builders
from citizen_agent.agent import build_citizen_agent
from ward_agent.agent import build_ward_agent
from admin_agent.agent import build_admin_agent

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="LokaYuktai Agentic AI System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global in-memory checkpointer to persist short-term conversational history by user_id thread
memory = MemorySaver()

# Build the LangGraph executors once on startup
citizen_executor = build_citizen_agent(memory)
ward_executor = build_ward_agent(memory)
admin_executor = build_admin_agent(memory)

class ChatRequest(BaseModel):
    message: str
    user_id: str
    context: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    response: str
    actions_taken: List[str] = []

def process_agent_chat(executor, request: ChatRequest) -> ChatResponse:
    try:
        # thread_id ensures the memory checkpointer retrieves the last 5 messages for this user
        config = {"configurable": {"thread_id": request.user_id}}
        
        context_str = f"The authenticated user_id logging this request is {request.user_id}."
        if request.context:
            context_str += f" Additional contextual variables: {request.context}"
        enhanced_msg = f"[System Context: {context_str} Do not ask the user for their ID or context, just use this.]\n\n{request.message}"

        # Invoke the robust LangGraph react agent
        # It will autonomously decide whether to use tools or just respond
        result = executor.invoke(
            {"messages": [("user", enhanced_msg)]},
            config=config
        )
        
        # Extract the final AI textual response
        final_message = result["messages"][-1].content

        with open("debug_messages.txt", "w") as f:
            for i, msg in enumerate(result["messages"]):
                f.write(f"[{i}] {msg.type}: {msg.content}\n")
        
        # Basic parsing to see if it used tools in this run by looking through recent messages
        actions = []
        for msg in result["messages"]:
            # If standard langchain ToolMessage is present, a tool was executed
            if msg.type == "tool":
                actions.append(f"Executed tool: {msg.name}")
        
        # Deduplicate actions
        actions = list(set(actions))

        return ChatResponse(response=final_message, actions_taken=actions)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat/citizen", response_model=ChatResponse)
async def chat_citizen(request: ChatRequest):
    return process_agent_chat(citizen_executor, request)

@app.post("/chat/ward", response_model=ChatResponse)
async def chat_ward(request: ChatRequest):
    return process_agent_chat(ward_executor, request)

@app.post("/chat/admin", response_model=ChatResponse)
async def chat_admin(request: ChatRequest):
    return process_agent_chat(admin_executor, request)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
