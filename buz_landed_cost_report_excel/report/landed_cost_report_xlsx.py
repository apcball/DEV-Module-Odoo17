# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
from odoo.exceptions import UserError
import base64
import io
import logging

_logger = logging.getLogger(__name__)

try:
    import xlsxwriter
    from xlsxwriter.utility import xl_rowcol_to_cell
    XLSX_AVAILABLE = True
except ImportError:
    XLSX_AVAILABLE = False
    _logger.warning('xlsxwriter not available. Excel export will be disabled.')


class LandedCostReportXlsx(models.AbstractModel):
    """
    Landed Cost Report Excel Export Handler
    
    Generates Excel reports with dynamic columns for landed cost data.
    """
    _name = 'report.buz_landed_cost_report_excel.report_xlsx'
    _description = 'Landed Cost Report Excel Export'
    
    def generate_xlsx_report(self, workbook, data, objects):
        """Generate Excel report with dynamic columns."""
        if not XLSX_AVAILABLE:
            raise UserError(_('xlsxwriter library is not installed. Please install it to use Excel export.'))
        
        for report in objects:
            self._generate_report_workbook(workbook, report)
    
    def _generate_report_workbook(self, workbook, report):
        """Generate the full workbook for a report."""
        # Create formats
        header_format = workbook.add_format({
            'bold': True,
            'bg_color': '#4472C4',
            'font_color': 'white',
            'border': 1,
            'align': 'center',
            'valign': 'vcenter'
        })
        
        title_format = workbook.add_format({
            'bold': True,
            'font_size': 16,
            'align': 'left',
            'valign': 'vcenter'
        })
        
        subtitle_format = workbook.add_format({
            'bold': True,
            'font_size': 12,
            'align': 'left',
            'valign': 'vcenter'
        })
        
        currency_format = workbook.add_format({
            'num_format': '#,##0.00',
            'border': 1,
            'align': 'right'
        })
        
        number_format = workbook.add_format({
            'num_format': '#,##0.00',
            'border': 1,
            'align': 'right'
        })
        
        date_format = workbook.add_format({
            'num_format': 'YYYY-MM-DD',
            'border': 1,
            'align': 'center'
        })
        
        text_format = workbook.add_format({
            'border': 1,
            'align': 'left'
        })
        
        text_center_format = workbook.add_format({
            'border': 1,
            'align': 'center'
        })
        
        total_format = workbook.add_format({
            'bold': True,
            'bg_color': '#D9E1F2',
            'num_format': '#,##0.00',
            'border': 1,
            'align': 'right'
        })
        
        # Create Summary Sheet
        self._write_summary_sheet(workbook, report, title_format, subtitle_format, 
                                   currency_format, header_format, text_format, text_center_format)
        
        # Create Detail Sheet
        self._write_detail_sheet(workbook, report, header_format, currency_format,
                                  number_format, date_format, text_format, 
                                  text_center_format, total_format)
    
    def _write_summary_sheet(self, workbook, report, title_format, subtitle_format,
                              currency_format, header_format, text_format, text_center_format):
        """Write the summary sheet."""
        sheet = workbook.add_worksheet('Summary')
        
        # Set column widths
        sheet.set_column('A:A', 30)
        sheet.set_column('B:B', 25)
        sheet.set_column('C:C', 25)
        
        # Title
        row = 0
        sheet.write(row, 0, 'Landed Cost Report', title_format)
        row += 2
        
        # Report Parameters
        sheet.write(row, 0, 'Report Parameters', subtitle_format)
        row += 1
        
        params = [
            ('Date Range', f"{report.date_from or 'N/A'} to {report.date_to or 'N/A'}"),
            ('Report Currency', report.currency_id.name or 'N/A'),
            ('Exchange Rate', f"{report.exchange_rate:.6f}"),
            ('Company', report.company_id.name or 'N/A'),
        ]
        
        for label, value in params:
            sheet.write(row, 0, label, text_format)
            sheet.write(row, 1, value, text_format)
            row += 1
        
        row += 1
        
        # Statistics
        sheet.write(row, 0, 'Statistics', subtitle_format)
        row += 1
        
        stats = [
            ('Landed Costs', report.landed_cost_count),
            ('Pickings', report.picking_count),
            ('Products', report.product_count),
        ]
        
        for label, value in stats:
            sheet.write(row, 0, label, text_format)
            sheet.write(row, 1, value, number_format)
            row += 1
        
        row += 1
        
        # Financial Summary
        sheet.write(row, 0, 'Financial Summary', subtitle_format)
        row += 1
        
        # Headers
        sheet.write(row, 0, 'Description', header_format)
        sheet.write(row, 1, 'Amount', header_format)
        sheet.write(row, 2, 'Currency', header_format)
        row += 1
        
        totals = [
            ('Total Original Value', report.total_original_value, report.currency_id.name),
            ('Total Original Value (THB)', report.total_original_value_baht, report.currency_id.name),
            ('Total Landed Cost', report.total_landed_cost, report.currency_id.name),
            ('Total Tax', report.total_tax, report.currency_id.name),
            ('Total Transit', report.total_transit, report.currency_id.name),
            ('Total Cost (THB)', report.total_cost_baht, report.currency_id.name),
        ]
        
        for desc, amount, currency in totals:
            sheet.write(row, 0, desc, text_format)
            sheet.write(row, 1, amount or 0.0, currency_format)
            sheet.write(row, 2, currency, text_center_format)
            row += 1
        
        # Cost Increase %
        row += 1
        sheet.write(row, 0, 'Average Cost Increase %', header_format)
        sheet.write(row, 1, f"{report.avg_cost_increase_pct:.2f}%", currency_format)
    
    def _write_detail_sheet(self, workbook, report, header_format, currency_format,
                            number_format, date_format, text_format, 
                            text_center_format, total_format):
        """Write the detail sheet in tabular format."""
        sheet = workbook.add_worksheet('Detail')
        
        # Get dynamic column info
        dynamic_columns = report.dynamic_columns or {}
        landed_cols = dynamic_columns.get('landed_columns', [])
        
        # Define fixed columns
        fixed_headers = [
            ('DocNo', 15),
            ('Date', 12),
            ('RefNo', 15),
            ('PrdID', 12),
            ('PrdName', 25),
            ('QT', 10),
            ('PricePerUnit', 14),
            ('Cost', 14),
            ('Rate', 10),
            ('Discount', 12),
            ('Exp', 10),
        ]
        
        # Add dynamic landed columns
        dynamic_headers = []
        for i, col_info in enumerate(landed_cols[:8]):
            col_name = col_info.get('name', f'Landed {i+1}')
            dynamic_headers.append((col_name, 14))
        
        # Pad to 8 columns if needed
        while len(dynamic_headers) < 8:
            idx = len(dynamic_headers) + 1
            dynamic_headers.append((f'Landed {idx}', 14))
        
        # Add remaining fixed columns
        remaining_headers = [
            ('Tax', 12),
            ('Transit', 12),
            ('CostBaht', 14),
            ('Cost per unit', 14),
            ('InvtName', 20),
        ]
        
        all_headers = fixed_headers + dynamic_headers + remaining_headers
        
        # Write headers
        for col, (header, width) in enumerate(all_headers):
            sheet.write(0, col, header, header_format)
            sheet.set_column(col, col, width)
        
        # Write data rows
        for row_idx, line in enumerate(report.line_ids, start=1):
            col = 0
            
            # Fixed fields
            sheet.write(row_idx, col, line.doc_no or '', text_format); col += 1
            sheet.write(row_idx, col, line.landed_cost_date or '', date_format); col += 1
            sheet.write(row_idx, col, line.ref_no or '', text_format); col += 1
            sheet.write(row_idx, col, line.prd_id or '', text_format); col += 1
            sheet.write(row_idx, col, line.prd_name or '', text_format); col += 1
            sheet.write(row_idx, col, line.qt or 0.0, number_format); col += 1
            sheet.write(row_idx, col, line.price_per_unit or 0.0, currency_format); col += 1
            sheet.write(row_idx, col, line.cost or 0.0, currency_format); col += 1
            sheet.write(row_idx, col, line.rate or 0.0, number_format); col += 1
            sheet.write(row_idx, col, line.discount or 0.0, currency_format); col += 1
            sheet.write(row_idx, col, line.exp or 0.0, currency_format); col += 1
            
            # Dynamic landed columns
            landed_values = [
                line.landed_1, line.landed_2, line.landed_3, line.landed_4,
                line.landed_5, line.landed_6, line.landed_7, line.landed_8
            ]
            for i in range(8):
                sheet.write(row_idx, col, landed_values[i] or 0.0, currency_format)
                col += 1
            
            # Remaining fields
            sheet.write(row_idx, col, line.tax or 0.0, currency_format); col += 1
            sheet.write(row_idx, col, line.transit or 0.0, currency_format); col += 1
            sheet.write(row_idx, col, line.cost_baht or 0.0, currency_format); col += 1
            sheet.write(row_idx, col, line.cost_per_unit or 0.0, currency_format); col += 1
            sheet.write(row_idx, col, line.invt_name or '', text_format); col += 1
        
        # Add totals row
        if report.line_ids:
            total_row = len(report.line_ids) + 1
            sheet.write(total_row, 0, 'TOTAL', header_format)
            
            # Sum formulas for numeric columns
            for col in range(1, len(all_headers)):
                start_cell = xl_rowcol_to_cell(1, col)
                end_cell = xl_rowcol_to_cell(total_row - 1, col)
                
                # Only sum numeric columns (from QT onwards which is index 5)
                if col >= 5:
                    sheet.write_formula(total_row, col, f'=SUM({start_cell}:{end_cell})', total_format)
                else:
                    sheet.write(total_row, col, '', total_format)