This repository contains the full stack Ethara AI Assessment project, including:

- **Web Automation (Frontend)**: React web app for user interaction
- **Automation Engine (Backend)**: Node.js automation/API.
- **LLM Engine(AI)**: Python-based local AI engine (used Ollama for create mock query)

- ## How it Works
**Note: Currently it's mock automation task so write same query**
1. User interacts with the React frontend and write his query: "I want to login my Facebook"
2. Frontend sends user query to llm engine that create a mock json i.e. generate AI response using Ollama and send it back to user.
4. Now User sends this AI generated response to Node JS Api and NOde JS uses Pupeeteer to process web automation.

**How it runs Locally**:
1 Frontend (React) : 
  1. npm install
  2. npm start
2. LLM Engine (Python):
   1. ollama pull llama3
   2. ollama run llama3
   3. python test2.py
3. Backend (Node JS):
     1. node server.js
  
**NOTE: You can add your facebook creadentials also. But I create a demo credentials so you can use:
Username: anchlarora1407@gmail.com
Password: Project@123**
