# Material Request (MR) System Design for 1 PO Multiple BOQ Support
## Odoo 17 Compliant Implementation

### Overview
This document outlines the design for a new Material Request (MR) system that supports the "1 PO Multiple BOQ" business requirement. The system allows creating a single Purchase Order (PO) that references multiple Bill of Quantities (BOQs), streamlining procurement processes for construction and project management scenarios.

### Core Models Architecture

#### 1. `boq.material.request` (Main MR Model)
```
Model Name: boq.material.request
Description: Main Material Request record containing header information
```

**Fields:**
- `name` (Char, required): MR Reference Number (Auto-generated)
- `state` (Selection, required): ['draft', 'confirmed', 'approved', 'partially_ordered', 'ordered', 'done', 'cancelled']
- `date_requested` (Date, required): Date when MR was created
- `date_required` (Date, required): Expected delivery date
- `requested_by_id` (Many2one, required): Employee requesting materials
- `department_id` (Many2one): Department making the request
- `project_id` (Many2one): Related project (if applicable)
- `purchase_order_id` (Many2one): Link to generated PO (when created)
- `boq_ids` (Many2many): Multiple BOQs associated with this MR
- `total_amount` (Monetary): Calculated total value of all items
- `currency_id` (Many2one): Currency for monetary fields
- `company_id` (Many2one): Company reference
- `notes` (Text): Additional notes/comments
- `approved_by_id` (Many2one): Approver (set when approved)
- `approval_date` (Datetime): Date of approval
- `procurement_team_id` (Many2one): Procurement team responsible

#### 2. `boq.material.request.line` (MR Line Items)
```
Model Name: boq.material.request.line
Description: Individual material request line items
```

**Fields:**
- `material_request_id` (Many2one, required): Parent MR
- `product_id` (Many2one, required): Product/service being requested
- `product_uom_id` (Many2one, required): Unit of measure
- `quantity` (Float, required): Requested quantity
- `unit_price` (Float): Estimated unit price
- `subtotal` (Float): Quantity * Unit Price
- `boq_line_id` (Many2one): Reference to original BOQ line
- `boq_id` (Many2one): Reference to original BOQ
- `description` (Text): Item description
- `state` (Selection): ['draft', 'confirmed', 'ordered', 'delivered', 'cancelled']
- `purchase_line_id` (Many2one): Link to purchase order line
- `received_qty` (Float): Quantity received
- `ordered_qty` (Float): Quantity ordered
- `remaining_qty` (Float): Quantity still needed
- `sequence` (Integer): Display sequence

#### 3. `boq.order.link` (Cross-reference Model)
```
Model Name: boq.order.link
Description: Links MR to multiple BOQs with additional metadata
```

**Fields:**
- `material_request_id` (Many2one, required): Reference to MR
- `boq_id` (Many2one, required): Reference to BOQ
- `linked_date` (Datetime): When link was created
- `responsible_person_id` (Many2one): Person responsible for this BOQ
- `estimated_value` (Monetary): Estimated value from this BOQ
- `notes` (Text): Specific notes for this BOQ-MR combination

### Business Workflow

#### Phase 1: Creation & Planning
1. **MR Creation**: User creates new Material Request
2. **BOQ Selection**: Select multiple BOQs to associate with the MR
3. **Line Generation**: System automatically generates MR lines from selected BOQs
4. **Review & Adjustment**: User can modify quantities, prices, or add/remove items
5. **Confirmation**: MR is confirmed and moves to "confirmed" state

#### Phase 2: Approval Process
1. **Approval Routing**: Based on amount and company policies
2. **Approver Actions**: 
   - Approve: Move to "approved" state
   - Reject: Move to "cancelled" state
   - Return for revision: Back to "draft" state
3. **Notification**: Stakeholders notified of status changes

#### Phase 3: Procurement Execution
1. **PO Creation**: From approved MR, create single PO referencing multiple BOQs
2. **Vendor Selection**: Select vendors for different items
3. **Order Processing**: Track order fulfillment
4. **Goods Receipt**: Record deliveries against MR lines
5. **Status Tracking**: Update remaining quantities and statuses

### State Transitions

```
State Flow:
draft ──► confirmed ──► approved ──► partially_ordered ──► ordered ──► done
  │           │           │                │                   │        │
  │           │           └── cancelled ◄──┘                   └── cancelled
  │           │           (rejected)                              (rejected)
  └── cancelled
   (deleted)
```

### Key Methods & Functions

#### Onchange Methods:
- `onchange_boq_ids()`: Recalculate totals when BOQs are added/removed
- `onchange_quantity()`: Update subtotal calculations
- `onchange_product_id()`: Set default UOM and pricing

#### Action Methods:
- `action_confirm()`: Confirm the MR and lock basic fields
- `action_approve()`: Approve the MR for procurement
- `action_cancel()`: Cancel the MR and prevent further processing
- `action_create_purchase_order()`: Generate PO from approved MR
- `action_view_purchase_orders()`: View related POs
- `action_view_boqs()`: View associated BOQs

#### Security & Access Rights:
- Different access levels based on department/role
- Field-level security for sensitive information
- Record rules to limit visibility by company/project

### Views & User Interface

#### Form View (`boq.material.request.form`)
- Header section with basic MR information
- Tabbed interface showing:
  - General information
  - Lines (with editable tree view)
  - Associated BOQs
  - Purchase orders
  - History/notes

#### Tree/List View (`boq.material.request.tree`)
- Key fields display: Reference, State, Requested By, Required Date, Total Amount
- Quick filters for common searches

#### Kanban View (`boq.material.request.kanban`)
- Visual status tracking with color coding
- Quick action buttons

### Reports & Documents

#### Standard Reports:
- Material Request Summary
- MR vs BOQ Comparison Report
- Procurement Status Report
- Pending Requirements Report

#### Generated Documents:
- Material Request Printout
- Approval Notification Email
- Procurement Summary

### Integration Points

#### With Purchase Module:
- Seamless PO creation from MR
- Bidirectional status updates
- Shared vendor information

#### With Inventory Module:
- Stock availability checking
- Reservation of materials
- Automatic reorder triggers

#### With Accounting Module:
- Budget tracking and commitment
- Cost center allocation
- Invoice matching

### Technical Implementation Considerations

#### Database Indexes:
- Index on `state` field for performance
- Composite index on `(company_id, state)` for filtered queries
- Index on `purchase_order_id` for join performance

#### Performance Optimization:
- Use computed fields for frequently accessed calculated values
- Implement proper caching strategies
- Optimize queries with prefetch_related where appropriate

#### Data Integrity:
- SQL constraints to ensure positive quantities
- Unique constraints where appropriate
- Proper foreign key relationships

### Customizations & Extensions

#### Possible Future Enhancements:
- Integration with mobile apps for field approvals
- Advanced reporting with drill-down capabilities
- Automated vendor selection algorithms
- Integration with warehouse management systems

This design provides a robust foundation for handling "1 PO Multiple BOQ" requirements while maintaining Odoo 17 compliance and following standard development practices.