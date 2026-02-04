# Landed Cost Report - UI/UX Design Document

## Odoo 17 Module: Landed Cost Report

---

## Table of Contents
1. [Overview](#overview)
2. [Form View Layout](#form-view-layout)
3. [Component Specifications](#component-specifications)
4. [Visual Design](#visual-design)
5. [Interaction Flow](#interaction-flow)
6. [Technical Notes](#technical-notes)

---

## Overview

### Purpose
The Landed Cost Report provides a comprehensive view of all costs associated with importing goods, including product costs and various service charges (freight, customs, insurance, etc.).

### Key Features
- Single-page report layout
- Multi-currency support with exchange rate input
- Categorized cost display (Products vs Services)
- Summary section with cost breakdown
- Excel export functionality
- On-screen preview (PDF/HTML)

---

## Form View Layout

### Overall Structure (Single Page)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  LANDED COST REPORT                                    [Save] [Discard]    │
├─────────────────────────────────────────────────────────────────────────────┤
│  ╔═══════════════════════════════════════════════════════════════════════╗  │
│  ║  HEADER SECTION (Card)                                                ║  │
│  ╠═══════════════════════════════════════════════════════════════════════╣  │
│  ║  Report Name: [________________]  Date: [____/____/________]          ║  │
│  ║  Reference:   [________________]  Status: [Draft ▼]                   ║  │
│  ╚═══════════════════════════════════════════════════════════════════════╝  │
│                                                                              │
│  ╔═══════════════════════════════════════════════════════════════════════╗  │
│  ║  CURRENCY & EXCHANGE RATE SECTION (Card - Highlighted)                ║  │
│  ╠═══════════════════════════════════════════════════════════════════════╣  │
│  ║  Base Currency:     [USD ▼]        Target Currency: [THB ▼]          ║  │
│  ║  Exchange Rate:     [1.00     ]  ←→  [35.50    ] [🔄 Refresh]         ║  │
│  ║  Rate Source:       [Manual ▼]    Last Updated: 2026-02-04 10:30      ║  │
│  ╚═══════════════════════════════════════════════════════════════════════╝  │
│                                                                              │
│  ╔═══════════════════════════════════════════════════════════════════════╗  │
│  ║  LANDED COST LINES (Notebook Tabs)                                    ║  │
│  ╠═══════════════════════════════════════════════════════════════════════╣  │
│  ║  [Products] [Services] [All Costs]                                    ║  │
│  ║                                                                       ║  │
│  ║  ┌─────────────────────────────────────────────────────────────────┐  ║  │
│  ║  │ Search...  [Filter ▼]  [Group By ▼]            [Add Line]      │  ║  │
│  ║  ├─────────────────────────────────────────────────────────────────┤  ║  │
│  ║  │ Product/Service    │ Qty │ Unit Cost │ Currency │ Cost (Base)  │  ║  │
│  ║  ├────────────────────┼─────┼───────────┼──────────┼──────────────┤  ║  │
│  ║  │ Laptop Pro X1      │ 10  │ $1,200.00 │ USD      │ $12,000.00   │  ║  │
│  ║  │ Wireless Mouse     │ 50  │ $25.00    │ USD      │ $1,250.00    │  ║  │
│  ║  │ USB-C Hub          │ 20  │ $45.00    │ USD      │ $900.00      │  ║  │
│  ║  │                    │     │           │          │              │  ║  │
│  ║  │                    │     │           │          │              │  ║  │
│  ║  └─────────────────────────────────────────────────────────────────┘  ║  │
│  ║                                                                       ║  │
│  ║  *Services Tab Shows:*                                                ║  │
│  ║  ┌─────────────────────────────────────────────────────────────────┐  ║  │
│  ║  │ Service Type  │ Provider    │ Amount │ Currency │ Cost (Base)  │  ║  │
│  ║  ├───────────────┼─────────────┼────────┼──────────┼──────────────┤  ║  │
│  ║  │ 🚢 Freight    │ DHL Express │ $500   │ USD      │ $500.00      │  ║  │
│  ║  │ 🛃 Customs    │ FedEx       │ $350   │ USD      │ $350.00      │  ║  │
│  ║  │ 🛡️ Insurance  │ AXA         │ $150   │ USD      │ $150.00      │  ║  │
│  ║  │ 📋 Handling   │ Local Agent │ $75    │ USD      │ $75.00       │  ║  │
│  ║  └─────────────────────────────────────────────────────────────────┘  ║  │
│  ╚═══════════════════════════════════════════════════════════════════════╝  │
│                                                                              │
│  ╔═══════════════════════════════════════════════════════════════════════╗  │
│  ║  SERVICE COSTS METRICS (Cards Row)                                    ║  │
│  ╠═══════════════════════════════════════════════════════════════════════╣  │
│  ║  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  ║  │
│  ║  │  🚢 FREIGHT  │ │  🛃 CUSTOMS  │ │ 🛡️ INSURANCE │ │  📋 OTHER    │  ║  │
│  ║  │              │ │              │ │              │ │              │  ║  │
│  ║  │   $500.00    │ │   $350.00    │ │   $150.00    │ │    $75.00    │  ║  │
│  ║  │   (9.09%)    │ │   (6.36%)    │ │   (2.73%)    │ │   (1.36%)    │  ║  │
│  ║  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘  ║  │
│  ╚═══════════════════════════════════════════════════════════════════════╝  │
│                                                                              │
│  ╔═══════════════════════════════════════════════════════════════════════╗  │
│  ║  SUMMARY SECTION (Card - Sticky Bottom)                               ║  │
│  ╠═══════════════════════════════════════════════════════════════════════╣  │
│  ║  ┌─────────────────────────────────┬─────────────────────────────────┐ ║  │
│  ║  │     PRODUCT COSTS               │      SERVICE COSTS              │ ║  │
│  ║  ├─────────────────────────────────┼─────────────────────────────────┤ ║  │
│  ║  │  Product Value:    $14,150.00   │  Freight:          $500.00      │ ║  │
│  ║  │                                 │  Customs:          $350.00      │ ║  │
│  ║  │                                 │  Insurance:        $150.00      │ ║  │
│  ║  │                                 │  Handling:          $75.00      │ ║  │
│  ║  │                                 │  Other Services:      $0.00     │ ║  │
│  ║  ├─────────────────────────────────┼─────────────────────────────────┤ ║  │
│  ║  │  SUBTOTAL:        $14,150.00    │  SUBTOTAL:        $1,075.00     │ ║  │
│  ║  └─────────────────────────────────┴─────────────────────────────────┘ ║  │
│  ║                                                                         ║  │
│  ║  ┌─────────────────────────────────────────────────────────────────┐   ║  │
│  ║  │  TOTAL LANDED COST:                    $15,225.00               │   ║  │
│  ║  │  Cost per Unit (avg):                  $1,522.50                │   ║  │
│  ║  │  Service Cost %:                       7.06%                    │   ║  │
│  ║  └─────────────────────────────────────────────────────────────────┘   ║  │
│  ╚═══════════════════════════════════════════════════════════════════════╝  │
│                                                                              │
│  ╔═══════════════════════════════════════════════════════════════════════╗  │
│  ║  PREVIEW SECTION (Card - Collapsible)                                 ║  │
│  ╠═══════════════════════════════════════════════════════════════════════╣  │
│  ║  [📄 PDF Preview ]  [🌐 HTML View ]  [🔍 Full Screen]                 ║  │
│  ║  ┌─────────────────────────────────────────────────────────────────┐  ║  │
│  ║  │                                                                 │  ║  │
│  ║  │                    [PREVIEW IFRAME]                             │  ║  │
│  ║  │                                                                 │  ║  │
│  ║  │              (Embedded PDF/HTML Preview)                        │  ║  │
│  ║  │                                                                 │  ║  │
│  ║  │                                                                 │  ║  │
│  ║  └─────────────────────────────────────────────────────────────────┘  ║  │
│  ╚═══════════════════════════════════════════════════════════════════════╝  │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  [📊 Export Excel]  [📄 Export PDF]  [🖨️ Print]  [📧 Email]         │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Specifications

### 1. Header Section

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Report Name | Char | Yes | Display name for the report |
| Date | Date | Yes | Report generation date |
| Reference | Char | No | Internal reference number |
| Status | Selection | Yes | Draft / Confirmed / Cancelled |

**XML Structure:**
```xml
<group>
    <group>
        <field name="name" placeholder="e.g., Import Shipment #2024-001"/>
        <field name="date"/>
    </group>
    <group>
        <field name="reference"/>
        <field name="status" widget="statusbar" options="{'clickable': '1'}"/>
    </group>
</group>
```

---

### 2. Exchange Rate Section

**Design:** Highlighted card with distinct background color

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Base Currency | Many2one | Yes | Company currency (default) |
| Target Currency | Many2one | Yes | Selected foreign currency |
| Exchange Rate | Float | Yes | Rate for conversion |
| Inverse Rate | Float | Computed | 1 / Exchange Rate |
| Rate Source | Selection | Yes | Manual / Auto (Bank rate) |
| Last Updated | Datetime | Computed | Timestamp of rate update |

**Visual Design:**
- Card with light blue background (`bg-info-light` or `bg-light`)
- Exchange rate fields side by side with swap button (🔄)
- Auto-refresh button for fetching latest rates
- Rate indicator showing direction (Base → Target)

**XML Structure:**
```xml
<group string="Currency &amp; Exchange Rate" 
       class="bg-light border rounded p-3 mb-3">
    <group>
        <field name="currency_id" 
               options="{'no_create': True}"
               string="Base Currency"/>
        <field name="exchange_rate" 
               widget="float" 
               digits="[12,6]"/>
    </group>
    <group>
        <field name="foreign_currency_id" 
               options="{'no_create': True}"
               string="Target Currency"/>
        <div class="o_row">
            <field name="inverse_rate" 
                   widget="float" 
                   digits="[12,6]"/>
            <button name="action_refresh_rate" 
                    type="object" 
                    icon="fa-refresh"
                    title="Refresh Rate"
                    class="btn btn-secondary"/>
        </div>
    </group>
    <group>
        <field name="rate_source"/>
        <field name="rate_last_updated" 
               readonly="1"/>
    </group>
</group>
```

---

### 3. Landed Cost Lines (Notebook)

**Tab Structure:**
1. **Products** - Physical goods being imported
2. **Services** - Landed cost services (Is a Landed Cost = ✓)
3. **All Costs** - Combined view

#### Products Tab

| Column | Type | Description |
|--------|------|-------------|
| Product | Many2one | Product template |
| Description | Char | Line description |
| Quantity | Float | Number of units |
| Unit Price | Monetary | Price per unit |
| Currency | Many2one | Line currency |
| Price Subtotal | Monetary | Computed (Qty × Unit Price) |
| Cost (Base Currency) | Monetary | Converted to base currency |

#### Services Tab

| Column | Type | Description |
|--------|------|-------------|
| Service Type | Selection | Freight / Customs / Insurance / Handling / Other |
| Service Product | Many2one | Product with `Is a Landed Cost = True` |
| Provider | Char | Service provider name |
| Amount | Monetary | Service cost |
| Currency | Many2one | Line currency |
| Cost (Base Currency) | Monetary | Converted to base currency |
| Split Method | Selection | Equal / By Quantity / By Cost / By Volume / By Weight |

**Service Type Icons:**
- 🚢 Freight
- 🛃 Customs
- 🛡️ Insurance
- 📋 Handling
- 📦 Other

**XML Structure:**
```xml
<notebook>
    <page string="Products" name="products">
        <field name="product_line_ids" 
               widget="one2many_list"
               mode="tree,form">
            <tree editable="bottom">
                <field name="product_id"/>
                <field name="name"/>
                <field name="quantity"/>
                <field name="price_unit"/>
                <field name="currency_id"/>
                <field name="price_subtotal" sum="Total"/>
                <field name="cost_base_currency" sum="Total (Base)"/>
            </tree>
        </field>
    </page>
    
    <page string="Services" name="services">
        <field name="service_line_ids" 
               widget="one2many_list"
               mode="tree,form">
            <tree editable="bottom" 
                  decoration-info="service_type == 'freight'"
                  decoration-success="service_type == 'customs'"
                  decoration-warning="service_type == 'insurance'">
                <field name="service_type" 
                       widget="selection_badge"/>
                <field name="product_id" 
                       domain="[('landed_cost_ok', '=', True)]"/>
                <field name="partner_id" string="Provider"/>
                <field name="amount"/>
                <field name="currency_id"/>
                <field name="cost_base_currency" sum="Total (Base)"/>
                <field name="split_method"/>
            </tree>
        </field>
    </page>
    
    <page string="All Costs" name="all_costs">
        <field name="all_line_ids" readonly="1">
            <tree>
                <field name="line_type"/>
                <field name="name"/>
                <field name="amount" sum="Total"/>
                <field name="cost_base_currency" sum="Total (Base)"/>
            </tree>
        </field>
    </page>
</notebook>
```

---

### 4. Service Cost Metrics Cards

**Visual Design:**
- Horizontal row of 4-5 metric cards
- Each card shows: Icon, Label, Amount, Percentage of total
- Color-coded by service type
- Hover effect for interactivity

**Card Layout:**
```
┌─────────────────────────┐
│        🚢 ICON          │
│       FREIGHT           │
│                         │
│      $500.00            │
│       9.09%             │
└─────────────────────────┘
```

**CSS Classes:**
```css
.landed-cost-metric-card {
    border: 1px solid #dee2e6;
    border-radius: 8px;
    padding: 16px;
    text-align: center;
    background: white;
    transition: transform 0.2s, box-shadow 0.2s;
}
.landed-cost-metric-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.landed-cost-metric-card.freight { border-top: 4px solid #007bff; }
.landed-cost-metric-card.customs { border-top: 4px solid #28a745; }
.landed-cost-metric-card.insurance { border-top: 4px solid #ffc107; }
.landed-cost-metric-card.handling { border-top: 4px solid #6c757d; }
```

**XML Structure:**
```xml
<div class="row mt-3 mb-3">
    <div class="col-3">
        <div class="card landed-cost-metric-card freight">
            <div class="card-body text-center">
                <i class="fa fa-ship fa-2x text-primary mb-2"/>
                <h6 class="card-title text-muted">Freight</h6>
                <h4 class="mb-1">
                    <field name="freight_total" widget="monetary"/>
                </h4>
                <small class="text-muted">
                    <field name="freight_percentage"/>%
                </small>
            </div>
        </div>
    </div>
    <!-- Repeat for Customs, Insurance, Handling -->
</div>
```

---

### 5. Summary Section

**Design:** Two-column layout with visual separation

**Left Column - Product Costs:**
- Product Value (sum of all product lines)

**Right Column - Service Costs (Itemized):**
- Freight
- Customs
- Insurance
- Handling
- Other Services

**Bottom Row - Totals:**
- Total Landed Cost (bold, highlighted)
- Cost per Unit (average)
- Service Cost Percentage

**Visual Design:**
- Card with subtle border
- Subtotal rows in light gray
- Total row in dark with white text
- Percentage indicators

**XML Structure:**
```xml
<group string="Summary" class="border rounded p-3 bg-light">
    <div class="row">
        <div class="col-6">
            <h6 class="text-muted">Product Costs</h6>
            <table class="table table-sm">
                <tr>
                    <td>Product Value:</td>
                    <td class="text-right">
                        <field name="product_total" widget="monetary"/>
                    </td>
                </tr>
                <tr class="table-secondary">
                    <td><strong>Subtotal:</strong></td>
                    <td class="text-right">
                        <strong><field name="product_total" widget="monetary"/></strong>
                    </td>
                </tr>
            </table>
        </div>
        <div class="col-6">
            <h6 class="text-muted">Service Costs</h6>
            <table class="table table-sm">
                <tr>
                    <td>Freight:</td>
                    <td class="text-right">
                        <field name="freight_total" widget="monetary"/>
                    </td>
                </tr>
                <tr>
                    <td>Customs:</td>
                    <td class="text-right">
                        <field name="customs_total" widget="monetary"/>
                    </td>
                </tr>
                <tr>
                    <td>Insurance:</td>
                    <td class="text-right">
                        <field name="insurance_total" widget="monetary"/>
                    </td>
                </tr>
                <tr>
                    <td>Handling:</td>
                    <td class="text-right">
                        <field name="handling_total" widget="monetary"/>
                    </td>
                </tr>
                <tr class="table-secondary">
                    <td><strong>Subtotal:</strong></td>
                    <td class="text-right">
                        <strong><field name="service_total" widget="monetary"/></strong>
                    </td>
                </tr>
            </table>
        </div>
    </div>
    
    <div class="row mt-3">
        <div class="col-12">
            <div class="bg-dark text-white p-3 rounded">
                <div class="row">
                    <div class="col-4 text-center border-right">
                        <small>TOTAL LANDED COST</small>
                        <h3><field name="total_landed_cost" widget="monetary"/></h3>
                    </div>
                    <div class="col-4 text-center border-right">
                        <small>COST PER UNIT</small>
                        <h4><field name="cost_per_unit" widget="monetary"/></h4>
                    </div>
                    <div class="col-4 text-center">
                        <small>SERVICE COST %</small>
                        <h4><field name="service_cost_percentage"/>%</h4>
                    </div>
                </div>
            </div>
        </div>
    </div>
</group>
```

---

### 6. Preview Section

**Design:** Collapsible card with embedded preview

**Controls:**
- PDF Preview button
- HTML View button
- Full Screen toggle
- Zoom controls (if applicable)

**Preview Area:**
- Fixed height iframe (400-500px)
- Scrollable content
- Loading spinner while generating

**XML Structure:**
```xml
<group string="Preview" 
       class="border rounded p-3"
       attrs="{'invisible': [('state', '=', 'draft')]}">
    <div class="btn-group mb-2">
        <button name="action_preview_pdf" 
                type="object" 
                class="btn btn-outline-primary"
                icon="fa-file-pdf-o">
            PDF Preview
        </button>
        <button name="action_preview_html" 
                type="object"
                class="btn btn-outline-primary"
                icon="fa-globe">
            HTML View
        </button>
        <button name="action_preview_fullscreen" 
                type="object"
                class="btn btn-outline-secondary"
                icon="fa-expand">
            Full Screen
        </button>
    </div>
    
    <field name="preview_html" 
           widget="html" 
           options="{'style': 'height: 400px; border: 1px solid #ddd;'}"
           readonly="1"/>
</group>
```

---

### 7. Export Buttons

**Placement:** Bottom of form, sticky or fixed position

**Buttons:**
1. 📊 Export Excel - Primary action (blue)
2. 📄 Export PDF - Secondary action (outline)
3. 🖨️ Print - Secondary action (outline)
4. 📧 Email - Secondary action (outline)

**XML Structure:**
```xml
<footer>
    <button name="action_export_excel" 
            type="object" 
            string="Export Excel"
            class="btn-primary"
            icon="fa-file-excel-o"/>
    <button name="action_export_pdf" 
            type="object" 
            string="Export PDF"
            class="btn-outline-secondary"
            icon="fa-file-pdf-o"/>
    <button name="action_print" 
            type="object" 
            string="Print"
            class="btn-outline-secondary"
            icon="fa-print"/>
    <button name="action_send_email" 
            type="object" 
            string="Email"
            class="btn-outline-secondary"
            icon="fa-envelope"/>
    <button string="Cancel" 
            class="btn-secondary" 
            special="cancel"/>
</footer>
```

---

## Visual Design

### Color Scheme

| Element | Color | Hex |
|---------|-------|-----|
| Primary (Freight) | Blue | #007bff |
| Success (Customs) | Green | #28a745 |
| Warning (Insurance) | Yellow | #ffc107 |
| Secondary (Handling) | Gray | #6c757d |
| Background | Light Gray | #f8f9fa |
| Border | Border Gray | #dee2e6 |
| Text Primary | Dark | #212529 |
| Text Muted | Gray | #6c757d |

### Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| Page Title | System | 24px | 600 |
| Section Headers | System | 16px | 600 |
| Card Titles | System | 14px | 500 |
| Body Text | System | 14px | 400 |
| Totals | System | 24px | 700 |
| Metric Amounts | System | 20px | 600 |

### Spacing

- Section margins: `mb-3` (16px)
- Card padding: `p-3` (16px)
- Grid gutters: 16px
- Button spacing: `mr-2` (8px)

---

## Interaction Flow

### Creating a New Report

```
1. User clicks "Create" from list view
2. Form opens with:
   - Date = Today
   - Status = Draft
   - Base Currency = Company currency
3. User enters Report Name and Reference
4. User selects Target Currency
5. Exchange rate auto-populates (if auto source)
6. User adds product lines
7. User adds service lines (Landed Cost products)
8. Summary auto-calculates in real-time
9. User clicks "Export Excel" or "Export PDF"
```

### Exchange Rate Update Flow

```
1. User changes Target Currency
2. System checks rate_source:
   - If 'auto': Fetch from exchange rate provider
   - If 'manual': Keep existing or default to 1.0
3. Display loading spinner during fetch
4. Update rate_last_updated timestamp
5. Recalculate all line amounts in base currency
6. Update summary totals
7. Refresh preview if visible
```

### Export Flow

```
Excel Export:
1. Validate report (all required fields)
2. Generate Excel file with multiple sheets:
   - Summary
   - Products
   - Services
   - Exchange Rate Info
3. Trigger browser download
4. Log export activity

PDF Export:
1. Validate report
2. Generate PDF using report template
3. Open in new tab or download
4. Update preview section if on screen
```

---

## Technical Notes

### Model Fields Required

```python
# Header
name = fields.Char('Report Name', required=True)
date = fields.Date('Date', default=fields.Date.today, required=True)
reference = fields.Char('Reference')
state = fields.Selection([
    ('draft', 'Draft'),
    ('confirmed', 'Confirmed'),
    ('cancelled', 'Cancelled')
], default='draft')

# Currency
currency_id = fields.Many2one('res.currency', 'Base Currency', 
                              default=lambda self: self.env.company.currency_id)
foreign_currency_id = fields.Many2one('res.currency', 'Target Currency')
exchange_rate = fields.Float('Exchange Rate', digits=(12, 6), default=1.0)
rate_source = fields.Selection([
    ('manual', 'Manual'),
    ('auto', 'Auto (Bank Rate)')
], default='manual')
rate_last_updated = fields.Datetime('Last Updated')

# Lines
product_line_ids = fields.One2many('landed.cost.product.line', 'report_id')
service_line_ids = fields.One2many('landed.cost.service.line', 'report_id')

# Computed Totals
product_total = fields.Monetary(compute='_compute_totals')
serivce_total = fields.Monetary(compute='_compute_totals')
freight_total = fields.Monetary(compute='_compute_totals')
customs_total = fields.Monetary(compute='_compute_totals')
insurance_total = fields.Monetary(compute='_compute_totals')
handling_total = fields.Monetary(compute='_compute_totals')
total_landed_cost = fields.Monetary(compute='_compute_totals')
cost_per_unit = fields.Monetary(compute='_compute_totals')
service_cost_percentage = fields.Float(compute='_compute_totals')

# Preview
preview_html = fields.Html('Preview', sanitize=False)
```

### JavaScript Enhancements

```javascript
// Real-time calculation updates
// Exchange rate swap button functionality
// Preview refresh on data change
// Export button loading states
```

### Security

- Multi-compurrency access control
- Landed cost product validation
- Export permissions

---

## Mobile Considerations

- Stack metric cards vertically on small screens
- Collapsible sections for better scrolling
- Simplified preview (link to full view)
- Touch-friendly button sizes

---

## Accessibility

- ARIA labels for all interactive elements
- Keyboard navigation support
- High contrast mode compatibility
- Screen reader friendly table structures

---

## Appendix: Icon Mapping

| Service Type | Icon | CSS Class |
|--------------|------|-----------|
| Freight | fa-ship | text-primary |
| Customs | fa-building-o | text-success |
| Insurance | fa-shield | text-warning |
| Handling | fa-truck | text-secondary |
| Other | fa-cube | text-muted |

---

*Document Version: 1.0*
*Created: 2026-02-04*
*Odoo Version: 17.0*
