# Student Developer Slide Patterns

A pattern catalog for student developer presentations: hackathon final pitches, capstone demos, developer club showcases, GitHub project presentations, and side-project pitches.

Each `section.slide` in a deck declares which pattern it implements via `data-pattern` (see [HTML_DECK_CONTRACT.md](HTML_DECK_CONTRACT.md)). Patterns keep decks structurally predictable — for the audience, and for the AI tools editing them.

**Typical 5-minute demo deck (8–10 slides):** title-cover → problem-context → target-users → solution-overview → demo-flow → architecture-overview → implementation-highlights → impact-results → next-steps → closing-share.

---

## 1. title-cover

`data-pattern="title-cover"`

**When to use:** First slide of every deck.

**Required content:** Project name; one-line description that a non-teammate understands; presenter/team name; event or context.

**Optional content:** Date, logo or mark, repo/demo link teaser.

**Common mistakes:** A clever name with no explanation of what the project does; cramming the full pitch onto the cover; listing every team member's full details here instead of on the team slide.

---

## 2. problem-context

`data-pattern="problem-context"`

**When to use:** Right after the cover. The audience must feel the problem before seeing the solution.

**Required content:** The specific problem; who experiences it; why existing options fall short.

**Optional content:** A concrete scenario or anecdote; a scoping statement ("we focus on X, not Y").

**Common mistakes:** Stating a technology instead of a problem ("there's no app that uses X"); a problem so broad no demo could address it; citing made-up statistics to sound rigorous — a vivid concrete scenario beats a fake number.

---

## 3. target-users

`data-pattern="target-users"`

**When to use:** When the audience might not be the user — judges, professors, recruiters — and needs to know who is.

**Required content:** Primary user group, concretely described; the moment/context in which they'd use the product.

**Optional content:** Secondary users; what the primary user does today instead (the real competitor).

**Common mistakes:** "Everyone can use this"; describing users as demographics instead of situations; skipping this slide when the judges are visibly not the target user.

---

## 4. solution-overview

`data-pattern="solution-overview"`

**When to use:** After the problem is established. The "what we built" slide.

**Required content:** What the product is (one sentence); the 2–4 capabilities that address the stated problem; what makes the approach different.

**Optional content:** A single product screenshot; positioning against the current alternative.

**Common mistakes:** A feature laundry list with no connection to the problem slide; describing the roadmap instead of what exists; explaining implementation here (that's what architecture and highlights slides are for).

---

## 5. demo-flow

`data-pattern="demo-flow"`

**When to use:** Every deck with a live demo — and as the demo's stand-in if the live demo fails.

**Required content:** The demo scenario as 3–5 numbered steps, each with the action and what the audience should notice.

**Optional content:** Screenshots per step; a fallback note ("if offline, we show the recorded run").

**Common mistakes:** "Now I'll just show it" with no structure — audiences lose the thread the moment anything stalls; demoing features that don't relate to the pitched problem; no fallback plan.

---

## 6. architecture-overview

`data-pattern="architecture-overview"`

**When to use:** Technical audiences (hackathon judges, capstone panels, club demos) who need to see the system is real.

**Required content:** Main components and how data/requests flow between them; the core stack, named briefly.

**Optional content:** One key architectural decision and why; what is built vs. what is a stub/mock (be honest — reviewers ask).

**Common mistakes:** A diagram with ten boxes explained in thirty seconds; logo-cloud slides (stack logos ≠ architecture); hiding which parts are mocked, then losing credibility in Q&A.

---

## 7. implementation-highlights

`data-pattern="implementation-highlights"`

**When to use:** When specific technical work deserves credit — usually the difference between "used an API" and "solved a problem."

**Required content:** 1–3 concrete technical challenges and how you solved them.

**Optional content:** A short code or algorithm sketch; a trade-off you consciously made; what you'd do differently.

**Common mistakes:** Listing everything you did instead of the 1–3 things that were hard; highlights that restate the architecture slide; claiming credit for what a library did out of the box.

---

## 8. impact-results

`data-pattern="impact-results"`

**When to use:** When you have evidence the thing works: test results, benchmark numbers, pilot feedback, completed scope.

**Required content:** What you measured or observed, and what it shows. **Every number must be real or explicitly labeled as example/demo data** — never present fabricated numbers as results.

**Optional content:** Before/after comparison; qualitative feedback quotes (with permission); honest limitations of the evidence.

**Common mistakes:** Inventing traction ("500 users in week one" of a 24-hour-old project); vanity metrics with no link to the problem; skipping the slide entirely when even "all 12 planned test cases pass" is legitimate evidence.

---

## 9. next-steps

`data-pattern="next-steps"`

**When to use:** Near the end. Shows the team knows what the project needs next — judges read this as maturity.

**Required content:** 2–4 concrete next steps, ordered by priority.

**Optional content:** Known limitations being addressed; what you'd need to get there (time, data, users).

**Common mistakes:** A fantasy roadmap ("then we monetize globally"); vague steps ("improve the app"); listing so many items it reads as "nothing is finished."

---

## 10. team-contribution

`data-pattern="team-contribution"`

**When to use:** Team projects — mandatory in most capstone and club settings; useful in hackathons when judges score individuals.

**Required content:** Each member and what they actually built/did, specifically.

**Optional content:** Contact/GitHub handles; how the team divided decisions, not just tasks.

**Common mistakes:** Identical vague roles ("worked on backend" ×3); listing titles instead of contributions; letting one member's work silently absorb the others'.

---

## 11. closing-share

`data-pattern="closing-share"`

**When to use:** Last slide. Stays on screen during Q&A — make it work for you.

**Required content:** Repo and/or demo link (written out, not just linked); a one-line reminder of the core message; how to reach the team.

**Optional content:** A QR code image supplied by the author; a specific ask ("try it and file issues", "we're looking for pilot users").

**Common mistakes:** "Thank you" with nothing else — the highest-attention moment of the talk, wasted; links too small to read from the back of the room; a generic ask ("check it out") instead of a specific one.

---

## Using patterns

- A deck doesn't need every pattern; pick what the brief supports and the time limit allows.
- Order can flex (e.g. `target-users` may merge into `problem-context` for short pitches), but title-cover opens and closing-share closes.
- Custom patterns are allowed: document them in the deck's guidance comments and use a descriptive kebab-case `data-pattern` value.
