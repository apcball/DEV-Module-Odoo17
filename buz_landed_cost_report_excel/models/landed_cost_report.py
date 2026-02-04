# -*- coding: utf-8 -*-

from odoo import models, fields, api, _, tools
from odoo.exceptions import UserError, ValidationError
import logging

_logger = logging.getLogger(__name__)


class LandedCostReportWizard(models.TransientModel):
    """
    Landed Cost Report Wizard
    
    This wizard allows users to configure report parameters and generate
    the landed cost report with dynamic columns.
    """
    _name = 'landed.cost.report.wizard'
    _description = 'Landed Cost Report Wizard'
    
    # Report Parameters
    date_from = fields.Date(
        string='Start Date',
        help='Filter landed costs from this date'
    )
    
    date_to = fields.Date(
        string='End Date',
        help='Filter landed costs up to this date'
    )
    
    # Filters
    landed_cost_ids = fields.Many2many(
        'stock.landed.cost',
        string='Landed Costs',
        domain=[('state', '=', 'done')],
        help='Specific landed costs to include (optional)'
    )
    
    picking_ids = fields.Many2many(
        'stock.picking',
        string='Stock Pickings',
        help='Filter by stock pickings'
    )
    
    product_ids = fields.Many2many(
        'product.product',
        string='Products',
        help='Filter by products'
    )
    
    category_ids = fields.Many2many(
        'landed.cost.category',
        string='Cost Categories',
        help='Filter by cost categories'
    )
    
    vendor_ids = fields.Many2many(
        'res.partner',
        string='Vendors',
        domain=[('supplier_rank', '>', 0)],
        help='Filter by vendors/suppliers'
    )
    
    # Company and Currency
    company_id = fields.Many2one(
        'res.company',
        string='Company',
        required=True,
        default=lambda self: self.env.company,
        help='Company for multi-company support'
    )
    
    currency_id = fields.Many2one(
        'res.currency',
        string='Report Currency',
        required=True,
        default=lambda self: self.env.company.currency_id,
        help='Target currency for the report (default: company currency - THB)'
    )
    
    exchange_rate = fields.Float(
        string='Exchange Rate',
        digits=(12, 6),
        default=1.0,
        help='Manual exchange rate override'
    )
    
    use_manual_rate = fields.Boolean(
        string='Use Manual Rate',
        default=False,
        help='Use manual rate instead of Odoo automatic rate'
    )
    
    # Options
    include_validated_only = fields.Boolean(
        string='Validated Only',
        default=True,
        help='Only include validated (done) landed costs'
    )
    
    group_by = fields.Selection([
        ('none', 'No Grouping'),
        ('product', 'Product'),
        ('picking', 'Picking'),
        ('vendor', 'Vendor'),
    ], string='Group By', default='none')
    
    # Dynamic Column Information (Computed)
    dynamic_column_count = fields.Integer(
        string='Dynamic Column Count',
        compute='_compute_dynamic_columns',
        help='Number of unique landed cost services in results'
    )
    
    dynamic_column_names = fields.Json(
        string='Dynamic Column Names',
        compute='_compute_dynamic_columns',
        help='JSON array of {"seq": 1, "name": "Freight", "code": "FREIGHT"}'
    )
    
    # Report Results
    report_id = fields.Many2one(
        'landed.cost.report',
        string='Generated Report'
    )
    
    # State for wizard flow
    state = fields.Selection([
        ('params', 'Parameters'),
        ('preview', 'Preview'),
    ], string='State', default='params')
    
    @api.depends('date_from', 'date_to', 'landed_cost_ids', 'product_ids', 'category_ids')
    def _compute_dynamic_columns(self):
        """Compute dynamic column information based on selected criteria."""
        for wizard in self:
            if wizard.state == 'params':
                # Get distinct services for the selected criteria
                services = wizard._get_distinct_services()
                wizard.dynamic_column_count = len(services)
                wizard.dynamic_column_names = services
            else:
                wizard.dynamic_column_count = 0
                wizard.dynamic_column_names = []
    
    def _get_distinct_services(self):
        """
        Get distinct landed cost services for dynamic columns.
        Returns list of dict with sequence, name, code, and category_id.
        """
        self.ensure_one()
        
        # Build domain for landed costs
        domain = []
        if self.include_validated_only:
            domain.append(('state', '=', 'done'))
        if self.date_from:
            domain.append(('date', '>=', self.date_from))
        if self.date_to:
            domain.append(('date', '<=', self.date_to))
        if self.landed_cost_ids:
            domain.append(('id', 'in', self.landed_cost_ids.ids))
        
        # Get landed costs
        landed_costs = self.env['stock.landed.cost'].search(domain)
        
        if not landed_costs:
            return []
        
        # Get unique cost lines with their categories
        services = []
        seen_categories = set()
        
        # Get all cost lines from these landed costs
        cost_lines = self.env['stock.landed.cost.lines'].search([
            ('cost_id', 'in', landed_costs.ids)
        ])
        
        for line in cost_lines:
            product = line.product_id
            if product and product.landed_cost_ok:
                # Get categories for this product
                categories = product.product_tmpl_id.landed_cost_category_ids
                
                if categories:
                    for category in categories:
                        if category.id not in seen_categories and not category.is_transit and not category.is_tax:
                            seen_categories.add(category.id)
                            services.append({
                                'sequence': category.sequence,
                                'name': category.name,
                                'code': category.code,
                                'category_id': category.id,
                            })
                else:
                    # No category assigned - use product name
                    service_key = f"product_{product.id}"
                    if service_key not in seen_categories:
                        seen_categories.add(service_key)
                        services.append({
                            'sequence': 99,
                            'name': product.name,
                            'code': f'PROD{product.id}',
                            'category_id': None,
                        })
        
        # Sort by sequence
        services.sort(key=lambda x: x['sequence'])
        
        # Limit to 8 columns
        return services[:8]
    
    def _get_exchange_rate(self, from_currency, to_currency, date):
        """
        Get exchange rate between two currencies.
        Priority: Manual rate > Odoo rate > 1.0
        """
        self.ensure_one()
        
        if from_currency == to_currency:
            return 1.0
        
        if self.use_manual_rate and self.exchange_rate:
            return self.exchange_rate
        
        # Use Odoo's currency rate mechanism
        return self.env['res.currency']._get_conversion_rate(
            from_currency,
            to_currency,
            self.company_id,
            date or fields.Date.today()
        )
    
    def _convert_to_report_currency(self, amount, from_currency, date):
        """Convert amount to report currency."""
        self.ensure_one()
        
        if not amount or from_currency == self.currency_id:
            return amount
        
        rate = self._get_exchange_rate(from_currency, self.currency_id, date)
        return amount * rate
    
    def action_generate_report(self):
        """Generate report data based on wizard criteria."""
        self.ensure_one()
        
        # Create the main report record
        report_vals = {
            'wizard_id': self.id,
            'date_from': self.date_from,
            'date_to': self.date_to,
            'currency_id': self.currency_id.id,
            'exchange_rate': self.exchange_rate if self.use_manual_rate else 1.0,
            'company_id': self.company_id.id,
        }
        
        report = self.env['landed.cost.report'].create(report_vals)
        self.report_id = report.id
        
        # Generate report lines
        report._generate_lines()
        
        # Move to preview state
        self.state = 'preview'
        
        return {
            'type': 'ir.actions.act_window',
            'res_model': self._name,
            'res_id': self.id,
            'view_mode': 'form',
            'target': 'new',
        }
    
    def action_export_excel(self):
        """Export report to Excel format with dynamic columns."""
        self.ensure_one()
        
        if not self.report_id:
            raise UserError(_('Please generate the report first.'))
        
        return self.env.ref('buz_landed_cost_report_excel.action_landed_cost_report_xlsx').report_action(self.report_id)
    
    def action_preview(self):
        """Open on-screen preview with dynamic columns."""
        self.ensure_one()
        
        if not self.report_id:
            raise UserError(_('Please generate the report first.'))
        
        return {
            'name': _('Landed Cost Report Preview'),
            'type': 'ir.actions.act_window',
            'res_model': 'landed.cost.report.line',
            'view_mode': 'tree,pivot',
            'domain': [('report_id', '=', self.report_id.id)],
            'context': {
                'landed_column_labels': {f'landed_{i+1}': col['name'] 
                                          for i, col in enumerate(self.dynamic_column_names or [])}
            },
            'target': 'current',
        }
    
    def action_back(self):
        """Go back to parameter configuration."""
        self.ensure_one()
        self.state = 'params'
        return {
            'type': 'ir.actions.act_window',
            'res_model': self._name,
            'res_id': self.id,
            'view_mode': 'form',
            'target': 'new',
        }


class LandedCostReport(models.TransientModel):
    """
    Landed Cost Report Header
    
    Main report header containing aggregated summary data and lines.
    This is a transient model that stores the report results temporarily.
    """
    _name = 'landed.cost.report'
    _description = 'Landed Cost Report'
    
    # Reference to Wizard
    wizard_id = fields.Many2one(
        'landed.cost.report.wizard',
        string='Wizard'
    )
    
    # Report Parameters
    date_from = fields.Date(string='Start Date')
    date_to = fields.Date(string='End Date')
    currency_id = fields.Many2one('res.currency', string='Report Currency')
    exchange_rate = fields.Float(string='Exchange Rate', digits=(12, 6))
    company_id = fields.Many2one('res.company', string='Company')
    
    # Dynamic Column Info
    dynamic_column_count = fields.Integer(
        string='Dynamic Columns',
        compute='_compute_dynamic_columns'
    )
    
    dynamic_columns = fields.Json(
        string='Dynamic Column Definitions',
        compute='_compute_dynamic_columns'
    )
    
    # Summary Statistics
    landed_cost_count = fields.Integer(
        string='Landed Costs',
        compute='_compute_statistics'
    )
    
    picking_count = fields.Integer(
        string='Pickings',
        compute='_compute_statistics'
    )
    
    product_count = fields.Integer(
        string='Products',
        compute='_compute_statistics'
    )
    
    # Financial Totals
    total_original_value = fields.Monetary(
        string='Total Original Value',
        currency_field='currency_id',
        compute='_compute_statistics'
    )
    
    total_original_value_baht = fields.Monetary(
        string='Total Original Value (THB)',
        currency_field='currency_id',
        compute='_compute_statistics'
    )
    
    total_landed_cost = fields.Monetary(
        string='Total Landed Cost',
        currency_field='currency_id',
        compute='_compute_statistics'
    )
    
    total_tax = fields.Monetary(
        string='Total Tax',
        currency_field='currency_id',
        compute='_compute_statistics'
    )
    
    total_transit = fields.Monetary(
        string='Total Transit',
        currency_field='currency_id',
        compute='_compute_statistics'
    )
    
    total_cost_baht = fields.Monetary(
        string='Total Cost (THB)',
        currency_field='currency_id',
        compute='_compute_statistics'
    )
    
    avg_cost_increase_pct = fields.Float(
        string='Avg Cost Increase %',
        digits=(5, 2),
        compute='_compute_statistics'
    )
    
    # Report Lines
    line_ids = fields.One2many(
        'landed.cost.report.line',
        'report_id',
        string='Report Lines'
    )
    
    @api.depends('wizard_id')
    def _compute_dynamic_columns(self):
        """Compute dynamic column definitions from wizard."""
        for report in self:
            if report.wizard_id:
                columns = report.wizard_id.dynamic_column_names or []
                report.dynamic_column_count = len(columns)
                report.dynamic_columns = {
                    'landed_columns': columns,
                    'has_transit': True,  # Will be set based on actual data
                    'has_tax': True,
                }
            else:
                report.dynamic_column_count = 0
                report.dynamic_columns = {}
    
    @api.depends('line_ids')
    def _compute_statistics(self):
        """Compute summary statistics from report lines."""
        for report in self:
            lines = report.line_ids
            
            report.landed_cost_count = len(lines.mapped('landed_cost_id'))
            report.picking_count = len(lines.mapped('picking_id'))
            report.product_count = len(lines.mapped('product_id'))
            
            report.total_original_value = sum(lines.mapped('cost'))
            report.total_original_value_baht = sum(lines.mapped('cost_baht'))
            report.total_landed_cost = sum(
                lines.mapped(lambda l: 
                    l.landed_1 + l.landed_2 + l.landed_3 + l.landed_4 +
                    l.landed_5 + l.landed_6 + l.landed_7 + l.landed_8
                )
            )
            report.total_tax = sum(lines.mapped('tax'))
            report.total_transit = sum(lines.mapped('transit'))
            report.total_cost_baht = sum(lines.mapped('cost_baht'))
            
            # Calculate average cost increase percentage
            if report.total_original_value_baht:
                increase = report.total_landed_cost / report.total_original_value_baht * 100
                report.avg_cost_increase_pct = increase
            else:
                report.avg_cost_increase_pct = 0.0
    
    def _generate_lines(self):
        """Generate report lines based on wizard criteria."""
        self.ensure_one()
        
        wizard = self.wizard_id
        
        # Build domain for landed costs
        domain = [('state', '=', 'done')]
        
        if wizard.date_from:
            domain.append(('date', '>=', wizard.date_from))
        if wizard.date_to:
            domain.append(('date', '<=', wizard.date_to))
        if wizard.landed_cost_ids:
            domain.append(('id', 'in', wizard.landed_cost_ids.ids))
        
        landed_costs = self.env['stock.landed.cost'].search(domain)
        
        # Delete existing lines
        self.line_ids.unlink()
        
        # Generate lines for each valuation adjustment
        line_vals = []
        sequence = 0
        
        for landed_cost in landed_costs:
            # Get valuation adjustment lines
            valuation_lines = self.env['stock.valuation.adjustment.lines'].search([
                ('cost_id', '=', landed_cost.id)
            ])
            
            for val_line in valuation_lines:
                # Apply product filter
                if wizard.product_ids and val_line.product_id not in wizard.product_ids:
                    continue
                
                # Get product info
                product = val_line.product_id
                product_tmpl = product.product_tmpl_id
                
                # Get picking info
                pickings = landed_cost.picking_ids
                picking = pickings[0] if pickings else False
                
                # Get vendor info
                vendor_bill = landed_cost.vendor_bill_id
                vendor = vendor_bill.partner_id if vendor_bill else False
                
                # Get reference number
                ref_no = vendor_bill.name if vendor_bill else (picking.origin if picking else '')
                
                # Get currency info
                source_currency = vendor_bill.currency_id if vendor_bill else self.currency_id
                
                # Calculate exchange rate
                rate = wizard._get_exchange_rate(
                    source_currency,
                    self.currency_id,
                    landed_cost.date
                )
                
                # Calculate amounts
                original_cost = val_line.former_cost
                quantity = val_line.quantity or 1.0
                price_per_unit = original_cost / quantity if quantity else 0.0
                
                # Initialize landed cost fields
                landed_costs_dict = {f'landed_{i}': 0.0 for i in range(1, 9)}
                tax_amount = 0.0
                transit_amount = 0.0
                
                # Get additional landed cost allocations for this line
                # This is a simplified approach - in reality, we'd need to query
                # the specific allocation for each cost line
                cost_lines = self.env['stock.landed.cost.lines'].search([
                    ('cost_id', '=', landed_cost.id)
                ])
                
                for cost_line in cost_lines:
                    cost_product = cost_line.product_id
                    if cost_product and cost_product.landed_cost_ok:
                        # Get categories
                        categories = cost_product.product_tmpl_id.landed_cost_category_ids
                        
                        # Calculate allocated amount for this product line
                        # This is simplified - actual allocation logic may vary
                        total_additional = cost_line.price_unit
                        
                        # Distribute based on valuation line's share
                        if val_line.former_cost and landed_cost.amount_total:
                            share = val_line.former_cost / landed_cost.amount_total
                            allocated_amount = total_additional * share
                        else:
                            allocated_amount = 0.0
                        
                        # Convert to report currency
                        allocated_amount_report = wizard._convert_to_report_currency(
                            allocated_amount,
                            source_currency,
                            landed_cost.date
                        )
                        
                        if categories:
                            for category in categories:
                                if category.is_tax:
                                    tax_amount += allocated_amount_report
                                elif category.is_transit:
                                    transit_amount += allocated_amount_report
                                else:
                                    # Map to landed_1 through landed_8 based on sequence
                                    seq = category.sequence
                                    if 1 <= seq <= 8:
                                        landed_costs_dict[f'landed_{seq}'] += allocated_amount_report
                        else:
                            # No category - put in landed_1 as default
                            landed_costs_dict['landed_1'] += allocated_amount_report
                
                # Calculate totals
                total_landed = sum(landed_costs_dict.values()) + tax_amount + transit_amount
                cost_baht = wizard._convert_to_report_currency(original_cost, source_currency, landed_cost.date) + total_landed
                cost_per_unit = cost_baht / quantity if quantity else 0.0
                
                sequence += 1
                
                line_vals.append({
                    'report_id': self.id,
                    'wizard_id': wizard.id,
                    'sequence': sequence,
                    'landed_cost_id': landed_cost.id,
                    'doc_no': landed_cost.name,
                    'landed_cost_date': landed_cost.date,
                    'ref_no': ref_no,
                    'picking_id': picking.id if picking else False,
                    'vendor_bill_id': vendor_bill.id if vendor_bill else False,
                    'vendor_id': vendor.id if vendor else False,
                    'product_id': product.id,
                    'prd_id': product_tmpl.default_code or '',
                    'prd_name': product_tmpl.name,
                    'invt_name': product_tmpl.categ_id.name if product_tmpl.categ_id else '',
                    'product_category_id': product_tmpl.categ_id.id if product_tmpl.categ_id else False,
                    'qt': quantity,
                    'price_per_unit': price_per_unit,
                    'cost': original_cost,
                    'source_currency_id': source_currency.id,
                    'rate': rate,
                    'discount': 0.0,  # To be implemented based on bill discounts
                    'exp': 0.0,  # To be implemented
                    **landed_costs_dict,
                    'tax': tax_amount,
                    'transit': transit_amount,
                    'cost_baht': cost_baht,
                    'cost_per_unit': cost_per_unit,
                    'company_id': self.company_id.id,
                })
        
        # Create all lines at once
        if line_vals:
            self.env['landed.cost.report.line'].create(line_vals)


class LandedCostReportLine(models.TransientModel):
    """
    Landed Cost Report Line (Tabular Format)
    
    This model stores data in a pivoted format - one row per product with
    landed costs spread across dynamic fields (landed_1 through landed_8).
    """
    _name = 'landed.cost.report.line'
    _description = 'Landed Cost Report Line'
    _order = 'sequence, doc_no, prd_id'
    
    # References
    report_id = fields.Many2one('landed.cost.report', string='Report')
    wizard_id = fields.Many2one('landed.cost.report.wizard', string='Wizard')
    sequence = fields.Integer(string='Sequence')
    
    # Document Fields
    landed_cost_id = fields.Many2one('stock.landed.cost', string='Landed Cost')
    doc_no = fields.Char(string='DocNo')
    landed_cost_date = fields.Date(string='Date')
    ref_no = fields.Char(string='RefNo')
    picking_id = fields.Many2one('stock.picking', string='Picking')
    vendor_bill_id = fields.Many2one('account.move', string='Vendor Bill')
    vendor_id = fields.Many2one('res.partner', string='Vendor')
    
    # Product Fields
    product_id = fields.Many2one('product.product', string='Product')
    prd_id = fields.Char(string='PrdID')
    prd_name = fields.Char(string='PrdName')
    invt_name = fields.Char(string='InvtName')
    product_category_id = fields.Many2one('product.category', string='Product Category')
    
    # Quantity and Pricing
    qt = fields.Float(string='QT', digits=(16, 2))
    price_per_unit = fields.Monetary(string='PricePerUnit', currency_field='source_currency_id')
    cost = fields.Monetary(string='Cost', currency_field='source_currency_id')
    source_currency_id = fields.Many2one('res.currency', string='Source Currency')
    rate = fields.Float(string='Rate', digits=(12, 6))
    discount = fields.Monetary(string='Discount', currency_field='company_currency_id')
    exp = fields.Monetary(string='Exp', currency_field='company_currency_id')
    
    # Dynamic Landed Cost Fields (landed_1 through landed_8)
    landed_1 = fields.Monetary(string='Landed 1', currency_field='company_currency_id')
    landed_2 = fields.Monetary(string='Landed 2', currency_field='company_currency_id')
    landed_3 = fields.Monetary(string='Landed 3', currency_field='company_currency_id')
    landed_4 = fields.Monetary(string='Landed 4', currency_field='company_currency_id')
    landed_5 = fields.Monetary(string='Landed 5', currency_field='company_currency_id')
    landed_6 = fields.Monetary(string='Landed 6', currency_field='company_currency_id')
    landed_7 = fields.Monetary(string='Landed 7', currency_field='company_currency_id')
    landed_8 = fields.Monetary(string='Landed 8', currency_field='company_currency_id')
    
    # Special Columns
    tax = fields.Monetary(string='Tax', currency_field='company_currency_id')
    transit = fields.Monetary(string='Transit', currency_field='company_currency_id')
    
    # Totals
    cost_baht = fields.Monetary(string='CostBath', currency_field='company_currency_id')
    cost_per_unit = fields.Monetary(string='Cost per unit', currency_field='company_currency_id')
    
    # Metadata
    company_id = fields.Many2one('res.company', string='Company')
    company_currency_id = fields.Many2one(
        'res.currency',
        related='company_id.currency_id',
        string='Company Currency',
        store=True
    )
    
    # JSON field for raw landed cost data (for debugging/extensibility)
    landed_cost_data = fields.Json(string='Landed Cost Data')
    
    def get_landed_column_label(self, column_number):
        """Get the label for a specific landed column."""
        self.ensure_one()
        if self.wizard_id and self.wizard_id.dynamic_column_names:
            columns = self.wizard_id.dynamic_column_names
            if 1 <= column_number <= len(columns):
                return columns[column_number - 1].get('name', f'Landed {column_number}')
        return f'Landed {column_number}'