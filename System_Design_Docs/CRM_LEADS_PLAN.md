# CRM — Leads Module Plan

---

## 1. Overview

The Leads module is the entry point of the entire CRM pipeline. It captures every inbound and outbound contact who has expressed interest in your products or services but has not yet been qualified as a prospect. The goal of this module is to organise, prioritise, and convert leads into prospects as efficiently as possible.

---

## 2. Module objectives

- Capture leads from all sources in a single centralised place
- Assign each lead to a salesperson with a follow-up date
- Score and prioritise leads by temperature (Hot / Warm / Cold)
- Track every interaction on a per-lead timeline
- Convert qualified leads to prospects with one click
- Measure lead source quality and salesperson response times

---

## 3. Side navigation — Leads menu

When the user clicks **Leads** in the side navigation bar it should open all Leads view.

### Column 1 — Lead views

| Menu item | Badge | Description |
|---|---|---|
| All leads | 148 | Full list with filter and sort |
| Add new lead | — | Manual data entry form |
| Hot leads | 31 | Immediate follow-up required |
| Stale leads | 12 | No activity in 14+ days |
| My leads | — | Assigned to logged-in user |


---

## 4. Secondary sub-navigation tabs

Below the top nav, a horizontal tab bar appears whenever the user is inside the Leads module.

| Tab | Icon | Action |
|---|---|---|
| All leads | List | Shows the full leads list view |
| Add lead | Plus | Opens the new lead entry form |
| Hot leads | Flame | Filtered list — Hot temperature only |
| Import | Upload | CSV / Excel bulk import wizard |
| Segments | Filter | Saved filter groups (e.g. "Mumbai HVAC leads") |
| Analytics | Chart bar | Lead source, conversion, and response time reports |

**Right side of sub-nav:**
- Export button — downloads current filtered view as CSV
- New lead button (primary) — quick shortcut to add form

---

## 5. Left sidebar items — Leads section

```
Leads
  ├── All leads                [148]
  ├── Add new lead
  ├── Hot leads                [31]
  ├── My leads
  ├── Stale leads              [12]
  └── Import leads
```

---

## 6. Pages and sub-pages

### 6.1 All leads — list view

**Purpose:** Master view of every lead in the system.

**KPI stat cards (4 across top):**

| Stat | Value | Indicator |
|---|---|---|
| Total leads (MTD) | 148 | +22% vs last month |
| Hot leads | 31 | Need follow-up today |
| Conversion rate | 24% | +4 pts vs target |
| Avg. response time | 2.4 h | Target: < 2 h |

**Filter bar:**
- Search box (name, company, mobile)
- Quick filter chips: All · Hot · Today · Mine · Overdue
- Sort dropdown: by date, value, temperature, assigned

**Table columns:**

| Column | Type | Notes |
|---|---|---|
| Name / company | Text + subtext | Full name, company, city |
| Mobile | Text | Primary contact number |
| Source | Text | Web / LinkedIn / Cold call etc. |
| Temperature | Pill badge | Hot (red) / Warm (amber) / Cold (blue) |
| Assigned to | Text | Salesperson name |
| Follow-up date | Date | Red if overdue |
| Actions | ··· | Edit, call, email, convert, delete |

**Row click action:** Opens the Lead detail view for that lead.

---

### 6.2 Lead detail view

**Purpose:** Single record view for one lead with all information and interaction history.

**Header section:**
- Avatar (initials circle)
- Full name, designation, company, city
- Status pills: temperature, source, product interest, assigned salesperson
- Action buttons: Call · Email · WhatsApp · Convert to prospect (primary)

**Detail cards (2-column grid):**

*Contact details card:*
- Mobile, email, company, designation, city, state

*Lead qualification card:*
- Product / service interest
- Estimated deal value (₹)
- Decision timeline
- Budget status (confirmed / unknown / pending)
- Lead source and campaign name

**Activity timeline:**

Each activity entry shows:
- Icon by type (call, email, WhatsApp, note, system event)
- Description of the interaction
- Timestamp and salesperson name

Activity types logged: ( lets implement this later )
- Incoming / outgoing calls
- Emails sent and received
- WhatsApp messages
- Notes added manually
- System events (lead created, assigned, converted)

**Convert to prospect button:**
- Appears in the header action row
- On click, opens a qualification confirmation modal
- Moves the record to the Prospects module
- Logs a system event on the timeline

---

### 6.3 Add new lead — form

**Purpose:** Manual entry form to add a single lead.

**Section 1 — Contact information**

| Field | Type | Required |
|---|---|---|
| First name | Text input | Yes |
| Last name | Text input | Yes |
| Mobile number | Text input | Yes |
| Email address | Text input | No |
| Company / organisation | Text input | No |
| Designation / role | Text input | No |
| City | Text input | No |
| State | Dropdown | No |

**Section 2 — Lead source & qualification**

| Field | Type | Options |
|---|---|---|
| Lead source | Dropdown | Web form, LinkedIn, Cold call, Referral, Trade event, WhatsApp, Email campaign, Other |
| Campaign / medium | Text input | e.g. Google Ads Q2 Mumbai |
| Referred by | Text input | Name or company |
| Product / service interest | Dropdown | HVAC, Fire safety, Solar/MEP, AMC, Turnkey |
| Estimated deal value (₹) | Number input | — |
| Expected close date | Date picker | — |
| Industry / segment | Dropdown | Manufacturing, Real estate, Hospitality, Healthcare, IT/Offices, Government |
| Decision timeline | Dropdown | Immediate / Short / Medium / Long |
| Budget confirmed? | Dropdown | Unknown / Yes / No / Pending |

**Section 3 — Lead temperature**

- Hot / Warm / Cold selector (toggle dots)
- Label updates to show priority instruction

**Section 4 — Tags**

- Pre-set tags: High value, Government, Repeat buyer, Follow up, Inbound, Urgent
- Free-text tag entry

**Section 5 — Assignment & follow-up**

| Field | Type | Required |
|---|---|---|
| Assign to salesperson | Dropdown | Yes |
| Follow-up date | Date picker | No |
| Follow-up mode | Dropdown | Phone call / Email / WhatsApp / Site visit / Video call |
| Priority | Dropdown | Normal / High / Urgent / Low |
| Initial notes | Textarea | No |

**Form actions (bottom row):**
- Cancel
- Save draft
- Save & schedule follow-up
- Save & convert to prospect (for pre-qualified hot leads)
- Save lead (primary)

**On save:** triggers a follow-up reminder task for the assigned salesperson.

---

### 6.4 Hot leads — filtered view

**Purpose:** Urgent action list showing only Hot temperature leads.

- Same table layout as All leads
- Additional column: days since last contact
- Colour-coded due dates: red = overdue, amber = due today
- Quick-action buttons visible inline (Call, Follow-up)
- Sorted by: overdue first, then by follow-up date

---

### 6.5 Import leads — wizard

**Purpose:** Bulk upload leads from a CSV or Excel file.

**Implemented (all-or-nothing):**

| Endpoint | Purpose |
|---|---|
| `GET /api/leads/import/template` | Download blank `.xlsx` — **Leads** sheet (header row only) + **Field guide** sheet (required flags, enum values) |
| `POST /api/leads/import/validate` | Multipart `file` + JSON `defaults` — validates every row, returns all errors |
| `POST /api/leads/import` | Body `{ importId }` — commits cached valid rows in a MongoDB transaction |

**Flow:** Leads list → **Import** → upload file → set default assignee / source / temperature → **Validate**. If any row fails (required fields, enums, Joi rules, duplicate mobile in file or DB), every error is listed by row + field; **no leads are created**. When validation passes, **Import N leads** runs atomically (rollback on failure).

**Template columns:** First Name, Last Name, Mobile, Email, Company, Designation, Department, City, State, Source, Campaign, Referred By, Product Interest, Industry, Estimated Value, Expected Close Date, Decision Timeline, Budget Status, Temperature, Tags, Assigned To Email, Follow Up Date, Follow Up Mode, Priority, Notes. Per-row values override batch defaults for source, temperature, and assignee (by email).

**Limits:** 500 rows per file; 5 MB; `.xlsx` / `.xls` / `.csv`.

---

### 6.6 Lead segments

**Purpose:** Save custom filter combinations as named segments.

- Segment name (e.g. "Mumbai HVAC Hot leads")
- Filter criteria (source, temperature, product, city, date range)
- Segments appear in sidebar for one-click access
- Can be shared with team or kept private

---

### 6.7 Lead analytics

**Purpose:** Understand lead quality, source ROI, and team performance.

**Charts and metrics:**

| Chart | Description |
|---|---|
| Leads by source | Bar chart — which source generates most leads |
| Source conversion rate | Which source converts to prospects best |
| Lead volume trend | Month-over-month line chart |
| Temperature distribution | Hot / Warm / Cold breakdown |
| Salesperson response time | Average first-response by rep |
| Stale leads by rep | Who has the most neglected leads |
| Win rate by source | Which source leads close most often |

---

## 7. Lead lifecycle stages

```
Lead captured
      │
      ▼
New lead (uncontacted)
      │
      ▼
Contacted (first call / email made)
      │
      ▼
  ┌───┴───┐
  │   |   │
Warm cold Hot
  │    |  │
  └───┬───┘
      │
      ▼
Qualified → Convert to Prospect
      │
  (or)│
      ▼
Not interested → Closed / lost
      │
  (or)│
      ▼
Stale → Re-nurture campaign
```

---

## 8. Lead status definitions

| Status | Colour | Meaning |
|---|---|---|
| New | Gray | Just captured, not yet contacted |
| Contacted | Blue | First outreach made |
| Hot | Red | Urgent, high-intent, follow up today |
| Warm | Amber | Interested, follow up within 3 days |
| Cold | Blue | Low intent, nurture over time |
| Qualified | Green | Budget, need, and authority confirmed |
| Converted | Teal | Moved to Prospects module |
| Not interested | Gray | Explicitly declined |
| Stale | Amber | No activity in 14+ days |

---

## 9. Lead temperature rules (automation) ( lets implement this later )

| Rule | Action |
|---|---|
| Lead not contacted within 24 hours | Auto-escalate to manager |
| No activity for 7 days | Auto-change status to Stale |
| Budget confirmed + Immediate timeline | Auto-flag as Hot |
| Email opened 3+ times | Notify assigned salesperson |
| Follow-up date missed | Send reminder + mark overdue |

---

## 10. Fields — complete list

| Field name | Type | Required | Notes |
|---|---|---|---|
| Lead ID | Auto | System | Human-readable code (`LD-0001`) per org |
| UUID | Auto | System | Globally unique stable id (`uuid`, v4) for integrations |
| First name | Text | Yes | — |
| Last name | Text | Yes | — |
| Mobile | Text | Yes | Primary contact, used for WhatsApp |
| Email | Email | No | — |
| Company | Text | No | Organisation name |
| Designation | Text | No | Role / title |
| City | Text | No | — |
| State | Dropdown | No | Indian states list |
| Lead source | Dropdown | Yes | 8 source options |
| Campaign | Text | No | UTM / campaign name |
| Referred by | Text | No | Referrer name |
| Product interest | Dropdown | No | From product catalogue |
| Estimated value | Number | No | In Indian Rupees (₹) |
| Expected close date | Date | No | — |
| Industry | Dropdown | No | 6 industry segments |
| Decision timeline | Dropdown | No | 4 options |
| Budget status | Dropdown | No | 4 options |
| Temperature | Toggle | Yes | Hot / Warm / Cold |
| Tags | Multi-select | No | Free-form + preset |
| Assigned to | Dropdown | Yes | From active users |
| Follow-up date | Date | No | Triggers reminder task |
| Follow-up mode | Dropdown | No | Call / Email / WhatsApp / Visit |
| Priority | Dropdown | No | Normal / High / Urgent / Low |
| Notes | Textarea | No | Initial notes from first contact |
| Status | System | Auto | Updated by workflow rules |
| Created by | System | Auto | Logged-in user |
| Created at | Timestamp | Auto | — |
| Last activity | Timestamp | Auto | Updated on every interaction |
| Converted at | Timestamp | Auto | Set when converted to prospect |


---

## 13. Notifications and reminders

- Follow-up due — in-app + email reminder 30 minutes before
- Overdue follow-up — in-app alert + manager notification
- New lead assigned — push notification to assigned salesperson
- Lead converted — confirmation to salesperson + manager
- Stale lead alert — daily digest email to salesperson
- Bulk import complete — email with import summary report

---

## 14. Development phases

### Phase 1 — Core (Week 1–3)
- Lead list view with filters and search
- Add new lead form
- Lead detail view with timeline
- Basic assignment and follow-up date

### Phase 2 — Enrichment (Week 4–6)
- Temperature scoring and automation rules
- Hot leads view
- Activity timeline (calls, emails, notes)
- Lead segments / saved filters

### Phase 3 — Integrations (Week 7–9)
- Web form webhook integration
- Email sync (Gmail / Outlook)
- WhatsApp Business API
- Click-to-call telephony

### Phase 4 — Analytics & polish (Week 10–12)
- Lead analytics dashboard
- Import wizard with validation
- Role-based permissions
- Bulk actions (assign, delete, export)
- Notification system

---

*Document version: 1.0 · Prepared for VentaCRM · June 2026*