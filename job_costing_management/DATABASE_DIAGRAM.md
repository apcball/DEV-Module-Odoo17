
# Job Costing Management - Database Schema Overview

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    JOB COSTING MODULE                                   │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│    job.costing       │
├──────────────────────┤
│ PK id                │
│ name (seq)           │
│ title                │
│ FK partner_id        │──────┐
│ FK project_id        │      │
│ date_start           │      │
│ date_end             │      │
│ FK user_id           │      │
│ FK manager_id        │      │
│ state                │      │
│ total_budgeted_cost  │      │
│ total_actual_cost    │      │
│ profit_margin        │      │
│ company_id           │      │
└──────────┬───────────┘      │
           │                  │
           │ 1:N              │
           ▼                  │
┌──────────────────────┐     │
│  job.costing.line    │     │
├──────────────────────┤     │
│ PK id                │     │
│ FK job_id            │     │
│ sequence             │     │
│ cost_type            │     │
│ FK product_id        │─────┼────┐
│ description          │     │    │
│ planned_qty          │     │    │
│ planned_unit_cost    │     │    │
│ planned_total_cost   │     │    │
│ actual_qty           │     │    │
│ actual_total_cost    │     │    │
└──────────┬───────────┘     │    │
           │                 │    │
           │                 │    │
           │ 1:N             │    │
           │                 │    │
           │    ┌────────────┘    │
           │    │                 │
           ▼    │                 │
┌───────────────────────────┐    │
│  material.requisition     │    │
├───────────────────────────┤    │
│ PK id                     │    │
│ name (seq)                │    │
│ FK job_id ────────────────┘    │
│ FK requester_id                │
│ FK department_id               │
│ date_request                   │
│ date_required                  │
│ priority                       │
│ state                          │
│ FK approved_by                 │
│ total_estimated_cost           │
│ total_delivered_cost           │
│ FK warehouse_id                │
│ FK location_id                 │
│ FK delivery_address_id ────────┼──┐
│ FK procurement_group_id        │  │
│ company_id                     │  │
└──────────┬────────────────────┘  │
           │                       │
           │ 1:N                   │
           ▼                       │
┌───────────────────────────┐      │
│ material.requisition.line │      │
├───────────────────────────┤      │
│ PK id                     │      │
│ FK requisition_id ────────┘      │
│ sequence                         │
│ FK product_id ───────────────────┘
│ description
│ FK uom_id
│ quantity_requested
│ quantity_approved
│ quantity_delivered
│ estimated_unit_cost
│ estimated_total_cost
│ FK job_costing_line_id ──────────┐
│ FK analytic_account_id           │
└──────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                          STOCK INTEGRATION                               │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   stock.picking (extended)                                               │
│   ├─ FK requisition_id ─────────────────────────────────────────┐        │
│   └─ FK job_costing_id ───────────────────────────────────────┐ │        │
│                                                               │ │        │
│   stock.move (extended)                                       │ │        │
│   └─ Many2many requisition_line_ids ──────────────────────────┘ │        │
│                                                                 │        │
│   procurement.group                                             │        │
│   └─ 1:1 with material.requisition                              │        │
│                                                                 │        │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                           WIZARD MODELS                                  │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   material.requisition.wizard (Transient)                                │
│   ├─ step: Integer (1-3)                                                 │
│   ├─ FK job_id                                                           │
│   ├─ FK requester_id                                                     │
│   ├─ date_required                                                       │
│   ├─ priority                                                            │
│   ├─ FK warehouse_id                                                     │
│   ├─ FK location_id                                                      │
│   ├─ FK delivery_address_id                                              │
│   └─ line_ids: One2many                                                  │
│                                                                          │
│   material.requisition.wizard.line (Transient)                           │
│   ├─ FK wizard_id                                                        │
│   ├─ sequence                                                            │
│   ├─ FK product_id                                                       │
│   ├─ description                                                         │
│   ├─ FK uom_id                                                           │
│   ├─ quantity                                                            │
│   ├─ available_qty (computed)                                            │
│   ├─ estimated_unit_cost                                                 │
│   └─ FK job_costing_line_id                                              │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

## Key Relationships Summary

### One-to-Many (1:N)
| Parent | Child | Field |
|--------|-------|-------|
| job.costing | job.costing.line | job_id |
| job.costing | material.requisition | job_id |
| job.costing | stock.picking | job_costing_id |
| job.costing.line | material.requisition.line | job_costing_line_id |
| material.requisition | material.requisition.line | requisition_id |
| material.requisition | stock.picking | requisition_id |
| material.requisition | procurement.group | (stored FK) |

### Many-to-One (N:1)
| Model | References | Field |
|-------|------------|-------|
| job.costing | res.partner | partner_id |
| job.costing | res.users | user_id |
| job.costing | hr.employee | manager_id |
| job.costing | project.project | project_id |
| material.requisition | job.costing | job_id |
| material.requisition | hr.employee | requester_id, approved_by |
| material.requisition | stock.warehouse | warehouse_id |
| material.requisition.line | product.product | product_id |
| material.requisition.line | uom.uom | uom_id |

### Many-to-Many (M:N)
| Model 1 | Model 2 | Relation Table |
|---------|---------|----------------|
| material.requisition.line | stock.move | material_req_line_stock_move_rel |

## State Machines

### Job Costing States
```
draft ──▶ in_progress ──▶ done
  │           │
  │           ▼
  │        on_hold ──▶ in_progress
  │
  └──────────────────▶ cancelled
```

### Material Requisition States
```
draft ──▶ submit ──▶ approve ──▶ done
            │           │
            ▼           ▼
         reject     partial ──▶ done
            │
            └────────────────▶ cancelled
```

## Wizard Steps
```
┌─────────┐     ┌─────────┐     ┌─────────┐
│  Step 1 │────▶│  Step 2 │────▶│  Step 3 │
│  Basic  │     │  Items  │     │ Review  │
│  Info   │     │         │     │ Submit  │
└─────────┘     └─────────┘     └─────────┘
   Select          Add            Confirm
   Job/Project     Materials      & Submit
   Dates          Quantities
   Priority
```

## Index Strategy

### Primary Indexes
- `job_costing(name)` - Sequence lookups
- `job_costing(state)` - List filtering
- `job_costing(partner_id)` - Customer queries
- `material_requisition(name)` - Sequence lookups
- `material_requisition(state)` - Workflow queries
- `material_requisition(job_id)` - Job requisitions
- `material_requisition(requester_id)` - My requisitions

### Foreign Key Indexes (auto-created by Odoo)
- All `Many2one` fields are automatically indexed

## Data Integrity Constraints

### Job Costing
1. `name` must be unique
2. `date_end` >= `date_start`
3. At least one line required before `in_progress`

### Material Requisition
1. `name` must be unique
2. `date_required` >= `date_request`
3. At least one line required before `submit`
4. `quantity_approved` <= `quantity_requested`

### Material Requisition Line
1. `quantity_requested` > 0
2. `uom_id` must be in same category as `product_id.uom_id`

## Computed Fields

### Job Costing
- `total_*_budget` - Sum of line planned costs by type
- `total_*_actual` - Sum of actual costs (from requisitions/lines)
- `profit_margin` - Calculated from budget
- `actual_profit_margin` - Calculated from actual costs

### Material Requisition
- `total_estimated_cost` - Sum of line estimated costs
- `total_delivered_cost` - Sum of delivered line costs
- `needs_approval` - Based on amount vs approval limit

### Material Requisition Line
- `quantity_delivered` - Sum from completed stock moves
- `estimated_total_cost` - qty × unit cost
- `delivered_total_cost` - From stock valuation
