# PathFinder

A web application that helps students explore career paths, visualize course prerequisites, browse the course catalog, and engage with a community Q&A forum.

---

## Features

### Dashboard
Central hub with four sections for navigating the app's main features.

### Career Paths
Browse and save career roadmaps across 16 career options in four categories:

- **Technology** — Full Stack Development, Cyber Security, Low Level Programming, AI/Machine Learning
- **Business** — Accountant, Financial Analyst, Operations Manager
- **Healthcare** — Lab Technician, Healthcare Assistant, Health Analyst, Physician, Pharmacist, Neuroscience
- **Law & Policy** — Communications Specialist, Policy Researcher, Lawyer

### Career Roadmap (Interactive Graph)
Clicking a career path renders an interactive prerequisite flow diagram showing course dependencies with:
- Zoom and pan controls
- AND/OR prerequisite logic
- A course detail panel with descriptions, hours, delivery mode, and linked prerequisites

### Browse Courses
Full course catalog with:
- Search by course code or name
- Level filtering (100–400 level)
- Expandable course cards showing description, hours, delivery mode, prerequisites, corequisites, and exclusions

### Q&A Forum
Community discussion board where users can read and submit course-related questions.

### Grade Predictor *(coming soon)*
GPA calculator — currently locked and in development.

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | React 18 |
| Build Tool | Vite 5 |
| Backend / Database | Supabase (PostgreSQL) |
| Architecture | MVC with custom React hooks |
| Styling | CSS Modules + global CSS |

---

## Project Structure

```
PathFinder/
└── frontend/
    ├── src/
    │   ├── App.jsx                  # Main router (state-based navigation)
    │   ├── main.jsx                 # Entry point
    │   ├── controllers/             # Business logic layer
    │   ├── views/                   # Presentational components
    │   ├── models/                  # Custom React hooks (data & state)
    │   │   ├── useApp.js
    │   │   ├── useBrowseCourses.js
    │   │   ├── useCareerPaths.js
    │   │   ├── useCareerRoadmap.js
    │   │   └── useQandA.js
    │   ├── data/
    │   │   └── jobPaths.js          # Hardcoded career path definitions
    │   ├── prerequisiteGraph.js     # Graph algorithm for roadmap visualization
    │   └── supabaseClient.js        # Supabase configuration
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## Getting Started

### Prerequisites
- Node.js (v18 or later recommended)
- A Supabase project with the required tables (see [Database Setup](#database-setup))

### Installation

```bash
cd frontend
npm install
```

### Environment Variables

Create a `.env` file inside the `frontend/` directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Running Locally

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm run preview
```

---

## Database Setup

The app connects to Supabase and expects the following tables:

### `Courses`
| Column | Type | Description |
|---|---|---|
| Course Code | text | Unique course identifier |
| Name | text | Course name |
| Description | text | Course description |
| Distribution | text | Distribution category |
| Hours | text | Credit hours |
| Delivery Mode | text | In-person, online, hybrid, etc. |
| Prerequisites | text | Raw prerequisite string |
| Corequisites | text | Corequisite courses |
| Exclusions | text | Courses that cannot be taken alongside |
| Prerequisites_parsed | json | Structured AND/OR prerequisite graph |

### `Pending Questions`
| Column | Type | Description |
|---|---|---|
| Id | int | Auto-incremented primary key |
| Name | text | Submitter's name |
| Question | text | Question content |
| Time | text | Submission time |
| Data | text | Submission date |

---

## Architecture

Navigation is state-based — managed by the `useApp` hook — with no external routing library. Each view has a dedicated controller for logic and a model hook for data fetching.

The prerequisite graph is built by `prerequisiteGraph.js`, which parses the structured JSON from Supabase, resolves AND/OR dependency logic, and calculates node positions using a relaxation algorithm for the visual flow diagram.
