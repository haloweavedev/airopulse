# Saige — Product Summary (from internal docs)

**Built by Airodental**

---

## What Saige is

Saige is the team training and operational coaching module inside AiroDental. It turns a dental office's SOPs, scripts, policies, and tribal knowledge into a living, searchable system that answers questions, guides decisions, and reinforces consistent team behavior.

It is not a generic chatbot. It is not a document dump. It is a role-aware coaching layer that gives staff approved answers and scripts in real time, trains new hires through structured learning paths, and gives managers visibility into what's breaking.

**One-line definition:**
Saige turns an office's SOPs, scripts, and policies into role-based answers, learning paths, and measurable competency — while protecting source content and refusing to guess when the truth isn't known.

---

## The problem Saige solves

Dental offices suffer from the same operational failures over and over:

- Docs exist but nobody uses them consistently
- Onboarding is too dependent on one person (usually the office manager)
- People get thrown in because the office is too busy to train properly
- No clear role-based pathway for new hires
- No tracking after day 1 / week 1 / first 30 days
- No way to know if people watched, read, or learned anything
- Too much information buried in Google Drive or binders
- Implementation dies when staffing changes
- Staff say different things to patients about insurance, pricing, scheduling, and policies
- Managers get interrupted constantly for the same questions

Saige exists to make a dental office **consistent on purpose** — not by accident, not by heroics.

---

## Who Saige is for

| Role | What they get from Saige |
|---|---|
| Front Desk / Patient Care Coordinator | Approved scripts, scheduling rules, insurance language, escalation criteria — in real time during calls |
| Insurance / Billing | Disclaimer language, estimate explanations, collections scripts, denial handling |
| Dental Assistants | Room turnover checklists, handoff workflows, post-op call scripts |
| Hygienists | Perio charting standards, SRP scripting, patient experience standards |
| Office Manager / Leadership | Analytics, training oversight, policy conflict alerts, content gap reports |

Role-based access is non-negotiable. The same question asked by different roles can produce different guidance.

---

## Two modes of operation

**Reactive — "Ask Saige"**
Staff ask a real question during work. Saige answers with:
- **Say this** — approved phrasing, 2–5 sentences
- **Do this** — short checklist, 3–7 bullets
- **Escalate if** — criteria + who to route to
- **Notes / Exceptions** — optional, collapsible

**Proactive — Learning Paths**
Saige doesn't wait for questions. It leads new hires through structured training:
- Role-based onboarding (Week 1, Week 2)
- Micro-lessons (3–7 minutes each)
- Checks (multiple choice, short answer, text roleplay)
- Reinforcement and refreshers

Q&A is reactive. Learning paths are proactive. Both reinforce each other.

---

## Content model (Trainual-inspired, dental-specific)

Saige mirrors the Trainual hierarchy:

**Subject → Topic → Step**

Dental examples:
- Subject: New Patient Phone Handling
  - Topic: Insurance questions
    - Step: "How to answer out-of-network"
    - Step: "How to explain estimates"
    - Step: "When to escalate"
- Subject: Clinical Assistant Setup
  - Topic: Room turnover standards
  - Topic: Sterilization flow

Every Subject has an **owner** responsible for keeping it updated. Ownership prevents content rot.

---

## Structured objects (not just documents)

Saige treats these as first-class objects, not buried text inside PDFs:

- **Scripts** — scenario, role, "say this," "do not say," escalation criteria
- **Policies** — versioned, owned, publishable, with rules and thresholds
- **Workflows / Checklists** — step lists with role tags and exception triggers
- **Learning Paths** — modules, lessons, checks, assignments, due dates
- **Gaps** — "no answer found" queries, low-confidence responses, policy conflicts

This structured layer is what separates Saige from a document vault.

---

## Data pipeline

1. **Ingest** — admin uploads PDFs, DOCX, TXT, transcripts, or pastes text
2. **Clean** — remove junk headers/footers, fix formatting, normalize
3. **Chunk** — small enough for precision, large enough for context
4. **Tag** — role, topic, priority, effective date, version
5. **Index** — hybrid retrieval (vector embeddings + keyword search)
6. **Extract** — Saige proposes candidate scripts, policies, workflows for admin approval

Tenant isolation is absolute. One practice cannot retrieve another practice's content.

---

## Guardrails (non-negotiable)

- **No raw source access** — staff cannot view, export, or copy source documents
- **Paraphrase enforcement** — no long verbatim output from source content
- **Refusal patterns** — "show me the document," "paste the policy," "print the manual" are all refused
- **Identifier scrubbing** — staff names, phone numbers, internal IDs scrubbed during ingestion
- **Confidence discipline** — high/medium/low confidence levels with required behaviors:
  - High: answer + cite label
  - Medium: ask clarifying question, then answer
  - Low: refuse certainty, provide safe generic script, route to escalation, log gap
- **No clinical advice** — Saige stays in the operational lane, never diagnoses or recommends treatment
- **No insurance guarantees** — Saige never promises coverage or exact pricing

**Golden rule:** If Saige cannot cite an active internal policy/script/workflow, it cannot speak like it's certain.

---

## Analytics (the "Core 6")

1. Training completion by role (percent complete, overdue, must-pass failures)
2. Most asked questions by role (weekly top 10, trending)
3. Content gaps ("no answer found" queries with frequency)
4. Most missed check questions (failure rate by module)
5. Confidence distribution (percent high/medium/low by role)
6. Policy conflict alerts (detected conflicts, resolved vs unresolved)

Plus a weekly auto-generated **"Office Friction Report"** showing top friction points, training progress, and recommended actions.

---

## Admin design philosophy

A manager should be able to run Saige in **10 minutes a week**:

**Weekly:**
- Review friction report
- Resolve top 3 gaps (create a script, clarify a policy, retag content)
- Check overdue training list
- Nudge 1–2 people if needed

**Monthly:**
- Review top missed checks
- Update learning paths based on failures
- Deprecate outdated content

If admin is a chore, it dies. Saige makes maintenance lightweight and guided.

---

## Pricing direction

- **Saige Core** (per seat) — Q&A + learning paths + basic analytics
- **Saige Pro** (per seat) — reinforcement engine + deeper analytics + policy rollout + roleplay scoring
- **Done-for-you onboarding** (one-time fee) — intake call, content cleanup, starter paths built

Saige is value-expensive but usage-cheap (text, not voice). Seat-based pricing scales with team size.

Can be bundled with Laine but should also be purchasable standalone.

---

## Beta group

12 confirmed dental offices with strong variety:
- **Office sizes:** 4-person to 30-person teams
- **Complexity:** single-location to 5-location groups
- **Maturity:** paper manuals and chaos → strong SOPs with poor implementation
- **PMS:** heavy Open Dental representation
- **Feedback commitment:** weekly async feedback + weekly 30-min screenshare calls
- **Incentive:** lifetime free access for engaged participants

Common pain points across all beta offices:
- Docs exist but nobody follows them
- Onboarding depends on one person
- No tracking or accountability
- Google Drive / binder chaos
- Want something dental-specific, not generic LMS
- Implementation breaks when staff turns over

---

## Roadmap

| Phase | Timeline | Goal |
|---|---|---|
| Phase 1 | First 30 days | **Trust** — reliable Q&A, guardrails, basic learning paths, guided home screen |
| Phase 2 | 60 days | **Habit** — reinforcement, gaps inbox, analytics, policy versioning, proactive nudges |
| Phase 3 | 90 days | **Visibility** — competency heatmaps, expanded scenario library, multi-location scaffolding |
| Beyond | Q2–Q4 | Voice roleplay exams, manager playbooks, content lifecycle automation, multi-location standardization |

**Milestone names:**
1. Trust Engine Live
2. Training Habit
3. Manager Brain
4. Multi-location Ready

---

## Competitors to mine (AiroPulse targets)

- **Trainual** — the direct baseline Saige is modeled after
- **usewhale.io** — SOP/training tool
- **Front Office Rocks** — dental-specific training (video-based)
- Generic LMS platforms that dental offices try and abandon
- Consultants and coaching firms dental offices hire

---

## Key strategic insight for AiroPulse

The Saige docs already contain massive internal clarity about what to build. What AiroPulse adds is **external signal** — real user complaints about Trainual and competitors that confirm, challenge, or expand the roadmap. The playbook:

1. Mine Reddit for Trainual complaints, SOP tool frustrations, dental office training pain
2. Map extracted insights against what Saige already plans to build
3. Find gaps — things users want that Saige hasn't considered yet
4. Find validation — things users complain about that Saige already solves
5. Use both to prioritize and sharpen the product
