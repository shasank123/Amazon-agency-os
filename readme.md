# 🚀 Amazon Agency OS: Multi-Agent B2B Platform

> **A "Portfolio Version" demonstration of a scalable Operating System for Amazon Marketing Agencies.**

This project is an **Event-Driven Multi-Agent System** designed to automate the core operations of an Amazon Agency. Instead of static dashboards, it uses autonomous AI agents to perform complex workflows like finding leads, repricing inventory, and drafting policy-compliant replies to customer reviews.

## 🏗 System Architecture

The system follows a **Microservices-ready architecture** using a "Brain" (FastAPI) and "Muscle" (Celery/LangGraph) approach.

* **Orchestrator:** FastAPI (High-performance Async API)
* **Message Broker:** Redis (Task Queues & Token Bucket Rate Limiting)
* **State Management:** PostgreSQL (User Data) & ClickHouse (Mocked Analytics)
* **Agent Logic:** LangGraph (Stateful, Cyclic Workflows)
* **Frontend:** Next.js 14 (App Router, Server Actions) + ShadCN UI

## 🤖 The Agent Roster

The system creates a "Digital Office" with 6 specialized agents:

| Agent | Role | Logic & Capability |
| :--- | :--- | :--- |
| **Jeff** | **Sales / SDR** | Scrapes 1M+ (mock) sellers to find qualified leads. Uses **LLMs** to draft personalized outreach based on brand pain points. |
| **Penny** | **Pricing** | Monitors competitor pricing 24/7. Uses **Rule-Based Logic** to undercut competitors by $0.05 while respecting profit margins. |
| **Sue** | **Reputation** | Handles customer service. Uses **RAG (Retrieval Augmented Generation)** to fetch client SOPs from a Vector DB and draft compliant replies. Features **Human-in-the-Loop** approval. |
| **Adam** | **Ad Manager** | Analyzes ad spend efficiency. Identifies "Bleeding Keywords" (High Spend / 0 Sales) and automates bid adjustments. |
| **Ivan** | **Inventory** | Predicts stockouts based on sales velocity. Automatically generates Purchase Orders (PDFs) for suppliers. |
| **Lisa** | **SEO** | audits product listings against top competitors. Suggests keyword optimizations to improve search ranking. |

## 🌟 Key Technical Features

### 1. Human-in-the-Loop (LangGraph Checkpointing)
Unlike standard chatbots, the **Sue Agent** pauses execution after drafting a reply.
* It saves the state to memory (`WAITING_APPROVAL`).
* The human user reviews/edits the draft via the Frontend.
* Upon approval, the graph resumes execution to publish the reply.

### 2. RAG (Retrieval Augmented Generation)
The agents don't hallucinate policies. They query a **pgvector** database to retrieve the specific "Return Policy" or "Brand Voice" documents for each client before generating text.

### 3. Event-Driven & Rate Limited
To prevent getting banned by Amazon APIs, the system uses a **Redis-backed Token Bucket algorithm**. This ensures that even if 5,000 agents wake up simultaneously, API calls are smoothed out to respect rate limits.

## 🛠 Local Setup (The "7-Day Sprint" Version)

This repository contains a fully functional "Simulation" of the OS using local mock data.

### Prerequisites
* Docker Desktop (Running)
* Python 3.10+
* Node.js 18+

### Step 1: Infrastructure
Spin up the Database (Postgres + pgvector) and Queue (Redis).
```bash
docker-compose up -d

Step 2: Backend (The Brain)
Bash

cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
Access Swagger UI at: http://localhost:8000/docs

Step 3: Frontend (The Dashboard)
Bash

cd frontend
npm install
npm run dev
Access Dashboard at: http://localhost:3000

🔮 Future Roadmap (Scaling Strategy)
If deployed to production for 1,000 agencies, the architecture is designed to evolve:

Sharding: Migrate PostgreSQL to Citus Data to shard data by agency_id.

Cluster: Upgrade Redis to a Cluster Mode to distribute the rate-limiting counters.

Isolation: Implement Row-Level Security (RLS) to ensure strict multi-tenant data isolation.

Built with ❤️ by shasank polamraju as a specialized study in Agentic Workflows.