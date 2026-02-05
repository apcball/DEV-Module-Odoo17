# Material Request (MR) Design for Multi-BOQ System
## Supporting "1 PO Multiple BOQ" Architecture

### Executive Summary
This document outlines the optimal design for Material Requests (MR) in a system that supports associating one Purchase Order (PO) with multiple Bill of Quantities (BOQ). The design focuses on flexibility, traceability, and efficient material management while maintaining clear audit trails.

---

### Core Data Structure

#### Material Request (MR) Entity
```
MR_ID (Primary Key)
PO_Reference (Foreign Key to PO)
BOQ_References (Array/List of BOQ IDs this MR relates to)
Request_Code (Unique identifier for the MR)
Project_Code
Department_Code
Requestor_ID
Request_Date
Required_Date
Status (Draft/Pending Approval/Approved/Rejected/Partially Issued/Completed/Closed)
Priority_Level (High/Medium/Low)
Budget_Code
Cost_Center
Location_Code
Description
Created_By
Created_Date
Modified_By
Modified_Date
Approved_By
Approved_Date
```

#### MR_Items Sub-Entity (One-to-Many relationship with MR)
```
MR_Item_ID (Primary Key)
MR_ID (Foreign Key)
Item_Code
Item_Description
Unit_of_Measure
Quantity_Requested
Quantity_Approved
Quantity_Issued
Quantity_Remaining
Unit_Price_Estimated
Total_Value_Estimated
BOQ_Reference (Specific BOQ this item belongs to)
BOQ_Line_Number
Cost_Code
Category_Code
Specification
Supplier_Reference
Delivery_Location
Priority_Flag
Justification_Notes
```

---

### Key Fields Explanation

#### Critical Identification Fields
- **MR_ID**: Unique identifier for each material request
- **PO_Reference**: Links the MR to a single PO (enabling 1 PO to multiple BOQs)
- **BOQ_References**: Array field storing multiple BOQ IDs that this MR serves
- **Request_Code**: Human-readable reference code for tracking

#### Status Management Fields
- **Status**: Comprehensive status tracking from creation to closure
- **Priority_Level**: Enables prioritization of requests
- **Required_Date**: When materials are needed

#### Financial Tracking Fields
- **Budget_Code**: Links to budget allocation
- **Cost_Center**: Departmental cost tracking
- **Estimated values**: For budget monitoring
- **Quantity tracking**: Requested vs approved vs issued quantities

---

### Workflow Design

#### Phase 1: Creation
1. User creates MR referencing one PO and multiple BOQs
2. System validates:
   - PO exists and is active
   - All referenced BOQs belong to the same PO
   - Budget availability
3. Items are added with associated BOQ references
4. MR saved in "Draft" status

#### Phase 2: Validation & Approval
1. System validates:
   - Sufficient budget allocation across referenced BOQs
   - Proper authorization levels based on value thresholds
   - Technical specifications completeness
2. MR submitted for approval
3. Approval workflow triggered based on:
   - Total value of request
   - Requesting department
   - Item categories
4. Upon approval, status changes to "Approved"

#### Phase 3: Procurement Preparation
1. System generates procurement recommendations:
   - Consolidated items across BOQs (if same item appears in multiple BOQs)
   - Supplier suggestions based on historical data
   - Delivery scheduling optimization
2. Purchase Order preparation (if not already linked)

#### Phase 4: Fulfillment
1. Warehouse/inventory team processes approved MR
2. Items issued against specific BOQ codes
3. Quantity tracking updated in real-time
4. Status updated to "Partially Issued" or "Completed"

#### Phase 5: Closure
1. All items fulfilled
2. Final reconciliation against BOQs
3. Status changed to "Closed"
4. Audit trail maintained

---

### Advanced Features

#### Cross-BOQ Optimization
- System identifies duplicate items across multiple BOQs within the same MR
- Suggests consolidation to reduce procurement costs
- Maintains separate accounting for each BOQ

#### Budget Control
- Real-time budget validation across multiple BOQs
- Alerts when combined requests exceed allocated budgets
- Automatic routing to appropriate approval authorities

#### Reporting Capabilities
- Track material usage by BOQ
- Monitor PO utilization across multiple projects
- Analyze spending patterns across BOQs
- Generate compliance reports

---

### Database Relationships

```
Purchase_Order (1) <---> (Many) Material_Request
Material_Request (1) <---> (Many) MR_Items
MR_Items (Many) <---> (Many) BOQ (via BOQ_Reference field)
BOQ (1) <---> (Many) BOQ_Items
```

---

### API Endpoints (Conceptual)

- `POST /material-requests` - Create new MR with multiple BOQ references
- `GET /material-requests/{id}` - Retrieve MR with all related BOQ data
- `PUT /material-requests/{id}/approve` - Approve MR
- `PUT /material-requests/{id}/items/{item_id}/issue` - Issue specific items
- `GET /po/{po_id}/material-requests` - Get all MRs for a PO (multi-BOQ view)

---

### Security Considerations

- Access control based on:
  - Department ownership
  - Budget authority levels
  - Project visibility permissions
- Audit logging for all status changes
- Change tracking for quantities and approvals

---

### Integration Points

- **ERP System**: Budget validation, PO creation
- **Inventory System**: Stock checking, issuance processing  
- **Project Management**: BOQ synchronization
- **Financial Systems**: Cost allocation and reporting