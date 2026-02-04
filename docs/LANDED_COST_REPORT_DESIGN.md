# Landed Cost Report Module - Database Structure & Architecture Design

## Overview

This document outlines the database structure and architecture for the Landed Cost Report module for Odoo 17. The module provides comprehensive reporting capabilities for landed costs with a **tabular format** - one row per product with dynamic columns for each landed cost service type.

---

## 1. Report Format (User's Tabular Structure)

### 1.1 Column Layout

The report displays data in a **horizontal tabular format** with the following columns:

| Column | Description | Source |
|--------|-------------|--------|
| **DocNo** | Document Number (Landed Cost reference) | `stock.landed.cost.name` |
| **Date** | Document Date | `stock.landed.cost.date` |
| **RefNo** | Reference Number (Bill/Picking reference) | `account.move.name` / `stock.picking.origin` |
| **PrdID** | Product ID/Code | `product.product.default_code` |
| **PrdName** | Product Name | `product.template.name` |
| **QT** | Quantity | `stock.valuation.adjustment.lines.quantity` |
| **PricePerUnit** | Price per Unit (Original cost) | Calculated from original value |
| **Cost** | Original Product Cost (in foreign currency) | `stock.valuation.adjustment.lines.former_cost` |
| **Rate** | Exchange Rate used | Calculated or from currency rate |
| **Discount** | Discount amount if any | From vendor bill (if applicable) |
| **Exp** | Export/Expense flag or amount | TBD |
| **Landed 1** | First Landed Cost Service amount | Dynamic column based on service type |
| **Landed 2** | Second Landed Cost Service amount | Dynamic column based on service type |
| **Landed 3** | Third Landed Cost Service amount | Dynamic column based on service type |
| **Landed N...** | Additional Landed Cost Services | Dynamic columns (variable count) |
| **Tax** | Tax amount | From landed cost or bill |
| **Transit** | Transit/Transportation cost | Specific landed cost category |
| **CostBath** | **Total Cost in Company Currency (THB)** | Converted total cost |
| **Cost per unit** | Landed cost per unit | `additional_landed_cost / quantity` |
| **InvtName** | Inventory/Account Category Name | `product.category.name` |

### 1.2 Key Design Principles

1. **One Row Per Product**: Each product line in the valuation gets one consolidated row
2. **Dynamic Columns**: Landed Cost Services are displayed as columns, not rows
3. **Variable Service Count**: Number of Landed columns depends on distinct service products used
4. **Company Currency Total**: Final cost always shown in company currency (Baht/THB)
5. **Denormalized View**: Data is pivoted from row-based storage to column-based display

### 1.3 Visual Layout Example

```
+--------+----------+---------+--------+----------+----+-------------+------+------+----------+----+----------+----------+----------+-----+--------+----------+-------------+----------+
| DocNo  | Date     | RefNo   | PrdID  | PrdName  | QT | PricePerUnit| Cost | Rate | Discount | Exp| Landed 1 | Landed 2 | Landed 3 | Tax | Transit| CostBath | Cost per unit| InvtName |
+--------+----------+---------+--------+----------+----+-------------+------+------+----------+----+----------+----------+----------+-----+--------+----------+-------------+----------+
| LC0001 | 2024-01-15| BILL001| PROD001| Widget A | 100| 50.00       | 5000 | 36.5 | 0        | 0  | 500.00   | 200.00   | 100.00   | 50  | 150.00 | 210900.00| 2109.00     | Raw Mat  |
| LC0001 | 2024-01-15| BILL001| PROD002| Widget B |  50| 80.00       | 4000 | 36.5 | 0        | 0  | 400.00   | 160.00   | 80.00    | 40  | 120.00 | 168720.00| 3374.40     | Raw Mat  |
+--------+----------+---------+--------+----------+----+-------------+------+------+----------+----+----------+----------+----------+-----+--------+----------+-------------+----------+
```

---

## 2. Module Structure

```
landed_cost_report/
├── __init__.py
├── __manifest__.py
├── models/
│   ├── __init__.py
│   ├── landed_cost_report.py          # Main report model (transient)
│   ├── landed_cost_report_line.py     # Report line items (tabular format)
│   └── landed_cost_category.py        # Landed cost type categories
├── wizard/
│   ├── __init__.py
│   └── landed_cost_report_wizard.py   # Report wizard (transient)
├── report/
│   ├── __init__.py
│   ├── landed_cost_report_xlsx.py     # Excel export handler
│   ├── landed_cost_report_pdf.py      # PDF export handler (optional)
│   └── report_template.py             # Dynamic column handler
├── views/
│   ├── landed_cost_report_views.xml
│   ├── landed_cost_report_wizard_views.xml
│   └── landed_cost_category_views.xml
├── data/
│   └── landed_cost_category_data.xml  # Default cost type categories
├── security/
│   ├── ir.model.access.csv
│   └── landed_cost_report_security.xml
└── static/
    └── src/
        └── scss/
            └── landed_cost_report.scss
```

---

## 3. Model Architecture

### 3.1 Transient Models (Wizard + Report Data)

```python
# Core Models Hierarchy
models.TransientModel
├── landed.cost.report.wizard      # User input/filters
├── landed.cost.report             # Main report header data
└── landed.cost.report.line        # Report detail lines (tabular format)

models.Model
└── landed.cost.category           # Persistent cost type categories
```

### 3.2 Model: `landed.cost.category` (Persistent)

Stores predefined landed cost type categories for classification and column mapping.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | Char | Yes | Category name (e.g., "Freight", "Customs Duty", "Insurance") |
| `code` | Char | Yes | Unique category code (e.g., "FREIGHT", "CUSTOMS") |
| `sequence` | Integer | No | Display order (determines column order: Landed 1, 2, 3...) |
| `is_transit` | Boolean | No | If True, shown in Transit column instead of Landed N |
| `is_tax` | Boolean | No | If True, contributes to Tax column |
| `active` | Boolean | Yes | Active/Archived status |
| `color` | Integer | No | Color index for kanban views |
| `description` | Text | No | Category description |
| `product_ids` | Many2many | No | Associated service products |

**Default Categories (Data File):**
```xml
- FREIGHT:    Freight & Shipping    (Landed 1)
- CUSTOMS:    Customs Duties        (Landed 2)
- INSURANCE:  Insurance             (Landed 3)
- HANDLING:   Handling & Processing (Landed 4)
- STORAGE:    Storage & Warehouse   (Landed 5)
- AGENCY:     Agency & Broker Fees  (Landed 6)
- TRANSIT:    Transit/Transport     (Transit column)
- TAX:        Taxes & Duties        (Tax column)
- FINANCE:    Bank Charges          (Landed 7)
- OTHER:      Other Costs           (Landed 8)
```

---

### 3.3 Model: `landed.cost.report.wizard` (Transient)

Wizard for user to configure report parameters.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `date_from` | Date | No | Start date filter |
| `date_to` | Date | No | End date filter |
| `landed_cost_ids` | Many2many | No | Specific landed costs to include |
| `picking_ids` | Many2many | No | Filter by stock pickings |
| `product_ids` | Many2many | No | Filter by products |
| `category_ids` | Many2many | No | Filter by cost categories |
| `vendor_ids` | Many2many | No | Filter by vendors |
| `company_id` | Many2one | Yes | Company (multi-company) |
| `currency_id` | Many2one | Yes | Target currency for report (default: company currency) |
| `exchange_rate` | Float | No | Manual exchange rate override |
| `use_manual_rate` | Boolean | No | Use manual rate vs. Odoo rate |
| `group_by` | Selection | No | Grouping: 'product', 'picking', 'vendor', 'none' |
| `include_validated_only` | Boolean | Yes | Only validated landed costs |
| `dynamic_column_count` | Integer | Computed | Number of unique landed cost services in results |
| `dynamic_column_names` | Json | Computed | JSON array of {"seq": 1, "name": "Freight", "code": "FREIGHT"} |
| `result_ids` | One2many | No | Computed report results (display only) |

**Methods:**
```python
def action_generate_report(self):
    """Generate report data based on wizard criteria."""
    pass

def action_export_excel(self):
    """Export report to Excel format with dynamic columns."""
    pass

def action_preview(self):
    """Open on-screen preview with dynamic columns."""
    pass

def _get_distinct_services(self):
    """Get distinct landed cost services for dynamic columns."""
    pass

def _get_exchange_rate(self, from_currency, to_currency, date):
    """Calculate exchange rate between currencies."""
    pass
```

---

### 3.4 Model: `landed.cost.report` (Transient)

Main report header containing aggregated summary data.

| Field | Type | Description |
|-------|------|-------------|
| `wizard_id` | Many2one | Reference to parent wizard |
| `date_from` | Date | Report period start |
| `date_to` | Date | Report period end |
| `currency_id` | Many2one | Report currency (company currency - THB) |
| `exchange_rate` | Float | Applied exchange rate |
| `landed_cost_count` | Integer | Number of landed costs |
| `picking_count` | Integer | Number of pickings |
| `product_count` | Integer | Number of products affected |
| `dynamic_column_count` | Integer | Number of dynamic Landed N columns |
| `dynamic_columns` | Json | JSON describing dynamic columns |
| `total_original_value` | Monetary | Sum of original product values (foreign currency) |
| `total_original_value_baht` | Monetary | Sum of original values in THB |
| `total_landed_cost` | Monetary | Sum of all landed costs in THB |
| `total_tax` | Monetary | Sum of tax amounts in THB |
| `total_transit` | Monetary | Sum of transit costs in THB |
| `total_cost_baht` | Monetary | Total Cost in Baht (original + landed) |
| `avg_cost_increase_pct` | Float | Average cost increase percentage |
| `line_ids` | One2many | Detail report lines (tabular format) |
| `category_summary_ids` | One2many | Summary by category |

**Dynamic Columns JSON Structure:**
```json
{
  "landed_columns": [
    {"sequence": 1, "code": "FREIGHT", "name": "Freight", "category_id": 1},
    {"sequence": 2, "code": "CUSTOMS", "name": "Customs Duty", "category_id": 2},
    {"sequence": 3, "code": "INSURANCE", "name": "Insurance", "category_id": 3}
  ],
  "has_transit": true,
  "has_tax": true
}
```

---

### 3.5 Model: `landed.cost.report.line` (Transient) - TABULAR FORMAT

**Key Change**: This model stores data in a pivoted format - one row per product with landed costs spread across dynamic fields.

| Field | Type | Description |
|-------|------|-------------|
| **Identification Fields** |||
| `report_id` | Many2one | Parent report |
| `wizard_id` | Many2one | Reference to wizard (for domain) |
| `sequence` | Integer | Line sequence number |
| **Document Fields** |||
| `landed_cost_id` | Many2one | Source stock.landed.cost |
| `doc_no` | Char | Document Number (landed cost name) |
| `landed_cost_date` | Date | Date of landed cost |
| `ref_no` | Char | Reference Number (bill/picking reference) |
| `picking_id` | Many2one | Related stock picking |
| `vendor_id` | Many2one | Vendor/Bill partner |
| `vendor_bill_id` | Many2one | Source vendor bill |
| **Product Fields** |||
| `product_id` | Many2one | Product receiving cost allocation |
| `prd_id` | Char | Product Code (default_code) |
| `prd_name` | Char | Product Name |
| `invt_name` | Char | Inventory/Category Name |
| `product_category_id` | Many2one | Product's internal category |
| **Quantity & Pricing** |||
| `qt` | Float | Quantity of products |
| `price_per_unit` | Monetary | Price per Unit (original) |
| `cost` | Monetary | Original Product Cost (foreign currency) |
| `cost_currency_id` | Many2one | Original cost currency |
| `rate` | Float | Exchange Rate used |
| `discount` | Monetary | Discount amount |
| `exp` | Monetary | Expense/Export amount |
| **Dynamic Landed Cost Fields** |||
| `landed_1` | Monetary | Landed Cost Service 1 amount (THB) |
| `landed_2` | Monetary | Landed Cost Service 2 amount (THB) |
| `landed_3` | Monetary | Landed Cost Service 3 amount (THB) |
| `landed_4` | Monetary | Landed Cost Service 4 amount (THB) |
| `landed_5` | Monetary | Landed Cost Service 5 amount (THB) |
| `landed_6` | Monetary | Landed Cost Service 6 amount (THB) |
| `landed_7` | Monetary | Landed Cost Service 7 amount (THB) |
| `landed_8` | Monetary | Landed Cost Service 8 amount (THB) |
| `landed_cost_data` | Json | JSON mapping {"category_id": amount, ...} |
| **Aggregated Fields** |||
| `tax` | Monetary | Tax amount (THB) |
| `transit` | Monetary | Transit/Transportation cost (THB) |
| `cost_baht` | Monetary | **Total Cost in Company Currency (THB)** |
| `cost_per_unit` | Monetary | Landed cost per unit (THB) |
| **Metadata** |||
| `company_id` | Many2one | Company |
| `source_currency_id` | Many2one | Original transaction currency |
| `exchange_rate_used` | Float | Rate used for conversion |

**Dynamic Field Mapping:**
```python
# The landed_1 through landed_8 fields are dynamically mapped
# based on the sequence of landed cost categories

LANDED_COST_FIELDS = ['landed_1', 'landed_2', 'landed_3', 'landed_4', 
                      'landed_5', 'landed_6', 'landed_7', 'landed_8']

# Mapping example:
# If categories are: FREIGHT(seq=1), CUSTOMS(seq=2), INSURANCE(seq=3)
# Then: landed_1 = FREIGHT amount, landed_2 = CUSTOMS amount, etc.
```

---

## 4. SQL Views for Data Aggregation

### 4.1 Base View: `view_landed_cost_valuation_base`

Foundation view joining all relevant tables.

```sql
CREATE OR REPLACE VIEW view_landed_cost_valuation_base AS
SELECT 
    -- IDs
    lc.id AS landed_cost_id,
    lc.name AS landed_cost_name,
    lc.date AS landed_cost_date,
    lc.account_move_id,
    lc.vendor_bill_id,
    lc.company_id,
    
    -- Picking Info
    sp.id AS picking_id,
    sp.name AS picking_name,
    sp.origin AS picking_origin,
    sp.date_done AS picking_date,
    
    -- Valuation Line Info
    val.id AS valuation_line_id,
    val.former_cost AS original_value,
    val.additional_landed_cost,
    val.final_cost AS new_value,
    val.quantity AS qt,
    
    -- Product Info
    val.product_id,
    pt.default_code AS prd_id,
    pt.name->>'en_US' AS prd_name,
    pt.categ_id AS product_category_id,
    pc.name AS invt_name,
    
    -- Cost Product (Service Product)
    cost_line.product_id AS cost_product_id,
    cost_pt.name->>'en_US' AS cost_product_name,
    cost_pt.landed_cost_ok,
    cost_pt.split_method_landed_cost AS split_method,
    
    -- Vendor Info
    am.partner_id AS vendor_id,
    rp.name AS vendor_name,
    am.name AS ref_no,
    
    -- Currency
    am.currency_id AS source_currency_id,
    cur.name AS source_currency_name,
    
    -- Cost Category (joined from landed_cost_category)
    lcc.id AS cost_category_id,
    lcc.code AS category_code,
    lcc.name AS category_name,
    lcc.sequence AS category_sequence,
    lcc.is_transit,
    lcc.is_tax

FROM stock_landed_cost lc
    INNER JOIN stock_landed_cost_stock_picking_rel rel ON lc.id = rel.stock_landed_cost_id
    INNER JOIN stock_picking sp ON rel.stock_picking_id = sp.id
    INNER JOIN stock_valuation_adjustment_lines val ON lc.id = val.cost_id
    INNER JOIN stock_landed_cost_lines cost_line ON lc.id = cost_line.cost_id
        AND cost_line.product_id = val.cost_line_product_id
    LEFT JOIN product_product pp ON val.product_id = pp.id
    LEFT JOIN product_template pt ON pp.product_tmpl_id = pt.id
    LEFT JOIN product_category pc ON pt.categ_id = pc.id
    LEFT JOIN product_product cost_pp ON cost_line.product_id = cost_pp.id
    LEFT JOIN product_template cost_pt ON cost_pp.product_tmpl_id = cost_pt.id
    LEFT JOIN account_move am ON lc.vendor_bill_id = am.id
    LEFT JOIN res_partner rp ON am.partner_id = rp.id
    LEFT JOIN res_currency cur ON am.currency_id = cur.id
    LEFT JOIN landed_cost_category_product_rel lcc_rel ON cost_pt.id = lcc_rel.product_template_id
    LEFT JOIN landed_cost_category lcc ON lcc_rel.landed_cost_category_id = lcc.id
WHERE lc.state = 'done';
```

### 4.2 Pivoted View: `view_landed_cost_tabular`

**Key View**: Pivots row-based landed costs into column-based format.

```sql
CREATE OR REPLACE VIEW view_landed_cost_tabular AS
WITH landed_cost_pivot AS (
    -- Aggregate landed costs by product and category sequence
    SELECT 
        landed_cost_id,
        product_id,
        picking_id,
        vendor_bill_id,
        source_currency_id,
        company_id,
        landed_cost_date,
        landed_cost_name,
        ref_no,
        prd_id,
        prd_name,
        invt_name,
        qt,
        original_value,
        new_value,
        -- Pivot landed costs by category sequence
        SUM(CASE WHEN category_sequence = 1 THEN additional_landed_cost ELSE 0 END) AS landed_1,
        SUM(CASE WHEN category_sequence = 2 THEN additional_landed_cost ELSE 0 END) AS landed_2,
        SUM(CASE WHEN category_sequence = 3 THEN additional_landed_cost ELSE 0 END) AS landed_3,
        SUM(CASE WHEN category_sequence = 4 THEN additional_landed_cost ELSE 0 END) AS landed_4,
        SUM(CASE WHEN category_sequence = 5 THEN additional_landed_cost ELSE 0 END) AS landed_5,
        SUM(CASE WHEN category_sequence = 6 THEN additional_landed_cost ELSE 0 END) AS landed_6,
        SUM(CASE WHEN category_sequence = 7 THEN additional_landed_cost ELSE 0 END) AS landed_7,
        SUM(CASE WHEN category_sequence = 8 THEN additional_landed_cost ELSE 0 END) AS landed_8,
        -- Special columns
        SUM(CASE WHEN is_tax = true THEN additional_landed_cost ELSE 0 END) AS tax,
        SUM(CASE WHEN is_transit = true THEN additional_landed_cost ELSE 0 END) AS transit,
        -- Total landed cost
        SUM(additional_landed_cost) AS total_landed_cost
    FROM view_landed_cost_valuation_base
    GROUP BY 
        landed_cost_id, product_id, picking_id, vendor_bill_id,
        source_currency_id, company_id, landed_cost_date, landed_cost_name,
        ref_no, prd_id, prd_name, invt_name, qt, original_value, new_value
)
SELECT 
    ROW_NUMBER() OVER () AS id,
    -- Document info
    landed_cost_id,
    landed_cost_name AS doc_no,
    landed_cost_date AS date,
    ref_no,
    picking_id,
    vendor_bill_id,
    -- Product info
    product_id,
    prd_id,
    prd_name,
    invt_name,
    -- Quantities
    qt,
    CASE WHEN qt > 0 THEN original_value / qt ELSE 0 END AS price_per_unit,
    original_value AS cost,
    -- Exchange rate (placeholder - calculated in Python)
    1.0 AS rate,
    0 AS discount,
    0 AS exp,
    -- Dynamic landed columns
    landed_1,
    landed_2,
    landed_3,
    landed_4,
    landed_5,
    landed_6,
    landed_7,
    landed_8,
    -- Special columns
    tax,
    transit,
    -- Totals (in company currency - would need conversion)
    new_value AS cost_baht,
    CASE WHEN qt > 0 THEN total_landed_cost / qt ELSE 0 END AS cost_per_unit,
    -- Metadata
    source_currency_id,
    company_id,
    total_landed_cost
FROM landed_cost_pivot;
```

### 4.3 Summary View: `view_landed_cost_by_category`

Aggregated view for category summaries.

```sql
CREATE OR REPLACE VIEW view_landed_cost_by_category AS
SELECT 
    ROW_NUMBER() OVER () AS id,
    company_id,
    cost_category_id,
    category_code,
    category_name,
    DATE_TRUNC('month', landed_cost_date) AS period_month,
    COUNT(DISTINCT landed_cost_id) AS landed_cost_count,
    COUNT(DISTINCT picking_id) AS picking_count,
    COUNT(DISTINCT product_id) AS product_count,
    SUM(original_value) AS total_original_value,
    SUM(additional_landed_cost) AS total_landed_cost,
    SUM(new_value) AS total_new_value,
    CASE 
        WHEN SUM(original_value) > 0 
        THEN (SUM(additional_landed_cost) / SUM(original_value)) * 100 
        ELSE 0 
    END AS cost_increase_percentage
FROM view_landed_cost_valuation_base
WHERE landed_cost_date IS NOT NULL
GROUP BY 
    company_id,
    cost_category_id,
    category_code,
    category_name,
    DATE_TRUNC('month', landed_cost_date);
```

---

## 5. Integration with stock_landed_costs Module

### 5.1 Core Dependencies

```python
# __manifest__.py
{
    'name': 'Landed Cost Report',
    'version': '17.0.1.0.0',
    'depends': [
        'base',
        'stock',              # Core stock management
        'stock_landed_costs', # Landed costs functionality
        'stock_account',      # Stock valuation
        'account',            # Accounting
        'purchase',           # Purchase orders
        'report_xlsx',        # Excel export support (OCA)
    ],
    # ...
}
```

### 5.2 Integration Points

| Source Model | Integration Type | Usage |
|--------------|------------------|-------|
| `stock.landed.cost` | Read | Main landed cost records |
| `stock.landed.cost.lines` | Read | Cost line items (service products) |
| `stock.valuation.adjustment.lines` | Read | Valuation allocations |
| `product.template` | Read | Service products with `landed_cost_ok=True` |
| `account.move` | Read | Vendor bills |
| `stock.picking` | Read | Receipt transfers |

### 5.3 Product Category Integration

Link landed cost products to categories:

```python
# Inherit from product.template to add category relation
class ProductTemplate(models.Model):
    _inherit = 'product.template'
    
    landed_cost_category_ids = fields.Many2many(
        'landed.cost.category',
        'landed_cost_category_product_rel',
        'product_template_id',
        'landed_cost_category_id',
        string='Landed Cost Categories',
        help='Categories this landed cost product belongs to. Determines column placement in report.'
    )
```

---

## 6. Multi-Currency Support Architecture

### 6.1 Currency Handling Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                  Multi-Currency Flow                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Source Currency (Bill)                                      │
│         │                                                    │
│         ▼                                                    │
│  ┌─────────────────────┐                                    │
│  │  Vendor Bill        │  ← Original amount in bill currency│
│  │  (currency_id)      │                                    │
│  └──────────┬──────────┘                                    │
│             │                                                │
│             ▼                                                │
│  ┌─────────────────────┐                                    │
│  │  Exchange Rate      │  ← Odoo rate OR Manual override    │
│  │  (rate calculation) │                                    │
│  └──────────┬──────────┘                                    │
│             │                                                │
│             ▼                                                │
│  ┌─────────────────────┐                                    │
│  │  Company Currency   │  ← THB (Thai Baht)                 │
│  │  (company currency) │  ← All totals displayed in THB     │
│  └─────────────────────┘                                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Currency Fields in Report Line Model

```python
class LandedCostReportLine(models.TransientModel):
    _name = 'landed.cost.report.line'
    _description = 'Landed Cost Report Line (Tabular Format)'
    
    # Original values (source currency) - displayed in Cost column
    cost = fields.Monetary(
        string='Cost (Foreign Currency)',
        currency_field='source_currency_id'
    )
    source_currency_id = fields.Many2one('res.currency', string='Source Currency')
    
    # Company currency values (THB) - displayed in CostBath and Landed columns
    landed_1 = fields.Monetary(string='Landed 1', currency_field='company_currency_id')
    landed_2 = fields.Monetary(string='Landed 2', currency_field='company_currency_id')
    landed_3 = fields.Monetary(string='Landed 3', currency_field='company_currency_id')
    # ... etc
    
    tax = fields.Monetary(string='Tax', currency_field='company_currency_id')
    transit = fields.Monetary(string='Transit', currency_field='company_currency_id')
    cost_baht = fields.Monetary(string='Cost Bath (THB)', currency_field='company_currency_id')
    cost_per_unit = fields.Monetary(string='Cost per Unit (THB)', currency_field='company_currency_id')
    
    company_currency_id = fields.Many2one(
        'res.currency', 
        related='company_id.currency_id',
        string='Company Currency (THB)'
    )
    
    # Exchange rate used for conversion
    rate = fields.Float(string='Exchange Rate', digits=(12, 6))
```

### 6.3 Exchange Rate Calculation

```python
class LandedCostReportWizard(models.TransientModel):
    _name = 'landed.cost.report.wizard'
    
    def _get_exchange_rate(self, from_currency, to_currency, date, company):
        """
        Get exchange rate between two currencies.
        Priority: Manual rate > Odoo rate > 1.0
        """
        if self.use_manual_rate and self.exchange_rate:
            return self.exchange_rate
            
        if from_currency == to_currency:
            return 1.0
            
        # Use Odoo's currency rate mechanism
        return self.env['res.currency']._get_conversion_rate(
            from_currency,
            to_currency,
            company,
            date or fields.Date.today()
        )
    
    def _convert_to_baht(self, amount, from_currency, date, company):
        """Convert amount to company currency (THB)."""
        to_currency = company.currency_id  # Should be THB
        
        if from_currency == to_currency:
            return amount
            
        rate = self._get_exchange_rate(from_currency, to_currency, date, company)
        return amount * rate
```

---

## 7. Excel Export Architecture

### 7.1 Export Structure

```
Workbook: Landed_Cost_Report_[Date].xlsx
│
├── Sheet: Summary
│   ├── Report Parameters
│   ├── Overall Totals by Category
│   └── Dynamic Column Mapping
│
└── Sheet: Detail (Tabular Format)
    └── Columns: DocNo, Date, RefNo, PrdID, PrdName, QT, PricePerUnit, 
                 Cost, Rate, Discount, Exp, Landed 1...N, Tax, Transit, 
                 CostBath, Cost per unit, InvtName
```

### 7.2 Excel Export Handler with Dynamic Columns

```python
class LandedCostReportXlsx(models.AbstractModel):
    _name = 'report.landed_cost_report.report_xlsx'
    _inherit = 'report.report_xlsx.abstract'
    _description = 'Landed Cost Report Excel Export'
    
    def generate_xlsx_report(self, workbook, data, report_data):
        """Generate Excel report with dynamic columns."""
        wizard = self.env['landed.cost.report.wizard'].browse(data['wizard_id'])
        report = self.env['landed.cost.report'].browse(data['report_id'])
        
        # Create formats
        header_format = workbook.add_format({
            'bold': True,
            'bg_color': '#4472C4',
            'font_color': 'white',
            'border': 1
        })
        
        currency_format = workbook.add_format({
            'num_format': '#,##0.00',
            'border': 1
        })
        
        date_format = workbook.add_format({
            'num_format': 'YYYY-MM-DD',
            'border': 1
        })
        
        # Get dynamic column info
        dynamic_columns = report.dynamic_columns or {}
        landed_cols = dynamic_columns.get('landed_columns', [])
        
        # Summary Sheet
        self._write_summary_sheet(workbook, report, landed_cols, header_format, currency_format)
        
        # Detail Sheet (Tabular Format)
        self._write_detail_sheet(workbook, report, landed_cols, header_format, currency_format, date_format)
    
    def _write_detail_sheet(self, workbook, report, landed_cols, header_format, currency_format, date_format):
        """Write the detail sheet in tabular format."""
        sheet = workbook.add_worksheet('Detail')
        
        # Define fixed columns
        fixed_headers = [
            'DocNo', 'Date', 'RefNo', 'PrdID', 'PrdName', 
            'QT', 'PricePerUnit', 'Cost', 'Rate', 'Discount', 'Exp'
        ]
        
        # Add dynamic landed columns
        dynamic_headers = [f"Landed {i+1}" for i in range(len(landed_cols))]
        
        # Add remaining fixed columns
        remaining_headers = ['Tax', 'Transit', 'CostBath', 'Cost per unit', 'InvtName']
        
        all_headers = fixed_headers + dynamic_headers + remaining_headers
        
        # Write headers
        for col, header in enumerate(all_headers):
            sheet.write(0, col, header, header_format)
            sheet.set_column(col, col, 15)  # Set column width
        
        # Write data rows
        for row, line in enumerate(report.line_ids, start=1):
            col = 0
            # Fixed fields
            sheet.write(row, col, line.doc_no); col += 1
            sheet.write(row, col, line.landed_cost_date, date_format); col += 1
            sheet.write(row, col, line.ref_no); col += 1
            sheet.write(row, col, line.prd_id); col += 1
            sheet.write(row, col, line.prd_name); col += 1
            sheet.write(row, col, line.qt); col += 1
            sheet.write(row, col, line.price_per_unit, currency_format); col += 1
            sheet.write(row, col, line.cost, currency_format); col += 1
            sheet.write(row, col, line.rate); col += 1
            sheet.write(row, col, line.discount, currency_format); col += 1
            sheet.write(row, col, line.exp, currency_format); col += 1
            
            # Dynamic landed columns
            landed_values = [
                line.landed_1, line.landed_2, line.landed_3, line.landed_4,
                line.landed_5, line.landed_6, line.landed_7, line.landed_8
            ]
            for i in range(len(landed_cols)):
                sheet.write(row, col, landed_values[i] or 0, currency_format)
                col += 1
            
            # Remaining fields
            sheet.write(row, col, line.tax, currency_format); col += 1
            sheet.write(row, col, line.transit, currency_format); col += 1
            sheet.write(row, col, line.cost_baht, currency_format); col += 1
            sheet.write(row, col, line.cost_per_unit, currency_format); col += 1
            sheet.write(row, col, line.invt_name); col += 1
```

---

## 8. On-Screen Preview Architecture

### 8.1 Dynamic Tree View

Since the number of Landed columns is dynamic, the tree view needs to be generated dynamically or use a pivot-like approach.

```xml
<!-- Base tree view with maximum columns -->
<record id="view_landed_cost_report_line_tree" model="ir.ui.view">
    <field name="name">landed.cost.report.line.tree</field>
    <field name="model">landed.cost.report.line</field>
    <field name="arch" type="xml">
        <tree create="false" edit="false" delete="false">
            <!-- Document Info -->
            <field name="doc_no"/>
            <field name="landed_cost_date"/>
            <field name="ref_no"/>
            <!-- Product Info -->
            <field name="prd_id"/>
            <field name="prd_name"/>
            <field name="qt"/>
            <!-- Cost Info -->
            <field name="price_per_unit"/>
            <field name="cost"/>
            <field name="cost_currency_id" invisible="1"/>
            <field name="rate"/>
            <field name="discount"/>
            <field name="exp"/>
            <!-- Dynamic Landed Columns - shown based on wizard config -->
            <field name="landed_1" optional="show"/>
            <field name="landed_2" optional="show"/>
            <field name="landed_3" optional="show"/>
            <field name="landed_4" optional="hide"/>
            <field name="landed_5" optional="hide"/>
            <field name="landed_6" optional="hide"/>
            <field name="landed_7" optional="hide"/>
            <field name="landed_8" optional="hide"/>
            <!-- Summary Columns -->
            <field name="tax"/>
            <field name="transit"/>
            <field name="cost_baht" sum="Total Cost (THB)"/>
            <field name="cost_per_unit"/>
            <field name="invt_name"/>
        </tree>
    </field>
</record>
```

### 8.2 Preview Action with Dynamic View

```python
def action_preview(self):
    """Open report preview in tree view with dynamic columns."""
    self.ensure_one()
    
    # Generate report data
    report = self._generate_report_data()
    
    # Build dynamic column labels
    landed_columns = report.dynamic_columns.get('landed_columns', [])
    context = {
        'landed_column_labels': {f'landed_{i+1}': col['name'] 
                                  for i, col in enumerate(landed_columns)}
    }
    
    return {
        'name': _('Landed Cost Report Preview'),
        'type': 'ir.actions.act_window',
        'res_model': 'landed.cost.report.line',
        'view_mode': 'tree,pivot',
        'domain': [('wizard_id', '=', self.id)],
        'context': context,
        'target': 'current',
    }
```

---

## 9. Security & Access Control

### 9.1 Model Access Rights

```csv
# ir.model.access.csv
id,name,model_id:id,group_id:id,perm_read,perm_write,perm_create,perm_unlink
access_landed_cost_category_user,landed.cost.category.user,model_landed_cost_category,stock.group_stock_user,1,0,0,0
access_landed_cost_category_manager,landed.cost.category.manager,model_landed_cost_category,stock.group_stock_manager,1,1,1,1
access_landed_cost_report_wizard,landed.cost.report.wizard.user,model_landed_cost_report_wizard,stock.group_stock_user,1,1,1,1
access_landed_cost_report,landed.cost.report.user,model_landed_cost_report,stock.group_stock_user,1,1,1,1
access_landed_cost_report_line,landed.cost.report.line.user,model_landed_cost_report_line,stock.group_stock_user,1,1,1,1
access_landed_cost_report_category_summary,landed.cost.report.category.summary.user,model_landed_cost_report_category_summary,stock.group_stock_user,1,1,1,1
```

### 9.2 Record Rules

```xml
<!-- Multi-company security -->
<record id="rule_landed_cost_report_multi_company" model="ir.rule">
    <field name="name">Landed Cost Report: Multi-Company</field>
    <field name="model_id" ref="model_landed_cost_report"/>
    <field name="domain_force">[('company_id', 'in', company_ids + [False])]</field>
</record>
```

---

## 10. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              TABULAR FORMAT DATA FLOW ARCHITECTURE                           │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌──────────────┐
  │   User       │
  │  Interface   │
  └──────┬───────┘
         │
         ▼
  ┌────────────────────────────────────────────────────────────────────┐
  │                    LANDED COST REPORT WIZARD                        │
  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
  │  │ Date Filters │  │   Products   │  │   Vendors    │             │
  │  └──────────────┘  └──────────────┘  └──────────────┘             │
  │  ┌────────────────────────────────────────────────────┐            │
  │  │  Dynamic Column Detection:                         │            │
  │  │  - Query distinct landed cost services             │            │
  │  │  - Assign sequence numbers (Landed 1, 2, 3...)     │            │
  │  │  - Build column mapping JSON                       │            │
  │  └────────────────────────────────────────────────────┘            │
  └────────────────────┬───────────────────────────────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
         ▼             ▼             ▼
  ┌──────────────┐ ┌────────┐  ┌──────────┐
  │   Generate   │ │ Export │  │  Preview │
  │   Report     │ │ Excel  │  │  Screen  │
  └──────┬───────┘ └────┬───┘  └────┬─────┘
         │              │           │
         └──────────────┼───────────┘
                        │
                        ▼
  ┌────────────────────────────────────────────────────────────────────┐
  │                    REPORT DATA GENERATION                           │
  │                                                                     │
  │  ┌──────────────────┐      ┌──────────────────┐                   │
  │  │  stock.landed    │──────│   SQL Views      │                   │
  │  │     .cost        │      │   (Pivot)        │                   │
  │  └──────────────────┘      └────────┬─────────┘                   │
  │                                     │                               │
  │  ┌──────────────────┐              ▼                               │
  │  │stock.valuation   │◄────┌──────────────────┐                    │
  │  │adjustment.lines  │     │  landed.cost.    │                    │
  │  └──────────────────┘     │  report.line     │                    │
  │                           │  (Tabular Format)│                    │
  │  ┌──────────────────┐     │                  │                    │
  │  │  product.        │◄────│  - One row per   │                    │
  │  │  template        │     │    product       │                    │
  │  │  (landed_cost_ok)│     │  - Landed costs  │                    │
  │  └──────────────────┘     │    as columns    │                    │
  │                           │  - All values    │                    │
  │  ┌──────────────────┐     │    in THB        │                    │
  │  │ account.move     │◄────└──────────────────┘                    │
  │  │ (vendor bills)   │                                              │
  │  └──────────────────┘                                              │
  │                                                                     │
  │  ┌──────────────────────────────────────────────────────────┐      │
  │  │  COLUMN MAPPING (Dynamic):                               │      │
  │  │  ┌─────────┬─────────────┬──────────────┐                │      │
  │  │  │ Landed 1│ Freight     │ category_id=1│                │      │
  │  │  │ Landed 2│ Customs     │ category_id=2│                │      │
  │  │  │ Landed 3│ Insurance   │ category_id=3│                │      │
  │  │  │ Tax     │ Tax Amount  │ is_tax=true  │                │      │
  │  │  │ Transit │ Transport   │ is_transit=tr│                │      │
  │  │  └─────────┴─────────────┴──────────────┘                │      │
  │  └──────────────────────────────────────────────────────────┘      │
  └────────────────────────────────────────────────────────────────────┘
```

---

## 11. Implementation Checklist

- [ ] Create module structure and manifest
- [ ] Create `landed.cost.category` model with data file
- [ ] Add `is_transit` and `is_tax` flags to category model
- [ ] Extend `product.template` with category relation
- [ ] Create wizard model `landed.cost.report.wizard`
- [ ] Create transient report models with tabular format
- [ ] Implement SQL views for data aggregation (pivot view)
- [ ] Create views (form, tree with dynamic columns)
- [ ] Implement Excel export handler with dynamic columns
- [ ] Add security rules and access rights
- [ ] Create menu items and actions
- [ ] Write unit tests
- [ ] Create user documentation

---

## 12. Column Mapping Reference

### 12.1 Field to Column Mapping

| Report Column | Model Field | Data Source |
|---------------|-------------|-------------|
| DocNo | `doc_no` | `stock.landed.cost.name` |
| Date | `landed_cost_date` | `stock.landed.cost.date` |
| RefNo | `ref_no` | `account.move.name` or `stock.picking.origin` |
| PrdID | `prd_id` | `product.product.default_code` |
| PrdName | `prd_name` | `product.template.name` |
| QT | `qt` | `stock.valuation.adjustment.lines.quantity` |
| PricePerUnit | `price_per_unit` | `former_cost / quantity` |
| Cost | `cost` | `stock.valuation.adjustment.lines.former_cost` |
| Rate | `rate` | Exchange rate calculation |
| Discount | `discount` | Vendor bill discount |
| Exp | `exp` | TBD / Additional expense |
| Landed 1-8 | `landed_1` to `landed_8` | Pivoted from category allocation |
| Tax | `tax` | Sum where `is_tax=True` |
| Transit | `transit` | Sum where `is_transit=True` |
| CostBath | `cost_baht` | `former_cost + landed_costs` in THB |
| Cost per unit | `cost_per_unit` | `total_landed_cost / quantity` |
| InvtName | `invt_name` | `product.category.name` |

### 12.2 Dynamic Column Logic

```python
def _assign_landed_columns(self, landed_cost_allocations):
    """
    Assign landed cost allocations to dynamic columns.
    Returns dict with landed_1 to landed_8 values.
    """
    result = {f'landed_{i}': 0.0 for i in range(1, 9)}
    
    # Get category mapping
    categories = self.env['landed.cost.category'].search([])
    category_sequence = {cat.id: cat.sequence for cat in categories}
    
    for allocation in landed_cost_allocations:
        cat_id = allocation.cost_category_id.id
        sequence = category_sequence.get(cat_id, 99)
        
        # Map to landed_1 through landed_8
        if 1 <= sequence <= 8:
            field_name = f'landed_{sequence}'
            result[field_name] += allocation.additional_landed_cost
    
    return result
```

---

## Document Information

| Field | Value |
|-------|-------|
| **Version** | 2.0.0 |
| **Odoo Version** | 17.0 |
| **Module** | landed_cost_report |
| **Created** | 2026-02-04 |
| **Updated** | 2026-02-04 |
| **Author** | Development Team |
| **Format** | Tabular with Dynamic Columns |
