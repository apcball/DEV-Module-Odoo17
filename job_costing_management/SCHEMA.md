# Job Costing Management Module - Database Schema
## Odoo 17 Module Design

---

## Overview

This module provides comprehensive job costing and material requisition management with:
- Job/Project cost tracking (budgeted vs actual)
- Material requisition workflow with approvals
- Step-by-step wizard for material requests
- Full inventory/stock integration

---

## Model Architecture

```
┌─────────────────┐     ┌─────────────────────┐     ┌─────────────────┐
│   res.partner   │────▶│      Job/Project    │◄────│   hr.employee   │
│   (Customer)    │     │   (job.costing)     │     │    (Manager)    │
└─────────────────┘     └─────────────────────┘     └─────────────────┘
           ▲                       │
           │                       │
           │           ┌───────────┴───────────┐
           │           │                       │
           │     ┌─────▼─────┐          ┌──────▼──────┐
           │     │  Job Line │          │ Material    │
           │     │ (Budget)  │          │ Requisition │
           │     └───────────┘          └──────┬──────┘
           │                                   │
           │                          ┌────────┴────────┐
           │                          │                 │
           │                    ┌─────▼─────┐    ┌──────▼──────┐
           │                    │ Req Line  │    │  Stock Pick │
           └────────────────────│ (Items)   │◄───│  (stock.picking)│
                                └───────────┘    └─────────────┘
```

---

## Model Definitions

### 1. Job Costing (job.costing)
Main entity representing a job or project.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | Char | Yes | Job reference number (sequence) |
| title | Char | Yes | Job title/description |
| partner_id | Many2one | Yes | Customer (res.partner) |
| project_id | Many2one | No | Related project (project.project) |
| date_start | Date | Yes | Job start date |
| date_end | Date | No | Job completion date |
| user_id | Many2one | Yes | Responsible salesperson |
| manager_id | Many2one | Yes | Project manager |
| state | Selection | Yes | draft → in_progress → done → cancelled |
| total_budgeted_cost | Float | Computed | Sum of all budgeted costs |
| total_actual_cost | Float | Computed | Sum of all actual costs |
| total_material_budget | Float | Computed | From job lines |
| total_material_actual | Float | Computed | From requisitions |
| total_labor_budget | Float | Computed | From job lines |
| total_labor_actual | Float | Computed | From timesheets/invoices |
| total_overhead_budget | Float | Computed | From job lines |
| total_overhead_actual | Float | Computed | From expenses |
| profit_margin | Float | Computed | Budgeted profit percentage |
| actual_profit_margin | Float | Computed | Actual profit percentage |
| note | Text | No | Internal notes |
| job_line_ids | One2many | - | Budget line items |
| requisition_ids | One2many | - | Related material requisitions |
| picking_ids | One2many | - | Related stock pickings |

**Constraints:**
- Unique name (sequence-based)
- date_end >= date_start
- State transitions enforced via workflow

---

### 2. Job Costing Line (job.costing.line)
Budget line items for different cost categories.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| job_id | Many2one | Yes | Parent job costing |
| sequence | Integer | No | Display order |
| cost_type | Selection | Yes | material/labor/overhead/subcontractor |
| product_id | Many2one | No | Related product (for materials) |
| description | Char | Yes | Line description |
| uom_id | Many2one | No | Unit of measure |
| planned_qty | Float | Yes | Budgeted quantity |
| planned_unit_cost | Float | Yes | Budgeted unit cost |
| planned_total_cost | Float | Computed | planned_qty × planned_unit_cost |
| actual_qty | Float | Computed | Actual quantity used |
| actual_unit_cost | Float | Computed | Weighted average actual cost |
| actual_total_cost | Float | Computed | Actual total cost |
| variance_amount | Float | Computed | planned - actual |
| variance_percent | Float | Computed | (variance / planned) × 100 |

---

### 3. Material Requisition (material.requisition)
Header for material requests.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | Char | Yes | Requisition number (sequence) |
| job_id | Many2one | Yes | Related job costing |
| requester_id | Many2one | Yes | Employee requesting materials |
| department_id | Many2one | No | Department |
| date_request | DateTime | Yes | Request date (default now) |
| date_required | Date | Yes | Date materials needed |
| priority | Selection | Yes | low/normal/high/urgent |
| state | Selection | Yes | draft → submit → approve → done → reject |
| line_ids | One2many | - | Requisition line items |
| picking_ids | One2many | - | Generated stock pickings |
| picking_count | Integer | Computed | Number of pickings |
| total_estimated_cost | Float | Computed | Sum of line costs |
| approved_by | Many2one | No | Manager who approved |
| date_approved | DateTime | No | Approval timestamp |
| rejection_reason | Text | No | Reason if rejected |
| delivery_address_id | Many2one | Yes | Where to deliver |
| notes | Text | No | Additional notes |

**Constraints:**
- date_required >= date_request
- Approval required based on amount threshold

---

### 4. Material Requisition Line (material.requisition.line)
Individual items requested.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| requisition_id | Many2one | Yes | Parent requisition |
| sequence | Integer | No | Display order |
| product_id | Many2one | Yes | Product requested |
| description | Char | Yes | Product description |
| uom_id | Many2one | Yes | Unit of measure |
| quantity_requested | Float | Yes | Amount requested |
| quantity_approved | Float | No | Amount approved (manager can reduce) |
| quantity_delivered | Float | Computed | Amount actually delivered |
| quantity_remaining | Float | Computed | requested - delivered |
| estimated_unit_cost | Float | Computed | From product standard cost |
| estimated_total_cost | Float | Computed | quantity × unit_cost |
| job_costing_line_id | Many2one | No | Link to budget line |
| analytic_account_id | Many2one | Computed | From job costing |
| procurement_group_id | Many2one | No | Odoo procurement group |
| move_ids | Many2many | Computed | Related stock moves |
| state | Selection | Computed | Based on parent requisition |

---

### 5. Material Requisition Wizard (material.requisition.wizard)
Transient model for step-by-step material requests.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| step | Integer | Yes | Current wizard step (1-4) |
| job_id | Many2one | Yes | Selected job |
| department_id | Many2one | No | Department |
| date_required | Date | Yes | When needed |
| priority | Selection | Yes | Request priority |
| delivery_address_id | Many2one | Yes | Delivery location |
| line_ids | One2many | - | Wizard line items |
| total_cost | Float | Computed | Running total |
| can_approve_self | Boolean | Computed | User has approval rights |
| needs_approval | Boolean | Computed | Requires manager approval |

**Wizard Steps:**
1. Select Job & Basic Info
2. Add Materials
3. Review & Submit
4. Confirmation

---

### 6. Material Requisition Wizard Line (material.requisition.wizard.line)
Transient lines for wizard.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| wizard_id | Many2one | Yes | Parent wizard |
| product_id | Many2one | Yes | Product |
| description | Char | Computed | From product |
| uom_id | Many2one | Computed | From product |
| quantity | Float | Yes | Requested quantity |
| available_qty | Float | Computed | Current stock available |
| estimated_cost | Float | Computed | Cost estimate |
| job_costing_line_id | Many2one | No | Budget line to charge |

---

## Relationships Summary

```
job.costing
├── job_line_ids → job.costing.line [1:N]
├── requisition_ids → material.requisition [1:N]
└── partner_id → res.partner [N:1]

material.requisition
├── job_id → job.costing [N:1]
├── line_ids → material.requisition.line [1:N]
├── requester_id → hr.employee [N:1]
├── approved_by → hr.employee [N:1]
├── department_id → hr.department [N:1]
└── picking_ids → stock.picking [1:N]

material.requisition.line
├── requisition_id → material.requisition [N:1]
├── product_id → product.product [N:1]
├── uom_id → uom.uom [N:1]
└── job_costing_line_id → job.costing.line [N:1]

stock.picking (extended)
└── requisition_id → material.requisition [N:1]
```

---

## Constraints & Validation

### Job Costing
1. **Name Uniqueness:** Auto-generated sequence, no duplicates
2. **Date Validation:** End date cannot be before start date
3. **State Transitions:** Only valid state changes allowed
4. **Budget Required:** At least one line before confirmation

### Material Requisition
1. **Date Validation:** Required date cannot be before request date
2. **Line Required:** At least one line to submit
3. **Approval Threshold:** Amount > limit requires manager approval
4. **Quantity Validation:** Approved qty cannot exceed requested

### Material Requisition Line
1. **Product Availability:** Warning if requested qty > available
2. **Budget Check:** Warning if exceeds budgeted amount
3. **UOM Compatibility:** Must be in product's UOM category

---

## Computed Fields Logic

### Job Costing Totals
```python
@api.depends('job_line_ids.planned_total_cost')
def _compute_total_budgeted(self):
    for job in self:
        lines = job.job_line_ids
        job.total_material_budget = sum(lines.filtered(lambda l: l.cost_type == 'material').mapped('planned_total_cost'))
        job.total_labor_budget = sum(lines.filtered(lambda l: l.cost_type == 'labor').mapped('planned_total_cost'))
        job.total_overhead_budget = sum(lines.filtered(lambda l: l.cost_type == 'overhead').mapped('planned_total_cost'))
        job.total_budgeted_cost = job.total_material_budget + job.total_labor_budget + job.total_overhead_budget
```

### Requisition Status
```python
@api.depends('line_ids.quantity_requested', 'line_ids.quantity_delivered')
def _compute_requisition_state(self):
    # Auto-update to done when all lines delivered
```

---

## Security & Access Control

| Role | Job Costing | Requisition | Approval |
|------|-------------|-------------|----------|
| Sales/User | Read/Create | Create own | - |
| Project Manager | Full | Full | Department |
| Operations Manager | Full | Full | All |
| Accountant | Read | Read | - |
| Administrator | Full | Full | All |

---

## Sequence Definitions

```python
# Job Costing Number
job.costing.sequence: JOB/%(year)s/%(sequence)04d → JOB/2025/0001

# Requisition Number
material.requisition.sequence: MR/%(year)s/%(sequence)04d → MR/2025/0001
```

---

## Indexes for Performance

```sql
-- Job lookups
CREATE INDEX idx_job_costing_partner ON job_costing(partner_id);
CREATE INDEX idx_job_costing_state ON job_costing(state);
CREATE INDEX idx_job_costing_dates ON job_costing(date_start, date_end);

-- Requisition lookups
CREATE INDEX idx_material_req_job ON material_requisition(job_id);
CREATE INDEX idx_material_req_state ON material_requisition(state);
CREATE INDEX idx_material_req_requester ON material_requisition(requester_id);

-- Line lookups
CREATE INDEX idx_material_req_line_product ON material_requisition_line(product_id);
CREATE INDEX idx_material_req_line_requisition ON material_requisition_line(requisition_id);
```

---

## Wizard Workflow States

```
┌─────────┐    Select Job     ┌─────────┐
│  Start  │──────────────────▶│ Step 1  │
└─────────┘                   └────┬────┘
                                   │
                                   │ Add Materials
                                   ▼
┌─────────┐    Submit      ┌──────────────┐
│   Done  │◄───────────────│    Step 2    │
└─────────┘                └──────┬───────┘
                                  │
                                  │ Review
                                  ▼
                           ┌──────────────┐
                           │    Step 3    │
                           └──────────────┘
```

This schema provides a robust foundation for job costing and material requisition management with full traceability and approval workflows.
