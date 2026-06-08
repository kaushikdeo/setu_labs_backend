# VentaCRM — Prospects Module Plan & Lead-to-Prospect Transition

---

## Table of contents

1. [What the Prospects module is](#1-what-the-prospects-module-is)
2. [How it differs from the Leads module](#2-how-it-differs-from-the-leads-module)
3. [Lead-to-prospect transition — full plan](#3-lead-to-prospect-transition--full-plan)
4. [Top navigation — Prospects mega-menu](#4-top-navigation--prospects-mega-menu)
5. [Secondary sub-navigation tabs](#5-secondary-sub-navigation-tabs)
6. [Left sidebar items — Prospects section](#6-left-sidebar-items--prospects-section)
7. [Pages and sub-pages](#7-pages-and-sub-pages)
8. [Prospect lifecycle stages](#8-prospect-lifecycle-stages)
9. [Complete fields list — Prospects module](#9-complete-fields-list--prospects-module)
10. [Automation and workflow rules](#10-automation-and-workflow-rules)
11. [Permissions by role](#11-permissions-by-role)
12. [Integrations](#12-integrations)
13. [Notifications and reminders](#13-notifications-and-reminders)
14. [Development phases](#14-development-phases)

---

## 1. What the Prospects module is

The Prospects module is the active sales pipeline. Every record here represents a real, qualified commercial opportunity — a company that has confirmed a budget, a need, a decision-making authority, and a timeline.

Unlike the Leads module, which is a holding area for unverified signals, the Prospects module is where deals are actively worked. It is the engine room of revenue generation. Salespeople manage their deals here. Managers track pipeline health here. The CEO's revenue forecast is built from this data.

Every prospect record is:
- Linked to an original lead record (its source)
- Assigned a confirmed monetary value (₹)
- Placed in a specific pipeline stage
- Tracked with an expected close date
- Visible on the kanban board, the forecast view, and the list view

---

## 2. How it differs from the Leads module

| Dimension | Leads module | Prospects module |
|---|---|---|
| What it contains | Unverified contacts who showed interest | Qualified opportunities with confirmed intent |
| Primary question | "Is this person worth pursuing?" | "How do we win this deal?" |
| Deal value | Estimated / guessed | Confirmed in conversation |
| Pipeline stage | Does not exist | Central field — drives everything |
| Expected close date | Not applicable | Mandatory — used in forecasting |
| Forecast contribution | None | Weighted value appears in CEO dashboard |
| Win probability | Not tracked | Tracked by stage (15% → 90%) |
| Manager visibility | Lead count, response time | Deal value, stage, risk, close date |
| Activities | Calls, emails, follow-up reminders | Demos, site visits, quotations, negotiations |
| When it ends | Lead converted to prospect or closed | Deal won, lost, or deferred |

---

## 3. Lead-to-prospect transition — full plan

### 3.1 The meaning of the transition

Converting a lead to a prospect is a formal declaration that:

1. The salesperson has completed a qualification conversation
2. All four BANT criteria are confirmed (see below)
3. The company is committing sales resources — demos, quotations, management time — to this opportunity
4. This deal now enters the revenue forecast

This is a gate, not a formality. A salesperson who converts unqualified leads into prospects pollutes the pipeline with fake opportunities, distorts the forecast, and wastes everyone's time. The CRM must enforce the gate.

---

### 3.2 The BANT qualification framework

Before any lead can be converted, the salesperson must have confirmed all four of the following through direct conversation. "Assumed" or "probably" does not qualify.

#### Budget (B)

**Definition:** The customer has confirmed that money is allocated, approved, or being allocated for this purchase.

**Qualifying statements from customer:**
- "We have ₹1 crore approved in this year's capex budget"
- "We are getting three quotes and will present to our finance committee in July"
- "Our board approved up to ₹75 lakhs for this project in the March meeting"
- "We need to spend this before March 31 — it's in this year's budget"

**Disqualifying statements:**
- "We would like to do this if the price is right" (no commitment, just interest)
- "We might have budget next year" (no current project)
- Silence or deflection on every budget question after two attempts

**What to do when budget is unconfirmed:**
Keep as lead. Send a case study of a similar project with approximate investment ranges. In the next call, ask: "What budget envelope are you working with for this?" Convert only after verbal confirmation.

---

#### Authority (A)

**Definition:** The person you are speaking to either has final approval authority or has direct access to and influence over the person who does.

**Three valid contacts to convert:**

| Contact type | Description | Conversion decision |
|---|---|---|
| Decision maker | Signs the PO, gives final commercial approval | Yes — highest priority |
| Influencer | Recommends vendor to the decision maker, presents internally, has the DM's ear | Yes — work through them to reach DM |
| Committee member | One vote in a formal multi-person approval committee | Yes — but identify all committee members |

**Contacts that should not trigger conversion:**

| Contact type | Description | Action |
|---|---|---|
| Technical evaluator | Reviews specs, writes technical report, has no commercial authority | Nurture — find the person above them |
| Gatekeeper | Admin, receptionist, junior researcher | Do not convert — find the real contact |
| Information gatherer | Collecting market data for someone else | Do not convert — find the actual decision-maker |

**How to identify authority in conversation:**
Ask directly: "Once you have reviewed the proposals, who makes the final call on vendor selection?" or "Is this decision yours to make or does it go to a committee or your MD?"

---

#### Need (N)

**Definition:** The customer has described a specific, concrete problem or project that your product or service directly addresses.

**Qualifying statements:**
- "We are building a 2,00,000 sq ft warehouse in Pune and need the complete HVAC design and installation"
- "Our fire suppression system is 15 years old and the factory audit in October requires us to replace it"
- "Our electricity bills are ₹8 lakhs per month and our MD has asked us to evaluate solar to bring that down by 40%"

**Disqualifying statements:**
- "I saw your stall at the exhibition and picked up a brochure" (curiosity, not need)
- "We heard you do HVAC — do you have a product catalogue?" (research, not need)
- "We may need to upgrade our systems at some point" (no urgency, no specific project)

**Test:** Can you write a scope of work for a quotation right now based on what the customer has told you? If yes, the need is real. If you need to ask five more questions before you can even begin to define a scope, the need is not yet established.

---

#### Timeline (T)

**Definition:** There is a real event, deadline, or project milestone that is driving a purchase decision within a foreseeable period.

**Qualifying statements:**
- "We need to commission the HVAC before our factory goes live on September 1"
- "The tender is open until July 15 and we need to submit three comparative quotes"
- "Our MD wants POs placed before March 31 — that is our financial year end"
- "We are planning to start installation during our December–January plant shutdown"

**Disqualifying statements:**
- "Sometime this year, once everything falls into place" (no commitment)
- "Our management is still discussing whether to do this" (no approved project)
- "We'll call you when we're ready" (indefinite deferral)

**What to do when timeline is vague:**
Ask: "What would need to happen for this project to get started?" and "Is there a date when this project goes from 'being discussed' to 'approved and active'?" If the answer is still vague after two probing questions, keep as lead.

---

### 3.3 The conversion gate — what the CRM enforces

When the salesperson clicks "Convert to prospect," the CRM opens a conversion modal. The following fields are mandatory and the system will not complete the conversion until all are filled:

| Field | Why mandatory |
|---|---|
| Confirmed deal value (₹) | Pipeline and forecast are built on this number |
| Expected close date | Required for monthly/quarterly revenue forecasting |
| Pipeline stage | Determines kanban placement and next-action task |
| Budget status | Confirms the B in BANT |
| Decision authority | Confirms the A in BANT |
| Confirmed need / requirement | Confirms the N in BANT |
| Decision timeline | Confirms the T in BANT |

The following fields are optional but strongly recommended:
- Win probability % (auto-set by stage, can be overridden)
- Competitors being evaluated
- Number of decision makers
- Qualification notes

---

### 3.4 What data carries over automatically

When conversion is confirmed, the following fields auto-populate on the new prospect record from the lead record. The salesperson does not re-enter this data:

| Field | Behaviour on conversion |
|---|---|
| First name, last name | Copied identically |
| Mobile number | Copied identically — primary contact |
| Email address | Copied identically |
| Company / organisation | Copied identically |
| Designation / role | Copied identically |
| City, state | Copied identically |
| Lead source | Copied — preserved for attribution reporting |
| Campaign / medium | Copied — preserved for marketing ROI reports |
| Lead temperature (Hot/Warm/Cold) | Copied — updated based on BANT confirmation |
| Product / service interest | Copied — forms the basis of the prospect's solution area |
| Tags | Copied — additional tags can be added |
| Assigned salesperson | Copied — can be changed at conversion (e.g. re-assigned to senior rep) |
| Full activity timeline | All calls, emails, WhatsApp, notes from lead stage are linked and visible on the prospect record |
| Lead ID reference | Stored as a linked field — full audit trail between lead and prospect |

---

### 3.5 What the salesperson does immediately after conversion

Within 24 hours of converting a lead to a prospect, the salesperson must:

1. Schedule the next action — demo call, site visit, or discovery meeting — and confirm it with the customer
2. Log the discovery meeting in the CRM calendar
3. Brief the technical engineer (if a site visit is needed)
4. Update qualification notes with everything learned in the conversion call
5. Identify who else in the customer organisation needs to be engaged (influencers, committee members)
6. Research the competition — look up the competitors named and prepare differentiation points
7. Notify the manager — for deals above ₹25 lakhs, a verbal briefing is expected

---

### 3.6 What happens to the original lead record

The original lead record is:
- Marked with status **Converted**
- Archived (not deleted)
- Linked bidirectionally to the new prospect record
- Viewable by clicking "View original lead" from the prospect record
- Not editable after conversion (locked for audit integrity)
- Included in lead source analytics — the original source attribution is preserved permanently

This means all historical data is intact. If a deal is lost and the prospect is closed, the original lead can be re-activated and a new conversion attempted in the future.

---

### 3.7 What happens if a lead does not qualify

When a lead is assessed against BANT and does not meet the criteria, it does not sit in limbo. There are three defined outcomes:

| Outcome | When to use | CRM action |
|---|---|---|
| Nurture | Interest exists but budget, authority, or timeline not yet confirmed | Keep as lead. Tag with nurture sequence. Add to email drip campaign. Set re-qualification follow-up in 30, 60, or 90 days. |
| Disqualified | No real interest, wrong segment, or company genuinely cannot buy | Mark lead as Disqualified. Log reason. Remove from active follow-up. Keep in database for future reference. |
| Deferred | Real interest and budget but project is 6+ months away | Mark lead as Deferred. Set reminder task for 90 days. Re-engage when project becomes active. |

---

## 4. Side navigation — Prospects menu

When the user clicks **Prospects** in the side navigation bar.

### Column 1 — Prospect views

| Menu item | Badge | Description |
|---|---|---|
| All prospects | 82 | Full list with filter and sort |
| Kanban board | — | Visual pipeline — drag and drop by stage |
| Hot prospects | 18 | High priority, immediate follow-up |
| Qualified prospects | 31 | Budget and need confirmed |
| My prospects | — | Assigned to logged-in user only |
| Stale prospects | 9 | No activity in 14+ days |

### Column 2 — Pipeline & actions

| Menu item | Description |
|---|---|
| Forecast view | Weighted pipeline by month and quarter |
| My prospects | Filter to current user's deals |
| Convert lead | Qualify and promote from lead stage |
| Create quotation | Auto-fill from prospect data |
| Schedule demo | Book a demo or site visit |
| Send follow-up | Email, call, or WhatsApp follow-up |
| Mark won / lost | Close deal with mandatory reason |
| Pipeline settings | Manage stages, fields, probability defaults |

---

## 5. Secondary sub-navigation tabs

| Tab | Icon | Action |
|---|---|---|
| All prospects | List | Master list view with filters |
| Kanban | Layout-kanban | Visual drag-and-drop pipeline board |
| Forecast | Chart-line | Weighted revenue by close month |
| Follow-ups | Mail-forward | All overdue and today's follow-up tasks |
| Activities | Activity | Full activity feed for all prospects |
| Analytics | Chart-bar | Win rate, stage conversion, velocity reports |

**Right side of sub-nav:**
- Filter button — open advanced filter panel
- Convert lead button (primary) — quick shortcut to conversion modal

---

## 6. Left sidebar items — Prospects section

```
Prospects
  ├── All prospects                [82]
  ├── Kanban board
  ├── Hot prospects                [18]
  ├── Qualified prospects          [31]
  ├── My prospects
  ├── Stale prospects              [9]
  ├── Forecast view
  ├── Follow-ups due today         [14]
  └── Convert lead

Pipeline tools
  ├── Won this month               [11]
  ├── Lost this month              [4]
  └── Pipeline analytics
```

---

## 7. Pages and sub-pages

### 7.1 All prospects — list view

**Purpose:** Master view of every prospect in the pipeline with filtering, sorting, and bulk actions.

**KPI stat cards (4 across top):**

| Stat | Value | Indicator |
|---|---|---|
| Total prospects | 82 | Active in pipeline |
| Pipeline value | ₹4.7 Cr | Total deal value |
| Hot prospects | 18 | Need follow-up today |
| Follow-ups due today | 14 | 6 overdue |

**Filter bar:**
- Search box — by name, company, mobile, deal value
- Quick filter chips: All · Hot · Qualified · Follow-up due · Mine · Stale
- Sort dropdown: by value, close date, last activity, stage, assigned rep

**Table columns:**

| Column | Type | Notes |
|---|---|---|
| Prospect name / company | Text + subtext | Full name, company, city |
| Deal value | Currency | Confirmed ₹ value |
| Pipeline stage | Pill badge | Colour-coded by stage |
| Temperature | Pill badge | Hot / Warm / Cold |
| Assigned to | Text | Salesperson name |
| Next action | Text + date | Red if overdue |
| Actions | ··· | Edit, call, email, create quote, mark won/lost |

**Row click action:** Opens the Prospect detail view.

**Bulk actions (select multiple rows):**
- Bulk reassign to salesperson
- Bulk update stage
- Export selected to CSV
- Bulk send follow-up email

---

### 7.2 Prospect detail view

**Purpose:** Single record view for one prospect with all deal information and complete interaction history.

**Header section:**
- Avatar (initials circle) — colour-coded by temperature
- Full name, designation, company, city
- Status pills: temperature, pipeline stage, product interest, close date, assigned rep
- Action buttons: Call · Email · WhatsApp · Create quote · Mark won · Mark lost

**Pipeline progress tracker:**
A horizontal visual bar showing all stages, with the current stage highlighted. Clicking a stage advances or retreats the deal.

```
[New] › [Qualified] › [Demo] › [Quoted] › [Negotiate] › [Won/Lost]
                                    ●  ← current stage
```

**Detail cards (2-column grid):**

*Deal details card:*
- Confirmed deal value
- Win probability %
- Weighted value (value × probability)
- Expected close date
- Days remaining to close date
- Industry / segment
- Product / service interest

*Qualification card:*
- Budget status (confirmed / likely / unknown)
- Decision authority type
- Number of decision makers
- Competitors being evaluated
- Decision timeline
- Qualification notes

*Latest quotation card (appears after first quote is created):*
- Quote number
- Quoted value
- Quote status (draft / sent / under review / accepted / rejected)
- Quote sent date
- Current revision number

*Contact details card:*
- Mobile, email, company, designation, city, state
- Secondary contacts (added later — procurement, finance, technical)

**Activity timeline:**

Full chronological log of every interaction, visible to all team members. Each entry shows:
- Icon by activity type (call, email, WhatsApp, site visit, demo, quote, system event)
- Description of what happened
- Outcome (positive / neutral / objection raised)
- Next step agreed
- Timestamp and logged-by (salesperson name)

**Activity types logged on prospect timeline:**
- Incoming and outgoing calls (duration, outcome, recording link if telephony integrated)
- Emails sent and received (subject line, thread link)
- WhatsApp messages
- Site visits (photos attached)
- Demo sessions (presentation deck attached)
- Quotations created, sent, revised
- Competitor intelligence updates
- Stage changes (system auto-logged)
- Conversion event (system auto-logged with link to original lead)
- Follow-up tasks created and completed
- Notes added manually

---

### 7.3 Kanban board

**Purpose:** Visual drag-and-drop view of all prospects organised by pipeline stage.

**Column structure:**

| Column | Colour | Default sort | Card shows |
|---|---|---|---|
| New prospect | Gray | Date added | Company, value, temperature |
| Qualified | Green | Deal value desc | Company, value, close date |
| Demo scheduled | Blue | Demo date asc | Company, value, demo date |
| Demo done | Purple | Days since demo | Company, value, days waiting |
| Quoted | Teal | Quote sent date | Company, value, quote status |
| Negotiation | Amber | Days in stage | Company, value, last contact |
| PO expected | Green | Expected PO date | Company, value, expected date |

**Interaction on kanban:**
- Drag a card from one column to the next — triggers stage change confirmation
- Click a card — opens full prospect detail view
- Right-click or ··· on a card — quick actions (call, email, create quote, mark won/lost)
- Column header click — shows aggregate value for that stage

**Kanban filters:**
- Filter by salesperson (show only one rep's pipeline)
- Filter by product / service type
- Filter by deal value (above / below a threshold)
- Filter by temperature

---

### 7.4 Forecast view

**Purpose:** Revenue forecast by month and quarter based on expected close dates and win probabilities.

**Forecast table columns:**

| Column | Description |
|---|---|
| Prospect name | Company / contact |
| Deal value | Confirmed ₹ amount |
| Win probability | % from stage default or manually set |
| Weighted value | Deal value × probability |
| Expected close | Month / quarter it falls in |
| Stage | Current pipeline stage |
| Assigned rep | Salesperson responsible |

**Summary section:**
- Total pipeline value (sum of all deal values)
- Weighted pipeline value (sum of all weighted values)
- Breakdown by month: July ₹XX · August ₹XX · September ₹XX
- Breakdown by rep: Ravi S. ₹XX · Anita K. ₹XX

**Forecast scenarios:**
- Conservative — sum of only deals at 75%+ probability
- Most likely — sum of all weighted values
- Optimistic — sum of all deals at full value (assumes all deals close)

---

### 7.5 Follow-ups view

**Purpose:** A focused task list showing every prospect with a follow-up overdue or due today — one place for the salesperson to start their day.

**Table structure:**

| Column | Description |
|---|---|
| Prospect / company | Name and company |
| Follow-up type | Call / email / WhatsApp / site visit |
| Due date / time | Red if overdue |
| Stage | Where the deal currently sits |
| Last contact | How many days since last activity |
| Quick action | Call now · Send email · Log as done |

**Overdue follow-ups** appear at the top, sorted by most overdue first.

---

### 7.6 Prospect analytics

**Purpose:** Understand pipeline health, stage conversion rates, win/loss patterns, and salesperson performance.

**Charts and metrics:**

| Chart | Description |
|---|---|
| Pipeline funnel | How many deals at each stage, % converting to next |
| Win rate by rep | Which salesperson closes most deals |
| Win rate by product | Which product line wins most often |
| Win rate by source | Which lead source produces the most wins |
| Average deal cycle | Days from prospect creation to won/lost |
| Average deal velocity | How fast deals move through each stage |
| Deals by stage age | How long each deal has been in its current stage |
| Lost deal reasons | Why deals are being lost (price, competition, timing) |
| Forecast accuracy | Predicted vs actual revenue by month |

---

### 7.7 Convert lead modal

**Purpose:** The transition form that opens when "Convert lead to prospect" is clicked from either the lead record or the Prospects sub-nav.

**Section 1 — Contact info (auto-filled, read-only)**
- First name, last name
- Company
- Mobile number
- Email address
- Lead source
- Original lead ID (reference link)

**Section 2 — Deal information (new, mandatory)**

| Field | Type | Required |
|---|---|---|
| Confirmed deal value (₹) | Number input | Yes |
| Expected close date | Date picker | Yes |
| Win probability (%) | Dropdown (preset by stage) | No — auto-set |
| Pipeline stage | Dropdown | Yes |

**Section 3 — Qualification confirmation (BANT, mandatory)**

| Field | Type | Required |
|---|---|---|
| Budget status | Dropdown | Yes |
| Decision authority type | Dropdown | Yes |
| Confirmed need / requirement | Text input | Yes |
| Decision timeline | Dropdown | Yes |

**Section 4 — Competition & context (new, optional)**

| Field | Type | Required |
|---|---|---|
| Competitors being evaluated | Text input | No |
| Number of decision makers | Dropdown | No |
| Qualification notes | Long text | No |
| Re-assign to salesperson | Dropdown | No |

**Modal actions:**
- Cancel — returns to lead record without converting
- Convert to prospect (primary) — creates prospect record and archives lead

---

## 8. Prospect lifecycle stages

```
Lead converted
      │
      ▼
[Stage 1]  New prospect
           (BANT confirmed, deal in pipeline, action needed)
      │
      ▼
[Stage 2]  Qualified
           (Deep discovery done, scope defined)
      │
      ▼
[Stage 3]  Demo scheduled
           (Demo or site visit booked and confirmed)
      │
      ▼
[Stage 4]  Demo done
           (Presentation / site visit completed, feedback received)
      │
      ▼
[Stage 5]  Quote in progress
           (Quotation being prepared by your team)
      │
      ▼
[Stage 6]  Quotation sent
           (Formal commercial proposal delivered to customer)
      │
      ▼
[Stage 7]  Follow-up
           (Post-quote communication sequence active)
      │
      ▼
[Stage 8]  Negotiation
           (Customer engaging on price, terms, or scope)
      │
      ├─────────────────────────────────────────┐
      │                                         │
      ▼                                         ▼
[Stage 9]  PO expected               [Stage 10]  Lost
           (Verbal commitment,                   (Customer chose
           internal PO approval                  competitor, cancelled,
           in progress)                          or deferred)
      │                                         │
      ▼                                         ▼
[Stage 11]  Won                       Closed lost
            (PO received and          (Reason logged,
            verified)                 nurture tagged)
      │
      ▼
Handed over to service / operations
```

---

## 9. Complete fields list — Prospects module

### 9.1 Fields carried over from lead (auto-populated)

| Field | Type | Source |
|---|---|---|
| Prospect ID | Auto | System-generated (PR-0001) |
| Linked lead ID | Reference | Auto-linked to original lead |
| First name | Text | Copied from lead |
| Last name | Text | Copied from lead |
| Mobile | Text | Copied from lead |
| Email | Email | Copied from lead |
| Company | Text | Copied from lead |
| Designation | Text | Copied from lead |
| City | Text | Copied from lead |
| State | Dropdown | Copied from lead |
| Lead source | Dropdown | Copied from lead — preserved |
| Campaign / medium | Text | Copied from lead — preserved |
| Temperature | Toggle | Copied — updated at conversion |
| Product / service interest | Dropdown | Copied from lead |
| Tags | Multi-select | Copied — additional tags can be added |
| Assigned salesperson | Dropdown | Copied — can be re-assigned |

### 9.2 New fields added at prospect stage

| Field name | Type | Required | Description |
|---|---|---|---|
| Confirmed deal value | Currency (₹) | Yes | Verbally confirmed budget from customer |
| Expected close date | Date | Yes | Target PO date — used in forecasting |
| Win probability (%) | Dropdown | No | Auto-set by stage, overridable |
| Weighted value | Calculated | Auto | Deal value × probability / 100 |
| Pipeline stage | Dropdown | Yes | Current position in sales pipeline |
| Budget status | Dropdown | Yes | Confirmed / Likely / Unknown |
| Decision authority type | Dropdown | Yes | Decision maker / Influencer / Evaluator |
| Number of decision makers | Dropdown | No | 1 / 2–3 / 4+ |
| Competitors being evaluated | Text | No | Competitor names from customer |
| Decision timeline | Dropdown | Yes | Immediate / Short / Medium / Long |
| Confirmed need / requirement | Text | Yes | Specific project or problem described |
| Qualification notes | Long text | No | Structured BANT conversation summary |
| Days in current stage | Calculated | Auto | Triggers stale alert if threshold exceeded |
| Last activity date | Timestamp | Auto | Updated on every interaction |
| Next follow-up date | Date | No | Triggers reminder task |
| Next follow-up mode | Dropdown | No | Call / Email / WhatsApp / Visit |
| Demo date | Date | No | Set when demo is scheduled |
| Demo completed | Checkbox + date | No | Marked when demo is done |
| Latest quote number | Reference | Auto | Linked to quotation record |
| Latest quote value | Currency | Auto | From linked quotation |
| Latest quote status | Reference | Auto | From linked quotation |
| PO number | Text | No | Filled when PO is received |
| PO date | Date | No | Date PO was issued by customer |
| Won date | Date | Auto | Set when status changes to Won |
| Lost date | Date | Auto | Set when status changes to Lost |
| Lost reason | Dropdown | Yes (if lost) | Mandatory when marking lost |
| Lost to competitor | Text | No | Competitor who won the deal |
| Conversion date | Timestamp | Auto | Date lead was converted to prospect |
| Converted by | User reference | Auto | Salesperson who did the conversion |

---

## 10. Automation and workflow rules

### Stage-based automation

| Trigger | Action |
|---|---|
| Prospect created (conversion) | Create task: "Schedule discovery meeting within 3 days" |
| Stage changed to Demo scheduled | Create task: "Confirm demo logistics 1 day before" |
| Stage changed to Demo done | Create task: "Send quotation within 3 business days" |
| Stage changed to Quotation sent | Start follow-up sequence (Day 3, 7, 14, 21) |
| Stage changed to Negotiation | Notify manager: "Deal in negotiation — Rajiv Nair ₹95L" |
| Stage changed to Won | Create work order · Notify operations · Notify manager |
| Stage changed to Lost | Require loss reason · Tag for nurture · Notify manager |

### Stale prospect rules

| Condition | Alert type | Recipient |
|---|---|---|
| No activity for 7 days | In-app + email reminder | Assigned salesperson |
| No activity for 14 days | In-app + email alert | Salesperson + manager |
| No activity for 21 days | Escalation alert | Sales manager |
| No activity for 30 days | Weekly digest flag | Manager |

### Forecast accuracy rules

| Condition | Action |
|---|---|
| Close date passes without stage change | Auto-flag as "Close date missed" |
| Deal in Negotiation for 14+ days | Alert manager |
| Deal value changes after creation | Log change history with old value, new value, and who changed it |
| Win probability manually overridden by more than 20% | Log override with note explaining reason |

---

## 11. Permissions by role

| Role | View | Add | Edit | Delete | Convert | Win/Lost | Analytics |
|---|---|---|---|---|---|---|---|
| CEO | All | Yes | All | Yes | Yes | Yes | All |
| Sales manager | All | Yes | All | Own team | Yes | Yes | Team |
| Salesperson | Own | Yes | Own | No | Own | Own | Own |
| Marketing | All (read) | No | No | No | No | No | Source only |
| Quotation admin | All (read) | No | Quote fields only | No | No | No | No |
| Accountant | Won only | No | No | No | No | No | Revenue only |
| Engineer | Won + service | No | No | No | No | No | No |

---

## 12. Integrations

| Integration | Purpose |
|---|---|
| Calendar (Google / Outlook) | Sync demo and follow-up tasks |
| Email (Gmail / Outlook) | Two-way email sync on prospect timeline |
| WhatsApp Business API | Send and receive messages from prospect record |
| Telephony (Exotel / Knowlarity) | Click-to-call, auto-log call recordings |
| Quotation module | Auto-fill prospect data into new quotation |
| Finance module | Pass won deal data to invoice creation |
| Service module | Auto-create work order from won deal / PO |
| Google Maps | Show prospect site location, plan field visit route |
| Excel / CSV | Export pipeline for offline analysis |
| Tally / ERP | Pass deal data to accounting after win |

---

## 13. Notifications and reminders

| Trigger | Notification type | Recipient |
|---|---|---|
| New prospect created | In-app + push | Assigned salesperson + manager |
| Follow-up date reached | In-app + email | Assigned salesperson |
| Follow-up overdue (>1 day) | In-app alert | Salesperson + manager |
| Demo scheduled | Calendar invite | Salesperson + customer (if integrated) |
| Quote sent to customer | In-app + email confirmation | Salesperson + quotation admin |
| Customer opens quote email | In-app notification | Assigned salesperson |
| Stage changed to Negotiation | In-app + email alert | Manager |
| Deal marked Won | Push + email celebration | Salesperson + manager + team |
| Deal marked Lost | In-app notification | Manager (requires reason review) |
| Close date missed | In-app + email warning | Salesperson + manager |
| Prospect stale 7 days | Email reminder | Salesperson |
| Prospect stale 14 days | In-app escalation | Salesperson + manager |
| Deal above ₹25L enters negotiation | Direct manager notification | Sales manager + CEO |

---

## 14. Development phases

### Phase 1 — Core pipeline (Week 1–3)
- Prospect list view with filters and search
- Prospect detail view with basic fields
- Pipeline stage field and kanban board (view only)
- Conversion modal linking from lead record
- Activity timeline on prospect record

### Phase 2 — Pipeline management (Week 4–6)
- Kanban drag-and-drop with stage change confirmation
- Deal value, close date, and win probability fields
- Forecast view (table + monthly breakdown)
- Follow-ups view
- Stage-change automation (auto-create tasks)
- Stale prospect detection and alerts

### Phase 3 — Conversion & qualification (Week 7–8)
- Full BANT conversion modal with mandatory gates
- Lead auto-population on conversion
- Competition and decision-maker fields
- Qualification notes
- Loss reason enforcement on Mark Lost

### Phase 4 — Integrations & analytics (Week 9–12)
- Quotation module linkage (auto-fill from prospect)
- Email and calendar integration (two-way sync)
- Telephony click-to-call
- Win/loss analytics dashboard
- Stage conversion rate reports
- Forecast accuracy tracking
- Role-based permissions enforcement
- Bulk actions (reassign, export, stage update)

---

*Document version: 1.0 · VentaCRM Prospects Module Plan · June 2026*

---

## 15. Follow-up scheduling (frontend, v1)

The `Prospect` record keeps a flat `nextFollowUpDate` + `nextFollowUpMode`. Future-dated activities of type `follow_up` represent the scheduled commitment; past `follow_up` activities are historical logs. Three surfaces let salespeople schedule, complete, and reschedule follow-ups:

1. **Prospect detail → Next action card (inline editor)**
   - Replaces the read-only `Next follow-up` / `Mode` rows with `Schedule follow-up` / `Reschedule` and `Clear` controls.
   - Editor exposes `date+time` (must be future), `mode` (Phone/Email/WhatsApp/Site visit/Video call), and an optional `note`.
   - Save creates a `follow_up` activity at `occurredAt = chosen date` and syncs `nextFollowUpDate`/`Mode` on the prospect.
   - Clear removes `nextFollowUpDate`/`Mode` without touching history.
   - Disabled when prospect is Won/Lost.

2. **Prospect detail → Log activity form (`Schedule follow-up` type)**
   - The activity type dropdown gains a `Schedule follow-up` option (prospect entities only).
   - When selected, the form swaps to a future `date+time` + required `mode` + optional `note` (hides `outcome`/`nextStep`).
   - Submit goes through the same scheduling path (creates `follow_up` activity + syncs prospect fields).

3. **Follow-ups page → row actions (`Done` + `Reschedule` popovers)**
   - `Done` popover: choose `Done as` (call/email/whatsapp/site_visit/demo/note, defaults from current `mode`), title (auto-filled), optional note, optional `Reschedule next follow-up` panel (date+mode+note). Logs the historical activity and either clears `nextFollowUpDate` or sets a new one in a single user gesture.
   - `Reschedule` popover: date+mode+note → updates the scheduled follow-up only.

Activity-store rules:
- Future-dated `follow_up` activities do **not** bump `lastActivityAt` (so kanban “days in stage” and stale detection still reflect real touchpoints).
- Adding a `follow_up` activity always overwrites `nextFollowUpDate`/`Mode`; the “current” next follow-up is always the latest scheduled one.
- Clearing a follow-up only nulls `nextFollowUpDate`/`Mode`; past `follow_up` activities remain in the timeline.

Backend mapping (to be implemented later): a `POST /prospects/:id/follow-up` endpoint can wrap the same two-step write (create activity + patch prospect). Until then, the frontend mock store reproduces this contract.

---

## 16. Backend implementation (v1, shipped)

### 16.1 Modules
- `src/modules/activity/` — generic activity collection shared between leads and prospects.
- `src/modules/prospect/` — prospect entity, pipeline operations, conversion, follow-up management.
- Wired into `app.ts` under `/api/activities` and `/api/prospects` (both require JWT auth).

### 16.2 Models

**`Activity`** (`activities` collection):
- `entityType: 'lead' | 'prospect'`, `entityId: ObjectId` (polymorphic — no `ref`).
- `linkedProspectId: ObjectId | null` — set on lead activities during conversion so the prospect timeline can include pre-conversion history.
- `type: ActivityType` — `call|email|whatsapp|site_visit|demo|note|stage_change|conversion|won|lost|follow_up|system`.
- `title`, `description?`, `direction?` (`in|out`), `outcome?` (`positive|neutral|objection`), `nextStep?`.
- `occurredAt: Date` (may be future for scheduled `follow_up`).
- `metadata?: Mixed` — e.g. `{ mode: FollowUpMode }` for follow-ups, `{ fromStage, toStage }` for stage changes.
- `createdBy: string` (user id).
- Indexes: `(entityType, entityId, occurredAt desc)`, `(linkedProspectId, occurredAt desc)`, `type`, `occurredAt desc`.

**`Prospect`** (`prospects` collection):
- `code: string` (unique, `PR-XXXX` via `srCounterService.nextSequence('prospect')`).
- `leadId: ObjectId` (unique — one prospect per lead).
- Denormalized contact info from the originating lead (firstName, lastName, mobile, email, company, designation, city, state, source, campaign, productInterest, industry, temperature, tags).
- `assignedUserId: ObjectId` (ref User).
- Deal: `dealValue`, `expectedCloseDate`, `winProbability` (0–100), `weightedValue` (recomputed on write).
- Pipeline: `stage: PipelineStage`, `status: ProspectStatus`, `stageChangedAt: Date`.
- BANT: `budgetStatus`, `authorityType`, `decisionMakerCount?`, `confirmedNeed`, `decisionTimeline`, `qualificationNotes?`, `competitors[]`.
- Follow-up: `nextFollowUpDate?`, `nextFollowUpMode?`, `lastActivityAt`.
- Demo: `demoDate?`, `demoCompletedAt?`.
- Won/Lost: `poNumber?`, `poDate?`, `wonAt?`, `lostAt?`, `lostReason?`, `lostToCompetitor?`.
- Audit: `convertedAt`, `convertedBy`, `createdBy`, timestamps.
- Indexes: `assignedUserId`, `stage`, `status`, `temperature`, `expectedCloseDate`, `nextFollowUpDate`, `lastActivityAt desc`, `createdAt desc`, and a text index over name/company/mobile/email/code.

### 16.3 Routes

**`/api/activities`** (auth required)
| Method | Path | Roles | Notes |
| --- | --- | --- | --- |
| GET | `/` | any | Query: `entityType, entityId, type?`. Returns merged stream for prospect (entity + linked lead activities), sorted `occurredAt desc`. |
| POST | `/` | super_admin, sales_manager, sales | Creates the activity; if `entityType='prospect'` and `type='follow_up'`, syncs `nextFollowUpDate/Mode` on the prospect (skips `lastActivityAt` bump when `occurredAt` is in the future). Any other prospect activity bumps `lastActivityAt`. |
| DELETE | `/:id` | super_admin, sales_manager | |

**`/api/prospects`** (auth required)
| Method | Path | Roles | Notes |
| --- | --- | --- | --- |
| GET | `/` | any | Filters: `q, stage, status, temperature, assignedUserId, closeFrom, closeTo, scope (all/hot/qualified/mine/stale), page, limit, sort`. Returns `{ data, page, limit, total }` with computed `assignee` + `daysInStage`. |
| GET | `/stats` | any | KPI roll-up (open count, pipeline value, weighted, hot/qualified/stale counts, follow-ups due today / overdue, won/lost MTD). |
| GET | `/kanban` | any | Same filters; status forced to `open`; returns one column per open stage. |
| GET | `/forecast` | any | Open prospects grouped by month & rep, plus scenarios (conservative / mostLikely / optimistic). |
| GET | `/follow-ups` | any | `{ overdue, dueToday, upcoming (7d) }`. |
| GET | `/by-lead/:leadId` | any | Returns the prospect (if any) created from that lead. |
| GET | `/:id` | any | Prospect detail with `assignee` + `daysInStage`. |
| POST | `/convert/:leadId` | super_admin, sales_manager, sales | BANT-gated conversion. Creates the prospect, marks the lead `CONVERTED`, relinks lead activities (`linkedProspectId`), logs `CONVERSION`, runs stage automation. |
| PATCH | `/:id` | super_admin, sales_manager, sales | Update editable fields; recomputes `weightedValue` if `dealValue` or `winProbability` changed; logs a `SYSTEM` activity. Stage/status/code are blacklisted. Closed (`won`/`lost`) prospects return 400. |

**Frontend edit:** `/prospects/:id/edit` — `ProspectForm` + `EditProspectPage`; entry from prospect detail **Edit** button and list-table pencil icon (open prospects only).
| POST | `/:id/stage` | super_admin, sales_manager, sales | Body `{ stage, note? }`. Updates `stageChangedAt`, recomputes probability/weighted, logs `STAGE_CHANGE`, runs `autoTasksForStage`. |
| POST | `/:id/won` | super_admin, sales_manager, sales | Body `{ poNumber, poDate, note? }`. Sets `status=won`, `winProbability=100`, `weightedValue=dealValue`. Logs `WON`. |
| POST | `/:id/lost` | super_admin, sales_manager, sales | Body `{ lostReason, lostToCompetitor?, note? }`. Sets `status=lost`, zeros probability/weighted. Logs `LOST`. |
| DELETE | `/:id/follow-up` | super_admin, sales_manager, sales | Nulls `nextFollowUpDate`/`Mode`. Past `follow_up` activities stay in the timeline. |
| DELETE | `/:id` | super_admin, sales_manager | Removes the prospect. |

### 16.4 Stage automation (`autoTasksForStage`)
Triggered on conversion (with the chosen stage) and on every stage change. Uses `activityService.logSystem` so server-generated `follow_up` system activities do **not** overwrite the user-controlled `nextFollowUpDate`.

| Stage entered | Action |
| --- | --- |
| `demo_scheduled` | System `follow_up` "Confirm demo logistics" 24h before `demoDate` (or tomorrow). |
| `demo_done` | System `follow_up` "Send quotation" in 3 days. |
| `quotation_sent` | System `follow_up`s "Follow up on quote (day N)" at 3/7/14/21 days. |
| `negotiation` (deal ≥ ₹25L) | System note "Manager notified — large deal in negotiation". |
| `won` / `lost` | Logged separately by `markWon` / `markLost`. |

### 16.5 Follow-up sync rules (single source of truth: the activity stream)
1. Only user-initiated `POST /api/activities` of `type=follow_up` on a `prospect` writes `nextFollowUpDate`/`nextFollowUpMode`. Backend mirrors the frontend store semantics.
2. Future-dated `follow_up` activities **do not** bump `lastActivityAt` (kanban stale detection stays honest).
3. `DELETE /api/prospects/:id/follow-up` clears the next follow-up without touching history.
4. Stage-automation generated `follow_up` activities use `activityService.logSystem` directly and do not sync the prospect.

### 16.6 Lead↔Prospect link
- `LeadModel.status` is set to `CONVERTED` and `convertedAt` is stamped on successful conversion.
- All `Activity` records with `entityType='lead'` and `entityId=lead._id` get `linkedProspectId=prospect._id` so the prospect timeline can surface lead-era touchpoints.
- `GET /api/prospects/by-lead/:leadId` is used by the lead detail page to show a "Converted to prospect" banner and disable the convert button.

### 16.7 Follow-up completion & history

**Routes:**
| Method | Path | Roles | Notes |
| --- | --- | --- | --- |
| POST | `/api/prospects/:id/follow-up/complete` | super_admin, sales_manager, sales | Atomically marks the most recent open past `follow_up` activity as done, logs the actual touchpoint, and either schedules the next follow-up or clears `nextFollowUpDate`/`Mode`. Body `{ doneAs, title, note?, reschedule? { occurredAt, mode, note? } }`. |
| GET | `/api/prospects/follow-ups/completed` | any | Query `days=30&scope=all|mine`. Returns past `follow_up` activities where `metadata.completedAt` is set, joined with prospect basics (code, name, company, stage, status, dealValue, assignee). |

**Server logic (`prospectService.completeFollowUp`):**
1. Resolve the open `follow_up` to mark done — past **or** future. Prefer the activity whose `occurredAt = prospect.nextFollowUpDate` (the user's current scheduled commitment). Fall back to the latest open `follow_up` by `occurredAt desc`. The match excludes activities that already have `metadata.completedAt` set.
2. If found, stamp `metadata.completedAt=now`, `metadata.completedAs=doneAs`, `metadata.completedBy=userId`. (No-op when there is no open follow-up — completing is still allowed; it just records the touchpoint.)
3. Always create a touchpoint `Activity` of `type=doneAs` (call/email/whatsapp/site_visit/demo/note) at `occurredAt=now`, linking back via `metadata.completesFollowUpId` when applicable.
4. If `reschedule` is provided: create a future `follow_up` activity and update `nextFollowUpDate`/`Mode` directly (bypassing the controller hook to keep this atomic). Otherwise: null `nextFollowUpDate`/`Mode`.
5. Bump `lastActivityAt=now` regardless (touchpoint just happened).

The `/follow-ups/completed` aggregation filters and sorts by `metadata.completedAt` (not `occurredAt`), so follow-ups completed early — before their scheduled time — appear under the day they were actually closed.

**Frontend (`useCompleteFollowUp`)** now calls this single endpoint instead of orchestrating multiple `POST /activities` + `DELETE /follow-up` writes; the `FollowUpsTable → Done` popover and any future inline "Mark done" surfaces share the same path.

**Completed section UI** (`FollowUpsTable`): a fourth section "Completed (last 30 days)" renders below "Upcoming". Each row shows prospect, mode, completed-at (with original due-at underneath), a green `Done · <doneAs>` badge, stage, deal value, and a `View` link. No row actions.

**Activity timeline badges** for `follow_up` items:
- `Scheduled` (cyan) when `occurredAt > now`.
- `Done · <doneAs>` (emerald) when `metadata.completedAt` is set.
- `Missed` (amber) when `occurredAt <= now` and `metadata.completedAt` is unset.