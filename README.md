# HEdClass

A web application for managing **higher-education degree classifications**. It lets a
department record students, their module results across the years of a programme, and
then runs each student through a rules-based **classification engine** that determines
their final degree outcome (1st, 2:1, 2:2, 3rd) — including resit caps, eligibility
checks and borderline flagging — with a full rationale for every decision.

## What it does

- **Role-based access** — an *Admin* manages programmes, classification officers and
  their programme assignments; *Officers* manage the students on the programmes they are
  assigned to.
- **Students & modules** — record students against a programme and capture their module
  marks, credits and resit status per year of study.
- **Classification engine** — applies each programme's weighting and resit rules to
  calculate the degree classification, flags borderline cases, and records a transparent
  rationale log for auditing.
- **Override & confirm workflow** — officers can override a calculated result with a
  documented reason and confirm final outcomes ready for an exam board.

## Tech stack

- **Node.js** (ES modules) with two **Express** servers — a presentation/web tier and an
  internal REST API tier — following an **MVC** structure (routes → controllers → models).
- **EJS** server-side templating with **Bootstrap** and **Chart.js**.
- **PostgreSQL** for the data tier.
- **Docker** for containerised deployment and **GitHub Actions** for CI/CD.

## Live demo

🚧 *A hosted live demo is coming soon — the URL will be added here once deployed.*

Demo credentials (for the live environment):

| Role    | Email                   | Password    |
|---------|-------------------------|-------------|
| Admin   | admin@hedclass.demo     | admin123    |
| Officer | officer1@hedclass.demo  | officer123  |
| Officer | officer2@hedclass.demo  | officer456  |

The demo data includes multiple programmes, students and module results that exercise a
range of classification scenarios.
