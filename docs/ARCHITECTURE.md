# SkillBridge Architecture

This document describes the actual implemented architecture of the SkillBridge application (Phase G).

```mermaid
flowchart TD
    %% Frontend Layer
    subgraph Frontend [Frontend: React SPA / Vite]
        UI[React Components / UI Wizard]
        WContext[Wizard Context]
        Hooks[API Custom Hooks]
        
        UI <--> WContext
        WContext <--> Hooks
    end

    %% Backend Layer
    subgraph Backend [Backend: Node.js / Express]
        Router[Express Routers & Validation]
        
        subgraph Services [Service Layer]
            AS[AnalysisService\n(Deterministic Scoring)]
            RS[RoadmapService\n(Rule-based Sequencing)]
            TS[TutorService\n(AI Orchestration)]
        end
        
        subgraph Repositories [Data Access Layer]
            RoleRepo[Roles Repository]
            ProfRepo[Profile Repository]
            AnaRepo[Analysis Repository]
        end
        
        Router --> Services
        AS --> RoleRepo
        AS --> ProfRepo
        AS --> AnaRepo
        RS --> RoleRepo
    end

    %% Storage Layer
    subgraph Database [Storage: SQLite]
        DB[(skillbridge.db)]
        Schema[Profiles, Skills, Roles, \nRole Requirements, Analyses]
        Schema --- DB
    end
    Repositories --> Database

    %% External & Market Data
    subgraph External [External AI]
        OR[OpenRouter API]
        Model[DeepSeek V4.1 Flash]
        OR --> Model
    end
    
    subgraph Pipeline [Market Data Pipeline]
        RawData[Job Postings JSON\n(7 Real, 30 Sample)]
        Scripts[ETL Scripts]
        RawData --> Scripts
    end

    %% Connections
    Hooks -- HTTP REST --> Router
    TS -- REST (JSON) --> OR
    Scripts -. Seeds .-> Database
```

## Architectural Decisions
1. **Layered Backend**: Separating routes, services, and repositories allows for rigorous unit testing (e.g., testing the scoring formula without hitting the database).
2. **Deterministic Core vs. AI Edges**: The scoring engine (`AnalysisService`) is 100% mathematical and deterministic based on the SQLite DB. AI is strictly confined to the `TutorService` to prevent hallucinated scores.
3. **SQLite**: Used for the MVP to provide zero-config, disk-based persistence while ensuring relational integrity (Foreign Keys).

4. **Current AI model (September 27, 2026)**: The user selected
   `deepseek/deepseek-v4.1-flash` after the former Claude 3 Haiku route returned 404.
   OpenRouter remains the provider. Optional reasoning is disabled for short
   explanations; the 1024-token cap, JSON validation and 10-second timeout remain.
   The timeout covers response-body consumption as well as headers.
5. **Response ownership**: `apiFetch` unwraps `{ data, error }` once. Results uses
   gapWeight/description/assessmentIdea; Tutor consumes the explanation directly.
   The scoring HTTP contract is unchanged.

## Course discovery (September 27 extension)

Tutor CourseRecommendations → POST /api/courses/search → taxonomy validation → CourseSearchService (cache/deduplication/concurrency limit) → OpenRouter web-search server tool → validated official course citations. Search is user-triggered and independent of Analysis and tutor explanation requests. Only skill names are sent externally. Scoring and database schema are unchanged. See COURSE_SEARCH_2026-09-27.md for contracts, limits and evidence.
