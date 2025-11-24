# Note Task Organizer – Architecture Design

## 1. Overview
The goal is to rebuild Note Task Organizer as a privacy-first, AI-assisted platform that ingests user notes, extracts action items/events, and tags content for effortless search. The system must operate entirely within infrastructure we control, including hosting of the small language model (SLM), to keep user data confidential while remaining scalable and maintainable.

## 2. Goals
- Secure, multi-tenant note/task management where each user’s data is isolated.
- AI-assisted workflows (subject detection, task extraction, tagging) using an on-prem/open-source SLM.
- Responsive UX supporting uploads, dashboards, search, filtering, and exports.
- Architecture that scales horizontally and supports background processing, observability, and CI/CD.

## 3. Non-Goals
- Building generalized document editing (rich text, collaborative editing) in this phase.
- Providing public APIs for third-party integrations.
- Training large models from scratch; we will fine-tune/PEFT existing SLMs if needed.

## 4. High-Level Architecture
```
Browser SPA ↔ CDN ↔ API Gateway/LB ↔ Node API (Auth, CRUD, GraphQL REST)
                               ↘ Redis (cache/queue) ↘ Background Workers
                                                  ↘ Inference Service (vLLM + SLM)
                               ↘ MongoDB (notes/tasks/users) ↘ Object Storage (S3/MinIO)
Monitoring/Logging stack collects metrics from every tier; CI/CD deploys containers to Kubernetes or ECS.
```

### Key Components
1. **Client (Next.js/Vite SPA)** – Authenticated UI served from CDN, uses React Query for data fetching, provides upload UI, dashboards, note/task views, and admin settings.
2. **API Service (Node.js/TypeScript + Express/Fastify)** – Handles auth, validation, note/task CRUD, search endpoints, export APIs, signed URL generation, and orchestrates uploads by enqueueing jobs.
3. **Background Workers (Node.js)** – Consume upload/process queues (BullMQ + Redis). Workers pull note files from object storage, call inference service, persist tags/tasks, and emit progress events.
4. **Inference Service (vLLM/TGI/Ollama)** – Hosts an open-source SLM (e.g., Phi-3.5 Mini or Llama-3.1-8B Instruct) with JSON-mode prompting. Accessible only via private network with service tokens.
5. **Data Stores** – MongoDB for structured data, Redis for caching and queues, Object Storage (S3/MinIO) for file blobs. Mongo collections include compound indexes and text indexes for efficient search.
6. **Ops Layer** – Kubernetes or ECS for orchestration, GitHub Actions for CI/CD, Prometheus/Grafana for metrics, Loki/ELK for logs, Vault/SSM for secrets.

## 5. Data Flow
1. User uploads files via SPA. Files stream directly to object storage via signed URLs; metadata hits `/api/upload`.
2. API validates request, records a pending upload doc, and enqueues a job in Redis with pointers to files and user metadata.
3. Worker dequeues job, downloads file from storage, sends sanitized content to inference service using JSON response schema (subject + tasks + tags).
4. Worker persists Note and Task documents (with `userId`, `category`, `privacy`), stores AI metadata, records audit trail, and emits WebSocket/event updates.
5. Client polls or receives websocket updates to refresh dashboards. Queries hit API, which reads from Mongo (with caching for stats).

## 6. Technology Choices
- **Frontend**: Next.js 15 (React 19), TypeScript, React Query, MUI, Zustand for local state, Vite for storybook-style component dev.
- **Backend/API**: Fastify (for performance) or Express + TypeScript, Zod for schema validation, JWT-based auth (Auth0 or custom with Passport/NextAuth), BullMQ, Socket.IO (progress updates).
- **Inference**: vLLM serving Phi-3.5 Mini or Llama-3.1-8B with quantization (Q4_K_M). Provide fallback route to larger model if confidence low.
- **Storage**: MongoDB Atlas (or self-hosted replica set), MinIO/S3-compatible buckets, Redis (Elasticache or self-hosted).
- **Infrastructure**: Kubernetes (EKS/GKE) or Nomad. GitHub Actions for CI/CD, Terraform for IaC.

## 7. Security & Privacy
- All services reside in private subnets; only CDN/LB is public.
- JWT auth with role-based permissions; tokens signed by auth service.
- Every Mongo query scoped by `userId`; indexes enforce uniqueness per user.
- Mutual TLS + service tokens between API, workers, and inference server.
- Files encrypted at rest (SSE-S3 or KMS); signed URLs expire quickly.
- Audit logging for uploads, AI outputs, deletions; anonymized metrics only.

## 8. Scalability & Reliability
- API and worker replicas autoscale via CPU/RPS metrics; inference service auto-replicates if GPU pool allows.
- Use rate limiting (Redis-backed) on upload and AI endpoints.
- Graceful degradation: if inference queue is full, return queued status and notify user; fall back to heuristic tagging if SLM unavailable.
- Observability: Prometheus alerts for queue depth, GPU utilization, error rates; logs aggregated via Loki/ELK.

## 9. Development Plan (Phased)
1. **Phase 0 – Foundations**
   - Set up repo (monorepo with Turborepo or pnpm workspaces), linting, formatting, shared TypeScript types.
   - Scaffold Next.js client and Fastify API with auth stubs.
2. **Phase 1 – Core CRUD & Auth**
   - Implement user management, JWT auth, base Note/Task CRUD with Mongo + indexes, file upload pipeline to object storage.
3. **Phase 2 – AI Inference Integration**
   - Deploy inference server with chosen SLM, build worker queue, implement structured JSON prompting, persistence of AI outputs.
4. **Phase 3 – UX Enhancements**
   - Dashboards, advanced filters, exports, manual task editing, progress indicators, websocket updates.
5. **Phase 4 – Hardening & Ops**
   - Automated tests (unit/integration/e2e), CI/CD, monitoring/logging, disaster recovery drills, performance tuning.

## 10. Open Questions
- Which auth provider (self-hosted Keycloak vs. SaaS) best fits compliance constraints?
- Required retention policies for uploaded files (legal/compliance)?
- Do we need offline/desktop clients in the near future?
- Will we fine-tune the SLM using proprietary note data, and what governance applies?

This document serves as the blueprint for the new standalone, privacy-first Note Task Organizer. As requirements evolve, update sections accordingly before implementation.
