# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
from odoo.exceptions import UserError
import io
import base64


class LandedCostReportWizard(models.TransientModel):
    """
    Landed Cost Report Wizard for Excel Export
    
    This wizard allows users to configure report parameters and generate
    the landed cost report with dynamic service columns as per design spec.
    """
    _name = 'landed.cost.report.wizard'
    _description = 'Landed Cost Excel Export Wizard'
    
    # Report Parameters
    date_from = fields.Date(
        string='From Date',
        required=True,
        default=lambda self: fields.Date.context_today(self).replace(day=1),
        help='Filter landed costs from this date'
    )
    
    date_to = fields.Date(
        string='To Date',
        required=True,
        default=fields.Date.context_today,
        help='Filter landed costs up to this date'
    )
    
    # Company
    company_id = fields.Many2one(
        'res.company',
        string='Company',
        required=True,
        default=lambda self: self.env.company,
        help='Company for multi-company support'
    )
    
    # Options
    include_draft = fields.Boolean(
        string='Include Draft',
        default=False,
        help='Include landed costs in draft state'
    )
    
    # Preview
    preview_data = fields.Html(
        string='Preview',
        readonly=True
    )
    show_preview = fields.Boolean(
        string='Show Preview',
        default=False
    )
    state = fields.Selection([
        ('draft', 'Draft'),
        ('preview', 'Preview'),
        ('done', 'Done')
    ], default='draft', string='Status')

    @api.onchange('date_from', 'date_to', 'company_id', 'include_draft')
    def _onchange_clear_preview(self):
        """Clear preview when parameters change"""
        self.show_preview = False
        self.preview_data = False
        self.state = 'draft'

    def _get_domain(self):
        """Get search domain for landed costs"""
        domain = [
            ('date', '>=', self.date_from),
            ('date', '<=', self.date_to),
            ('company_id', '=', self.company_id.id),
        ]
        if not self.include_draft:
            domain.append(('state', '=', 'done'))
        return domain

    def action_preview(self):
        """Generate and show preview on screen"""
        self.ensure_one()
        
        domain = self._get_domain()
        landed_costs = self.env['stock.landed.cost'].search(domain)
        
        if not landed_costs:
            raise UserError(_('No landed cost records found for the selected criteria.'))
        
        # Generate preview HTML
        preview_html = self._generate_preview_html(landed_costs)
        
        self.write({
            'preview_data': preview_html,
            'show_preview': True,
            'state': 'preview'
        })
        
        return {
            'type': 'ir.actions.act_window',
            'res_model': self._name,
            'res_id': self.id,
            'view_mode': 'form',
            'target': 'new',
        }

    def action_export_excel(self):
        """Generate and download Excel report"""
        self.ensure_one()
        
        domain = self._get_domain()
        landed_costs = self.env['stock.landed.cost'].search(domain)
        
        if not landed_costs:
            raise UserError(_('No landed cost records found for the selected criteria.'))
        
        # Generate Excel using xlsxwriter
        return self._generate_excel_report(landed_costs)

    def _generate_excel_report(self, landed_costs):
        """Generate Excel file with proper formatting"""
        try:
            import xlsxwriter
        except ImportError:
            raise UserError(_('xlsxwriter library is required. Please install it: pip install xlsxwriter'))
        
        output = io.BytesIO()
        workbook = xlsxwriter.Workbook(output, {'in_memory': True})
        
        # Create worksheet
        sheet = workbook.add_worksheet('Landed Cost Report')
        
        # Get report data
        report_data = self._get_report_data(landed_costs)
        service_columns = report_data['service_columns']
        rows = report_data['rows']
        
        # Define formats
        formats = self._define_formats(workbook)
        
        # Build column headers
        fixed_headers_left = [
            'DocNo', 'Date', 'RefNo', 'PrdID', 'PrdName', 
            'QT', 'PricePerUnit', 'Cost', 'Rate', 'Discount', 'Exp'
        ]
        fixed_headers_right = ['Tax', 'Transit', 'CostBaht', 'Cost per unit', 'InvtName']
        
        all_headers = fixed_headers_left + service_columns + fixed_headers_right
        
        # Write headers (row 0)
        for col, header in enumerate(all_headers):
            sheet.write(0, col, header, formats['header'])
        
        # Set column widths
        self._set_column_widths(sheet, len(fixed_headers_left), len(service_columns), len(fixed_headers_right))
        
        # Write data rows
        for row_idx, row_data in enumerate(rows, start=1):
            self._write_data_row(sheet, row_idx, row_data, service_columns, formats)
        
        # Write summary row with formulas
        self._write_summary_row(sheet, len(rows), service_columns, formats)
        
        # Freeze header row
        sheet.freeze_panes(1, 0)
        
        # Page setup
        sheet.set_landscape()
        sheet.fit_to_pages(1, 0)
        sheet.set_paper(9)  # A4
        
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
        
        self.write({
            'state': 'done'
        })
        
        return {
            'type': 'ir.actions.act_url',
            'url': f'/web/content/{attachment.id}?download=true',
            'target': 'self',
        }

    def _define_formats(self, workbook):
        """Define Excel cell formats per design spec"""
        formats = {}
        
        # Header format - Dark blue with white text
        formats['header'] = workbook.add_format({
            'bold': True,
            'font_size': 11,
            'font_name': 'Calibri',
            'bg_color': '#1F4E78',
            'font_color': 'white',
            'align': 'center',
            'valign': 'vcenter',
            'text_wrap': True,
            'border': 1,
            'border_color': '#000000',
        })
        
        # Data format - Normal text
        formats['data'] = workbook.add_format({
            'font_size': 10,
            'font_name': 'Calibri',
            'align': 'left',
            'valign': 'vcenter',
            'border': 1,
            'border_color': '#D9D9D9',
        })
        
        # Number format - Right aligned with 2 decimals
        formats['number'] = workbook.add_format({
            'font_size': 10,
            'font_name': 'Calibri',
            'align': 'right',
            'valign': 'vcenter',
            'num_format': '#,##0.00',
            'border': 1,
            'border_color': '#D9D9D9',
        })
        
        # Date format - DD/MM/YYYY
        formats['date'] = workbook.add_format({
            'font_size': 10,
            'font_name': 'Calibri',
            'align': 'center',
            'valign': 'vcenter',
            'num_format': 'DD/MM/YYYY',
            'border': 1,
            'border_color': '#D9D9D9',
        })
        
        # Rate format - 6 decimal places
        formats['rate'] = workbook.add_format({
            'font_size': 10,
            'font_name': 'Calibri',
            'align': 'right',
            'valign': 'vcenter',
            'num_format': '#,##0.000000',
            'border': 1,
            'border_color': '#D9D9D9',
        })
        
        # Summary format - Bold with yellow background
        formats['summary'] = workbook.add_format({
            'bold': True,
            'font_size': 11,
            'font_name': 'Calibri',
            'bg_color': '#FFF2CC',
            'align': 'left',
            'valign': 'vcenter',
            'border': 1,
            'border_color': '#000000',
            'top': 2,
        })
        
        # Summary number format
        formats['summary_number'] = workbook.add_format({
            'bold': True,
            'font_size': 11,
            'font_name': 'Calibri',
            'bg_color': '#FFF2CC',
            'align': 'right',
            'valign': 'vcenter',
            'num_format': '#,##0.00',
            'border': 1,
            'border_color': '#000000',
            'top': 2,
        })
        
        # Alternate row format (light gray)
        formats['data_alt'] = workbook.add_format({
            'font_size': 10,
            'font_name': 'Calibri',
            'align': 'left',
            'valign': 'vcenter',
            'bg_color': '#F2F2F2',
            'border': 1,
            'border_color': '#D9D9D9',
        })
        
        formats['number_alt'] = workbook.add_format({
            'font_size': 10,
            'font_name': 'Calibri',
            'align': 'right',
            'valign': 'vcenter',
            'num_format': '#,##0.00',
            'bg_color': '#F2F2F2',
            'border': 1,
            'border_color': '#D9D9D9',
        })
        
        # Currency format with THB symbol
        formats['currency_thb'] = workbook.add_format({
            'font_size': 10,
            'font_name': 'Calibri',
            'align': 'right',
            'valign': 'vcenter',
            'num_format': '#,##0.00 [$฿-th-TH]',
            'border': 1,
            'border_color': '#D9D9D9',
        })
        
        return formats

    def _set_column_widths(self, sheet, left_count, service_count, right_count):
        """Set column widths per design spec"""
        # Fixed left columns
        left_widths = [12, 12, 15, 12, 35, 10, 15, 15, 15, 12, 25]
        for i, width in enumerate(left_widths):
            sheet.set_column(i, i, width)
        
        # Dynamic service columns
        service_start = left_count
        for i in range(service_count):
            sheet.set_column(service_start + i, service_start + i, 20)
        
        # Fixed right columns
        right_widths = [12, 12, 18, 15, 15]
        right_start = left_count + service_count
        for i, width in enumerate(right_widths):
            sheet.set_column(right_start + i, right_start + i, width)

    def _write_data_row(self, sheet, row_idx, row_data, service_columns, formats):
        """Write a single data row"""
        col = 0
        is_alt = row_idx % 2 == 0
        data_fmt = formats['data_alt'] if is_alt else formats['data']
        num_fmt = formats['number_alt'] if is_alt else formats['number']
        
        # Fixed columns (left)
        sheet.write(row_idx, col, row_data.get('doc_no', ''), data_fmt); col += 1
        sheet.write(row_idx, col, row_data.get('date'), formats['date']); col += 1
        sheet.write(row_idx, col, row_data.get('ref_no', ''), data_fmt); col += 1
        sheet.write(row_idx, col, row_data.get('prd_id', ''), data_fmt); col += 1
        sheet.write(row_idx, col, row_data.get('prd_name', ''), data_fmt); col += 1
        sheet.write(row_idx, col, row_data.get('qt', 0), num_fmt); col += 1
        sheet.write(row_idx, col, row_data.get('price_per_unit', 0), num_fmt); col += 1
        sheet.write(row_idx, col, row_data.get('cost', 0), num_fmt); col += 1
        sheet.write(row_idx, col, row_data.get('rate', 1.0), formats['rate']); col += 1
        sheet.write(row_idx, col, row_data.get('discount', 0), num_fmt); col += 1
        sheet.write(row_idx, col, row_data.get('exp', ''), data_fmt); col += 1
        
        # Dynamic service columns
        services = row_data.get('services', {})
        for service_name in service_columns:
            amount = services.get(service_name, 0)
            sheet.write(row_idx, col, amount, num_fmt)
            col += 1
        
        # Fixed columns (right)
        sheet.write(row_idx, col, row_data.get('tax', 0), num_fmt); col += 1
        sheet.write(row_idx, col, row_data.get('transit', 0), num_fmt); col += 1
        sheet.write(row_idx, col, row_data.get('cost_baht', 0), formats['currency_thb']); col += 1
        sheet.write(row_idx, col, row_data.get('cost_per_unit', 0), formats['currency_thb']); col += 1
        sheet.write(row_idx, col, row_data.get('invt_name', ''), data_fmt); col += 1

    def _write_summary_row(self, sheet, data_row_count, service_columns, formats):
        """Write the summary row with formulas"""
        summary_row = data_row_count + 1
        last_data_row = data_row_count
        
        # Helper to get Excel column letter
        def get_col_letter(col_idx):
            """Convert column index to Excel column letter (0-indexed)"""
            if col_idx < 26:
                return chr(65 + col_idx)
            else:
                return chr(64 + col_idx // 26) + chr(65 + col_idx % 26)
        
        # Write TOTAL label
        sheet.write(summary_row, 0, 'TOTAL', formats['summary'])
        
        # QT column (index 5) - sum formula
        qt_col = 5
        qt_letter = get_col_letter(qt_col)
        sheet.write_formula(summary_row, qt_col, 
                          f'=SUM({qt_letter}2:{qt_letter}{last_data_row + 1})', 
                          formats['summary_number'])
        
        # Cost column (index 7) - sum formula
        cost_col = 7
        cost_letter = get_col_letter(cost_col)
        sheet.write_formula(summary_row, cost_col, 
                          f'=SUM({cost_letter}2:{cost_letter}{last_data_row + 1})', 
                          formats['summary_number'])
        
        # Discount column (index 9) - sum formula
        discount_col = 9
        discount_letter = get_col_letter(discount_col)
        sheet.write_formula(summary_row, discount_col, 
                          f'=SUM({discount_letter}2:{discount_letter}{last_data_row + 1})', 
                          formats['summary_number'])
        
        # Service columns - sum each
        service_start_col = 11
        for i, _ in enumerate(service_columns):
            col_idx = service_start_col + i
            col_letter = get_col_letter(col_idx)
            sheet.write_formula(summary_row, col_idx, 
                              f'=SUM({col_letter}2:{col_letter}{last_data_row + 1})', 
                              formats['summary_number'])
        
        # Right-side columns
        tax_col = service_start_col + len(service_columns)
        transit_col = tax_col + 1
        cost_baht_col = tax_col + 2
        cost_per_unit_col = tax_col + 3
        
        tax_letter = get_col_letter(tax_col)
        transit_letter = get_col_letter(transit_col)
        cost_baht_letter = get_col_letter(cost_baht_col)
        
        # Tax - sum
        sheet.write_formula(summary_row, tax_col, 
                          f'=SUM({tax_letter}2:{tax_letter}{last_data_row + 1})', 
                          formats['summary_number'])
        
        # Transit - sum
        sheet.write_formula(summary_row, transit_col, 
                          f'=SUM({transit_letter}2:{transit_letter}{last_data_row + 1})', 
                          formats['summary_number'])
        
        # CostBaht - sum
        sheet.write_formula(summary_row, cost_baht_col, 
                          f'=SUM({cost_baht_letter}2:{cost_baht_letter}{last_data_row + 1})', 
                          formats['summary_number'])
        
        # Cost per unit - average (CostBaht / QT)
        summary_row_1based = summary_row + 1
        sheet.write_formula(summary_row, cost_per_unit_col, 
                          f'={cost_baht_letter}{summary_row_1based}/{qt_letter}{summary_row_1based}', 
                          formats['summary_number'])

    def _get_report_data(self, landed_costs):
        """Fetch landed cost data for Excel export"""
        # Get unique service products for dynamic columns
        service_columns = self._get_dynamic_service_columns(landed_costs)
        
        # Build rows
        rows = []
        for lc in landed_costs:
            for line in lc.valuation_adjustment_lines:
                row_data = self._build_row_data(lc, line, service_columns)
                rows.append(row_data)
        
        return {
            'service_columns': service_columns,
            'rows': rows,
        }

    def _get_dynamic_service_columns(self, landed_costs):
        """Extract unique landed cost service products for column headers"""
        services = set()
        for lc in landed_costs:
            for cost_line in lc.cost_lines:
                if cost_line.product_id and cost_line.product_id.landed_cost_ok:
                    services.add(cost_line.product_id.name)
        return sorted(list(services))

    def _build_row_data(self, landed_cost, line, service_columns):
        """Build row data for a valuation adjustment line"""
        quantity = line.quantity or 0
        purchase_value = line.purchase_value or 0
        
        # Calculate price per unit
        price_per_unit = purchase_value / quantity if quantity else 0
        
        # Get exchange rate
        exchange_rate = landed_cost.exchange_rate or 1.0
        
        # Calculate cost in company currency (THB)
        final_cost = line.additional_landed_cost or 0
        
        # Build services dict
        services = {}
        total_service_cost = 0
        
        for cost_line in landed_cost.cost_lines:
            if cost_line.product_id and cost_line.product_id.landed_cost_ok:
                service_name = cost_line.product_id.name
                # Calculate proportional cost for this line
                prop_cost = self._calculate_proportional_cost(
                    cost_line, line, landed_cost
                )
                services[service_name] = prop_cost
                total_service_cost += prop_cost
        
        return {
            'doc_no': landed_cost.name or '',
            'date': landed_cost.date,
            'ref_no': landed_cost.reference or '',
            'prd_id': line.product_id.default_code or '',
            'prd_name': line.product_id.name or '',
            'qt': quantity,
            'price_per_unit': price_per_unit,
            'cost': purchase_value,
            'rate': exchange_rate,
            'discount': 0,  # Placeholder
            'exp': '',  # Placeholder
            'services': services,
            'tax': 0,  # Placeholder
            'transit': 0,  # Placeholder
            'cost_baht': final_cost,
            'cost_per_unit': final_cost / quantity if quantity else 0,
            'invt_name': line.move_id.picking_id.name if line.move_id and line.move_id.picking_id else 
                        (line.move_id.name if line.move_id else ''),
        }

    def _calculate_proportional_cost(self, cost_line, valuation_line, landed_cost):
        """Calculate proportional service cost for a valuation line"""
        # Get total purchase value of all lines
        total_value = sum(
            l.purchase_value or 0
            for l in landed_cost.valuation_adjustment_lines
        )
        
        if total_value == 0:
            return 0
        
        # Calculate proportion based on purchase value
        line_value = valuation_line.purchase_value or 0
        proportion = line_value / total_value
        
        # Get cost line price (in company currency)
        cost_price = cost_line.price_unit or 0
        
        return cost_price * proportion

    def _generate_preview_html(self, landed_costs):
        """Generate HTML preview of the report data"""
        report_data = self._get_report_data(landed_costs)
        service_columns = report_data['service_columns']
        rows = report_data['rows']
        
        # Build HTML table
        html = ['<div class="table-responsive"><table class="table table-sm table-bordered table-striped">']
        
        # Header
        fixed_headers_left = ['DocNo', 'Date', 'RefNo', 'PrdID', 'PrdName', 'QT', 'PricePerUnit', 'Cost']
        fixed_headers_right = ['Tax', 'Transit', 'CostBaht', 'Cost per unit', 'InvtName']
        
        html.append('<thead class="table-dark"><tr>')
        for h in fixed_headers_left:
            html.append(f'<th>{h}</th>')
        for h in service_columns:
            html.append(f'<th>{h}</th>')
        for h in fixed_headers_right:
            html.append(f'<th>{h}</th>')
        html.append('</tr></thead>')
        
        # Body
        html.append('<tbody>')
        for row in rows[:100]:  # Limit to 100 rows for preview
            html.append('<tr>')
            html.append(f'<td>{row.get("doc_no", "")}</td>')
            html.append(f'<td>{row.get("date", "")}</td>')
            html.append(f'<td>{row.get("ref_no", "")}</td>')
            html.append(f'<td>{row.get("prd_id", "")}</td>')
            html.append(f'<td>{row.get("prd_name", "")}</td>')
            html.append(f'<td class="text-end">{row.get("qt", 0):,.0f}</td>')
            html.append(f'<td class="text-end">{row.get("price_per_unit", 0):,.2f}</td>')
            html.append(f'<td class="text-end">{row.get("cost", 0):,.2f}</td>')
            
            # Service columns
            services = row.get('services', {})
            for svc in service_columns:
                val = services.get(svc, 0)
                html.append(f'<td class="text-end">{val:,.2f}</td>')
            
            html.append(f'<td class="text-end">{row.get("tax", 0):,.2f}</td>')
            html.append(f'<td class="text-end">{row.get("transit", 0):,.2f}</td>')
            html.append(f'<td class="text-end fw-bold">{row.get("cost_baht", 0):,.2f}</td>')
            html.append(f'<td class="text-end">{row.get("cost_per_unit", 0):,.2f}</td>')
            html.append(f'<td>{row.get("invt_name", "")}</td>')
            html.append('</tr>')
        
        html.append('</tbody>')
        html.append('</table></div>')
        
        if len(rows) > 100:
            html.append(f'<div class="alert alert-info mt-2">Showing 100 of {len(rows)} records. Export to Excel to see all data.</div>')
        
        return ''.join(html)

    def action_close(self):
        """Close the wizard"""
        return {'type': 'ir.actions.act_window_close'}
