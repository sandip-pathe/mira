# Architecting Mira v0.02 AI Wellbeing Companion

**Created:** 10/14/2026 1:54:08  
**Updated:** 10/14/2026 1:54:08  
**Exported:** 10/14/2026 12:32:57  
**Link:** [https://gemini.google.com/u/2/app/382ca2decd8090f2](https://gemini.google.com/u/2/app/382ca2decd8090f2)  

## User:

> 10/14/2026 1:54:08

"""
Mira is an AI-powered everyday wellbeing companion for difficult but non-clinical moments: overwhelm, burnout, loneliness, rejection, rumination, difficulty focusing, or simply needing to unload something. The core idea is not “AI therapist” and not “ChatGPT with a mental-health prompt.” The question is whether AI can understand what kind of support someone needs in that moment, respond appropriately, help them do something useful when needed, learn whether it worked, and carry that context forward with consent.
The product loop is: the person talks or journals → Mira understands the situation and what is still unclear → decides whether to keep listening, clarify, offer a small action, or suggest human support → asks permission before intervening → guides one bounded action → checks whether it helped → optionally remembers the useful outcome for later. The long-term product thesis is: don’t just talk to people; help them through the moment, learn what helped, and be more useful next time.
Mira has three visible surfaces. Talk is realtime voice, designed around a support moment rather than chat bubbles: hold to talk, release to respond, interrupt naturally, and keep the transcript secondary. Journal is private by default, with text or voice journaling; only explicitly approved context can become persistent memory. Actions are short guided exercises, but in v0.02 they should increasingly appear inside the moment rather than feeling like a separate catalogue. The current burnout/focus story uses simple neutral actions such as a pause or task reset, with the actual intervention library intentionally left for later clinician input.
Underneath is the important part: a support-policy/orchestration layer. Realtime Mira handles natural conversation, but the system tracks structured state such as what happened, what the person seems to need, what Mira still does not understand, what has helped before, and whether the next move should be to listen, clarify, act, check the outcome, or escalate. This is where Mira becomes more interesting than generic chat. The AI should understand first, intervene second. It may infer that an action could help, but it asks permission before offering the two bounded choices.
Privacy and safety are part of the product, not later compliance work. Journal entries stay private unless the person approves an excerpt for reuse. Mira should identify when remembered context is being used, and revocation prevents future retrieval or reinjection. For the demo, human-support boundaries are deliberately conservative; Mira does not diagnose or claim treatment. The clinical policy, intervention catalogue, escalation rules, and safety boundaries are explicitly things to refine with Mpower clinicians rather than invent independently.
Technically, the first build already proved a lot: React Native/Expo on Android, FastAPI, OpenAI Realtime/WebRTC, push-to-talk, interruption, relayed tool calls, Journal, consented memory, Actions, and feedback all work. That means the main uncertainty has shifted from “can we build it?” to “can this interaction model actually be more useful than ordinary AI chat?” v0.02 therefore should not add ten features. It should make one difficult moment feel exceptional: Mira understands the person, chooses the right mode of support, guides something concrete, checks whether it helped, and uses that outcome intelligently later.
Mpower’s role is not simply distribution. They potentially provide the part Mira cannot manufacture from engineering alone: domain expertise, clinically appropriate interventions, escalation policy, safety boundaries, and real-world users. The pitch is therefore not “I built your new mental-health app.” It is closer to: “Here is a working vision of what an intelligent support layer could feel like. I can build the technology; you understand the people, interventions, and clinical boundaries. Is there something here worth testing together?”
The standard for Mira right now is neither “clinically proven” nor “beautiful demo.” It is: is there a believable path from today’s AI capability to something that genuinely helps a person through a difficult moment, and are the remaining unknowns the kind that users, iteration, and domain experts can answer?
"""
"""
Mira is an AI mental-support system for everyday distress—stress, rejection, burnout, overthinking, loneliness, uncertainty—not severe clinical cases.
The core hypothesis is simple: people often do not need the “perfect” intervention. They need something relevant, safe, doable, and suitable for them right now.
Mira has two main layers:
- Decision layer: AI understands the current situation using conversation, history, preferences, context, time, energy, and past responses. It decides whether the person needs listening, a self-help intervention, human support, or no action.
- Intervention layer: a curated library of tools derived from psychology, behavioral science, therapists, and existing research—journaling, grounding, breathing, reflection, reframing, sleep wind-down, small behavioral actions, social support prompts, etc.
A more advanced version could use a multi-model architecture: one model generates 2–3 appropriate interventions; a specialized decision model such as Jev ranks them and picks the one most likely to help and actually be completed.
The system does not try to diagnose the person, solve mental health, or always choose the theoretically optimal treatment. It operates under uncertainty. Multiple interventions may work. The goal is simply to increase the probability of a useful next step.
Over time, Mira learns: what situations occur repeatedly, what the user dislikes, what they actually complete, what appears useful, and when they prefer to just talk. That creates continuity and personalization, rather than restarting from zero every conversation.
The important product philosophy is that sometimes the correct intervention is no intervention. Listening may be enough. Sometimes a friend or therapist is better. Sometimes the system should escalate rather than attempt to help itself.
The technical thesis is therefore not “build a more empathetic chatbot.” It is:
Can AI reliably understand an everyday difficult moment and route a person toward an appropriate, low-friction form of support?
And the research hypothesis is testable: compare listening vs intervention, generic vs personalized recommendations, single-model vs multi-model decisions, and—most importantly—whether people actually use the suggested action and find it helpful.
So Mira is ultimately less of a chatbot and more of an adaptive decision layer over a toolbox for human well-being.
""" 

So, this is Mira is something I'm building for mental health. I have pasted two chunks of text. The first one describing what Mira is, what was the initial hypothesis and why we are working on Mira and what we are actually building. And the second is the summary of the brainstorm session I had with ChatGPT about the Mira and what should it exactly do or how should we tackle the metal health problem. Based on these two things, I want you to use your all the capabilities and everything and figure out what it is or like figure out what exactly should we do. Maybe you could use some research tool or some skill, some of your skills to do analysis of this thing or do some founder kind of product help. Yeah, that kind of stuff.

## Gemini:

> 10/14/2026 1:54:08

> **Thinking steps**
>
> **Defining the Project Scope**
>
> I'm now zeroing in on defining the precise project scope. I am analyzing the user's intent to build "Mira," an AI companion, and have begun identifying the key areas of concern: overwhelm, burnout, rejection, and rumination. I am still determining the best way to categorize these non-clinical moments for Mira's application.
>
> **Analyzing the Requirements**
>
> I'm now diving deeper into the user's provided materials. The vision document and brainstorming summary give a rich foundation for understanding "Mira." I'm parsing the two-layer architecture, focusing on the decision and intervention layers, and considering how multi-model ranking and learning over time will play a role. I am starting to form initial concepts about what "making one difficult moment feel exceptional" might entail.
>
> **Assessing Resource Suitability**
>
> I'm now evaluating the available tools and skills. I've confirmed `google:search` is viable for up-to-date information, including the mental health AI companion landscape. I'm focusing on the applicability of `widget_caddy:search_widget` in an educational/explanatory context. I have also verified that `system:wellness_coach` is not relevant because the user is not explicitly seeking collaborative coaching.
>
> **Analyzing Market Shifts**
>
> The initial search results point to a significant shift. I'm seeing that Woebot's consumer app shut down in June 2025, suggesting a challenging consumer market. It seems that the economics aren't working against free, generalized chatbots like ChatGPT.
>
> **Evaluating AI Mental Health**
>
> I'm now focusing on the evolving landscape of AI in mental health. I see that companies like Ash are attempting to navigate restrictions, pivoting toward enterprise support models. Meanwhile, Wysa, Limbic, and others are finding success as supportive infrastructure within broader clinical ecosystems. I've identified two critical failure modes: the rigid, scripted approach and the unstructured LLM companions prone to validation and dependency issues.
>
> **Defining Mira's Core**
>
> I'm now zeroing in on Mpower's needs and identifying Mira's purpose. It's clear: they don't require another chatbot, and pretending to be a psychiatrist isn't the solution. They need support for everyday distress, like exam stress and loneliness, where campus counselors are overwhelmed or stigma is present. The solution has been synthesized, and it seems **Just-In-Time Adaptive Intervention (JITAI) meets Realtime Voice Orchestration** is the right path forward.
>
> **Refining Solution Architecture**
>
> My focus is sharpening on Mira's core architectural approach. I've named the solution now: **JITAI (Just-In-Time Adaptive Intervention) powered by a Contextual Bandit/Decision Policy**, running over a conversational LLM interface. This is crucial because raw LLMs fall short due to "sycophantic rumination," while traditional CBT apps feel forced. The aim is a fluid interface that is structured at the right moments, with bounded micro-actions, clinician vetted. Finally, it seems building a multi-model ranking engine isn't the current priority, and a deterministic/structured Policy State Machine should be built first.
>
> **Prioritizing Readiness Metrics**
>
> I'm now zeroing in on defining the "Readiness to Shift" metric, which is crucial for Mira's core functionality. I've abandoned the separate ranking model approach for now, as I have no proprietary data. Instead, I'm integrating a State & Readiness Rubric for structured outputs. My focus is now on the timing of intervention transitions and understanding when to shift from active listening to asking permission, emphasizing the B2B2C model.
>
> **Mapping Architecture Layers**
>
> I am now structuring the architecture, focusing on a "Dual-Loop" Engine for Mira. I am linking the existing React Native/Expo, FastAPI, OpenAI Realtime WebRTC, and relayed tool calls to the Decision and Intervention layers. The first "Fast Voice Loop" will be implemented with OpenAI Realtime WebRTC for natural interactions, while forbidding the voice model from inventing. I'm positioning Mira as the 24/7 front door and companion to Mpower Cells, specifically addressing distress like exam burnout.
>
> **Orchestrating Policy Layers**
>
> I'm structuring the two key loops within the architecture. Loop 1 focuses on Fast Voice using OpenAI Realtime WebRTC for natural interaction, strictly forbidding the voice model from inventing or giving unsolicited advice. Loop 2, the Slow Policy Loop, operates in the background via FastAPI, updating a lightweight JSON state object with distress types, energy levels, clarity scores, repetition indices, and policy moves. Finally, I'm thinking of adding interactive visualizations to the end of the prose so the founder can interactively inspect Mira's support-policy orchestration.
>
> **Designing Demo Scenarios**
>
> I'm now crafting contrasting scenarios for the Mpower demo to showcase the Decision Layer's intelligence. For instance, in a high-arousal scenario, Mira will *actively listen* after rejection, validate feelings without toxic positivity, and *limit* any forced exercise. In contrast, for task paralysis and burnout, Mira will offer a 90-second reset, with bounded micro-actions and clinician-vetted guidance, as a real alternative.

Mira is not an AI therapist and not an empathetic wrapper around ChatGPT—it is a **Just-In-Time Adaptive Intervention (JITAI) engine** disguised as a voice-first companion. 

In behavioral science, what you arrived at across those two documents has a specific name: **state-aware routing under uncertainty**. When you combine your v0.01 technical proof (Text 1) with your decision-layer brainstorm (Text 2), a clear, defensible thesis emerges—along with a few architectural traps you need to avoid in v0.02.

---

## 1. The Core Insight: Why Current Mental Health AI Fails (And Where Mira Wins)

The AI mental health landscape in 2025–2026 has split into two broken extremes:

| Archetype | Examples | Why It Fails in a Difficult Moment |
| :--- | :--- | :--- |
| **Scripted CBT Chatbots** | Early Wysa, Woebot (shut down its consumer app in June 2025) | **Too rigid.** Clinically safe and predictable, but when someone is burned out or spiraling at 11 PM, clicking through a rigid cognitive-reframing worksheet feels like homework. |
| **Raw LLM Companions** | ChatGPT, Character.AI, Replika | **No orchestration policy.** Great at sounding warm, terrible at knowing *what to do*. They fall into two traps: **premature problem-solving** (dumping a 7-bullet list of generic advice when you just needed to vent) or **sycophantic rumination** (endlessly validating a user's spiral for 45 minutes without helping them break the loop). |

**Mira’s Wedge:** You are combining **fluid voice/journal intake** (so the user doesn't feel like they are filling out a clinical form) with a **structured policy state machine** (so the AI knows when to shut up and listen, when to ask permission to pivot, and when to guide one tiny, concrete action).

---

## 2. Stress-Testing Your Brainstorm: 3 Founder Course-Corrections

Before writing a line of v0.02 code, here is an honest critique of what works and what needs sharpening between your two texts:

### A. Kill the "Multi-Model Ranking Engine (Jev)" for Now—Build a Deterministic State Rubric Instead
In your second text, you floated having one model generate 2–3 interventions and a specialized model ("Jev") rank them based on completion probability. **Do not build or train a separate ranking model in v0.02.** 
* **Why:** Contextual bandits and ranking models require thousands of logged `(context, intervention, outcome)` tuples to beat a well-crafted heuristic. Right now, you have a cold-start problem.
* **What to do instead:** Use a **Dual-Loop Architecture** on your existing stack. Keep OpenAI Realtime handling the voice warmth, while a background FastAPI state-tracker runs a structured JSON rubric after every turn to set the policy state. Let clinician-designed rules govern the routing first; collect outcome logs now so you can train a learned policy model at v1.0.

### B. The Hardest Problem Isn't *Which* Action to Pick—It's *Timing the Permission Gate*
Your second text says: *"Multiple interventions may work. The goal is simply to increase the probability of a useful next step."* That is 100% right. Whether someone does box breathing or a 5-4-3-2-1 grounding exercise matters very little. What matters enormously is **not offering an exercise 45 seconds into a vent session.**
* If someone just got rejected from a job, and Mira says *"Would you like to try a 2-minute reframing exercise?"* on turn 2, trust is broken.
* Your Decision Layer needs an explicit **"Readiness-to-Shift" detector**: Mira should only move from `LISTEN` to `ASK_PERMISSION` when either (1) emotional velocity slows down, (2) the user explicitly asks *"What do I do?"*, or (3) the user hits a **rumination loop** (repeating the same stressor 3+ times without relief).

### C. Position Mira Around Mpower’s Real Bottleneck (B2B2C Campus & Workplace Triage)
Look at how Mpower (Aditya Birla Education Trust) actually operates: they run **Mpower – The Centre** (clinical psychiatry/therapy), **The Mpower Cell** (embedded counseling units on campuses like BITS Pilani, Goa, Hyderabad, and Kalyan), and massive **Youth & Corporate Outreach programs**.
* Mpower’s problem is not a lack of clinical capability; it is **the 11 PM gap and the stigma barrier**. On a college campus or in a corporate workforce, 85% of distress moments are non-clinical overwhelm, academic/work burnout, relationship rejection, or task paralysis. Students either suffer in silence because of stigma, or flood campus counselors with sub-clinical stress.
* **Your pitch to Mpower:** Mira is the **pre-clinical & between-session support layer** for Mpower's ecosystem. It handles the 11 PM overwhelm using Mpower-vetted micro-interventions, logs what works with strict consent, and acts as an intelligent, low-stigma bridge into an Mpower Cell or clinician when human support is actually needed.

---

## 3. The v0.02 Technical & Product Architecture: The "Dual-Loop" Engine

You already have React Native/Expo, FastAPI, OpenAI Realtime/WebRTC, and relayed tool calls working. Do not add new surfaces in v0.02. Instead, split Mira’s brain into a **Fast Conversational Loop** and a **Slow Orchestration Loop**:

1. **The Fast Loop (OpenAI Realtime Voice):**
   * **Job:** Hold space, reflect emotion concisely, maintain natural push-to-talk pacing, and execute whatever mode the Slow Loop dictates.
   * **Hard Constraint:** The Realtime prompt is *explicitly forbidden* from giving unsolicited advice, diagnosing, or inventing coping exercises on its own.
2. **The Slow Loop (FastAPI Support-Policy State Machine):**
   * **Job:** On every user turn, evaluate the transcript + consented memory and update a structured `SupportState` object that dictates Mira's next system instruction:
     * `moment_type`: `overwhelm | rumination | rejection | loneliness | task_paralysis | unclear`
     * `arousal_state`: `venting_hot | depleted_flat | looping | ready_for_shift`
     * `missing_context`: What 1 thing does Mira still need to know before acting?
     * `next_policy_move`: `LISTEN_ONLY` → `CLARIFY_NEED` → `ASK_PERMISSION` → `GUIDE_IN_MOMENT_ACTION` → `CHECK_OUTCOME` → `ESCALATE_HUMAN`
3. **The Consented Memory Ledger (Post-Session):**
   * Instead of saving raw chat transcripts into RAG (which feels creepy and degrades retrieval quality), save **Structured Outcome Cards** that the user explicitly approves with one tap:
     * *Trigger:* "Late-night task paralysis before a deadline"
     * *What Failed:* "Breathing exercises (felt impatient)"
     * *What Worked:* "2-minute 'ugly first draft' timer reset"

---

## 4. How to Nail v0.02: The "Two-Path Contrast" Demo for Mpower

To prove your thesis—*that an orchestrated support layer beats ordinary AI chat*—design v0.02 around **one persona experiencing two different moments**. In a 5-minute demo with Mpower clinicians, show them how Mira behaves differently based on state:

* **Demo Path 1: The "No-Intervention" Moment (Rejection / Loneliness)**
  * *User state:* Just got rejected after a final-round interview; feeling embarrassed and defeated.
  * *What ChatGPT does:* Immediately outputs 5 cheerful tips on resilience and networking.
  * *What Mira v0.02 does:* Detects high acute sting (`arousal_state: venting_hot`). Policy locks into `LISTEN_ONLY` and `CLARIFY_NEED`. Mira reflects the disappointment in two warm sentences, asks if they want to just sit with it or talk through what happened, and **deliberately does not offer a tool**.
* **Demo Path 2: The "In-Moment Action" Loop (Burnout / Task Paralysis)**
  * *User state:* Staring at work at 9 PM, brain fog, looping on how behind they are.
  * *What Mira v0.02 does:* 
    1. **Memory Recall (Transparent):** *"I remember last week when work piled up, you mentioned big to-do lists made you freeze more."* (Shows badge: `Using approved memory from Oct 8`).
    2. **Permission Gate:** *"Want to just unload for another minute, or should we try a 90-second reset to clear the noise?"*
    3. **Bounded Choice (2 Options):** Offers a **Physiological Sigh / Pause** (if exhausted) vs. a **Single-Tab Micro-Start** (if stuck on action).
    4. **In-Conversation Guidance:** Guides the 60-second action directly inside the voice flow—no kicking the user out to a separate "Catalogue" tab.
    5. **Outcome Check & Memory Write:** *"Did that lower the static a bit, or not really?"* → User says yes → Mira prompts: *"Save '90-second micro-start works for evening task freeze' to your toolkit?"*

---

## 5. What to Ask Mpower (Your Clinical Co-Design Agenda)

When you walk into the room with Mpower, don't ask them *"Do you like the app?"* Hand them a concrete **Clinical Co-Design Charter** with four specific gaps only they can fill:

1. **The Taxonomy of Everyday Moments:** *"We are targeting 6 non-clinical states: Overwhelm, Rumination, Rejection, Loneliness, Burnout, and Focus Paralysis. From your Mpower Cell campus and workplace data, which 2 of these show up most frequently, and what subtle red flags mean Mira should immediately stop and escalate?"*
2. **The "Permission-to-Shift" Rules:** *"When one of your counselors is listening to someone vent, what verbal or pacing cues tell the counselor that the person is ready to transition from venting to a grounding or behavioral exercise?"*
3. **Vetting the Micro-Intervention Library:** *"For v0.02, we need 3 ultra-short (under 2 minutes), voice-guidable interventions per state that cannot cause harm if done alone. Which evidence-based micro-tools do your clinicians trust most?"*
4. **Escalation & Warm Handoff Protocol:** *"When someone crosses from everyday burnout into clinical distress, what should a warm handoff to Mpower—The Centre, an Mpower Cell, or their 1800-120-820050 helpline—actually look like inside the product?"*

---

## Interactive Architecture: Mira v0.02 Support-Policy State Machine

Use the interactive diagram below to inspect how Mira’s **Decision Layer** routes a user from raw voice/journal input through state evaluation, the permission gate, bounded actions, and consented memory—including how different emotional states trigger completely different support paths:

<GenerateWidget component_placeholder_id="im_17f389f010bf6243" height="600px" type="inline_visualization">
<skills>diagram</skills>

**Idea:** An interactive state-machine and orchestration architecture explorer for Mira v0.02 showing how the Decision Layer evaluates user context and routes between listening, clarifying, bounded interventions, outcome checking, and clinical escalation.
**Visual type:** Interactive multi-stage system architecture and decision flow diagram with scenario toggles and step-through inspection.
**Data specification:**
- **Data structure:** Directed state graph with 6 core orchestration nodes (`IntakeSurface`, `StateEstimator`, `PolicyRouter`, `PermissionGate`, `InterventionEngine`, `OutcomeAndMemory`) plus 3 scenario presets (`Scenario 1: Task Paralysis & Burnout`, `Scenario 2: Acute Rejection (Listen Only)`, `Scenario 3: Clinical Red Flag (Escalate)`).
- **Initial values:**
  - Node 1 (`IntakeSurface`): Talk (Realtime WebRTC Push-to-Talk) & Private Journal. Captures voice prosody/pacing, transcript turn, and explicit approved memory tags.
  - Node 2 (`StateEstimator`): FastAPI background evaluator computing `distress_type`, `arousal_level` (0.0 to 1.0), `clarity_score` (0.0 to 1.0), and `rumination_loop_count`.
  - Node 3 (`PolicyRouter`): Decision policy selecting between 4 branches: `KEEP_LISTENING` (if clarity less than 0.6 or arousal greater than 0.8), `ASK_PERMISSION` (if rumination loop detected or user ready for shift), `ESCALATE_MPOWER` (if clinical/crisis boundary triggered).
  - Node 4 (`PermissionGate`): Asks explicit user consent before intervening and presents at most 2 bounded, low-friction choices tailored to energy level.
  - Node 5 (`InterventionEngine`): In-conversation guided micro-action (60 to 120 seconds, such as Physiological Pause or Task Reset) curated with Mpower clinicians.
  - Node 6 (`OutcomeAndMemory`): Checks subjective helpfulness ("Did that help, or not really?") and writes an explicit, revocable Outcome Card to the user's memory ledger.
- **Mapping:** Nodes map to clickable architectural blocks arranged left-to-right across the product loop; active scenario highlights the specific path, state JSON payload, and clinician boundary rules at each node.
**User controls:** Scenario selector toggle (`Task Paralysis Loop`, `Acute Rejection - Listen Only`, `Clinical Escalation Boundary`) and `Prev` / `Next` step buttons to walk through a live turn-by-turn state transition.
**Interactivity:** Clicking any node or stepping through stages reveals the live structured JSON state payload (`moment_type`, `arousal_state`, `policy_move`, `memory_used`) and contrasts Mira's behavior against standard ChatGPT.
**Animation:** Smooth highlight transitions along the active routing path as the user steps through the support loop or switches scenarios.
</GenerateWidget>

<ElicitationsGroup message="Where should we go next to build out v0.02?">
  <Elicitation label="Design the exact FastAPI JSON schema and system prompts" query="Write the exact FastAPI structured output JSON schema and dual-loop system prompts for Mira's State Estimator and Realtime Voice model in v0.02."/>
  <Elicitation label="Draft the 1-page partnership pitch memo for Mpower" query="Draft a sharp, founder-to-clinician 1-page partnership memo and demo script tailored specifically for Mpower's leadership and clinical team."/>
  <Elicitation label="Design the A/B research protocol to test the hypothesis" query="Design a concrete, lightweight research and evaluation protocol to test Mira's core hypothesis (listening vs. bounded intervention and completion rates) with early pilot users."/>
</ElicitationsGroup>

Powered by Gemini Exporter (https://www.ai-chat-exporter.com)
