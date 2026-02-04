# Landed Cost Report - Excel Export Design Document

## Overview

This document outlines the design and implementation approach for exporting Landed Cost Reports to Excel (.xlsx) format with a single-sheet tabular layout. Landed cost services appear as dynamic columns rather than separate sheets.

---

## 1. Excel File Structure

### 1.1 Single-Sheet Architecture

The Excel export uses a **single worksheet** containing all landed cost data in a flat, tabular format suitable for analysis and pivot tables.

| Sheet Name | Purpose | Content |
|------------|---------|---------|
| `Landed Cost Report` | Complete data table | All landed cost entries with dynamic service columns |

---

## 2. Column Structure

### 2.1 Fixed Columns (Left Side)

These columns appear at the beginning of every report:

| # | Column Name | Field | Data Type | Format | Notes |
|---|-------------|-------|-----------|--------|-------|
| 1 | DocNo | `name` | String | Text | Landed cost document number |
| 2 | Date | `date` | Date | DD/MM/YYYY | Landed cost date |
| 3 | RefNo | `reference` | String | Text | Vendor reference / PO number |
| 4 | PrdID | `product_id.default_code` | String | Text | Product internal reference |
| 5 | PrdName | `product_id.name` | String | Text | Product name/description |
| 6 | QT | `quantity` | Number | Integer | Quantity of units |
| 7 | PricePerUnit | `price_unit` | Number | Currency 2 dec | Original purchase price per unit |
| 8 | Cost | `purchase_value` | Number | Currency 2 dec | Total purchase value (QT × PricePerUnit) |
| 9 | Rate | `exchange_rate` | Number | 6 decimal places | Currency conversion rate |
| 10 | Discount | `discount` | Number | Currency 2 dec | Any discount applied |
| 11 | Exp | `expense_description` | String | Text | Expense notes/description |

### 2.2 Dynamic Service Columns (Middle)

These columns are generated dynamically based on the **unique landed cost service types** present in the data:

| Column Name Pattern | Source | Data Type | Format |
|---------------------|--------|-----------|--------|
| `{Service Product Name}` | `cost_lines.product_id.name` | Number | Currency 2 dec |

**Dynamic Column Generation Logic:**

```python
def get_dynamic_service_columns(landed_costs):
    """Extract unique landed cost service products for column headers"""
    services = set()
    for lc in landed_costs:
        for cost_line in lc.cost_lines:
            if cost_line.product_id and cost_line.product_id.is_landed_cost:
                services.add(cost_line.product_id.name)
    return sorted(list(services))  # Sorted alphabetically for consistency
```

**Example Dynamic Columns:**
- `Freight (Sea)`
- `Freight (Air)`
- `Insurance`
- `Customs Clearance`
- `Import Duty`
- `Handling Fee`
- `Storage`
- `Documentation`
- `Inspection`

**Cell Value Logic:**
- If a specific landed cost has a charge for that service → Show the amount
- If no charge for that service → Show `0.00` or leave blank

### 2.3 Fixed Columns (Right Side)

These columns appear after all dynamic service columns:

| # | Column Name | Field | Data Type | Format | Notes |
|---|-------------|-------|-----------|--------|-------|
| N+1 | Tax | `tax_amount` | Number | Currency 2 dec | Tax amount if applicable |
| N+2 | Transit | `transit_cost` | Number | Currency 2 dec | Transit-related costs |
| N+3 | CostBath | `total_cost_company_currency` | Number | Currency 2 dec | **Total landed cost in company currency (THB)** |
| N+4 | Cost per unit | `unit_landed_cost` | Number | Currency 2 dec | CostBath ÷ QT |
| N+5 | InvtName | `picking_id.name` or `move_id.name` | String | Text | Inventory receipt/stock move reference |

---

## 3. Complete Column Layout Example

```
┌──────┬──────────┬──────────┬───────┬─────────┬────┬────────────┬──────────┬──────────┬──────────┬─────┬─────────────────────┬───────────────────┬──────────┬──────────────┬──────────────┬──────────────┬────────────┬─────────┐
│ DocNo│ Date     │ RefNo    │ PrdID │ PrdName │ QT │ PricePerUnit│ Cost    │ Rate     │ Discount │ Exp │ Product Service is  │ Product Service is│ Tax      │ Transit      │ CostBath     │ Cost per unit│ InvtName   │         │
│      │          │          │       │         │    │             │         │          │          │     │ Landed 1            │ Landed 2          │          │              │              │              │            │         │
├──────┼──────────┼──────────┼───────┼─────────┼────┼─────────────┼─────────┼──────────┼──────────┼─────┼─────────────────────┼───────────────────┼──────────┼──────────────┼──────────────┼──────────────┼────────────┼─────────┤
│ LC001│ 04/02/26 │ PO-12345 │ PROD-1│ Widget A│ 100│ 50.00       │ 5000.00 │ 35.123456│ 0.00     │     │ 500.00              │ 250.00            │ 0.00     │ 100.00       │ 197945.60    │ 1979.46      │ WH/IN/001  │         │
│ LC001│ 04/02/26 │ PO-12345 │ PROD-2│ Widget B│ 200│ 75.00       │ 15000.00│ 35.123456│ 0.00     │     │ 750.00              │ 375.00            │ 0.00     │ 150.00       │ 593836.80    │ 2969.18      │ WH/IN/001  │         │
└──────┴──────────┴──────────┴───────┴─────────┴────┴─────────────┴─────────┴──────────┴──────────┴─────┴─────────────────────┴───────────────────┴──────────┴──────────────┴──────────────┴──────────────┴────────────┴─────────┘
```

---

## 4. Summary Row

### 4.1 Summary Row Placement

A **summary row** appears at the bottom of the data (after the last data row), with:
- **Bold formatting**
- **Background color highlight** (light yellow/cream)
- **Sum formulas** for numeric columns

### 4.2 Summary Row Structure

| Column | Value | Formula/Logic |
|--------|-------|---------------|
| DocNo | `"TOTAL"` | Text |
| Date | (blank) | - |
| RefNo | (blank) | - |
| PrdID | (blank) | - |
| PrdName | (blank) | - |
| QT | Total Quantity | `=SUM(F2:F{last_row})` |
| PricePerUnit | (blank) | - |
| Cost | Total Purchase Value | `=SUM(H2:H{last_row})` |
| Rate | (blank) | - |
| Discount | Total Discount | `=SUM(J2:J{last_row})` |
| Exp | (blank) | - |
| Service Column 1 | Sum of this service | `=SUM(L2:L{last_row})` |
| Service Column 2 | Sum of this service | `=SUM(M2:M{last_row})` |
| ... | ... | ... |
| Tax | Total Tax | `=SUM({col}2:{col}{last_row})` |
| Transit | Total Transit | `=SUM({col}2:{col}{last_row})` |
| CostBath | **Grand Total** | `=SUM({col}2:{col}{last_row})` |
| Cost per unit | Average Unit Cost | `=CostBath_cell ÷ QT_cell` |
| InvtName | (blank) | - |

### 4.3 Summary Row Visual

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ TOTAL                                        300                    20000.00                      1250.00   625.00    ...     0.00     250.00     791782.40     2639.27                         │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
  ↑ Bold text, yellow background highlight
```

---

## 5. Excel Formatting Specifications

### 5.1 Header Row Formatting

| Element | Format |
|---------|--------|
| Font | Calibri 11pt Bold |
| Background | Dark blue (#1F4E78) |
| Font Color | White |
| Alignment | Center, Wrap Text |
| Border | Thin black border |
| Row Height | 30pt (tall enough for wrapped text) |

### 5.2 Data Row Formatting

| Element | Format |
|---------|--------|
| Font | Calibri 10pt |
| Background | White / Alternating light gray (#F2F2F2) |
| Alignment | Left for text, Right for numbers |
| Border | Thin gray border on all cells |

### 5.3 Summary Row Formatting

| Element | Format |
|---------|--------|
| Font | Calibri 11pt Bold |
| Background | Light yellow (#FFF2CC) |
| Border | Thick top border, thin sides |

### 5.4 Number Formats

| Column Type | Format |
|-------------|--------|
| DocNo, RefNo, PrdID | Text |
| Date | DD/MM/YYYY |
| Currency (Original) | `#,##0.00` with currency symbol |
| Currency (THB) | `#,##0.00 "THB"` or `#,##0.00 ฿` |
| Rate | `#,##0.000000` (6 decimal places) |
| Quantity | `#,##0` (integer) |

### 5.5 Column Widths

| Column Group | Recommended Width |
|--------------|-------------------|
| DocNo | 12 |
| Date | 12 |
| RefNo | 15 |
| PrdID | 12 |
| PrdName | 30 |
| QT | 10 |
| PricePerUnit | 15 |
| Cost | 15 |
| Rate | 15 |
| Discount | 12 |
| Exp | 20 |
| Service Columns | 20 each |
| Tax | 12 |
| Transit | 12 |
| CostBath | 18 |
| Cost per unit | 15 |
| InvtName | 15 |

---

## 6. Data Fetching Logic

### 6.1 Main Query Structure

```python
def get_landed_cost_data(date_from, date_to, company_id):
    """Fetch landed cost data for Excel export"""
    
    domain = [
        ('date', '>=', date_from),
        ('date', '<=', date_to),
        ('company_id', '=', company_id),
        ('state', '=', 'done'),  # Only posted landed costs
    ]
    
    landed_costs = env['stock.landed.cost'].search(domain)
    
    # Get unique service products for dynamic columns
    service_columns = get_dynamic_service_columns(landed_costs)
    
    rows = []
    for lc in landed_costs:
        for line in lc.valuation_adjustment_lines:
            row_data = {
                'doc_no': lc.name,
                'date': lc.date,
                'ref_no': lc.reference or '',
                'prd_id': line.product_id.default_code or '',
                'prd_name': line.product_id.name,
                'qt': line.quantity,
                'price_per_unit': line.purchase_value / line.quantity if line.quantity else 0,
                'cost': line.purchase_value,
                'rate': lc.exchange_rate or 1.0,
                'discount': line.discount or 0,
                'exp': line.expense_description or '',
                
                # Dynamic service amounts (key = service product name)
                'services': {},
                
                'tax': line.tax_amount or 0,
                'transit': line.transit_cost or 0,
                'cost_bath': line.final_cost,  # In company currency (THB)
                'cost_per_unit': line.final_cost / line.quantity if line.quantity else 0,
                'invt_name': line.move_id.picking_id.name if line.move_id.picking_id else '',
            }
            
            # Populate service amounts
            for cost_line in lc.cost_lines:
                if cost_line.product_id and cost_line.product_id.is_landed_cost:
                    service_name = cost_line.product_id.name
                    # Distribute proportionally based on line's weight
                    row_data['services'][service_name] = calculate_proportional_cost(
                        cost_line, line, lc
                    )
            
            rows.append(row_data)
    
    return {
        'service_columns': service_columns,
        'rows': rows,
    }
```

### 6.2 Service Cost Distribution

```python
def calculate_proportional_cost(cost_line, valuation_line, landed_cost):
    """
    Calculate how much of a service cost applies to this valuation line.
    Uses the same logic as Odoo's native landed cost distribution.
    """
    total_value = sum(
        line.purchase_value 
        for line in landed_cost.valuation_adjustment_lines
    )
    
    if total_value == 0:
        return 0
    
    # Proportional distribution based on purchase value
    proportion = valuation_line.purchase_value / total_value
    additional_cost = cost_line.price_unit * proportion
    
    return additional_cost
```

---

## 7. Odoo Implementation

### 7.1 Dependencies

```python
# __manifest__.py
{
    'name': 'Landed Cost Report Excel Export',
    'version': '17.0.1.0.0',
    'depends': ['stock_landed_costs'],
    'external_dependencies': {
        'python': ['xlsxwriter'],
    },
}
```

### 7.2 Report Generator Class

```python
# reports/landed_cost_xlsx.py

import io
import xlsxwriter
from odoo import models, api

class LandedCostExcelReport(models.AbstractModel):
    _name = 'report.landed_cost_report.landed_cost_xlsx'
    _description = 'Landed Cost Excel Report Generator'
    
    def generate_xlsx_report(self, workbook, data, objects):
        """Generate single-sheet landed cost report"""
        
        # Fetch data
        report_data = self._get_report_data(data)
        service_columns = report_data['service_columns']
        rows = report_data['rows']
        
        # Create worksheet
        sheet = workbook.add_worksheet('Landed Cost Report')
        
        # Define formats
        header_format = workbook.add_format({
            'bold': True,
            'font_size': 11,
            'bg_color': '#1F4E78',
            'font_color': 'white',
            'align': 'center',
            'valign': 'vcenter',
            'text_wrap': True,
            'border': 1,
        })
        
        data_format = workbook.add_format({
            'font_size': 10,
            'align': 'left',
            'valign': 'vcenter',
            'border': 1,
        })
        
        number_format = workbook.add_format({
            'font_size': 10,
            'align': 'right',
            'valign': 'vcenter',
            'num_format': '#,##0.00',
            'border': 1,
        })
        
        date_format = workbook.add_format({
            'font_size': 10,
            'align': 'center',
            'valign': 'vcenter',
            'num_format': 'DD/MM/YYYY',
            'border': 1,
        })
        
        rate_format = workbook.add_format({
            'font_size': 10,
            'align': 'right',
            'valign': 'vcenter',
            'num_format': '#,##0.000000',
            'border': 1,
        })
        
        summary_format = workbook.add_format({
            'bold': True,
            'font_size': 11,
            'bg_color': '#FFF2CC',
            'align': 'left',
            'valign': 'vcenter',
            'border': 1,
        })
        
        summary_number_format = workbook.add_format({
            'bold': True,
            'font_size': 11,
            'bg_color': '#FFF2CC',
            'align': 'right',
            'valign': 'vcenter',
            'num_format': '#,##0.00',
            'border': 1,
        })
        
        # Build column headers
        fixed_headers_left = [
            'DocNo', 'Date', 'RefNo', 'PrdID', 'PrdName', 
            'QT', 'PricePerUnit', 'Cost', 'Rate', 'Discount', 'Exp'
        ]
        fixed_headers_right = ['Tax', 'Transit', 'CostBath', 'Cost per unit', 'InvtName']
        
        all_headers = fixed_headers_left + service_columns + fixed_headers_right
        
        # Write headers (row 0)
        for col, header in enumerate(all_headers):
            sheet.write(0, col, header, header_format)
        
        # Set column widths
        col_widths = [12, 12, 15, 12, 30, 10, 15, 15, 15, 12, 20]
        col_widths += [20] * len(service_columns)
        col_widths += [12, 12, 18, 15, 15]
        
        for i, width in enumerate(col_widths):
            sheet.set_column(i, i, width)
        
        # Write data rows
        for row_idx, row_data in enumerate(rows, start=1):
            col = 0
            
            # Fixed columns (left)
            sheet.write(row_idx, col, row_data['doc_no'], data_format); col += 1
            sheet.write(row_idx, col, row_data['date'], date_format); col += 1
            sheet.write(row_idx, col, row_data['ref_no'], data_format); col += 1
            sheet.write(row_idx, col, row_data['prd_id'], data_format); col += 1
            sheet.write(row_idx, col, row_data['prd_name'], data_format); col += 1
            sheet.write(row_idx, col, row_data['qt'], number_format); col += 1
            sheet.write(row_idx, col, row_data['price_per_unit'], number_format); col += 1
            sheet.write(row_idx, col, row_data['cost'], number_format); col += 1
            sheet.write(row_idx, col, row_data['rate'], rate_format); col += 1
            sheet.write(row_idx, col, row_data['discount'], number_format); col += 1
            sheet.write(row_idx, col, row_data['exp'], data_format); col += 1
            
            # Dynamic service columns
            for service_name in service_columns:
                amount = row_data['services'].get(service_name, 0)
                sheet.write(row_idx, col, amount, number_format)
                col += 1
            
            # Fixed columns (right)
            sheet.write(row_idx, col, row_data['tax'], number_format); col += 1
            sheet.write(row_idx, col, row_data['transit'], number_format); col += 1
            sheet.write(row_idx, col, row_data['cost_bath'], number_format); col += 1
            sheet.write(row_idx, col, row_data['cost_per_unit'], number_format); col += 1
            sheet.write(row_idx, col, row_data['invt_name'], data_format); col += 1
        
        # Write summary row
        summary_row = len(rows) + 1
        last_data_row = len(rows)
        
        sheet.write(summary_row, 0, 'TOTAL', summary_format)
        
        # QT column (index 5) - sum
        sheet.write_formula(summary_row, 5, f'=SUM(F2:F{last_data_row+1})', summary_number_format)
        # Cost column (index 7) - sum
        sheet.write_formula(summary_row, 7, f'=SUM(H2:H{last_data_row+1})', summary_number_format)
        # Discount column (index 9) - sum
        sheet.write_formula(summary_row, 9, f'=SUM(J2:J{last_data_row+1})', summary_number_format)
        
        # Service columns - sum each
        service_start_col = 11
        for i, _ in enumerate(service_columns):
            col_letter = chr(65 + service_start_col + i) if service_start_col + i < 26 else f'A{chr(65 + service_start_col + i - 26)}'
            sheet.write_formula(summary_row, service_start_col + i, 
                              f'=SUM({col_letter}2:{col_letter}{last_data_row+1})', 
                              summary_number_format)
        
        # Right-side columns
        tax_col = service_start_col + len(service_columns)
        transit_col = tax_col + 1
        cost_bath_col = tax_col + 2
        cost_per_unit_col = tax_col + 3
        
        tax_col_letter = chr(65 + tax_col) if tax_col < 26 else f'A{chr(65 + tax_col - 26)}'
        transit_col_letter = chr(65 + transit_col) if transit_col < 26 else f'A{chr(65 + transit_col - 26)}'
        cost_bath_col_letter = chr(65 + cost_bath_col) if cost_bath_col < 26 else f'A{chr(65 + cost_bath_col - 26)}'
        
        sheet.write_formula(summary_row, tax_col, f'=SUM({tax_col_letter}2:{tax_col_letter}{last_data_row+1})', summary_number_format)
        sheet.write_formula(summary_row, transit_col, f'=SUM({transit_col_letter}2:{transit_col_letter}{last_data_row+1})', summary_number_format)
        sheet.write_formula(summary_row, cost_bath_col, f'=SUM({cost_bath_col_letter}2:{cost_bath_col_letter}{last_data_row+1})', summary_number_format)
        sheet.write_formula(summary_row, cost_per_unit_col, f'={cost_bath_col_letter}{summary_row+1}/F{summary_row+1}', summary_number_format)
```

---

## 8. Export Wizard

### 8.1 Wizard Model

```python
# wizards/landed_cost_export_wizard.py

from odoo import models, fields, api
from odoo.exceptions import UserError
import base64
import io

class LandedCostExportWizard(models.TransientModel):
    _name = 'landed.cost.export.wizard'
    _description = 'Landed Cost Excel Export Wizard'
    
    date_from = fields.Date(string='From Date', required=True, 
                            default=lambda self: fields.Date.context_today(self).replace(day=1))
    date_to = fields.Date(string='To Date', required=True,
                          default=fields.Date.context_today)
    company_id = fields.Many2one('res.company', string='Company',
                                  default=lambda self: self.env.company)
    
    def action_export_excel(self):
        """Generate and download Excel report"""
        self.ensure_one()
        
        # Check for records
        domain = [
            ('date', '>=', self.date_from),
            ('date', '<=', self.date_to),
            ('company_id', '=', self.company_id.id),
            ('state', '=', 'done'),
        ]
        landed_costs = self.env['stock.landed.cost'].search(domain)
        
        if not landed_costs:
            raise UserError('No landed cost records found for the selected criteria.')
        
        # Generate Excel
        import xlsxwriter
        output = io.BytesIO()
        workbook = xlsxwriter.Workbook(output, {'in_memory': True})
        
        report = self.env['report.landed_cost_report.landed_cost_xlsx']
        report.generate_xlsx_report(workbook, {
            'date_from': self.date_from,
            'date_to': self.date_to,
            'company_id': self.company_id.id,
        }, landed_costs)
        
        workbook.close()
        output.seek(0)
        
        # Create attachment
        file_data = base64.b64encode(output.read())
        filename = f'Landed_Cost_Report_{self.date_from}_{self.date_to}.xlsx'
        
        attachment = self.env['ir.attachment'].create({
            'name': filename,
            'type': 'binary',
            'datas': file_data,
            'mimetype': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
        
        return {
            'type': 'ir.actions.act_url',
            'url': f'/web/content/{attachment.id}?download=true',
            'target': 'self',
        }
```

---

## 9. Comparison: Old vs New Design

| Aspect | Old Design | New Design |
|--------|------------|------------|
| **Sheet Structure** | Multiple sheets (Summary, Details, By Product, By Service, Exchange Rates) | Single sheet |
| **Service Display** | Separate sheet OR columns in Details | Dynamic columns within main table |
| **Data Layout** | Grouped/aggregated | Flat, tabular (row per valuation line) |
| **Column Headers** | Generic categories | Actual service product names |
| **Summary** | Separate sheet with aggregations | Single row at bottom with formulas |
| **Use Case** | High-level overview, management reporting | Detailed analysis, pivot tables, data export |

---

## 10. Testing Checklist

- [ ] Verify dynamic columns match service products marked "Is Landed Cost"
- [ ] Confirm CostBath = (Cost + sum of all service costs + Tax + Transit) × Rate
- [ ] Verify Cost per unit = CostBath ÷ QT
- [ ] Check summary row formulas calculate correctly
- [ ] Test with 0 services (no dynamic columns)
- [ ] Test with 10+ services (many dynamic columns)
- [ ] Verify date format DD/MM/YYYY
- [ ] Verify rate displays 6 decimal places
- [ ] Verify currency format displays 2 decimal places
- [ ] Test empty date range (error handling)

---

## 11. Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-04 | System | Initial design with multi-sheet architecture |
| 2.0 | 2026-02-04 | System | Updated to single-sheet tabular format with dynamic service columns |

---

*End of Document*
