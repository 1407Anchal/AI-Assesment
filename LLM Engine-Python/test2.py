import uuid
from langchain_core.messages import SystemMessage
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import StateGraph, START
from typing_extensions import TypedDict
from langchain_core.messages import AIMessage, HumanMessage, ToolMessage
from langgraph.graph import END
from flask import Flask, json, request, jsonify
from flask_cors import CORS
from langchain_community.chat_models import ChatOllama
app = Flask(__name__)
CORS(app)
conversation_memory = {}
template = """
You are a browsing automation agent.
Convert the user instruction into JSON steps.
Return ONLY valid JSON array. No explanation.
"""

def get_messages_info(messages):
        return [SystemMessage(content=template)] + messages

llm = ChatOllama(
    model="llama3",
    temperature=0
)

def info_chain(state):
        print("state 96:==",state)
        messages = get_messages_info(state["messages"])
        response = llm.invoke(messages)
        print("97:==",response)
        return {"messages": [response]}

prompt_system = """create a wondorfull story about {memories} and {relationships} and {places}"""
def get_prompt_messages(messages: list):
    print("104")
    tool_call = None
    other_msgs = []
    for m in messages:
        if isinstance(m, AIMessage) and m.tool_calls:
            tool_call = m.tool_calls[0]["args"]
        elif isinstance(m, ToolMessage):
            continue
        elif tool_call is not None:
            other_msgs.append(m)
    return [SystemMessage(content=prompt_system.format(reqs=tool_call))] + other_msgs
def prompt_gen_chain(state):
        messages = get_prompt_messages(state["messages"])
        response = llm.invoke(messages)
        print("118:==",response)
        return {"messages": [response]}


def log_chat_to_file(filename, speaker, response):
    with open(filename, 'a') as file:
        file.write(f'{speaker}: {response}\n')
def get_state(state):
    print("state:==",state)
    messages = state["messages"]
    print("messages:==",messages)
    last_message = messages[-1]
    if isinstance(last_message, AIMessage) and last_message.tool_calls:
        print("129")
        return add_tool_message
    elif not isinstance(last_message, HumanMessage):
        print("132")
        return END
    return "info"
class State(TypedDict):
        messages: list



memory = MemorySaver()
workflow = StateGraph(State)
workflow.add_node("info", info_chain)
workflow.add_node("prompt", prompt_gen_chain)
print("workflow",workflow)

@workflow.add_node
def add_tool_message(state: State):
    print("151",ToolMessage(
                content="Prompt generated!",
                tool_call_id=state["messages"][-1].tool_calls[0]["id"],
            ))
    return {
        "messages": [
            ToolMessage(
                content="Prompt generated!",
                tool_call_id=state["messages"][-1].tool_calls[0]["id"],
            )
        ]
    }
workflow.add_conditional_edges("info", get_state, ["add_tool_message", "info", END])
workflow.add_edge("add_tool_message", "prompt")
workflow.add_edge("prompt", END)
workflow.add_edge(START, "info")
graph = workflow.compile(checkpointer=memory)
@app.route("/")
def root():
    print("hello from python")
    return jsonify({"hello":"HELLO FROM ROOT OF LANG CHAIN"})

@app.route('/generate_response', methods=['POST'])
def generate_response():
    
    data = request.json
    print("request=========",request.json)
    user_message = data['query']
    print("user message",user_message)
    session_id = data.get('session_id', str(uuid.uuid4()))
    print("session Id:==",session_id)
    if session_id not in conversation_memory:
        print("158========")
        conversation_memory[session_id] = {"messages": []}
    conversation_memory[session_id]["messages"].append(HumanMessage(content=user_message))
    config = {"configurable": {"thread_id": session_id}}
    final_message = None
    print("conversation memory:==",session_id)
    for output in graph.stream(
        conversation_memory[session_id],
        config=config
    ):
        print("output message:--",output)
        last_message = list(output.values())[0]["messages"][-1]
        final_message = last_message.content

    try:
        payload_json = json.loads(final_message)
    except Exception as e:
        payload_json = {
            "error": "LLM returned invalid JSON",
            "raw_output": final_message
        }
    return jsonify({
        "session_id": session_id,
        "payload": payload_json
    })
    

@app.route('/reset_session', methods=['POST'])
def reset_session():
    data = request.json
    session_id = data.get('session_id')
    if session_id in conversation_memory:
        del conversation_memory[session_id]
    return jsonify({"message": "Session reset successfully"}), 200
    
if __name__ == '__main__':
    app.run(debug=True, port=9000)