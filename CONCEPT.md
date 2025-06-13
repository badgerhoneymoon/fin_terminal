“Retro-Terminal Budget Drop” — Concept Doc v1.0

(Non-technical, ready for Cursor/V0)

⸻

1. North-star experience

Open a single browser tab, see a slick faux-CRT dashboard that feels Hacker-cool, not nostalgia-cringe. Two goals dominate the screen: “Stabilisation Fund” (fill up) and two credit-card debts (drain to zero). You grab glowing money chips and fling them into a target; numbers tick, progress bars slide, a tiny phosphor beep confirms. Close tab, come back next week—state’s still there.

⸻

2. Visual language

Element	Direction
Palette	Black #000 background, neon-green primary (#00FF90), magenta accent (#FF00C8). Subtle glassy overlays (low-opacity white with backdrop-filter: blur(6px)) modernise the CRT vibe.
Typography	IBM Plex Mono at 16 px base. Headings 24 px uppercase. Weight 500; no faux bold.
Texture	3-px scan-lines overlay (multiplicative blend) at 20 % opacity. Occasional 40 ms flicker animation on focusable items to sell the “tube” illusion.
Motion	Chips launch with 250 ms ease-out cubic; landing triggers a 1-frame shake in the bucket card. Progress bars animate width/height over 400 ms. All motion uses Framer-Motion’s spring defaults—feels snappy, never bouncy.
Sound	Two SFX only: click (chip mint) and beep (chip drop / milestone hit). Muted by default; toggle top-right.
Accessibility	Every draggable chip also manipulable via keyboard (TAB to chip ⇒ SPACE to pick up ⇒ arrow keys to target ⇒ SPACE to drop). High-contrast toggle switches palette to white #FAFAFA bg / charcoal text.


⸻

3. Screen anatomy (desktop-first)

┌─────────────────────────────────────────────────────────────────┐
│ █ BUDGET DROP ▌                                     FX● · · · │
├─────────────────────────────────────────────────────────────────┤
│ ▌ STABILISATION (fund)            $450 / $1 500  █▉▉▉▁▁▁▁▁▁▁ │
│ ▌ TINKOFF CARD (debt)           ₽85 000 ▾ ₽0     █▇▅▂▁        │
│ ▌ BOA CARD (debt)               $1 200 ▾ $0      █▆▅▃▁        │
│───────────────────────────────────────────────────────────────┤
│  +  AMOUNT FIELD  [ USD ▼ ]   →   ▮500 USD (chip)             │
│                                                               │
│  (Drag chips from staging tray onto any bucket above)         │
└─────────────────────────────────────────────────────────────────┘
Footer: [Export JSON]  [Import]  ·  Last save 10 s ago

	•	Header – Title, tiny FX indicator (glows red if older than 24 h).
	•	Bucket list – Each row acts as a drop-zone. Fund rows fill →; debt rows drain ←.
	•	Staging tray – Minimal: one text field + currency dropdown mint chips. Minting auto-clears the field and parks the chip. Can stack multiple chips.
	•	Footer – Export/Import, save timestamp, mute toggle.

⸻

4. Core interactions

Flow	Steps & micro-copy
Mint income chip	Hit +, type 500, pick USD/BTC/etc → “MINTED” toast bottom-left (2 s).
Drag & drop	Chip follows cursor with trailing CRT ghost; bucket under pointer highlights cyan border; release drops.
Undo	Right-click bucket → scrollable log (last 20 moves). Click entry → “Revert?” → yes pulls chip back to tray.
Milestone celebration	When debt crosses a checkpoint, bucket row flashes magenta & emits longer beep.
FX refresh	Click FX indicator → modal “Rates updated using exchangerate.host · fallback to manual if offline.”


⸻

5. Logic & mechanics (plain-English)
	1.	Buckets
Fund targets count up to a goal (e.g. $1 500).
Debt targets count down to zero. Each debt optionally lists numeric checkpoints; UI ticks them off.
	2.	Chips
A chip = one transaction. Value is always positive, currency chosen on mint. When dropped:
	•	Fund → add to running total.
	•	Debt → subtract from outstanding balance (do not allow over-payment; chip bounces back with red border).
	3.	Currency conversion
	•	Every chip and bucket has a native currency for display.
	•	Internally we store raw numbers plus last-known USD rate.
	•	Dashboard always shows both native figure and tiny “≈ $X” hover tooltip.
	•	If FX data is >24 h old, rate badge pulses; user still allowed to operate.
	4.	Persistence
	•	On every state change, serialise to JSON and localStorage under "budgetdrop.v1".
	•	Export simply triggers download("budget-export-2025-06-13.json").
	•	Import overlays a file input; parsing errors spit a red toast.

⸻

6. Milestone scheme for your debts (suggested)

Debt	Current	Milestones
Tinkoff (₽100 000)	100 000 → 0	75 000, 50 000, 25 000
BoA ($1 200)	1 200 → 0	900, 600, 300

Buckets visually segment at each tick.

⸻

7. User journeys

A. Payday split
	1.	Mint chip 500 USD.
	2.	Drag to Stabilisation fund → progress jumps +$500.
	3.	Mint chip 200 USD.
	4.	Drag to BoA → BoA bar shrinks; hits $900 milestone, bucket flashes magenta.

B. Mid-month crypto top-up
	1.	Mint chip 0.005 BTC.
	2.	Drop onto Stabilisation fund. Tooltip shows “≈ $312”.
	3.	Fund progress inches closer to $1 500; CRT beep.

C. Offline café session
	1.	No internet; FX badge red.
	2.	User mints chip anyway—allowed. App uses cached rates.
	3.	On reconnect, badge turns green after auto-refresh.

⸻

8. Hand-off checklist for dev
	•	Palette & font tokens set in Tailwind / CSS vars.
	•	Global BudgetContext (React) stubbed with reducer actions mint, drop, undo, import, export, updateRates.
	•	Drag-and-drop skeleton (pointer events acceptable) with keyboard fallback.
	•	Sound assets wired via <audio> tags; muted by default.
	•	Unit test: over-payment bounceback.
	•	Lighthouse pass ≥ 90 accessibility score (high-contrast mode, ARIA labels).

⸻

9. Open edges (decide later)
	•	Should debts allow negative balance (credit surplus) or hard-block at zero?
	•	Option for salary presets (auto-mint 50 % fund / 50 % BoA) via one click?
	•	Dark-vs-“light CRT” themes?
	•	PWA install prompt for offline desktop use?

⸻