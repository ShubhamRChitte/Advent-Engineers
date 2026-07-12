# Product Requirements Document (PRD)
# Advent Engineers — Transformer Testing & Management System
**Version:** 1.0 (Production)
**Generated from:** Live Codebase Analysis
**Backend Port:** 5000 | **Frontend Port:** 5173 (Vite dev)
**Database:** MongoDB Atlas — `AdventEngineersCluster`
**Stack:** MERN (MongoDB, Express, React/TypeScript, Node.js)

---

## STEP 1: SYSTEM OVERVIEW

### 1.1 Application Name
**Advent Engineers — Transformer Testing Management System**

### 1.2 Purpose
A multi-role, multi-stage transformer quality testing and order management platform for a transformer manufacturing firm. The system tracks each Instrument Transformer (CT = Current Transformer, PT = Potential Transformer) unit through a sequential testing workflow from manufacturing through final dispatch.

### 1.3 User Roles (Exact role strings from codebase)

| Role Key | Display Name | Department | Access |
|---|---|---|---|
| `admin` | Admin | Management / Office / Admin | Full system access |
| `entry-operator` | Entry Operator | Office | Order creation & management |
| `core-tester` | Core Tester | Core Test | CT core testing stage |
| `secondary-tester` | Secondary Tester | Secondary Test | CT secondary testing stage |
| `after-primary-tester` | After-Primary Tester | Primary Test | CT primary/after-primary testing stage |
| `final-tester` | Final Tester | Final Test | CT final testing + megger tests |
| `pt-tester` | PT Tester | PT Test | PT-specific testing + heating |

### 1.4 High-Level Architecture

```
Frontend (React + TypeScript, Vite)
  ├── LoginPage         → Role-based routing
  ├── AdminLayout       → Admin Panel (admin)
  ├── EntryOperatorLayout → Order entry (entry-operator)
  └── TesterLayout      → All tester roles

Backend (Node.js + Express, Port 5000)
  ├── /auth             → Authentication, Employee Management
  ├── /api/orders       → Order CRUD & Approval
  ├── /api/transformers → Transformer stage management
  ├── /api/metering-tests → CT Metering Core Testing
  ├── /api/protection-tests → CT Protection/PS Core Testing
  ├── /api/core-tests   → Generic core test routes
  ├── /api/pt-tests     → PT Testing full lifecycle
  ├── /api/heating-record → CT Heating Record
  ├── /api/pt-heating-record → PT Heating Record
  ├── /api/final        → Final Test submission
  ├── /api/dashboard    → Dashboard statistics
  ├── /api/failed-cores → Failed core management
  ├── /api/core-vendors → Core vendor CRUD
  ├── /api/notifications → Real-time notifications
  ├── /api/return-forms → Return-to-vendor forms
  └── /api/failed-cores → Failed core tracking

Database Collections (MongoDB)
  ├── orders
  ├── transformers
  ├── meteringcoretests
  ├── protectioncoretests
  ├── secondarymeteringtests
  ├── heatingrecords
  ├── failedcores
  ├── users
  ├── corevendors
  ├── notifications
  └── counters
```

---

## STEP 2: MODULE BREAKDOWN

### Module 1: Authentication & Role System
- **Purpose:** Session-based login with Passport.js Local Strategy. Role mapped from `designation` and `department` fields.
- **Entry Point:** `http://localhost:5173/` → LoginPage
- **Roles Allowed:** All
- **APIs:** `POST /auth/login`, `POST /auth/logout`, `GET /auth/check-auth`, `GET /auth/testers`, `POST /auth/add-employee`, `GET /auth/all-employees`
- **Session:** Express-Session with cookie-based auth (`maxAge`: 24 hours)

### Module 2: Admin Panel
- **Purpose:** Full system visibility, order approval, employee management, analytics, stock management
- **Entry Point:** Admin layout (sidebar navigation)
- **Roles Allowed:** `admin`
- **Sub-modules:** Dashboard, Orders (approval/CRUD), Employee Management, Analytics, Notifications, Stock Management, Accuracy Limits Manager, Core Vendors

### Module 3: Entry Operator Module
- **Purpose:** Create orders, assign testers, view order reports per client
- **Entry Point:** Entry Operator layout
- **Roles Allowed:** `entry-operator`
- **Sub-modules:** Dashboard, Order Form, Orders List, Reports View, Vendor Management

### Module 4: CT Testing System (Multi-Stage)
- **Purpose:** 4-stage CT testing workflow: Core → Secondary → Primary → Final
- **Entry Point:** TesterLayout → role-based sidebar
- **Roles Allowed:** `core-tester`, `secondary-tester`, `after-primary-tester`, `final-tester`
- **Stages:** core → secondary → primary → heating → final → shipped

### Module 5: PT Testing System
- **Purpose:** Single-stage PT testing for Potential Transformers
- **Entry Point:** TesterLayout → PT Tester Sidebar
- **Roles Allowed:** `pt-tester`
- **Stages:** pt (single stage) → PT Testing In Progress → PT Testing Completed

### Module 6: CT Heating Record Module
- **Purpose:** Record heating/drying process steps per transformer unit. CT-only post-primary testing.
- **Entry Point:** TesterLayout → Heating section
- **Roles Allowed:** `after-primary-tester`, `final-tester` (post-primary stage)

### Module 7: PT Heating Record Module
- **Purpose:** Record PT-specific heating records (11KV / 33KV PT variants)
- **Entry Point:** TesterLayout (PT Tester Dashboard → Heating tab)
- **Roles Allowed:** `pt-tester`

### Module 8: Reports Module
- **Purpose:** View and print completed test reports per role and stage
- **Entry Point:** TesterLayout reports section, AdminLayout reports
- **Roles Allowed:** All authenticated roles

### Module 9: Failed Cores Management
- **Purpose:** Track, log, and manage failed transformer cores through audit trail
- **Entry Point:** Admin panel, automatically triggered by test failure
- **Roles Allowed:** `admin`, triggered by all testers

### Module 10: Notifications System
- **Purpose:** Real-time notifications dispatched to testers when orders are assigned or stages transition
- **Roles Allowed:** All authenticated roles

---

## STEP 3: FEATURE-LEVEL BREAKDOWN

### 3.1 Authentication Features

| # | Feature | Description |
|---|---|---|
| A1 | Login with Employee ID + Password | POST /auth/login, bcryptjs password check |
| A2 | Session Persistence | localStorage stores user object after login |
| A3 | Role-based Routing | On login, redirects to correct layout based on `role` field |
| A4 | Logout | POST /auth/logout, clears session + localStorage |
| A5 | Auth Check | GET /auth/check-auth — verifies session is active |
| A6 | Role Mapping | `designation`=Admin → admin; department-based mapping for testers |

### 3.2 Admin Panel Features

| # | Feature | Description |
|---|---|---|
| AD1 | Admin Dashboard | Stats: Total Employees, Active Orders, Tests Completed, Pending Tests |
| AD2 | Testing Progress Trend | 6-month chart: core/secondary/final completed counts |
| AD3 | Order Status Distribution | Pie chart: Pending / In Progress / Completed |
| AD4 | Recent Activity Feed | Last 3 orders + last 2 employees added |
| AD5 | View All Orders | GET /api/admin/orders — sorted newest first |
| AD6 | Approve Order | PUT /api/orders/:orderId/approve — generates transformers |
| AD7 | Delete Order | DELETE /api/orders/:orderId — cascades delete transformers + Cloudinary images |
| AD8 | Update Order | PUT /api/orders/:orderId — generic update |
| AD9 | Reassign Tester | PUT /api/orders/:orderId/reassign — updates all transformers' assignment field |
| AD10 | Admin Notifications | GET /api/admin/notifications — Pending Approval or isRead=false orders |
| AD11 | Add Employee | POST /auth/add-employee — auto-generates EMP001... EMP999 IDs, bcrypt password |
| AD12 | View All Employees | GET /auth/all-employees — excludes passwords |
| AD13 | Employee Performance | UI-level analytics on tester stats |
| AD14 | Accuracy Limits Manager | CRUD for accuracy class limits (IS standard configurations) |
| AD15 | Core Vendor Management | GET/POST/DELETE /api/core-vendors — seed on server start |
| AD16 | Admin Analytics Dashboard | Extended analytics view |
| AD17 | Admin Review Panel | View transformers pending admin_review stage |
| AD18 | Approve Retest | PUT /api/transformers/:uniqueId/approve-retest — returns transformer to target stage |
| AD19 | Stock Management | Enhanced stock management UI component |

### 3.3 Entry Operator Features

| # | Feature | Description |
|---|---|---|
| EO1 | Entry Dashboard | Summary view for operator |
| EO2 | Create Order (with Cloudinary upload) | POST /api/create-order (multipart form with images) |
| EO3 | Order Form Fields | clientName, clientContactNo, transformerName, transformerType (CT/PT), quantity, ratio[], noOfCores, coreDetails (type/accuracyClass/vendorNo), coreVendors, nominalSystemVoltage, burden, deadline, ratedPrimaryCurrent, ratedSecondaryCurrent, voltageRating, isStandard, indoorOutdoor, insulationType, tankType, stc, priority, instructions, images |
| EO4 | Bypass Approval (Admin Direct Create) | `bypassApproval=true` flag generates transformers immediately |
| EO5 | Orders List View | View all orders with status |
| EO6 | Order Detail View | View full order with transformers and test status |
| EO7 | Assign Testing Workflow | Assign tester per stage with unit range (from/to) |
| EO8 | Client Orders View | Orders grouped by client |
| EO9 | Reports View | View order-level reports aggregated by stage |
| EO10 | Vendor Management | Manage vendor records |

### 3.4 CT Testing System — Core Stage

| # | Feature | Description |
|---|---|---|
| CT1 | View Assigned Orders (Active tab) | GET /api/assigneed_orders?type=active — transformers in `core` stage assigned to current user |
| CT2 | View History (History tab) | GET /api/assigneed_orders?type=history — past completed assignments |
| CT3 | Open Order Detail | View specific transformer list per order |
| CT4 | Submit Metering Core Test | POST /api/metering-tests — readings per internalCoreNo, result P/F |
| CT5 | Submit Protection Core Test | POST /api/protection-tests |
| CT6 | Submit PS Core Test | POST /api/protection-tests (coreType: PS) |
| CT7 | Lock Failed Cores | Failed cores (result=F) are locked — cannot be re-edited |
| CT8 | Auto-record Failed Cores | Automatic POST /api/failed-cores when result=F during core testing |
| CT9 | Core Test Report View | View saved core test data per order |
| CT10 | Pass/Fail Logic | result="P" → PASS, result="F" → FAIL; order status → "Core Testing In Progress" |

### 3.5 CT Testing System — Secondary Stage

| # | Feature | Description |
|---|---|---|
| ST1 | View Assigned Transformers | Transformers at currentStage="secondary" assigned to user |
| ST2 | Core Selection for Secondary Test | Select which core type to test |
| ST3 | Secondary Metering Report | Fill secondary metering measurements |
| ST4 | Secondary Protection Report | Fill protection core secondary measurements |
| ST5 | Secondary PS Report | Fill PS class core measurements |
| ST6 | Approve/Complete Secondary Stage | PUT /api/transformers/:uniqueId/approve-stage (stage=secondary, nextStage=primary) |
| ST7 | View Completed Reports | GET /api/secondary/reports — transformers where testHistory.secondary_test.status=Completed and tester matches |
| ST8 | Assignment Completion Check | If all units in tester's range are done, marks assignment as "Completed" |

### 3.6 CT Testing System — After-Primary (Primary) Stage

| # | Feature | Description |
|---|---|---|
| PT1 | View Assigned Orders | Transformers at currentStage="primary" |
| PT2 | Core Selection | Select core sub-type for this transformer |
| PT3 | After-Primary Metering Report | Fill primary-level metering data |
| PT4 | After-Primary PS Report | Fill PS class primary data |
| PT5 | After-Primary Protection Report | Fill protection core primary data |
| PT6 | Approve Primary Stage | PUT /api/transformers/:uniqueId/approve-stage (stage=primary, nextStage=heating) |
| PT7 | View Completed Reports | GET /api/after-primary/reports |
| PT8 | Heating Stage Trigger | After all transformers in order leave primary → order transitions to heating |

### 3.7 CT Heating Record Module

| # | Feature | Description |
|---|---|---|
| HR1 | View Orders Ready for Heating | GET /api/heating-record/assigned-orders?type=CT |
| HR2 | View Transformers for Order | GET /api/heating-record/transformers/:orderId |
| HR3 | Fill Heating Process Steps | Table: process, duration, startDate/time, completionDate/time, remarks |
| HR4 | Fill Left Inputs (col1, col2) | Side-columns for heating record |
| HR5 | Signature Fields | preparedBy, verifiedBy, productionManager |
| HR6 | Save Heating Record (Draft) | POST /api/heating-record/save/:uniqueId — status="In Progress" |
| HR7 | Approve Heating Record | POST /api/heating-record/save/:uniqueId (isApproveCall=true) → status="Approved", moves to "final" |
| HR8 | Bulk Heating Record Save | POST /api/heating-record — saves blocks array for entire order |
| HR9 | Heating Approval Transition | Order moves currentStage=final, all transformers updated, notifications sent |
| HR10 | Heating Completion Status | POST /api/heating-record/completed-status — batch check completion |
| HR11 | Heating Report Print | Print in A4 layout (no validation, signature optional) |
| HR12 | 11KV CT Heating Record | HeatingRecord11KVCT component |
| HR13 | 33KV CT Heating Record | HeatingRecord33KVCT component |

### 3.8 CT Testing System — Final Stage

| # | Feature | Description |
|---|---|---|
| FT1 | View Assigned Transformers | Transformers at currentStage="final" |
| FT2 | Fill Final Test Data | Fields: polarityResult, hvSecondaryWinding, hvPrimaryWinding, hvBetweenCore, ovitTest, meggarPrimaryToSecondary, meggarPrimaryToEarth, meggarSecondaryToEarth, meggarCoreToCore |
| FT3 | Core Selection | FinalCoreSelection component |
| FT4 | Final QA Summary | FinalQASummary view |
| FT5 | Save Report (Draft Mode) | POST /api/final/:id/generate-save — saves without stage transition |
| FT6 | Submit Final Test | POST /api/final/:id — evaluates pass/fail, transitions stage |
| FT7 | Pass Result | transformer moves to currentStage="shipped", testHistory.final_test.status="Completed" |
| FT8 | MEGGER FAILURE — Auto Logic | Pri-Sec > 1000 MΩ OR Pri-Earth > 1000 MΩ OR Sec-Earth > 500 MΩ OR Core-Core > 200 MΩ → FAIL, stays in final |
| FT9 | Polarity Failure | result=Fail → stage stays final, failureStage=FINAL_POLARITY_TEST |
| FT10 | HV Secondary Failure | → failureStage=FINAL_HV_SECONDARY, stays final |
| FT11 | HV Primary Failure | → failureStage=FINAL_HV_PRIMARY, requiresAdminReview=true, returnTargetStage=primary |
| FT12 | HV Core Failure | → failureStage=FINAL_HV_CORE, requiresAdminReview=true, returnTargetStage=primary |
| FT13 | OVIT Failure | → failureStage=FINAL_OVIT, requiresAdminReview=true, returnTargetStage=secondary |
| FT14 | Admin Review Routing | transformer.currentStage = "admin_review", adminReviewDetails populated |
| FT15 | Approve Stage (Final) | PUT /api/transformers/:uniqueId/approve-stage (stage=final, nextStage=shipped) |
| FT16 | Final Reports | GET /api/final/reports — all transformers with final_test.status=Completed |
| FT17 | Final Metering Report | FinalMeteringReport component |
| FT18 | Final Protection Report | FinalProtectionReport component |
| FT19 | Final PS Report | FinalPSReport component |
| FT20 | Final Test Print Report | FinalTestReport component — A4 layout |

### 3.9 PT Testing System

| # | Feature | Description |
|---|---|---|
| PT_1 | PT Tester Dashboard | Stats: active tests, completed tests this month, recent activity |
| PT_2 | View Assigned PT Orders | GET /api/pt-tests/all-transformers → filter currentStage="pt" |
| PT_3 | Assigned Tab | PTAssignedOrders — transformers assigned and not yet approved |
| PT_4 | Completed Tab | PTCompletedTransformersList — transformers with pt_test.approved=true |
| PT_5 | Open Testing Form | PTTestingReport — full test report form per transformer |
| PT_6 | Submit PT Test Report | POST /api/pt-tests/submit → saves to testHistory.pt_test |
| PT_7 | Re-edit PT Report | Same endpoint — updates existing pt_test data (no stage enforcement) |
| PT_8 | Approve Individual Transformer | PUT /api/pt-tests/transformer/:transformerId/approve → pt_test.approved=true |
| PT_9 | Order-Level Approval | PUT /api/pt-tests/:orderId/approve → requires ALL transformers to have pt_test data |
| PT_10 | Auto Order Status Update | Order status → "PT Testing In Progress" on submit; "PT Testing Completed" on full approval |
| PT_11 | completionStages.pt | Set to true when all transformers in order are approved |
| PT_12 | Failed PT Log | POST /api/pt-tests/failed → creates FailedTransformerModel record |
| PT_13 | PT Reports List | GET /api/pt-tests/reports → only approved transformers (pt_test.approved=true) |
| PT_14 | PT Report View | PTReportView — detailed view of a single transformer's PT report |
| PT_15 | Fetch Single PT Test Data | GET /api/pt-tests/:transformerId → pt_test data |
| PT_16 | PT Report Print | PTTestingReport print mode — A4 layout, no validation |

### 3.10 PT Heating Record Module

| # | Feature | Description |
|---|---|---|
| PTH1 | PT Tester Heating View | PTHeatingRecordModule — separate from CT heating |
| PTH2 | 33KV PT Heating Form | HeatingRecord33KVPT — process steps, timing, signatures |
| PTH3 | 11KV PT Accessible | Accessible through unified heating (UnifiedHeatingRecord) |
| PTH4 | Save PT Heating Record | POST /api/pt-heating-record — pushes to processHistory.ptHeatingRecord[] |
| PTH5 | Fetch PT Heating Records | GET /api/pt-heating-record/:jobId — fetches all records for job |
| PTH6 | PT Heating Record Exact | PTHeatingRecordExact print component |
| PTH7 | Heating View Orders | GET /api/heating-record/assigned-orders?type=PT — shows PT orders eligible for heating |
| PTH8 | Approve PT Heating | PUT /api/heating-record/:orderId/approve (type=PT) — HeatingRecordModel updated |

### 3.11 Reports Module

| # | Feature | Description |
|---|---|---|
| R1 | Secondary Reports View | GET /api/secondary/reports — per-user completed secondary reports |
| R2 | After-Primary Reports View | GET /api/after-primary/reports |
| R3 | Final Reports View | GET /api/final/reports |
| R4 | PT Reports View | GET /api/pt-tests/reports — approved PT transformers only |
| R5 | Heating Reports View | HeatingTrackingReport component |
| R6 | Admin Core Testing Reports | CoreTestingReports, SecondaryTestingReports, FinalTestingReports admin modules |
| R7 | Order-level Aggregated Reports | GET /api/orders/:orderId/reports-aggregation |
| R8 | Client Stats | GET /api/orders/clients/stats — per-client order counts |
| R9 | Orders by Client | GET /api/orders/client/:clientName |
| R10 | Report Page (Public route) | /report/:id — accessible at ReportPage without strict login |
| R11 | Admin Report View | /admin/report/:id — AdminReportViewPage, requires any authenticated role |
| R12 | Print (A4) | All report components render A4 format for window.print() |

### 3.12 Failed Cores Management

| # | Feature | Description |
|---|---|---|
| FC1 | Auto-record on Metering Failure | POST /api/failed-cores triggered automatically when result=F |
| FC2 | Manual Record Failure | POST /api/failed-cores — requires orderId, internalCoreNo, failureReason |
| FC3 | List Failed Cores | GET /api/failed-cores — paginated (50/page), filterable by orderId, vendorId, coreType, failureStage, status, date range, search |
| FC4 | Return to Vendor | PUT /api/failed-cores/:id/return |
| FC5 | Undo Return | PUT /api/failed-cores/:id/undo-return |
| FC6 | Bulk Return | POST /api/failed-cores/bulk-return — array of core IDs |
| FC7 | Failed Core Count Badge | GET /api/failed-cores/count |
| FC8 | Admin Retest Approval | PUT /api/transformers/:uniqueId/approve-retest — moves transformer back to target stage |

### 3.13 Notifications System

| # | Feature | Description |
|---|---|---|
| N1 | Get My Notifications | GET /api/notifications — by recipientRole OR recipientName, last 20, sorted desc |
| N2 | Unread Count | GET /api/notifications/unread-count |
| N3 | Mark All Read | PUT /api/notifications/mark-read |
| N4 | Mark One Read | PUT /api/notifications/:id/read |
| N5 | Auto-create on Assignment | On order approval with assignments — creates ASSIGNMENT notifications for starting stage testers |
| N6 | Auto-create on Stage Transition | When all transformers leave a stage → notifyNextStage() creates notifications for next testers |
| N7 | Clear on Stage Completion | clearNotifications(orderId, stage) called when stage transitions |

---

## STEP 4: WORKFLOW DEFINITIONS

### 4.1 CT Transformer Full Workflow

```
[Order Created] (status: Pending Approval)
       ↓
[Admin Approves] → generateTransformersForOrder()
       ↓
[Transformers created] (currentStage: "core")
       ↓
[Core Tester] → Submit Metering/Protection/PS tests
       → Pass: Continue
       → Fail: Auto-log to FailedCores, lock reading
       ↓
[All units leave core] → Order.currentStage = "secondary"
[Notification sent to secondary testers]
       ↓
[Secondary Tester] → Fill secondary form → Approve
       → PUT /api/transformers/:uniqueId/approve-stage (stage=secondary, nextStage=primary)
       ↓
[All units leave secondary] → Order.currentStage = "primary"
       ↓
[After-Primary Tester] → Fill after-primary form → Approve
       → PUT (stage=primary, nextStage=heating)
       ↓
[All units leave primary] → Order.currentStage = "heating"
       ↓
[Heating Record] → Fill process steps → Approve heating
       → POST /api/heating-record/save/:uniqueId (isApproveCall=true)
       → Order.currentStage = "final", all transformers.currentStage = "final"
       ↓
[Final Tester] → Fill final test → Submit
       → POST /api/final/:id
       → Pass: currentStage = "shipped", testHistory.final_test.status = "Completed"
       → Fail: See failure routing below
       ↓
[All units shipped] → Order.currentStage = "completed", status = "Completed"
```

**Final Test Failure Routing:**
```
Megger (Pri-Sec > 1000 OR Pri-Earth > 1000 OR Sec-Earth > 500 OR Core-Core > 200)
  → status = "Failed", stage stays "final"

Polarity Fail → stage stays "final"
HV Secondary Fail → stage stays "final"
HV Primary Fail → currentStage = "admin_review", returnTargetStage = "primary"
HV Core Fail → currentStage = "admin_review", returnTargetStage = "primary"
OVIT Fail → currentStage = "admin_review", returnTargetStage = "secondary"
```

**Admin Retest Flow (after admin_review):**
```
Admin: PUT /api/transformers/:uniqueId/approve-retest
  → transformer.currentStage = adminReviewDetails.returnTargetStage
  → FailedCore record updated: adminApprovalStatus = "APPROVED", retestStatus = "PENDING"
```

### 4.2 PT Transformer Full Workflow

```
[Order Created] (transformerType: "PT", status: Pending Approval)
       ↓
[Admin Approves] → transformers.currentStage = "pt" (skippped core/secondary/primary)
       ↓
[PT Tester] sees in Assigned Tab (PTAssignedOrders)
       ↓
[PT Tester] opens testing form (PTTestingReport)
       ↓
[PT Tester] fills test data → Submit
       → POST /api/pt-tests/submit
       → testHistory.pt_test = (data + savedAt + savedBy)
       → Order.status = "PT Testing In Progress"
       ↓
[PT Tester] clicks "Approve Transformer"
       → PUT /api/pt-tests/transformer/:transformerId/approve
       → testHistory.pt_test.approved = true
       ↓
[All transformers approved] → Order.status = "PT Testing Completed", completionStages.pt = true
       ↓
[Transformer moves to Completed Tab] (PTCompletedTransformersList)
       ↓
[Appears in PT Reports] (GET /api/pt-tests/reports — only approved)
```

### 4.3 CT Heating Record Workflow

```
[Order at currentStage = "heating" OR primary_test.status = "Completed"]
       ↓
[GET /api/heating-record/assigned-orders?type=CT] → order appears in Heating list
       ↓
[GET /api/heating-record/transformers/:orderId] → fetch eligible transformers
       ↓
[Fill Process Steps table: process, duration, start/completion date+time, remarks]
[Fill Left Inputs: col1, col2]
[Fill Signatures: preparedBy, verifiedBy, productionManager]
       ↓
[Save (draft)] → POST /api/heating-record/save/:uniqueId → status = "In Progress"
       ↓
[Approve] → POST /api/heating-record/save/:uniqueId (isApproveCall=true)
       → status = "Approved" (CT) OR "Completed" (PT — stops here)
       → CT: transformer.currentStage = "final"
       → CT: Order.currentStage = "final", completionStages.heating = true
       → Notifications sent to final testers
```

### 4.4 PT Heating Record Workflow

```
[PT Tester opens PTHeatingRecordModule]
       ↓
[Selects order / job]
       ↓
[HeatingRecord33KVPT (or 11KV variant) — fills form]
       ↓
[POST /api/pt-heating-record → pushed to processHistory.ptHeatingRecord[]]
       ↓
[Print via PTHeatingRecordExact component]
```

---

## STEP 5: DATA MODEL DOCUMENTATION

### 5.1 Order Model

```javascript
{
  jobId: "JOB-2026-001",                    // Auto-generated, unique
  clientName: String (required),
  clientContactNo: String (required),
  transformerName: String (required),
  transformerType: "CT" | "PT" (required),
  quantity: Number (min: 1, required),
  ratio: [String],                           // e.g. ["400/1", "800/1"]
  noOfCores: Number (required),
  coreDetails: [{
    coreType: "Metering" | "Protection" | "PS",
    accuracyClass: String,
    vendorNo: String
  }],
  coreVendors: {
    metering: [{ serialNo, name }],
    protection: [{ serialNo, name }],
    ps: [{ serialNo, name }]
  },
  nominalSystemVoltage: Number,
  burden: Number,
  deadline: Date (required),
  assignments: [{
    testerName: String,
    stage: "core"|"secondary"|"primary"|"heating"|"final"|"pt",
    unitRange: { from: Number, to: Number },
    status: "Assigned"|"In Progress"|"Completed"
  }],
  currentStage: "core"|"secondary"|"primary"|"heating"|"final"|"completed"|"pt",
  completionStages: { core, secondary, primary, heating, final, pt: Boolean },
  testsCompleted: Number,
  passCount: Number,
  failCount: Number,
  reportData: Mixed,
  isApproved: Boolean (default: false),
  isRead: Boolean (default: false),
  status: "Pending Approval"|"In Progress"|"Completed"|"Core Testing In Progress"|"Core Testing Completed"|"PT Testing In Progress"|"PT Testing Completed",
  priority: "High"|"Medium"|"Low",
  ratedPrimaryCurrent: Number,
  ratedSecondaryCurrent: Number (required),
  voltageRating: String,
  isStandard: String (required),
  indoorOutdoor: String,
  insulationType: String,
  tankType: String,
  stc: String,
  instructions: String,
  images: [{ url, public_id }],
  approved: Boolean
}
```

### 5.2 Transformer Model

```javascript
{
  uniqueId: "TR-JOB-2026-001-001",          // Format: TR-<jobId>-<padded 3-digit index>
  orderId: ObjectId (ref: Order, required),
  jobId: String (required),
  currentStage: "core"|"secondary"|"primary"|"heating"|"final"|"shipped"|"pt"|"admin_review",
  adminReviewDetails: {
    failedStage: String,
    returnTargetStage: String,
    requestedAt: Date
  },
  testHistory: {
    core_test: TestStageSchema,             // includes metering_results, protection_results, ps_results
    secondary_test: { tester, timestamp, status: "Pending"|"In Progress"|"Completed"|"Approved", metering_results, protection_results, ps_results },
    primary_test: { same as secondary_test },
    heating_test: {
      status: "Pending"|"In Progress"|"Completed"|"Approved",
      timestamp, processSteps[], leftInputs[], preparedBy, productionManager, verifiedBy, reportDate
    },
    final_test: { tester, timestamp, status, polarityResult, hvSecondaryWinding, hvPrimaryWinding, hvBetweenCore, ovitTest, meggarPrimaryToSecondary, meggarPrimaryToEarth, meggarSecondaryToEarth, meggarCoreToCore, metering_results, protection_results, ps_results },
    pt_test: Mixed {                        // Flexible schema for PT test data
      approved: Boolean,
      savedAt: Date,
      savedBy: String,
      ...(all PT form fields)
    }
  },
  assignments: {
    core_tester: String,
    secondary_tester: String,
    primary_tester: String,
    final_tester: String,
    pt_tester: String
  },
  processHistory: {
    heatingRecord: [{ transformerId, jobNumber, processSteps[], preparedBy, productionManager, verifiedBy, reportDate, status, recordedBy, recordedAt }],
    ptHeatingRecord: [{ transformerId, jobNumber, processSteps[], preparedBy, productionManager, verifiedBy, date, recordedBy, recordedAt }]
  },
  finalReportData: Mixed
}
```

### 5.3 User Model

```javascript
{
  employeeId: "EMP001" (unique, required),
  password: String (bcrypt hashed, required),
  fullName: String (required),
  mobileNumber: String (required),
  emailId: String,
  designation: String (required),           // "Admin", "Entry Operator", etc.
  department: String (required),            // "Core Test", "Secondary Test", "Primary Test", "Final Test", "PT Test"
  dateOfJoining: Date (required),
  employmentType: "Permanent"|"Contract"|"Trainee",
  transformerSkills: { canTestCT, canTestPT: Boolean },
  testCapabilities: { ratioTest, polarityTest, burdenTest, accuracyTest, excitationTest, insulationResistanceTest, tanDeltaTest: Boolean },
  voltageExperience: [Number],
  assignedLab: String,
  activeStatus: Boolean (default: true)
}
```

### 5.4 FailedCore Model

```javascript
{
  orderId: ObjectId (required),
  orderNumber: String (required),
  jobId: String,
  clientName: String,
  internalCoreNo: String (required),
  vendorCoreNo: String (required),
  coreType: "METERING"|"PROTECTION"|"SPECIAL"|"OTHER",
  vendorId: ObjectId,
  vendorName: String,
  failureReason: String (required),
  failureStage: "INITIAL_TEST"|"SECONDARY_TEST"|...|"FINAL_MEGGER_TEST"|...|"FIELD_RETURN",
  failedAt: Date,
  status: "FAILED"|"REPLACED"|"SCRAPPED"|"UNDER_ANALYSIS"|"RETURNED",
  returnStatus: "PENDING"|"RETURNED",
  returnedDate, returnedBy, returnFormId,
  retestStatus: "PENDING"|"COMPLETED"|"NOT_APPLICABLE",
  adminApprovalStatus: "PENDING"|"APPROVED"|"REJECTED"|"NOT_REQUIRED"
}
```

### 5.5 HeatingRecordModel

```javascript
{
  orderId: ObjectId (required),
  transformerType: String (required),      // "CT" or "PT"
  blocks: Array,                            // Parsed blocks of heating steps
  status: String (default: "Pending"),
  updatedAt: Date
}
```

### 5.6 NotificationModel

```javascript
{
  recipientRole: String,                    // "core", "secondary", "primary", "final", "pt", "heating"
  recipientName: String,                    // Specific tester name
  message: String,
  orderId: ObjectId,
  jobId: String,
  type: "ASSIGNMENT",
  isRead: Boolean (default: false),
  createdAt: Date
}
```

---

## STEP 6: VALIDATION RULES

### 6.1 CT Core Test Validation

| Test | Field | Rule | Action |
|---|---|---|---|
| Metering Core | result | "P" = Pass, "F" = Fail | F → auto-record FailedCore, locked |
| Metering Core | status | Derived: "PASS", "FAIL", "PENDING" | Lock if FAIL or RETURNED |
| Protection Core | compositeError | Validated against accuracy class limits | PASS/FAIL |
| Protection Core | secondaryLimitingVoltage | Computed from resistance + alf | Auto-calculated |
| PS Class | vk, iexVk, turnRatioError | Checked against PS class limits | PASS/FAIL |

**Lock Mechanism:** If a reading already has `status="FAIL"` or `status="RETURNED"`, any subsequent save will skip that reading. It cannot be re-edited.

### 6.2 Final Test Validation (Automatic — Backend Enforced)

| Test | Limit | Failure Type | Routing |
|---|---|---|---|
| Megger Pri-Sec | > 1000 MΩ | Auto-fail | Stays at final |
| Megger Pri-Earth | > 1000 MΩ | Auto-fail | Stays at final |
| Megger Sec-Earth | > 500 MΩ | Auto-fail | Stays at final |
| Megger Core-Core | > 200 MΩ | Auto-fail | Stays at final |
| Polarity | result = "Fail" | Manual | Stays at final |
| HV Secondary Winding | result = "Fail" | Manual | Stays at final |
| HV Primary Winding | result = "Fail" | Admin Review | Return to primary |
| HV Between Core | result = "Fail" | Admin Review | Return to primary |
| OVIT | result = "Fail" | Admin Review | Return to secondary |

**Evaluation Order:** Megger → Polarity → HV Secondary → HV Primary → HV Core → OVIT

### 6.3 PT Test Validation

- All PT test data is stored as `Mixed` type — no server-side field-level validation.
- Approval requires: `testHistory.pt_test` exists AND `Object.keys().length > 0`.
- Order-level approval: ALL transformers in order must have PT test data saved.
- Per-transformer approval: just requires pt_test data to exist for that transformer.

### 6.4 Order Approval Validation

- `isApproved=false` orders cannot have transformers generated.
- If all PT transformers not yet tested: `PUT /api/pt-tests/:orderId/approve` returns 400.
- Admin delete: No restriction — cascades regardless of stage.

---

## STEP 7: UI BEHAVIOR SPECIFICATION

### 7.1 Assigned vs Completed Logic

| Module | Assigned Definition | Completed Definition |
|---|---|---|
| CT Secondary | `currentStage = "secondary"` AND `assignments.secondary_tester` matches user (or blank) | `testHistory.secondary_test.status = "Completed"` AND tester matches |
| CT After-Primary | `currentStage = "primary"` AND assignment matches | `testHistory.primary_test.status = "Completed"` |
| CT Final | `currentStage = "final"` | `testHistory.final_test.status = "Completed"` |
| PT Testing | `currentStage = "pt"` AND NOT `pt_test.approved = true` | `pt_test.approved = true` |

### 7.2 Button Visibility Rules

| Button | Visible When | Action |
|---|---|---|
| Start Testing (CT) | Transformer in user's assigned stage | Opens test form |
| Approve Stage (CT) | Data saved for this transformer | Calls approve-stage API |
| Approve Transformer (PT) | `pt_test` data exists for this transformer | PUT /api/pt-tests/transformer/:id/approve |
| Approve Order (PT) | All transformers in order have `pt_test` data | PUT /api/pt-tests/:orderId/approve |
| Edit (CT/PT) | Report already saved | Reopen form with existing data |
| Approve Heating | Heating data saved | POST with isApproveCall=true |
| Admin Approve Order | `isApproved = false` | PUT /api/orders/:orderId/approve |
| Delete Order | Admin only | DELETE /api/orders/:orderId |
| Approve Retest | Transformer in `admin_review` stage | PUT /api/transformers/:uniqueId/approve-retest |

### 7.3 Tab Switching Behavior

- **PT Tester:** Two tabs — "Assigned" (not approved) and "Completed" (approved)
- **CT Tester (Secondary/Primary/Final):** Active vs. report view
- **Core Tester:** Active tab + History tab for past completed assignments
- **Heating Module:** Transformer list → select unit → form fills

### 7.4 Report Rendering

- `window.print()` triggered via print button
- No validation errors shown in print mode
- Signature fields shown but optional
- A4 layout enforced via CSS `@media print`
- PT test report: `PTTestingReport` component renders full IS-standard style report
- Heating record: `HeatingRecord11KVCT`, `HeatingRecord33KVCT`, `HeatingRecord33KVPT` components
- Final test report: `FinalTestReport` component

### 7.5 Tester Dashboard Stats (GET /api/dashboard/tester-stats)

- `activeTests`: Count of transformers at current stage assigned to user
- `completedTests`: Count completed this calendar month
- `recentActivity`: Last 5 test interactions

---

## STEP 8: EDGE CASES

| # | Edge Case | Current Behavior |
|---|---|---|
| E1 | PT tester re-saves report after initial save | Allowed — `POST /api/pt-tests/submit` updates existing pt_test (no stage restriction) |
| E2 | Approve PT order without all transformers tested | Returns 400: "Not all transformers have testing data saved" |
| E3 | Core reading FAIL — re-edit attempt | Backend skips update for that reading (locked by status=FAIL) |
| E4 | Transformer orderId is string (not ObjectId) | Triple-query pattern: by ObjectId, by string, by jobId — handles all cases |
| E5 | Order approval when already approved | Returns 400: "Already approved" |
| E6 | Admin deletes order mid-workflow | Force deletes all transformers + Cloudinary images |
| E7 | Final test: Multiple megger failures | All failing checks appended, joined with " | " as failureReason |
| E8 | Final test: No orderId on transformer | Throws 500 with "Order association missing" |
| E9 | Heating for PT (isApproveCall=true on PT transformer) | Status = "Completed" (not Approved), transformer does NOT move to final — PT stops here |
| E10 | All PT transformers approved → order-level check | allApproved computed; if true → Order.status = "PT Testing Completed" |
| E11 | Tester name mismatch (name vs fullName) | `namesToCheck` array includes `user.name`, `user.fullName`, trimmed variants — searched with `$in` |
| E12 | Duplicate employee (email or mobile) | Returns 400: "User with this email or mobile number already exists" |
| E13 | Duplicate failed core entry | Mongo code 11000 → 400: "This core has already been marked as failed" (PT failed route only) |
| E14 | Transformation from secondary → global order stage | Only when `pendingTotalCount === 0` (all units have left the stage) |
| E15 | Report page without login | `/report/:id` and `/admin/report/:id` accessible to any authenticated role |

---

## STEP 9: TEST CASE GENERATION (TESTSPRITE-READY)

### TC-A01: Login Flow
- **Feature:** Authentication
- **Preconditions:** Valid employee record in DB
- **Steps:**
  1. Navigate to `http://localhost:5173/`
  2. Enter valid Employee ID and Password
  3. Click Login
- **Expected:** Redirected to role-appropriate layout; user stored in localStorage
- **Edge:** Wrong password → 401 "Invalid credentials"

### TC-A02: Role-Based Landing
- **Feature:** Role routing
- **Preconditions:** Multiple users with different roles
- **Steps:**
  1. Login as admin → Verify AdminLayout visible
  2. Login as entry-operator → Verify EntryOperatorLayout
  3. Login as core-tester → Verify TesterLayout
- **Expected:** Each role sees only its layout, not others'

### TC-A03: Logout
- **Feature:** Logout
- **Steps:**
  1. Login with any user
  2. Click Logout
- **Expected:** localStorage cleared, redirected to LoginPage

---

### TC-AD01: Admin Dashboard Stats
- **Feature:** Admin Dashboard
- **Preconditions:** Orders and employees exist in DB
- **Steps:**
  1. Login as admin
  2. Navigate to Dashboard
  3. Verify stat cards: Employees, Active Orders, Tests Completed, Pending Tests
- **Expected:** Correct counts from DB; testing trend chart shows 6 months

### TC-AD02: Approve Order
- **Feature:** Order Approval
- **Preconditions:** Order exists with `isApproved=false`, assignments filled
- **Steps:**
  1. Admin views pending orders
  2. Clicks Approve on order
  3. Verify PUT /api/orders/:orderId/approve called
- **Expected:** Order `isApproved=true`, transformers created (count = quantity), currentStage set per type

### TC-AD03: Delete Order with Cloudinary Cleanup
- **Feature:** Order Deletion
- **Preconditions:** Order exists with images and transformers
- **Steps:**
  1. Admin clicks Delete on an order
  2. Verify DELETE /api/orders/:orderId called
- **Expected:** Order deleted, all transformers deleted, Cloudinary images destroyed

### TC-AD04: Reassign Tester
- **Feature:** Tester Reassignment
- **Steps:**
  1. Admin selects an in-progress order
  2. Clicks Reassign for a stage
  3. Selects new tester
- **Expected:** PUT /api/orders/:orderId/reassign called; all transformers updated with new tester name

### TC-AD05: Add Employee
- **Feature:** Employee Management
- **Steps:**
  1. Admin clicks Add Employee
  2. Fills all required fields (fullName, mobileNumber, designation, department, dateOfJoining, employmentType, password)
  3. Submits
- **Expected:** Employee created with auto-generated EMP-prefixed ID; password bcrypt-hashed

### TC-AD06: Admin Retest Approval
- **Feature:** Admin Review
- **Preconditions:** Transformer in admin_review stage (HV Primary or Core failure)
- **Steps:**
  1. Admin views Admin Review panel
  2. Clicks "Approve Retest" for a transformer
- **Expected:** Transformer moves to `returnTargetStage` (secondary or primary); FailedCore record updated

---

### TC-EO01: Create Order (CT)
- **Feature:** Order Creation
- **Preconditions:** Logged in as entry-operator
- **Steps:**
  1. Navigate to Create Order
  2. Fill: clientName, clientContactNo, transformerName, transformerType=CT, quantity=5, ratio, noOfCores=2, coreDetails (Metering + Protection), deadline, isStandard, ratedSecondaryCurrent
  3. Submit
- **Expected:** Order created with status="Pending Approval", jobId auto-generated (JOB-YYYY-NNN format)

### TC-EO02: Create Order (PT)
- **Feature:** PT Order Creation
- **Steps:** Same as TC-EO01, transformerType=PT
- **Expected:** Order created; on admin approval, transformers start at currentStage="pt"

### TC-EO03: Create Order with Images (Cloudinary)
- **Feature:** Image upload
- **Steps:**
  1. Create order, attach 1-10 images
  2. Submit
- **Expected:** Images uploaded to Cloudinary; urls stored in `order.images[]`

### TC-EO04: Assign Testers to Order
- **Feature:** Assignment Workflow
- **Steps:**
  1. After order created, click Assign
  2. For each stage, assign tester with unit range (from-to)
  3. Save
- **Expected:** Order.assignments[] populated correctly

---

### TC-CT01: Core Tester Sees Assigned Orders
- **Feature:** CT Core Testing — Assigned View
- **Preconditions:** Order approved, transformer at core stage, assignment.core_tester = logged-in user
- **Steps:**
  1. Login as core-tester
  2. Navigate to Assigned Orders (Active tab)
- **Expected:** Order appears with correct unit range

### TC-CT02: Submit Metering Core Test — PASS
- **Feature:** Metering Core Test
- **Preconditions:** Order in core stage, transformer assigned
- **Steps:**
  1. Open order, fill metering readings with result="P"
  2. Submit POST /api/metering-tests
- **Expected:** Reading saved with status="PASS"; order status → "Core Testing In Progress"

### TC-CT03: Submit Metering Core Test — FAIL
- **Feature:** Failed Core Auto-log
- **Steps:**
  1. Fill metering reading with result="F"
  2. Submit
- **Expected:** Failed core auto-logged in FailedCores collection; reading locked (status="FAIL")

### TC-CT04: Re-edit Failed Core Reading
- **Feature:** Lock mechanism
- **Steps:**
  1. After TC-CT03, attempt to re-submit same reading with result="P"
- **Expected:** Backend skips update for that reading; result remains "F"

### TC-CT05: Secondary Stage Approval (Per Transformer)
- **Feature:** Secondary stage transition
- **Preconditions:** Transformer at secondary stage
- **Steps:**
  1. Login as secondary-tester
  2. Fill secondary form
  3. Click Approve
  4. PUT /api/transformers/:uniqueId/approve-stage (stage=secondary, nextStage=primary)
- **Expected:** Transformer moves to primary; if all units done → Order moves to primary

### TC-CT06: Order-Level Stage Transition
- **Feature:** Order stage auto-advance
- **Steps:**
  1. Approve last transformer in secondary stage
- **Expected:** `pendingTotalCount === 0` → Order.currentStage = "primary"; notifications sent to primary testers

---

### TC-HT01: CT Heating Record — Save (Draft)
- **Feature:** Heating Record Save
- **Preconditions:** transformer.testHistory.primary_test.status = "Completed"
- **Steps:**
  1. Login as after-primary-tester or final-tester
  2. Open heating record
  3. Fill process steps and signatures
  4. Click Save (draft)
- **Expected:** POST /api/heating-record/save/:uniqueId called; status="In Progress"

### TC-HT02: CT Heating Record — Approve
- **Feature:** Heating Approval
- **Steps:**
  1. After TC-HT01, click Approve
  2. Confirm approval
- **Expected:** heating_test.status="Approved"; transformer.currentStage="final"; Order.currentStage="final"; notifications sent to final testers

### TC-HT03: PT Heating Record — Save
- **Feature:** PT Heating
- **Preconditions:** PT order exists
- **Steps:**
  1. Login as pt-tester
  2. Open PT Heating Record Module
  3. Fill HeatingRecord33KVPT form
  4. Submit
- **Expected:** POST /api/pt-heating-record; record pushed to processHistory.ptHeatingRecord[]

---

### TC-FT01: Final Test — PASS
- **Feature:** Final Testing Pass
- **Preconditions:** Transformer at final stage
- **Steps:**
  1. Login as final-tester
  2. Fill all final test fields with passing values
  3. Submit
- **Expected:** transformer.currentStage="shipped"; testHistory.final_test.status="Completed"

### TC-FT02: Final Test — Megger FAIL
- **Feature:** Megger Auto-Validation
- **Steps:**
  1. Fill meggarPrimaryToSecondary = 1200 (> 1000 MΩ)
  2. Submit
- **Expected:** Status = "Failed"; stage stays "final"; failure logged in FailedCores

### TC-FT03: Final Test — HV Primary FAIL (Admin Review)
- **Feature:** Admin Review Routing
- **Steps:**
  1. Set hvPrimaryWinding = "Fail"
  2. Submit
- **Expected:** transformer.currentStage = "admin_review"; adminReviewDetails.returnTargetStage = "primary"

### TC-FT04: Final Test — OVIT FAIL (Admin Review)
- **Steps:**
  1. Set ovitTest = "Fail"
  2. Submit
- **Expected:** transformer → admin_review, returnTargetStage = "secondary"

---

### TC-PT01: PT Tester Sees Assigned Transformers
- **Feature:** PT Assigned View
- **Preconditions:** PT order approved, transformers at pt stage, pt_tester assigned
- **Steps:**
  1. Login as pt-tester
  2. Navigate to Assigned tab
- **Expected:** All transformers for PT orders visible

### TC-PT02: Submit PT Test Report
- **Feature:** PT Test Submission
- **Steps:**
  1. Open transformer from Assigned tab
  2. Fill PTTestingReport form
  3. Submit
- **Expected:** POST /api/pt-tests/submit; pt_test saved with savedAt and savedBy; Order status = "PT Testing In Progress"

### TC-PT03: Re-edit PT Test After Initial Save
- **Feature:** PT Re-edit
- **Steps:**
  1. After TC-PT02, reopen transformer
  2. Modify data and re-submit
- **Expected:** pt_test updated (no stage restriction enforced)

### TC-PT04: Approve Individual PT Transformer
- **Feature:** Per-transformer PT Approval
- **Steps:**
  1. After pt_test data saved, click Approve Transformer
  2. PUT /api/pt-tests/transformer/:transformerId/approve
- **Expected:** pt_test.approved=true; if all in order approved → Order completes

### TC-PT05: Approve PT Order — All Transformers Done
- **Feature:** Order-level PT Approval
- **Preconditions:** All transformers in order have pt_test data
- **Steps:**
  1. Click Approve Order
  2. PUT /api/pt-tests/:orderId/approve
- **Expected:** Order.status="PT Testing Completed", completionStages.pt=true

### TC-PT06: Approve PT Order — Incomplete
- **Feature:** Validation on PT Approval
- **Preconditions:** Not all transformers have pt_test data
- **Steps:**
  1. Click Approve Order (premature)
- **Expected:** 400 response: "Cannot approve. Not all transformers have testing data saved."

### TC-PT07: PT Transformer in Completed Tab
- **Feature:** Completed Tab Display
- **Preconditions:** pt_test.approved=true
- **Steps:**
  1. After TC-PT04, navigate to Completed tab
- **Expected:** Approved transformer appears in PTCompletedTransformersList

### TC-PT08: PT Report in Reports List
- **Feature:** PT Reports
- **Steps:**
  1. After approval, open PT Reports tab
  2. GET /api/pt-tests/reports
- **Expected:** Only approved transformers (pt_test.approved=true) listed

---

### TC-R01: View Secondary Reports
- **Feature:** Secondary Reports
- **Preconditions:** At least one completed secondary test by current user
- **Steps:**
  1. Login as secondary-tester
  2. Navigate to Reports
- **Expected:** GET /api/secondary/reports returns transformers where secondary_test.status="Completed" and tester matches

### TC-R02: View Final Reports
- **Feature:** Final Reports
- **Steps:**
  1. Login as final-tester / admin
  2. Navigate to Reports
- **Expected:** GET /api/final/reports returns transformers with final_test.status="Completed"

### TC-R03: Print CT Report (A4)
- **Feature:** Report Print
- **Steps:**
  1. Open any completed report
  2. Click Print
- **Expected:** window.print() triggers; A4 layout; no validation visible; signatures shown

### TC-R04: PT Report Print
- **Steps:**
  1. Open approved PT transformer's report
  2. Click Print
- **Expected:** PTTestingReport renders in A4 format; no validation

---

### TC-N01: Notifications on Order Approval
- **Feature:** Assignment Notifications
- **Preconditions:** Order has assignments for starting stage
- **Steps:**
  1. Admin approves order with core tester assignments
- **Expected:** Notifications created for each unique core tester in assignments

### TC-N02: Notifications on Stage Transition
- **Feature:** Stage Transition Notifications
- **Steps:**
  1. Last secondary transformer approved → order moves to primary
- **Expected:** notifyNextStage() called; notifications created for primary testers

### TC-N03: Unread Count Badge
- **Steps:**
  1. Tester logs in
  2. GET /api/notifications/unread-count
- **Expected:** Badge shows count of unread notifications for this user's role or name

### TC-N04: Mark All Read
- **Steps:**
  1. Tester clicks "Mark All Read"
  2. PUT /api/notifications/mark-read
- **Expected:** All notifications for this user's role/name set to isRead=true; count → 0

---

### TC-FC01: Failed Core Pagination
- **Feature:** Failed Core Listing
- **Steps:**
  1. Admin navigates to Failed Cores
  2. GET /api/failed-cores?page=1&limit=50
- **Expected:** Paginated list; total, pages, data count correct

### TC-FC02: Failed Core Filter by Stage
- **Steps:**
  1. GET /api/failed-cores?failureStage=INITIAL_TEST
- **Expected:** Only INITIAL_TEST stage failures returned

### TC-FC03: Return Core to Vendor
- **Steps:**
  1. Admin selects a failed core
  2. Clicks Return to Vendor
  3. PUT /api/failed-cores/:id/return
- **Expected:** failedCore.returnStatus="RETURNED", returnedDate set, returnedBy set

### TC-FC04: Undo Return
- **Steps:**
  1. After TC-FC03, click Undo Return
  2. PUT /api/failed-cores/:id/undo-return
- **Expected:** returnStatus reset to "PENDING"

### TC-FC05: Bulk Return
- **Steps:**
  1. Select multiple failed cores
  2. POST /api/failed-cores/bulk-return with array of IDs
- **Expected:** All selected cores updated; partial errors reported in response

---

## STEP 10: API TESTING

### 10.1 Authentication APIs

| Endpoint | Method | Input | Output | Notes |
|---|---|---|---|---|
| /auth/login | POST | `{ employeeId, password }` | `{ success, user: { id, fullName, employeeId, designation, department, role } }` | Sets session cookie |
| /auth/logout | POST | (session) | `{ success: true }` | Destroys session |
| /auth/check-auth | GET | (cookie) | `{ isAuthenticated, user }` | |
| /auth/testers | GET | - | `{ success, users[] }` | Only active users in test departments |
| /auth/add-employee | POST | { fullName, mobileNumber, emailId, designation, department, dateOfJoining, employmentType, transformerSkills, testCapabilities, voltageExperience, assignedLab, password } | `{ success, employeeId }` | Auto-generates EMP ID |
| /auth/all-employees | GET | - | `{ success, users[] }` | No passwords |

### 10.2 Order APIs

| Endpoint | Method | Input | Output |
|---|---|---|---|
| POST /api/create-order | POST | multipart with images + order fields | `{ success, jobId }` |
| PUT /api/orders/:orderId/approve | PUT | orderId | `{ success, message }` |
| PUT /api/orders/:orderId/reassign | PUT | `{ stage, testerName }` | `{ success, order }` |
| PUT /api/orders/:orderId | PUT | any fields | `{ success, order }` |
| DELETE /api/orders/:orderId | DELETE | orderId | `{ success }` |
| GET /api/orders/:orderId | GET | orderId or jobId | `{ success, data: order }` |
| GET /api/admin/orders | GET | - | `[orders]` |
| GET /api/admin/notifications | GET | - | `[orders with Pending/unread status]` |
| GET /api/assigneed_orders | GET | `?type=active|history&stage=...` | `[enrichedOrders]` |
| GET /api/orders/clients/stats | GET | - | `{ success, clients[] }` |
| GET /api/orders/client/:clientName | GET | clientName | `{ success, orders[] }` |
| GET /api/orders/:orderId/reports-aggregation | GET | orderId | `{ success, reports[] }` |

### 10.3 Transformer APIs

| Endpoint | Method | Input | Output |
|---|---|---|---|
| GET /api/transformers/order/:orderId | GET | orderId | `[transformersWithReadings]` |
| PUT /api/transformers/:uniqueId/approve-stage | PUT | `{ stage, nextStage }` (auth) | `{ success }` |
| GET /api/transformers/admin-review | GET | - | `{ success, data: [transformers] }` |
| PUT /api/transformers/:uniqueId/approve-retest | PUT | `{ newTester? }` (auth) | `{ success, stage }` |
| GET /api/transformers/:uniqueId | GET | uniqueId | transformer object with jobId/clientName enriched |
| GET /api/orders/:orderId/transformers | GET | orderId | `[transformers]` |
| GET /api/secondary/reports | GET | (auth) | `[enrichedTransformers]` |
| GET /api/after-primary/reports | GET | (auth) | `[enrichedTransformers]` |
| GET /api/final/reports | GET | (auth) | `[transformers]` |

### 10.4 CT Core Test APIs

| Endpoint | Method | Input | Output |
|---|---|---|---|
| GET /api/metering-tests/:orderId | GET | orderId | MeteringCoreTest document or null |
| POST /api/metering-tests | POST | `{ orderId, coreType, readings[], ...header }` | `{ success, data }` |
| GET /api/protection-tests/:orderId | GET | orderId | ProtectionCoreTest document |
| POST /api/protection-tests | POST | `{ orderId, coreType, readings[], ...header }` | `{ success, data }` |

### 10.5 PT Test APIs

| Endpoint | Method | Input | Output |
|---|---|---|---|
| POST /api/pt-tests/submit | POST | `{ transformerId, orderId, reportData }` (auth) | `{ success, allCompleted }` |
| PUT /api/pt-tests/:orderId/approve | PUT | orderId (auth) | `{ success }` |
| PUT /api/pt-tests/transformer/:transformerId/approve | PUT | transformerId (auth) | `{ success, allApproved }` |
| POST /api/pt-tests/failed | POST | `{ transformerId, orderId, jobNumber, coreType, failureParameters, failureReason, reportedBy }` (auth) | `{ success, data }` |
| GET /api/pt-tests/all-transformers | GET | (auth) | `{ success, transformers[] }` |
| GET /api/pt-tests/reports | GET | (auth) | `[enrichedApprovedTransformers]` |
| GET /api/pt-tests/:transformerId | GET | transformerId (auth) | `{ success, data: pt_test }` |

### 10.6 Heating APIs

| Endpoint | Method | Input | Output |
|---|---|---|---|
| POST /api/heating-record | POST | `{ orderId, transformerType, blocks[] }` | `{ success }` |
| GET /api/heating-record/assigned-orders | GET | `?type=CT|PT` | `{ success, orders[] }` |
| GET /api/heating-record/transformers/:orderId | GET | orderId | `{ success, transformers[] }` |
| GET /api/heating-record/:orderId/:type | GET | orderId, type | `{ success, data: record }` |
| POST /api/heating-record/completed-status | POST | `{ orderIds[], prefix }` | `{ success, completedIds[] }` |
| PUT /api/heating-record/:orderId/approve | PUT | orderId, `{ type }` | `{ success }` |
| POST /api/heating-record/save/:uniqueId | POST | `{ processSteps, preparedBy, verifiedBy, productionManager, leftInputs, isApproveCall }` (auth) | `{ success, currentStage }` |
| POST /api/pt-heating-record | POST | `{ records[] }` | `{ success, message }` |
| GET /api/pt-heating-record/:jobId | GET | jobId | `{ success, data: records[] }` |

### 10.7 Final Test APIs

| Endpoint | Method | Input | Output |
|---|---|---|---|
| GET /api/final/reports | GET | (auth) | `[transformers with Completed final test]` |
| POST /api/final/:id | POST | final test payload (auth) | `{ success, requiresAdminReview }` |
| POST /api/final/:id/generate-save | POST | final test payload (auth) | `{ success }` |

### 10.8 Dashboard APIs

| Endpoint | Method | Input | Output |
|---|---|---|---|
| GET /api/dashboard/stats | GET | - | `{ stats[], testingData[], orderData[], recentActivity[] }` |
| GET /api/dashboard/tester-stats | GET | `?role=...&userName=...` | `{ stats: { activeTests, completedTests }, recentActivity[] }` |

### 10.9 Failed Cores APIs

| Endpoint | Method | Input | Output |
|---|---|---|---|
| POST /api/failed-cores | POST | `{ orderId, internalCoreNo, failureReason, failureStage?, dynamicValues? }` (auth) | `{ success, data }` |
| GET /api/failed-cores | GET | `?page=1&limit=50&search=&orderId=&vendorId=&coreType=&failureStage=&status=&startDate=&endDate=` (auth) | `{ success, count, total, data[], pagination }` |
| PUT /api/failed-cores/:id/return | PUT | failedCoreId (auth) | `{ success, data }` |
| PUT /api/failed-cores/:id/undo-return | PUT | failedCoreId (auth) | `{ success, data }` |
| POST /api/failed-cores/bulk-return | POST | `{ coreIds[] }` (auth) | `{ success, data[], errors? }` |
| GET /api/failed-cores/count | GET | (auth) | `{ success, count }` |

### 10.10 Notification APIs

| Endpoint | Method | Input | Output |
|---|---|---|---|
| GET /api/notifications | GET | (auth) | `{ success, notifications[] }` |
| GET /api/notifications/unread-count | GET | (auth) | `{ success, count }` |
| PUT /api/notifications/mark-read | PUT | (auth) | `{ success }` |
| PUT /api/notifications/:id/read | PUT | notificationId (auth) | `{ success }` |

### 10.11 Core Vendor APIs

| Endpoint | Method | Input | Output |
|---|---|---|---|
| GET /api/core-vendors | GET | (auth) | `{ success, data: vendors[] }` |
| POST /api/core-vendors | POST | `{ vendor_no, vendor_name, status }` (auth) | `{ success, data }` |
| DELETE /api/core-vendors/:id | DELETE | vendorId (auth) | `{ success }` |

---

## STEP 11: PRINT & REPORT TESTING

### 11.1 A4 Layout Requirements
- All print components use CSS `@media print` to enforce A4 sizing
- Reports should not show validation error states during print
- Signature fields (preparedBy, verifiedBy, productionManager) appear but are optional
- Headers must include: Job Number, Client Name, Date, Transformer Unit ID

### 11.2 Print Components and Their Scope

| Component | Type | Source Data |
|---|---|---|
| `HeatingRecord11KVCT` | CT 11KV Heating | processHistory.heatingRecord[] |
| `HeatingRecord33KVCT` | CT 33KV Heating | processHistory.heatingRecord[] |
| `HeatingRecord33KVPT` | PT 33KV Heating | processHistory.ptHeatingRecord[] |
| `PTHeatingRecordExact` | PT Heating Print | processHistory.ptHeatingRecord (exact format) |
| `FinalTestReport` | CT Final Test Report | testHistory.final_test data |
| `PTTestingReport` | PT Full Test Report | testHistory.pt_test data |
| `SecondaryMeteringReport` | CT Secondary | testHistory.secondary_test.metering_results |
| `SecondaryProtectionReport` | CT Secondary | testHistory.secondary_test.protection_results |
| `SecondaryPSReport` | CT Secondary PS | testHistory.secondary_test.ps_results |
| `AfterPrimaryMeteringReport` | CT Primary | testHistory.primary_test data |
| `AfterPrimaryPSReport` | CT Primary PS | testHistory.primary_test data |

### 11.3 Print Test Cases

| TC | Test | Expected |
|---|---|---|
| P01 | Print CT Heating Record | A4 format, all process steps visible, no missing fields |
| P02 | Print PT Test Report | IS-standard layout, all test parameter columns visible |
| P03 | Print Final Test Report | Megger readings, HV readings, polarity visible; PASS/FAIL clearly shown |
| P04 | Print secondary metering report | Core readings per ratio visible in tabular format |
| P05 | Print PT Heating Record | Date, process steps, and signatures visible |

---

## STEP 12: CONSISTENCY CHECKS

### 12.1 CT vs PT Behavior Consistency

| Behavior | CT | PT | Notes |
|---|---|---|---|
| Stage tracking | currentStage: core → secondary → primary → heating → final → shipped | currentStage: pt (stays) | PT does NOT use CT stages |
| Approval mechanism | Per-transformer via approve-stage endpoint | Per-transformer via pt-tests approve, then order-level | Different endpoints |
| Failed Core logging | Automatic on result=F in metering/protection routes | Manual via POST /api/pt-tests/failed | |
| Heating approval effect | Moves to "final" (CT) | Stays at pt stage (isApproveCall=true sets Completed only) | PT heating does NOT trigger final |
| Report visibility | After stage completion (status=Completed) | After pt_test.approved=true | |

### 12.2 Transformer-Wise Workflow Consistency
- Every CT transformer has its own `currentStage` tracked independently
- Order stage transition only happens when ALL transformers exit the current stage
- PT transformers track approval per-transformer AND per-order independently
- Admin review applies per-transformer — other transformers in same order unaffected

### 12.3 Order-Level Dependency Checks
- Approve Order → generates transformers (cannot approve twice)
- Transformer stage transitions do NOT delete any order data
- Order can have transformers at different stages simultaneously (partial completion is valid)
- Order.completionStages tracks which workflow stages have been fully completed

---

## STEP 13: FINAL COVERAGE MATRIX

| Module | Key Features | Test Cases Covered |
|---|---|---|
| Authentication | Login, logout, role mapping, session | TC-A01, TC-A02, TC-A03 |
| Admin Panel | Dashboard, order CRUD, approval, reassign, employee mgmt, retest | TC-AD01 through TC-AD06 |
| Entry Operator | Create CT/PT orders, image upload, assign testers | TC-EO01 through TC-EO04 |
| CT Core Testing | Assigned view, metering/protection test, PASS/FAIL, lock mechanism | TC-CT01 through TC-CT06 |
| CT Secondary Testing | View transformers, fill form, approve, stage transition | TC-CT05 (adapts to secondary), TC-CT06 |
| CT After-Primary Testing | Primary form, approval, transition to heating | (ST/PT series adapted above) |
| CT Heating Record | Draft save, approve, stage transition to final | TC-HT01, TC-HT02 |
| CT Final Testing | Pass, Megger fail, HV fail types, admin review routing | TC-FT01 through TC-FT04 |
| PT Testing | Assigned view, submit, re-edit, per-transformer approve, order approve, reports | TC-PT01 through TC-PT08 |
| PT Heating Record | Form fill, save | TC-HT03 |
| Reports | Secondary/primary/final/PT reports, print | TC-R01 through TC-R04 |
| Notifications | Fetch, unread count, mark read, auto-create | TC-N01 through TC-N04 |
| Failed Cores | Pagination, filter, return, undo-return, bulk return | TC-FC01 through TC-FC05 |
| Print/Report Rendering | All A4 components | P01 through P05 |

**Total Test Cases Defined:** 55+
**API Endpoints Documented:** 45+
**Data Models Documented:** 6 core schemas
**Workflow Stages Documented:** CT (7 stages), PT (1 stage + approval), Heating (CT + PT variants)

---

## APPENDIX: IMPORTANT IMPLEMENTATION NOTES FOR TESTSPRITE

1. **Session auth required:** All test API calls (except /auth/login, /report/:id) require a valid session cookie from `POST /auth/login`.
2. **MongoDB ObjectId vs string:** Many endpoints handle both `ObjectId` and string-format IDs. Test both forms.
3. **Tester name matching:** Uses `$in` array with `[user.name, user.fullName, trimmed variants]` — test with exact and case-trimmed names.
4. **PT heating vs CT heating:** ARE SEPARATE modules with separate API endpoints. Do not confuse.
5. **lockMechanism for failed cores:** A reading with status=FAIL cannot be overwritten. Test this boundary.
6. **Transformer uniqueId format:** Always `TR-<jobId>-<000>` (e.g., `TR-JOB-2026-001-003`). Cannot be arbitrary.
7. **Order ID can be MongoDB _id OR jobId string** in some endpoints (triple query pattern).
8. **Print mode:** Reports suppress validation in print mode. Ensure Playwright/TestSprite uses `window.print()` mock or screenshot capture.
9. **Cloudinary:** Image upload tests require valid Cloudinary credentials set in Backend `.env`. Without them, upload will fail with 500 (handled gracefully).
10. **PT approval check:** `Object.keys(testHistory.pt_test).length > 0` is the guard — an empty object `{}` is treated as no data.
