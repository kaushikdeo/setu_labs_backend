CRM — Opportunity module plan & prospect-to-opportunity transition

---

## Table of contents

1. [What the Opportunity module is](#1-what-the-opportunity-module-is)
2. [How it differs from the Prospects module](#2-how-it-differs-from-the-prospects-module)
3. [Prospect-to-opportunity transition — full plan](#3-prospect-to-opportunity-transition--full-plan)
4. [Opportunity stages — complete lifecycle](#4-opportunity-stages--complete-lifecycle)
5. [Top navigation — Opportunities mega-menu](#5-top-navigation--opportunities-mega-menu)
6. [Secondary sub-navigation tabs](#6-secondary-sub-navigation-tabs)
7. [Left sidebar items — Opportunities section](#7-left-sidebar-items--opportunities-section)
8. [Pages and sub-pages](#8-pages-and-sub-pages)
9. [Quote versioning and management](#9-quote-versioning-and-management)
10. [Approval workflow](#10-approval-workflow)
11. [Margin analysis](#11-margin-analysis)
12. [Win and loss tracking](#12-win-and-loss-tracking)
13. [Complete fields list — Opportunity module](#13-complete-fields-list--opportunity-module)
14. [Complete fields list — Quote table](#14-complete-fields-list--quote-table)
15. [Complete fields list — Quote line item table](#15-complete-fields-list--quote-line-item-table)
16. [Database relationship model](#16-database-relationship-model)
17. [Automation and workflow rules](#17-automation-and-workflow-rules)
18. [Permissions by role](#18-permissions-by-role)
19. [Integrations](#19-integrations)
20. [Notifications and reminders](#20-notifications-and-reminders)
21. [Development phases](#21-development-phases)

---

## 1. What the Opportunity module is

The Opportunity module is the commercial engine of CRM. Every record here represents a deal that has moved past qualification and into active commercial preparation — scope has been defined, a quotation is being built or has been sent, and the company is investing engineering, administrative, and management resources to win the deal.

An Opportunity is where selling stops and proposing begins. It is where the salesperson, the quotation admin, the engineer, and the manager all work together on the same record toward a single outcome: getting a signed PO.

Every Opportunity record is:
- Linked to a parent Prospect record (its commercial origin)
- Linked to one or more Quote records (each with version history)
- Assigned a named opportunity with a formal scope of work
- Tracked through a defined set of stages from Scope Defined to Won or Lost
- Visible in pipeline reports, forecast views, and margin analysis

The Opportunity module also handles the complete quotation lifecycle — drafting, internal review, approval, PDF generation, sending to the customer, revision management, and eventual conversion to a Sales Order when the PO is received.

---

## 2. How it differs from the Prospects module

| Dimension | Prospects module | Opportunity module |
|---|---|---|
| Primary question | How do we win this deal? | How do we quote and close this deal? |
| Scope of work | Verbal description only | Written, documented, agreed |
| Quotation | Does not exist yet | Central deliverable — multiple versions |
| Line items | Not applicable | Specific products/services with qty, rate, GST |
| Engineering involvement | Occasional (demo, site visit) | Mandatory — specs, BOM, technical review |
| Quotation admin | Not involved | Owns the quotation document |
| Margin tracking | Not tracked | Tracked per quote version |
| Approval workflow | Not applicable | Triggered by value, discount, or margin |
| Internal team | Salesperson only | Salesperson + admin + engineer + manager |
| Outcome tracking | Win/loss at deal level | Win/loss with quote version, price gap, competitor |

---

## 3. Prospect-to-opportunity transition — full plan

### 3.1 The meaning of the transition

Converting a Prospect to an Opportunity is the decision to formally invest company resources — engineering time, admin time, and management attention — in preparing a priced commercial proposal for this customer.

A Prospect becomes an Opportunity when:

1. The customer has asked for a formal quotation (explicit request)
2. The scope of work has been documented in writing (not verbal only)
3. Technical specifications are known well enough to price accurately
4. A submission deadline has been set
5. The appropriate quotation admin and technical reviewer have been identified

If any of these is missing, the record stays as a Prospect. Creating an Opportunity without a defined scope produces a wrong quotation, scope disputes after the PO, and margin erosion.

---

### 3.2 What triggers the conversion

The conversion is triggered when the salesperson clicks "Create opportunity" from the Prospect detail page. This action:

- Opens the conversion modal (see section 3.4)
- Requires all mandatory fields to be filled before confirming
- On confirmation, creates a linked Opportunity record
- Auto-drafts the first Quote record (QT-XXXX-V1) with fields pre-populated
- Notifies the quotation admin with the submission deadline
- Notifies the technical reviewer to begin spec review
- Does not close or delete the Prospect record — it remains the commercial origin record

---

### 3.3 Conversion gates — mandatory before creating an opportunity

The following must be confirmed through conversation and documented in the system. The "Create opportunity" button remains disabled until all mandatory fields are filled.

#### Scope of work (mandatory)

The customer has described — and the salesperson has documented — exactly what needs to be supplied, installed, commissioned, or delivered. The scope must be written, not verbal.

Qualifying scope: "Supply, install, and commission 4 × 125TR central HVAC units including chiller plant, AHUs, ducting, and controls for a 4-lakh sqft manufacturing facility at Chakan, Pune."

Not a qualifying scope: "They need HVAC for a big factory in Pune."

The engineer cannot build a BOM from a vague description. The quotation admin cannot price without a defined scope. Scope disputes after PO are almost always caused by an undocumented scope at the quotation stage.

#### Technical specifications (mandatory)

Capacity required, brand preferences, model specifications, site conditions, and any drawings or technical documents provided by the customer. The technical reviewer uses these to verify that the quotation is priced correctly for what needs to be delivered.

If technical drawings are not yet available, the field is set to "Pending from customer" — the quote cannot proceed to Approved status until drawings are received or explicitly waived.

#### Quote submission deadline (mandatory)

The hard date by which the quotation must reach the customer. This may be a tender deadline, a customer meeting date, or a verbal commitment from the salesperson.

The quotation admin uses this date to plan the preparation timeline backwards: technical review, internal approval, PDF generation, and dispatch must all complete before this date.

#### Opportunity type (mandatory)

Which category the deal falls into: Supply & installation, Supply only, AMC / service contract, Turnkey project, or Consultancy. This determines which quote template is used, which approval workflow applies, and what GST treatment and T&C template are automatically applied.

#### Payment terms (mandatory)

The advance percentage, milestone payment schedule, and credit days agreed with or expected by the customer. This determines whether the deal is commercially viable and structures the invoice schedule that follows when the PO is received.

---

### 3.4 What data carries over automatically from the Prospect record

When the conversion is confirmed, the following fields auto-populate on the new Opportunity record without the salesperson re-entering anything.

| Field | Behaviour |
|---|---|
| Customer / company name | Copied identically |
| Contact person name | Copied identically |
| Mobile and email | Copied identically |
| Confirmed deal value (₹) | Copied — becomes the target for quote value |
| Expected close date | Copied — becomes the opportunity close date |
| Win probability (%) | Copied — updated to stage-default on conversion |
| BANT qualification notes | Copied — visible in opportunity history |
| Lead source and campaign | Copied — preserved for attribution reporting |
| Competitor details | Copied — used in win/loss analysis |
| Number of decision makers | Copied |
| Assigned salesperson | Copied — can be re-assigned |
| Full activity timeline | All calls, emails, WhatsApp, notes, site visit logs from both Lead and Prospect stages are linked and visible on the Opportunity record |
| Prospect ID reference | Stored as a linked field — bidirectional navigation between records |

---

### 3.5 What does not carry over and must be entered fresh

The following are new fields that only exist at the Opportunity stage. They must be filled in the conversion modal.

| Field | Why it must be entered fresh |
|---|---|
| Opportunity name | A formal, human-readable identifier for this commercial engagement |
| Opportunity type | Determines template, workflow, and GST treatment |
| Scope of work (written) | Must be formally documented — verbal description from Prospect is not sufficient |
| Technical specifications | May have been discussed informally; must now be formally confirmed |
| Quote submission deadline | A new field that drives the entire internal preparation schedule |
| Quotation owner | Who builds the quotation document |
| Technical reviewer | Who validates the specs and BOM |
| Approval threshold | What discount or margin level triggers manager review |
| Site visit confirmation | Was the site physically visited before quoting? |
| Warranty period | What warranty commitment is being made |
| Delivery timeline | Weeks from PO — operations needs this to resource-plan |

---

### 3.6 What happens to the Prospect record after conversion

The Prospect record is:
- Marked with status **Converted to opportunity**
- Not deleted — remains fully accessible
- Linked bidirectionally to the new Opportunity record ("View opportunity" link on Prospect, "View original prospect" link on Opportunity)
- Included in prospect-stage analytics with the converted status
- Not editable for BANT fields after conversion (locked for audit integrity)
- Re-activatable if the Opportunity is lost and a future opportunity arises with the same customer

---

### 3.7 What the salesperson does in the 24 hours after conversion

1. Introduce the quotation admin to the opportunity — brief Vijay on the scope, the customer's priorities, and the deadline
2. Send any technical documents received from the customer to the technical reviewer
3. Confirm the submission date with the customer: "We will have the proposal ready by [date]"
4. Log this confirmation on the Opportunity timeline
5. For deals above ₹25 Lakhs: brief the sales manager verbally
6. Create a follow-up task for the day before the submission deadline to review the draft

---

## 4. Opportunity stages — complete lifecycle

The Opportunity stage is the primary field that drives the pipeline view, the forecast calculation, and the next-action automation. Every stage has a default win probability, a set of allowed actions, and a set of automatic notifications.

### Stage map

```
[Prospect converted]
        │
        ▼
Stage 1 ── Scope defined
        │   Customer has asked for a quote. Scope documented.
        │   Internal team assigned. Preparation begins.
        │
        ▼
Stage 2 ── Quote in progress
        │   Quotation admin is actively building the document.
        │   Line items, pricing, GST, T&C being prepared.
        │
        ▼
Stage 3 ── Under internal review
        │   Draft quote submitted for technical and manager review.
        │   Engineer checking specs. Manager checking margin.
        │
        ▼
Stage 4 ── Quote approved
        │   Internal review complete. Quote approved for sending.
        │   PDF generated. Ready to dispatch.
        │
        ▼
Stage 5 ── Quote sent
        │   Quotation delivered to customer by email with PDF.
        │   Follow-up sequence activated.
        │
        ▼
Stage 6 ── Revision requested
        │   Customer has asked for changes — price, scope, or terms.
        │   New version being prepared. Previous version superseded.
        │   (May cycle back to Stage 2 multiple times)
        │
        ▼
Stage 7 ── Negotiation
        │   Customer is engaging on commercial terms.
        │   Discounts, payment terms, delivery being negotiated.
        │   Manager involved for deals above threshold.
        │
        ▼
Stage 8 ── Verbal commitment
        │   Customer has verbally agreed.
        │   Waiting for formal PO to be issued internally.
        │
        ├─────────────────────────────┐
        │                             │
        ▼                             ▼
Stage 9 ── Won                Stage 10 ── Lost
        │   PO received &             │    Customer chose another
        │   verified.                 │    vendor, cancelled, or
        │   Deal closed.              │    indefinitely deferred.
        │
        ▼
[Handover to service / operations]
Sales Order created → Delivery Challan → Invoice → Payment
```

---

### Stage definitions — detailed

#### Stage 1 — Scope defined

The prospect has been converted. Scope of work is documented. Internal team is assigned. The quotation has not started yet.

Customer status: Has asked for a formal quotation. Expecting a proposal within the agreed timeframe. May be simultaneously requesting quotes from competitors.

Your team: Quotation admin reviews the scope. Technical reviewer begins BOM preparation. Salesperson confirms submission deadline with customer.

Win probability default: 40%

---

#### Stage 2 — Quote in progress

The quotation admin is actively building the quotation document. Line items are being entered, pricing is being calculated, GST is being applied, and terms and conditions are being attached.

Customer status: Waiting. May be following up to check on the status. A check-in call from the salesperson at this stage — "We are finalising your proposal and will have it ready by Thursday" — reinforces professionalism and keeps the deal warm.

Your team: Quotation admin owns this stage. Engineer provides BOM confirmation. Salesperson stays in contact with the customer. No quote should take more than 3 business days to prepare for standard items, or 5 business days for complex projects.

Win probability default: 40%

---

#### Stage 3 — Under internal review

The draft quotation has been submitted by the quotation admin for review. Two reviews happen in parallel: the technical reviewer checks that specs, quantities, and delivery timelines are accurate; the manager checks that the margin is acceptable and the discount is within policy.

Customer status: Still waiting. This stage should not exceed 1 business day for standard deals or 2 business days for large complex deals.

Your team: Technical reviewer and manager must review and either approve or return with comments. If returned with comments, the quote goes back to Stage 2 for revision before re-submission.

Win probability default: 45%

---

#### Stage 4 — Quote approved

Both the technical review and the manager approval are complete. The quotation is approved for sending. The PDF is generated and ready for dispatch.

Customer status: Unaware of internal progress. Expecting the quote shortly.

Your team: Quotation admin generates the PDF. Salesperson prepares the covering email with a personalised note referencing specific requirements discussed in the discovery meeting.

Win probability default: 50%

---

#### Stage 5 — Quote sent

The approved quotation has been delivered to the customer by email with the PDF attached. A personalised covering note accompanies it. The follow-up sequence is automatically activated.

Customer status: Reviewing the proposal. Comparing with competitor quotes. Internally discussing the investment. May have questions or concerns not yet shared.

Your team: Follow-up sequence activates automatically — Day 3 phone call, Day 7 email, Day 10 phone call, Day 14 manager call, Day 21 final email with validity reminder.

Win probability default: 55%

---

#### Stage 6 — Revision requested

The customer has responded with a request for changes. This may be a price reduction, a scope change, an addition of optional items, a change in payment terms, or a request for an alternative product model.

Customer status: Engaged and serious. A revision request means the customer is interested enough to negotiate — they have not rejected the quote, they are working toward a version they can accept. This is a positive signal.

Your team: The original quote is marked as Superseded. A new version (V2, V3, etc.) is created. No quote is ever deleted. The salesperson must understand the specific change requested before the admin starts the revision — a vague "make it cheaper" instruction without a target number will result in multiple revision cycles.

Win probability default: 60%

---

#### Stage 7 — Negotiation

The customer is actively engaging on commercial terms. The discussion has moved beyond the document into a real-time conversation about price, payment terms, delivery timelines, warranty, or scope.

Customer status: Serious buyer. Comparing your final commercial position with at least one competitor. Testing your flexibility and confidence. How you negotiate reflects how you will perform as a supplier.

Your team: Salesperson handles the negotiation with guidance from the manager. Any discount above the defined threshold requires manager approval before it is offered verbally or in writing. Every concession offered must be logged on the Opportunity timeline immediately — verbal promises become disputes if not documented.

Win probability default: 70%

---

#### Stage 8 — Verbal commitment

The customer has verbally agreed to proceed with your company and your quote. They are now processing the formal Purchase Order internally — going through their finance team, getting approvals, and preparing the PO document.

Customer status: Committed. Their internal processes are the only remaining barrier. A PO can take anywhere from 1 day to 3 weeks depending on the customer's internal bureaucracy and deal size.

Your team: Salesperson confirms the verbal commitment in writing: "Thank you Rajiv, we are delighted to work with Tata Projects on this. Please send us the formal PO when ready and we will begin mobilisation immediately." This email creates a paper trail and gently accelerates their internal process.

Win probability default: 90%

---

#### Stage 9 — Won

The formal Purchase Order has been received and verified. The deal is commercially closed.

Customer status: Buyer. Committed. Expecting smooth, professional delivery. Everything promised in the quotation will be tested in the execution phase.

Your team: PO is verified against the accepted quote (line items, values, terms must match). Sales Order is created. Handover to operations and service team. Salesperson's target is credited. Manager is notified.

Win probability: 100%

---

#### Stage 10 — Lost

The customer has chosen a competitor, cancelled the project, or deferred indefinitely.

Customer status: Made a different decision. Does not mean they will never buy from you. A gracious, professional response to a loss preserves the relationship for future opportunities.

Your team: Loss reason is mandatory (see section 12). Customer is tagged for nurture. Competitive intelligence is logged. The lost deal is reviewed in the weekly pipeline meeting.

Win probability: 0%

---

### Stage probability matrix

| Stage | Default win probability | Typical duration |
|---|---|---|
| Scope defined | 40% | 1–2 days |
| Quote in progress | 40% | 2–5 business days |
| Under internal review | 45% | 1–2 business days |
| Quote approved | 50% | Same day |
| Quote sent | 55% | 3–21 days |
| Revision requested | 60% | 2–5 business days |
| Negotiation | 70% | 3–14 days |
| Verbal commitment | 90% | 1–21 days |
| Won | 100% | — |
| Lost | 0% | — |

---

## 5. Side navigation — Opportunities ( collapsable menu )

When the user clicks Opportunities in the top navigation bar

### Column 1 — Opportunity views

| Menu item | Badge | Description |
|---|---|---|
| All opportunities | 47 | Full list with filter and sort |
| My opportunities | — | Assigned to logged-in user |
| Quote in progress | 12 | Actively being prepared |
| Quote sent | 18 | Awaiting customer response |
| Negotiation | 8 | Active commercial discussion |
| Won this month | 11 | Closed won deals MTD |
| Lost this month | 4 | Closed lost deals MTD |

### Column 2 — Actions and tools

| Menu item | Description |
|---|---|
| Create opportunity | Convert from prospect or create standalone |
| Pending approvals | Quotes awaiting manager sign-off |
| Create quotation | Start a new quote against an opportunity |
| Forecast view | Revenue forecast by stage and close month |
| Win / loss analysis | Why deals are won and lost |
| Margin report | Margin by opportunity, rep, and product |
| Opportunity settings | Stages, approval thresholds, templates |

---

## 6. Secondary sub-navigation tabs

| Tab | Icon | Action |
|---|---|---|
| All opportunities | List | Master list view |
| Kanban | Layout-kanban | Visual pipeline by stage |
| Forecast | Chart-line | Weighted revenue by close month |
| Pending approvals | Clock | Quotes awaiting sign-off |
| Won / lost | Trophy | Closed deals with analysis |
| Analytics | Chart-bar | Stage conversion, velocity, margin reports |

---

## 7. Left sidebar items — Opportunities section

```
Opportunities
  ├── All opportunities          [47]
  ├── My opportunities
  ├── Scope defined              [6]
  ├── Quote in progress          [12]
  ├── Under review               [5]
  ├── Quote sent                 [18]
  ├── Negotiation                [8]
  ├── Verbal commitment          [4]
  ├── Won this month             [11]
  └── Lost this month            [4]

Quotations
  ├── All quotes
  ├── Pending approvals          [8]
  ├── Draft quotes               [7]
  ├── Sent quotes                [18]
  └── Quote templates

Pipeline tools
  ├── Forecast view
  ├── Margin analysis
  └── Win / loss analysis
```

---

## 8. Pages and sub-pages

### 8.1 All opportunities — list view

KPI stat cards (4 across top):

| Stat | Value | Indicator |
|---|---|---|
| Total opportunities | 47 | Active pipeline |
| Pipeline value | ₹6.2 Cr | Total deal value |
| Quotes pending send | 12 | Ready but not yet sent |
| Pending approvals | 8 | Awaiting manager sign-off |

Filter bar:
- Search box — by opportunity name, customer, quote number
- Quick filter chips: All · My deals · Quote in progress · Negotiation · Due this week
- Sort: by value, close date, stage, last activity

Table columns:

| Column | Type | Notes |
|---|---|---|
| Opportunity name | Text | Human-readable deal identifier |
| Customer / company | Text | Contact name and company |
| Opportunity value | Currency | Confirmed deal value |
| Stage | Pill badge | Colour-coded by stage |
| Latest quote | Text + status | Quote number and current status |
| Submission deadline | Date | Red if overdue |
| Assigned to | Text | Salesperson name |
| Actions | ··· | View, edit, create quote, mark won/lost |

---

### 8.2 Opportunity detail view

Header section:
- Opportunity name (large, prominent)
- Customer name, contact, city
- Status pills: stage, deal value, win probability, close date
- Action buttons: Create quote · Edit · Mark won · Mark lost

Pipeline stage progress bar:
A horizontal tracker showing all 10 stages with the current stage highlighted and completed stages marked. Clicking a stage allows the salesperson to advance or retreat the deal with a confirmation dialog.

Tabs within the Opportunity detail view:

#### Tab 1 — Overview

Two-column grid of detail cards:

Deal details card:
- Opportunity value (₹)
- Win probability (%)
- Weighted value (value × probability)
- Expected close date
- Days remaining to deadline
- Opportunity type
- Industry / segment

Qualification summary card:
- Budget status
- Decision authority
- Number of decision makers
- Competitors being evaluated
- Decision timeline
- Original prospect ID (link)

Scope of work card (full width):
- Written scope summary
- Site location
- Site visit status
- Technical specification summary
- Drawings attached (yes / pending / not required)

Commercial framework card:
- Payment terms
- Delivery timeline
- Warranty period
- Applicable T&C template

Internal team card:
- Assigned salesperson
- Quotation owner
- Technical reviewer
- Approval threshold

Activity timeline:
Full chronological log of every interaction from Lead stage through Prospect stage through Opportunity stage. Activity types: calls, emails, WhatsApp, site visits, demo sessions, quote events (created, revised, sent, approved), stage changes, notes, system events.

---

#### Tab 2 — Activities

Dedicated view of the full activity timeline with:
- Filter by activity type (calls only, emails only, quotes only)
- Log new activity button
- Schedule follow-up button
- Each entry shows: type icon, description, outcome, next step agreed, timestamp, logged by

---

#### Tab 3 — Products

List of product and service categories being quoted, with:
- Category / product name
- Specification summary
- Estimated quantity
- Any brand or model requirements noted
- Link to finalised line items in the active quote

---

#### Tab 4 — Quotes

The central tab for the Opportunity. Shows all quote versions in chronological order.

Columns: Quote number, Date, Version, Amount (excl. GST), Status, Actions

Actions per quote row:
- View — opens the full quote record
- Revise — creates a new version (current version marked Superseded)
- Send email — sends the PDF to the customer with a covering note
- Generate PDF — regenerates the PDF from current data
- Convert to order — visible only on the Accepted quote

Quote status values: Draft · Under review · Approved · Sent · Under review by customer · Revision requested · Accepted · Rejected · Superseded

The primary (accepted) quote row is visually distinguished with a green left border.

Footer note: "No quote is ever deleted. Every version is preserved for audit and history."

---

#### Tab 5 — Visits

Log of site visits associated with this opportunity:
- Visit date
- Location
- Who attended (salesperson + engineer names)
- Visit purpose (initial scoping, technical survey, demo, pre-delivery inspection)
- Visit notes
- Photos attached (thumbnail grid)
- Next visit scheduled

---

#### Tab 6 — Documents

All documents attached to this opportunity:
- Technical drawings (from customer)
- Competitor's tender documents (if obtained)
- BOQ (bill of quantities from customer)
- Internal BOM prepared by engineer
- Quote PDFs (all versions)
- Customer PO (uploaded on win)
- Any other attachments

Each document shows: filename, uploaded by, upload date, file size, download / preview button.

---

#### Tab 7 — Tasks

All FollowUpTask records linked to this opportunity:
- Pending tasks (sorted by due date)
- Completed tasks (muted, strike-through)
- Add task button
- Each task: title, due date, mode, assigned to, priority, status

---

#### Tab 8 — Margin

Margin analysis across all quote versions:

Table: Quote version, Revenue (excl. GST), Estimated cost, Gross margin (%), Margin vs floor

Cost breakdown for the active quote:
- Materials cost
- Labour / service cost
- Overhead allocation
- Total cost

Margin health indicator:
- Green: margin ≥ 35%
- Amber: margin 28–35%
- Red: margin < 28% (below floor — requires special approval)

---

### 8.3 Create opportunity — conversion modal

See section 3.4 above. The modal has five sections:
1. Contact and deal info — auto-filled from prospect (read only)
2. Opportunity identity — name, type, submission deadline (new, mandatory)
3. Scope of work — written scope, site location, site visit status (new, mandatory)
4. Technical specification — capacity, brand, drawings (new, mandatory)
5. Commercial framework — payment terms, delivery timeline, warranty (new, mandatory)
6. Internal ownership — quotation owner, technical reviewer, approval threshold (new, mandatory)

---

### 8.4 Create quote page

When the quotation admin creates a new quote (or revision), this is the full page they work on.

Header section:
- Quote number (auto-generated: QT-YYYY-NNN-VN)
- Opportunity name (linked, read only)
- Customer and contact (auto-filled)
- Quote date (today by default)
- Validity date (30 days by default, editable)
- Quote type (from opportunity type)

Line items section:
- Add line item button
- Each line item: description, SAC/HSN code, quantity, UOM, unit rate, discount %, net amount, GST rate, GST amount, total with GST
- Reorder by drag-and-drop
- Optional line items (customer can accept or decline per line)
- Subtotals auto-calculated

Tax summary section:
- GST type selector: CGST + SGST (intra-state) or IGST (inter-state)
- Tax breakup table: taxable value per rate, CGST, SGST, IGST, total GST
- Grand total (excl. GST), total GST, grand total (incl. GST)
- TDS deduction field (if applicable)
- Net payable

Commercial terms section:
- Payment terms (from opportunity, editable)
- Delivery timeline
- Warranty period
- Validity period
- Special conditions (free text)

Scope and inclusions section:
- Scope of supply (formatted text, pre-filled from opportunity scope)
- Inclusions list
- Exclusions list (critical — what is NOT included prevents scope disputes)
- Terms and conditions (from T&C template library, auto-selected by opportunity type)

Internal fields (not printed on PDF):
- Cost price per line item (for margin calculation)
- Total estimated cost
- Gross margin %
- Notes for reviewer

Actions:
- Save draft
- Submit for review
- Preview PDF
- Generate and download PDF

---

### 8.5 Forecast view

Revenue forecast by month and quarter based on expected close dates and win probabilities.

Summary section:
- Total pipeline value (all open opportunities)
- Weighted pipeline value (sum of value × probability)
- Monthly breakdown: this month / next month / quarter end

Scenarios:
- Conservative: sum of deals at 75%+ probability
- Most likely: sum of all weighted values
- Optimistic: sum of all deal values at 100%

---

### 8.6 Pending approvals page

For the manager and quotation admin. Shows all quotes awaiting approval.

Table columns: Quote number, Opportunity name, Value, Margin %, Discount %, Submitted by, Submitted at, Age (days), Actions (Approve / Return with comments)

Sorted by: age (most overdue first)

SLA: All quotes should be approved within 1 business day. The system flags quotes awaiting approval for more than 24 hours.

---

## 9. Quote versioning and management

### Versioning format

```
QT-YYYY-NNN-VN
     │    │   │
     │    │   └── Version number (V1, V2, V3...)
     │    └────── Sequential opportunity number (001, 002, 003...)
     └─────────── Year (2026, 2027...)

Example: QT-2026-048-V1, QT-2026-048-V2, QT-2026-048-V3
```

### Version lifecycle rules

1. A quote is created as a Draft (V1)
2. On approval and sending, it becomes the active quote
3. When a revision is needed, the current version is marked Superseded and a new version is created (V2)
4. The new version inherits all fields from the previous version as a starting point
5. No version is ever deleted from the database
6. Only one version per opportunity can have `IsPrimary = true` at any time
7. `IsPrimary` is automatically set to true on the Accepted version

### Version status values

| Status | Description |
|---|---|
| Draft | Being built by quotation admin — not yet submitted |
| Under review | Submitted for internal technical and manager review |
| Approved | Both reviews passed — ready to send |
| Sent | Delivered to customer |
| Revision requested | Customer asked for changes — new version being prepared |
| Accepted | Customer accepted this version — IsPrimary = true |
| Rejected | Customer formally declined this version |
| Superseded | Replaced by a newer version — historical record only |

---

## 10. Approval workflow

### Workflow steps

```
Draft
  │
  ▼
Submitted for review
  │
  ├── Technical review (engineer)
  │       Check: specs correct, BOM accurate, delivery timeline realistic
  │       Outcome: Approved or Returned with comments
  │
  ├── Manager review (sales manager)
  │       Check: margin ≥ floor, discount within policy, commercial terms acceptable
  │       Outcome: Approved or Returned with comments
  │
  ▼ (both reviews passed)
Approved
  │
  ▼
Sent to customer
  │
  ├── Accepted → Won workflow
  └── Rejected → Loss workflow or Revision cycle
```

### Auto-trigger rules for manager review

Manager review is automatically required (cannot be bypassed) when any of the following conditions are true:

| Trigger condition | Reason |
|---|---|
| Deal value above ₹25 Lakhs | High-value deal requires senior sign-off |
| Discount exceeds 5% from list price | Margin protection |
| Gross margin below 28% | Below acceptable floor |
| Payment terms deviate from standard | Non-standard terms create cash flow risk |
| Delivery timeline shorter than standard lead time | Operations must confirm feasibility |

### Review SLA

- Technical review: complete within 1 business day
- Manager review: complete within 1 business day
- Combined: quote should move from Under review to Approved within 2 business days

---

## 11. Margin analysis

### Per-quote margin calculation

```
Gross margin = (Revenue − Estimated cost) / Revenue × 100

Revenue        = Sum of all line item net amounts (excl. GST)
Estimated cost = Materials cost + Labour / service cost + Overhead allocation
```

### Margin floors by opportunity type

| Opportunity type | Minimum acceptable margin | Special approval required below |
|---|---|---|
| Supply & installation | 28% | Manager + director |
| Supply only | 22% | Manager |
| AMC / service contract | 35% | Manager |
| Turnkey project | 25% | Manager + director |
| Consultancy | 45% | Manager |

### Margin visibility rules by role

| Role | Can see margin data |
|---|---|
| CEO | All opportunities |
| Sales manager | All opportunities in their team |
| Salesperson | Their own opportunities only |
| Quotation admin | All opportunities they manage |
| Engineer | No margin visibility |
| Accountant | Won opportunities only |

---

## 12. Win and loss tracking

### On marking Won

When the opportunity is marked Won, the following are mandatory:

- PO number (from the customer's Purchase Order document)
- PO date
- PO document upload (PDF scan of the customer's PO)
- Final accepted quote version (confirmed automatically from IsPrimary)
- Won date
- Actual won value (may differ slightly from quoted value if small adjustments were made)

System actions on Win:
- Opportunity status → Won
- Salesperson's monthly revenue target is credited
- Sales Order is automatically created from the accepted quote
- Operations / service team is notified
- Delivery Challan process is initiated

### On marking Lost

When the opportunity is marked Lost, the following are mandatory:

Loss reason (dropdown — one must be selected):
- Price too high — competitor was cheaper
- Competitor selected — better relationship
- Competitor selected — better product / specs
- Project cancelled by customer
- Project postponed indefinitely
- Budget not approved
- No response despite follow-up
- Technical specification mismatch
- Customer chose incumbent supplier
- Lost to tender process
- Other (requires notes)

Additional fields (mandatory when competitor is named):
- Competitor who won (company name)
- Competitor's approximate price (if known)
- Price gap (your price vs competitor price)
- Customer feedback (free text — what they told you)

### Win / loss analytics

Built from the accumulated loss reason data:

| Report | Description |
|---|---|
| Loss reason distribution | Which reasons account for most losses |
| Loss by competitor | Which competitors win most often against you |
| Price gap analysis | Average price gap when lost on price |
| Win rate by opportunity type | Which deal types close at the highest rate |
| Win rate by salesperson | Who closes most effectively |
| Win rate by lead source | Which sources produce the highest-quality opportunities |
| Average deal cycle | Days from opportunity creation to won / lost |

---

## 13. Complete fields list — Opportunity module

### Fields carried over from Prospect (auto-populated)

| Field | Type | Source |
|---|---|---|
| Opportunity ID | Auto | System-generated (OPP-0001) |
| Linked Prospect ID | Reference | Auto-linked |
| Customer / company | Text | Copied from Prospect |
| Contact person name | Text | Copied from Prospect |
| Mobile | Text | Copied from Prospect |
| Email | Email | Copied from Prospect |
| City, State | Text | Copied from Prospect |
| Confirmed deal value | Currency | Copied from Prospect |
| Expected close date | Date | Copied from Prospect |
| Win probability | % | Copied — updated to stage default |
| Budget status | Dropdown | Copied from Prospect BANT |
| Decision authority | Dropdown | Copied from Prospect BANT |
| Decision timeline | Dropdown | Copied from Prospect BANT |
| Number of decision makers | Dropdown | Copied from Prospect |
| Competitors being evaluated | Text | Copied from Prospect |
| Lead source | Dropdown | Copied — preserved for attribution |
| Assigned salesperson | Dropdown | Copied — can be changed |
| Activity timeline | Reference | All Lead + Prospect history linked |

### New fields added at Opportunity stage

| Field name | Type | Required | Description |
|---|---|---|---|
| Opportunity name | Text | Yes | Human-readable deal identifier |
| Opportunity type | Dropdown | Yes | Supply+install / Supply only / AMC / Turnkey / Consultancy |
| Quote submission deadline | Date | Yes | When quote must reach customer |
| Scope of work | Long text | Yes | Written formal scope |
| Site location | Text | No | Full delivery / installation address |
| Site visit completed | Dropdown + date | Yes | Yes (with date) / No — scheduled / Not required |
| Technical specifications | Long text | Yes | Capacity, brand, model, conditions |
| Drawings attached | Dropdown | Yes | Yes / Pending from customer / Not required |
| Payment terms | Dropdown | Yes | Advance % + milestone schedule |
| Delivery timeline | Text | Yes | e.g. "8 weeks from PO date" |
| Warranty period | Dropdown | Yes | 12 / 24 / 36 months |
| Quotation owner | User reference | Yes | Who builds the quote document |
| Technical reviewer | User reference | No | Who validates specs and BOM |
| Approval threshold | Dropdown | Yes | Deal value above which manager approval required |
| Stage | Dropdown | Yes | One of 10 defined stages |
| Active quote number | Reference | Auto | Linked to latest non-superseded quote |
| Active quote value | Currency | Auto | From linked quote |
| Active quote status | Reference | Auto | From linked quote |
| PO number | Text | Yes (if Won) | Customer's PO reference number |
| PO date | Date | Yes (if Won) | Date PO was issued |
| PO document | File | Yes (if Won) | PDF scan of customer PO |
| Won date | Date | Auto | Set when status → Won |
| Won value | Currency | Yes (if Won) | Actual confirmed value |
| Lost date | Date | Auto | Set when status → Lost |
| Loss reason | Dropdown | Yes (if Lost) | Mandatory category |
| Competitor who won | Text | No (if Lost) | Competitor company name |
| Competitor price | Currency | No | Approximate competitor quote value |
| Price gap | Currency | Auto | Won value − Competitor price |
| Customer feedback | Long text | No | What customer said when declining |
| Created from prospect | Reference | Auto | Bidirectional link |
| Conversion date | Timestamp | Auto | Date prospect was converted |
| Converted by | User reference | Auto | Salesperson who converted |
| Created at | Timestamp | Auto | Opportunity creation time |
| Last activity | Timestamp | Auto | Updated on every interaction |

---

## 14. Complete fields list — Quote table

| Field name | Type | Required | Notes |
|---|---|---|---|
| QuoteID | UUID | Auto | Primary key |
| Quote number | Text | Auto | QT-YYYY-NNN-VN format |
| OpportunityID | UUID | Yes | Foreign key → Opportunity |
| Quote version | Integer | Auto | 1, 2, 3... |
| Quote date | Date | Yes | Date quote was created |
| Validity date | Date | Yes | Date quote expires |
| Amount (excl. GST) | Currency | Auto | Sum of line item net amounts |
| GST amount | Currency | Auto | Calculated from line items |
| Total amount (incl. GST) | Currency | Auto | Amount + GST |
| TDS deduction | Currency | No | If applicable |
| Net payable | Currency | Auto | Total − TDS |
| Status | Enum | Yes | See version status values in section 9 |
| IsPrimary | Boolean | Auto | True only for Accepted quote |
| Payment terms | Dropdown | Yes | Inherited from opportunity, editable |
| Delivery timeline | Text | Yes | Inherited from opportunity, editable |
| Warranty period | Dropdown | Yes | Inherited from opportunity, editable |
| Scope of supply | Long text | No | Pre-filled from opportunity scope |
| Inclusions | Long text | No | What is included |
| Exclusions | Long text | Yes | What is NOT included — prevents disputes |
| T&C template used | Reference | Auto | Linked to T&C template library |
| Special conditions | Long text | No | Any additional commercial notes |
| PDF path | Text | Auto | Path to generated PDF file |
| Submitted for review at | Timestamp | Auto | When submitted to internal review |
| Approved by | User reference | Auto | Manager who approved |
| Approved at | Timestamp | Auto | When approval was given |
| Sent at | Timestamp | Auto | When emailed to customer |
| Customer PO number | Text | No | Filled when customer accepts |
| Cost price (internal) | Currency | No | Total estimated cost — not on PDF |
| Gross margin % | Calculated | Auto | (Amount − Cost) / Amount × 100 |
| Created by | User reference | Auto | Who created this version |
| Created at | Timestamp | Auto | |
| Superseded at | Timestamp | Auto | Set when a newer version is created |
| Notes for reviewer | Long text | No | Internal notes — not on PDF |

---

## 15. Complete fields list — Quote line item table

| Field name | Type | Required | Notes |
|---|---|---|---|
| LineItemID | UUID | Auto | Primary key |
| QuoteID | UUID | Yes | Foreign key → Quote |
| SortOrder | Integer | Yes | Display order — drag to reorder |
| Description | Text | Yes | Service or product name |
| SAC code | Text | Conditional | Required for services (GST) |
| HSN code | Text | Conditional | Required for goods (GST) |
| Quantity | Decimal | Yes | Numeric quantity |
| UOM | Dropdown | Yes | nos / sqft / kW / TR / hours / years / months |
| Unit rate | Currency | Yes | Per unit price |
| Discount % | Decimal | No | Line-level discount |
| Discount amount | Currency | Auto | Unit rate × qty × discount% |
| Net amount | Currency | Auto | (Unit rate × qty) − discount |
| GST rate | Dropdown | Yes | 0 / 5 / 12 / 18 / 28 % |
| GST type | Dropdown | Auto | IGST or CGST + SGST (from opportunity state vs company state) |
| GST amount | Currency | Auto | Net amount × GST rate |
| Total with GST | Currency | Auto | Net amount + GST amount |
| Cost price | Currency | No | Internal cost per unit — not on PDF |
| Line margin % | Calculated | Auto | (Net amount − cost) / Net amount × 100 |
| IsOptional | Boolean | No | Optional items shown separately on PDF |
| Notes | Text | No | Internal or customer-facing line note |
| Created at | Timestamp | Auto | |

---

## 16. Database relationship model

```
Customer
  └── Contact
  └── Lead                          (entry point)
        └── Prospect                (BANT qualified)
              └── Opportunity       (scope defined, quote engine active)
                    ├── Quote V1    (IsPrimary: false, status: Superseded)
                    ├── Quote V2    (IsPrimary: false, status: Superseded)
                    └── Quote V3    (IsPrimary: true, status: Accepted)
                          └── QuoteLineItems
                          └── SalesOrder
                                └── DeliveryChallan
                                └── Invoice
                                      └── PaymentRecord

Supporting tables:
  FollowUpTask         (linked to Opportunity)
  Activity             (linked to Opportunity, inherited from Lead and Prospect)
  Document             (linked to Opportunity)
  SiteVisit            (linked to Opportunity)
  TCTemplate           (linked to Opportunity via OpportunityType)
  User                 (salesperson, admin, engineer, manager)
  Product              (product / service catalogue)
```

### Relationship cardinalities

| Parent | Child | Cardinality |
|---|---|---|
| Customer | Contact | 1 → many |
| Customer | Opportunity | 1 → many |
| Opportunity | Quote | 1 → many (one IsPrimary) |
| Quote | QuoteLineItem | 1 → many |
| Quote | SalesOrder | 1 → 1 (accepted quote only) |
| SalesOrder | DeliveryChallan | 1 → many (partial deliveries) |
| SalesOrder | Invoice | 1 → many (milestone invoices) |
| Invoice | PaymentRecord | 1 → many (partial payments) |

---

## 17. Automation and workflow rules

### Stage-based automation

| Trigger | Automated action |
|---|---|
| Opportunity created | Notify quotation owner with deadline · Create task: "Begin quote preparation" |
| Stage → Quote in progress | Notify engineer: "Review spec for [Opportunity name]" |
| Stage → Under internal review | Notify manager and engineer: quote awaiting review |
| Internal review time > 24 hours | Escalation alert to manager |
| Stage → Approved | Notify salesperson: "Quote approved — ready to send" |
| Stage → Sent | Activate follow-up sequence (Day 3, 7, 10, 14, 21) |
| Stage → Revision requested | Notify quotation owner: new version needed |
| Stage → Negotiation | Notify manager: deal in negotiation |
| Stage → Verbal commitment | Notify manager: pending PO |
| Stage → Won | Create Sales Order · notify operations · credit salesperson target |
| Stage → Lost | Require loss reason · notify manager · tag for nurture |

### Stale opportunity rules

| Condition | Alert |
|---|---|
| No activity for 7 days | Reminder to salesperson |
| No activity for 14 days | Alert to salesperson + manager |
| Quote in progress > 5 days | Alert to quotation owner |
| Under review > 2 days | Escalation to manager |
| Quote sent, no response > 21 days | Flag as at-risk |
| Submission deadline in 2 days, quote not yet approved | Urgent alert to manager |

---

## 18. Permissions by role

| Role | View | Create | Edit | Approve | Delete | Win/Lost | Margin | Analytics |
|---|---|---|---|---|---|---|---|---|
| CEO | All | Yes | All | Yes | Yes | Yes | All | All |
| Sales manager | All | Yes | All | Yes | No | Yes | Team | Team |
| Salesperson | Own | Yes | Own | No | No | Own | Own | Own |
| Quotation admin | All | Quote only | Quote fields | No | No | No | All | No |
| Engineer | Assigned | No | Spec fields | Technical only | No | No | No | No |
| Accountant | Won only | No | No | No | No | No | Won | Revenue only |
| Marketing | All (read) | No | No | No | No | No | No | Source only |

---

## 19. Integrations

| Integration | Purpose |
|---|---|
| PDF generator | Generate professional quote PDFs from template |
| Email (Gmail / Outlook) | Send quote PDF and two-way email sync on timeline |
| Calendar (Google / Outlook) | Sync submission deadlines and review tasks |
| WhatsApp Business API | Send quote notification and follow-up messages |
| Telephony (Exotel / Knowlarity) | Click-to-call, auto-log call recordings |
| Finance module | Auto-create Sales Order from accepted quote |
| Service module | Auto-create Work Order from Sales Order |
| Product catalogue | Pull product / service list for line item entry |
| T&C template library | Auto-select and attach terms based on opportunity type |
| Excel / CSV | Export pipeline and margin analysis |
| Tally / ERP | Pass Sales Order and invoice data to accounting |
| Digital signature (optional) | Allow customer to sign and accept quote online |

---

## 20. Notifications and reminders

| Trigger | Type | Recipient |
|---|---|---|
| Opportunity created | In-app + push | Quotation owner + manager |
| Submission deadline in 5 days | Email reminder | Salesperson + quotation owner |
| Submission deadline in 2 days | Urgent alert | Salesperson + manager |
| Submission deadline passed, quote not sent | Critical alert | Manager |
| Quote submitted for review | In-app | Manager + technical reviewer |
| Review overdue > 24 hours | Escalation | Manager |
| Quote approved | In-app + push | Salesperson |
| Quote sent | In-app confirmation | Salesperson + quotation owner |
| Stage changed to Negotiation | Email alert | Manager |
| Stage changed to Verbal commitment | Push + email | Sales manager + CEO (if above ₹25L) |
| Deal marked Won | Push + email celebration | Salesperson + manager + team |
| Deal marked Lost | In-app | Manager (requires loss reason review) |
| Quote sent, no response > 14 days | At-risk flag | Salesperson + manager |
| Margin below floor in draft | Warning | Quotation owner + manager |

---

## 21. Development phases

### Phase 1 — Core opportunity pipeline (Week 1–3)
- Opportunity list view with filters and stage management
- Opportunity detail view with all tabs (Overview, Activities, Quotes, Tasks)
- Prospect-to-opportunity conversion modal with all mandatory gates
- Basic quote creation with line items (without GST split)
- Quote version history table on Quotes tab
- Stage progression and kanban board

### Phase 2 — Quotation engine (Week 4–6)
- Full quote creation page with SAC/HSN codes, UOM, GST calculation
- CGST + SGST vs IGST auto-detection based on state
- PDF generation from quote template
- Quote approval workflow with manager and technical review
- Margin calculation and display per quote version
- Pending approvals page
- Email sending with PDF attachment from quote record

### Phase 3 — Advanced commercial features (Week 7–8)
- Quote T&C template library linked to opportunity type
- Scope, inclusions, and exclusions section on quote
- Payment terms milestone schedule builder
- Win workflow — PO upload, Sales Order creation
- Loss workflow — mandatory reason, competitor logging, nurture tagging
- Win / loss analytics dashboard
- Margin analysis tab

### Phase 4 — Automation and integrations (Week 9–12)
- Stage-based automation (all triggers in section 17)
- Stale opportunity detection and alerts
- Follow-up sequence post quote send (Day 3, 7, 10, 14, 21)
- Digital signature integration for online quote acceptance (optional)
- Finance module integration — Sales Order → Invoice auto-creation
- Service module integration — Work Order from Sales Order
- Tally / ERP data pass
- Full role-based permissions enforcement
- Bulk actions (reassign, stage update, export)

---

## 22. Backend implementation — delivered (frontend-backend wired)

Frontend mocks (`mockOpportunityStore`, `mockQuoteStore`, `mockTcTemplateStore`) have been removed. The frontend now calls real REST endpoints exclusively. Three new backend modules were added and registered in `src/app.ts`.

### 22.1 Modules added

| Folder | Mongo collection | REST prefix |
|---|---|---|
| `src/modules/tc-template/` | `tctemplates` | `/api/tc-templates` |
| `src/modules/opportunity/` | `opportunities` | `/api/opportunities` |
| `src/modules/quote/` | `quotes` (line items embedded) | `/api/quotes` |

`src/modules/activity/` was extended to accept `entityType: 'opportunity'` so the existing generic activity timeline serves Opportunities without duplication.

### 22.2 TC template endpoints

| Method | Path | Auth |
|---|---|---|
| GET | `/api/tc-templates` | any authenticated |
| GET | `/api/tc-templates/default/:type` | any authenticated |
| GET | `/api/tc-templates/:id` | any authenticated |
| POST | `/api/tc-templates` | super_admin, sales_manager |
| PATCH | `/api/tc-templates/:id` | super_admin, sales_manager |
| DELETE | `/api/tc-templates/:id` | super_admin, sales_manager |

Only one default template is allowed per `opportunityType`; creating or updating one with `isDefault=true` clears the previous default.

### 22.3 Opportunity endpoints

| Method | Path | Auth |
|---|---|---|
| GET | `/api/opportunities` | any authenticated |
| GET | `/api/opportunities/stats` | any authenticated |
| GET | `/api/opportunities/kanban` | any authenticated |
| GET | `/api/opportunities/forecast` | any authenticated |
| GET | `/api/opportunities/stale` | any authenticated |
| GET | `/api/opportunities/win-loss` | any authenticated |
| GET | `/api/opportunities/by-prospect/:prospectId` | any authenticated |
| POST | `/api/opportunities/convert/:prospectId` | super_admin, sales_manager, sales |
| POST | `/api/opportunities` (standalone) | super_admin, sales_manager, sales |
| GET | `/api/opportunities/:id` | any authenticated |
| PATCH | `/api/opportunities/:id` | super_admin, sales_manager, sales |
| POST | `/api/opportunities/:id/stage` | super_admin, sales_manager, sales |
| POST | `/api/opportunities/:id/won` | super_admin, sales_manager, sales |
| POST | `/api/opportunities/:id/lost` | super_admin, sales_manager, sales |
| DELETE | `/api/opportunities/:id` | super_admin, sales_manager |

Highlights:
- Code generation `OPP-NNNN` via `srCounterService.nextSequence('opportunity')`.
- Conversion from a Prospect copies identity/BANT/competitors/tags and links bidirectionally (`prospectId`, `prospectCode`).
- Stage change writes a `STAGE_CHANGE` activity and triggers stage-based system tasks (`QUOTE_SENT` schedules Day 3/7/14 follow-ups, `NEGOTIATION` notifies manager for deals over the configured `approvalThreshold`, `VERBAL_COMMITMENT` schedules a PO chase in 2 days).
- Win/loss markers compute weighted value, mutate status, and write a `WON`/`LOST` activity with PO metadata or loss reason.
- Stale threshold = 7 days since `lastActivityAt`. `getStale` returns all open opportunities past this cutoff.
- Active-quote denormalisation fields (`activeQuoteId`, `activeQuoteNumber`, `activeQuoteStatus`, `activeQuoteValue`, `activeQuoteMarginPct`, `quoteCount`) are recomputed by the quote service after each quote-side mutation.

### 22.4 Quote endpoints

| Method | Path | Auth |
|---|---|---|
| GET | `/api/quotes` | any authenticated |
| GET | `/api/quotes/pending-approvals` | any authenticated |
| GET | `/api/quotes/:id` | any authenticated |
| POST | `/api/quotes` | super_admin, sales_manager, sales |
| PATCH | `/api/quotes/:id` | super_admin, sales_manager, sales |
| POST | `/api/quotes/:id/line-items` | super_admin, sales_manager, sales |
| PATCH | `/api/quotes/:id/line-items/:lineId` | super_admin, sales_manager, sales |
| DELETE | `/api/quotes/:id/line-items/:lineId` | super_admin, sales_manager, sales |
| POST | `/api/quotes/:id/line-items/reorder` | super_admin, sales_manager, sales |
| POST | `/api/quotes/:id/submit-for-review` | super_admin, sales_manager, sales |
| POST | `/api/quotes/:id/technical-review` | super_admin, sales_manager, sales |
| POST | `/api/quotes/:id/manager-review` | super_admin, sales_manager |
| POST | `/api/quotes/:id/generate-pdf` | super_admin, sales_manager, sales |
| POST | `/api/quotes/:id/send` | super_admin, sales_manager, sales |
| POST | `/api/quotes/:id/revise` | super_admin, sales_manager, sales |
| POST | `/api/quotes/:id/accept` | super_admin, sales_manager, sales |
| POST | `/api/quotes/:id/reject` | super_admin, sales_manager, sales |
| DELETE | `/api/quotes/:id` | super_admin, sales_manager (draft only) |

Number format: `QT-{YYYY}-{NNN}-V{n}`, counter keyed per calendar year (`srCounterService.nextSequence('quote-' + year)`). Revisions reuse the parent's number prefix and increment the trailing `Vn`.

Server-side line-item math on every save:
- `discountAmount = quantity * unitRate * discountPct / 100`
- `netAmount = quantity * unitRate - discountAmount`
- `gstAmount = netAmount * gstRate / 100`
- `cgst/sgst` split when opportunity state == `maharashtra`, else IGST
- `totalWithGst = netAmount + gstAmount`
- Line margin = `(netAmount - costPrice*quantity) / netAmount`
- Quote totals exclude `isOptional=true` lines

Manager-review trigger: amount ≥ ₹25 L OR any line discount > 5% OR margin below the per-type floor (Supply+Install 28%, Supply-only 22%, AMC 35%, Turnkey 25%, Consultancy 45%). The trigger is set on every recompute.

Revision workflow: `POST /api/quotes/:id/revise` clones the parent quote, sets the parent to `SUPERSEDED` with `supersededByQuoteId`, marks the new quote `isPrimary=true`, transitions the opportunity back to `QUOTE_IN_PROGRESS`, and writes a `SYSTEM` activity with `metadata.fromQuoteId` / `metadata.toQuoteId` so the activity timeline's quote-scope filter picks it up.

Send workflow: requires `APPROVED` status; sets `SENT`/`sentAt`/`sentTo`/`sentCc`, lazily generates a PDF URL placeholder, advances the opportunity to `QUOTE_SENT`, and writes an outbound `EMAIL` activity with `metadata.quoteId` so the per-quote activity log surfaces it.

### 22.5 Activity extension

`ActivityEntityType` now includes `'opportunity'`. Validation schemas (`listActivitiesQuerySchema`, `createActivitySchema`) accept `entityType=opportunity`. No new collection — opportunities reuse the existing `activities` collection. Quote-scoped activity filtering on the frontend uses `metadata.quoteId | fromQuoteId | toQuoteId`.

### 22.6 Frontend wiring

| File | Behaviour |
|---|---|
| `src/features/opportunities/api/tcTemplatesApi.ts` | calls `/api/tc-templates` |
| `src/features/opportunities/api/opportunitiesApi.ts` | calls `/api/opportunities`; `listActivities`/`addActivity`/`removeActivity` delegate to existing `activitiesApi` with `entityType='opportunity'` |
| `src/features/opportunities/api/quotesApi.ts` | calls `/api/quotes` |

The `src/features/opportunities/mock/` folder and all three mock stores have been deleted. No frontend file references them.

### 22.7 RBAC summary

- Read: any authenticated user.
- Sales/quote edits, conversions, stage/won/lost transitions, line-item CRUD, send, revise, accept, reject: `sales`, `sales_manager`, `super_admin`.
- Manager review and delete: `sales_manager`, `super_admin` only.
- Default template configuration (TC templates): `sales_manager`, `super_admin` only.

### 22.8 Counters reserved

- `opportunity` → `OPP-NNNN`
- `quote-YYYY` → `QT-YYYY-NNN-Vn` (per calendar year)

### 22.9 Quote PDF generation

Replaces the previous placeholder `pdfUrl` (`/quote-pdf/...`) with real PDF output using **pdfkit**, styled after `Quotation_format.pdf` (SciFi Sebex layout).

| Endpoint | Purpose |
|---|---|
| `POST /api/quotes/:id/generate-pdf` | Builds PDF, uploads to storage when configured, sets `pdfUrl` + `pdfGeneratedAt` |
| `GET /api/quotes/:id/pdf` | Authenticated inline PDF stream (used for preview + download) |

**Layout sections (matches `Quotation_format.pdf`):** logo + company block, bordered meta row (quotation no/date/reference | place of supply), bill-to & ship-to with grey headers, bordered subject row, full-grid line-item table (Sr No, item & description with `·` bullets, qty, rate, amount), footer grid (total in words + bank details | taxable amount + CGST9/SGST9 + total + signatory), terms & conditions, page frame + page numbers.

**Company profile:** defaults to SciFi Sebex constants in `quote-pdf.config.ts`; overridden by internal `Organization` record when present (name, address, contacts, **GSTIN**, **logo**).

**Organization logo:** uploaded on Organization → Basic Info (`/onboarding`); stored as `logoUrl`. PDF header embeds the image (PNG/JPG/WebP) when fetchable. SVG is skipped (pdfkit limitation).

**Frontend:** `fetchQuotePdfBlob` downloads via authenticated `GET /api/quotes/:id/pdf` (fixes `window.open` on a fake relative URL). Toolbar **Generate & download PDF** and PDF tab preview use this path.

**Pagination:** page breaks use a single tracked `y` cursor (`ensureSpaceAt`). Mixing `doc.y` with manual `y` in `drawLineItem` previously triggered double `addPage()` and a blank middle page when content neared the page bottom.

---