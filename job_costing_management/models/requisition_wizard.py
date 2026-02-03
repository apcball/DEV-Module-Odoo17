# -*- coding: utf-8 -*-
"""
Material Requisition Wizard
===========================

Step-by-step wizard for creating material requisitions.
Provides guided workflow for requesting materials.
"""

from odoo import models, fields, api, _
from odoo.exceptions import UserError, ValidationError
from odoo.tools import float_compare


class MaterialRequisitionWizard(models.TransientModel):
    """
    Material Requisition Wizard.
    
    Multi-step wizard that guides users through creating a material requisition:
    Step 1: Select job and enter basic info
    Step 2: Add material lines
    Step 3: Review and submit
    """
    _name = 'material.requisition.wizard'
    _description = 'Material Requisition Wizard'
    
    # === Wizard Step ===
    step = fields.Integer(
        string='Current Step',
        default=1,
        required=True
    )
    
    # === Step 1: Basic Info ===
    job_id = fields.Many2one(
        'job.costing',
        string='Job / Project',
        required=True,
        domain=[('state', 'in', ['draft', 'in_progress', 'on_hold'])],
        help='Select the job requiring materials'
    )
    
    job_title = fields.Char(
        related='job_id.title',
        string='Job Title',
        readonly=True
    )
    
    partner_id = fields.Many2one(
        'res.partner',
        related='job_id.partner_id',
        string='Customer',
        readonly=True
    )
    
    department_id = fields.Many2one(
        'hr.department',
        string='Department',
        default=lambda self: self.env.user.employee_id.department_id if self.env.user.employee_id else False
    )
    
    requester_id = fields.Many2one(
        'hr.employee',
        string='Requester',
        default=lambda self: self.env.user.employee_id,
        required=True
    )
    
    date_required = fields.Date(
        string='Date Required',
        required=True,
        default=lambda self: fields.Date.today()
    )
    
    priority = fields.Selection([
        ('0', 'Low'),
        ('1', 'Normal'),
        ('2', 'High'),
        ('3', 'Urgent')
    ], string='Priority',
       default='1',
       required=True
    )
    
    warehouse_id = fields.Many2one(
        'stock.warehouse',
        string='Source Warehouse',
        required=True,
        default=lambda self: self.env.user._get_default_warehouse()
    )
    
    location_id = fields.Many2one(
        'stock.location',
        string='Source Location',
        required=True,
        domain="[('usage', '=', 'internal')]"
    )
    
    delivery_address_id = fields.Many2one(
        'res.partner',
        string='Delivery Address',
        required=True
    )
    
    # === Step 2: Material Lines ===
    line_ids = fields.One2many(
        'material.requisition.wizard.line',
        'wizard_id',
        string='Material Lines'
    )
    
    line_count = fields.Integer(
        string='Number of Items',
        compute='_compute_line_count'
    )
    
    # === Computed Fields ===
    total_estimated_cost = fields.Float(
        string='Total Estimated Cost',
        compute='_compute_totals',
        digits='Product Price'
    )
    
    total_items = fields.Integer(
        string='Total Items',
        compute='_compute_totals'
    )
    
    can_approve_self = fields.Boolean(
        string='Can Self-Approve',
        compute='_compute_approval_info'
    )
    
    needs_approval = fields.Boolean(
        string='Needs Manager Approval',
        compute='_compute_approval_info'
    )
    
    approval_limit = fields.Float(
        string='Approval Limit',
        compute='_compute_approval_info',
        digits='Product Price'
    )
    
    # === Validation Flags ===
    has_lines = fields.Boolean(
        string='Has Lines',
        compute='_compute_validation_flags'
    )
    
    all_lines_valid = fields.Boolean(
        string='All Lines Valid',
        compute='_compute_validation_flags'
    )
    
    # === Summary for Review ===
    summary_html = fields.Html(
        string='Summary',
        compute='_compute_summary_html'
    )
    
    # === Onchange Methods ===
    @api.onchange('job_id')
    def _onchange_job_id(self):
        """Auto-fill delivery address from job customer."""
        if self.job_id and self.job_id.partner_id:
            self.delivery_address_id = self.job_id.partner_id.id
    
    @api.onchange('warehouse_id')
    def _onchange_warehouse_id(self):
        """Set default location from warehouse."""
        if self.warehouse_id:
            self.location_id = self.warehouse_id.lot_stock_id.id
    
    @api.onchange('requester_id')
    def _onchange_requester_id(self):
        """Auto-fill department from requester."""
        if self.requester_id and self.requester_id.department_id:
            self.department_id = self.requester_id.department_id.id
    
    # === Compute Methods ===
    @api.depends('line_ids')
    def _compute_line_count(self):
        for wizard in self:
            wizard.line_count = len(wizard.line_ids)
    
    @api.depends('line_ids.estimated_total_cost', 'line_ids.quantity')
    def _compute_totals(self):
        for wizard in self:
            wizard.total_estimated_cost = sum(wizard.line_ids.mapped('estimated_total_cost'))
            wizard.total_items = sum(wizard.line_ids.mapped('quantity'))
    
    @api.depends('total_estimated_cost', 'requester_id')
    def _compute_approval_info(self):
        for wizard in self:
            # Get approval limit
            limit = 0.0
            if wizard.requester_id:
                limit = wizard.requester_id.requisition_approval_limit or 0.0
            if not limit and wizard.department_id:
                limit = wizard.department_id.requisition_approval_limit or 0.0
            
            wizard.approval_limit = limit
            wizard.can_approve_self = limit > 0
            wizard.needs_approval = wizard.total_estimated_cost > limit
    
    @api.depends('line_ids', 'line_ids.product_id', 'line_ids.quantity')
    def _compute_validation_flags(self):
        for wizard in self:
            wizard.has_lines = bool(wizard.line_ids)
            wizard.all_lines_valid = all(
                line.product_id and line.quantity > 0 
                for line in wizard.line_ids
            )
    
    @api.depends('job_id', 'line_ids', 'total_estimated_cost', 'date_required', 'priority')
    def _compute_summary_html(self):
        for wizard in self:
            if not wizard.job_id:
                wizard.summary_html = _('<p>Please complete the previous steps first.</p>')
                continue
            
            lines_html = '</ul>'.join([
                f'<li>{line.product_id.display_name}: {line.quantity} {line.uom_id.name}'
                for line in wizard.line_ids if line.product_id
            ])
            
            priority_labels = {
                '0': '<span class="badge badge-info">Low</span>',
                '1': '<span class="badge badge-secondary">Normal</span>',
                '2': '<span class="badge badge-warning">High</span>',
                '3': '<span class="badge badge-danger">Urgent</span>',
            }
            
            wizard.summary_html = f'''
                <div class="table-responsive">
                    <table class="table table-sm table-borderless">
                        <tr><td><strong>Job:</strong></td><td>{wizard.job_id.display_name} - {wizard.job_title or ''}</td></tr>
                        <tr><td><strong>Customer:</strong></td><td>{wizard.partner_id.display_name if wizard.partner_id else '-'}</td></tr>
                        <tr><td><strong>Date Required:</strong></td><td>{wizard.date_required or '-'}</td></tr>
                        <tr><td><strong>Priority:</strong></td><td>{priority_labels.get(wizard.priority, wizard.priority)}</td></tr>
                        <tr><td><strong>Items:</strong></td><td>{wizard.line_count} products, {wizard.total_items} total units</td></tr>
                        <tr><td><strong>Est. Total Cost:</strong></td><td><span class="font-weight-bold">{wizard.total_estimated_cost:,.2f}</span></td></tr>
                        <tr><td><strong>Approval Required:</strong></td><td>{'Yes' if wizard.needs_approval else 'No (within your limit)'}</td></tr>
                    </table>
                    <hr/>
                    <h6>Items:</h6>
                    <ul>{lines_html}
                </div>
            '''
    
    # === Step Navigation Methods ===
    def action_step1_next(self):
        """Proceed from step 1 to step 2."""
        self.ensure_one()
        
        # Validate step 1 fields
        if not self.job_id:
            raise UserError(_('Please select a job!'))
        if not self.date_required:
            raise UserError(_('Please specify when materials are required!'))
        if not self.delivery_address_id:
            raise UserError(_('Please specify a delivery address!'))
        if not self.warehouse_id:
            raise UserError(_('Please select a source warehouse!'))
        
        # Check date
        if self.date_required < fields.Date.today():
            raise UserError(_('Required date cannot be in the past!'))
        
        self.write({'step': 2})
        return self._get_wizard_action()
    
    def action_step2_prev(self):
        """Go back from step 2 to step 1."""
        self.ensure_one()
        self.write({'step': 1})
        return self._get_wizard_action()
    
    def action_step2_next(self):
        """Proceed from step 2 to step 3 (review)."""
        self.ensure_one()
        
        # Validate lines
        if not self.line_ids:
            raise UserError(_('Please add at least one material line!'))
        
        for line in self.line_ids:
            if not line.product_id:
                raise UserError(_('Please select a product for all lines!'))
            if line.quantity <= 0:
                raise UserError(_('Quantity must be greater than zero for %s!') % line.product_id.display_name)
        
        self.write({'step': 3})
        return self._get_wizard_action()
    
    def action_step3_prev(self):
        """Go back from step 3 to step 2."""
        self.ensure_one()
        self.write({'step': 2})
        return self._get_wizard_action()
    
    def action_submit(self):
        """Submit the requisition and create the actual record."""
        self.ensure_one()
        
        # Create requisition
        requisition_vals = {
            'job_id': self.job_id.id,
            'requester_id': self.requester_id.id,
            'department_id': self.department_id.id if self.department_id else False,
            'date_required': self.date_required,
            'priority': self.priority,
            'warehouse_id': self.warehouse_id.id,
            'location_id': self.location_id.id,
            'delivery_address_id': self.delivery_address_id.id,
            'notes': _('Created from wizard by %s') % self.env.user.name,
            'line_ids': []
        }
        
        # Add lines
        for line in self.line_ids:
            line_vals = {
                'product_id': line.product_id.id,
                'description': line.description or line.product_id.display_name,
                'uom_id': line.uom_id.id,
                'quantity_requested': line.quantity,
                'job_costing_line_id': line.job_costing_line_id.id if line.job_costing_line_id else False,
            }
            requisition_vals['line_ids'].append((0, 0, line_vals))
        
        requisition = self.env['material.requisition'].create(requisition_vals)
        
        # Auto-submit for approval
        requisition.action_submit()
        
        # Return to view the created requisition
        return {
            'type': 'ir.actions.act_window',
            'res_model': 'material.requisition',
            'res_id': requisition.id,
            'view_mode': 'form',
            'target': 'current',
            'context': {'form_view_initial_mode': 'edit'}
        }
    
    def action_cancel(self):
        """Cancel the wizard."""
        return {'type': 'ir.actions.act_window_close'}
    
    def action_add_line(self):
        """Add a new line (for button in view)."""
        self.ensure_one()
        self.env['material.requisition.wizard.line'].create({
            'wizard_id': self.id,
            'sequence': len(self.line_ids) * 10
        })
        return self._get_wizard_action()
    
    def _get_wizard_action(self):
        """Get action to reopen wizard at current step."""
        return {
            'type': 'ir.actions.act_window',
            'res_model': 'material.requisition.wizard',
            'res_id': self.id,
            'view_mode': 'form',
            'target': 'new',
            'context': self.env.context,
        }


class MaterialRequisitionWizardLine(models.TransientModel):
    """
    Material Requisition Wizard Line.
    
    Temporary line item for the wizard. Will be converted to actual
    requisition lines when wizard is submitted.
    """
    _name = 'material.requisition.wizard.line'
    _description = 'Material Requisition Wizard Line'
    _order = 'sequence, id'
    
    # === Parent ===
    wizard_id = fields.Many2one(
        'material.requisition.wizard',
        string='Wizard',
        required=True,
        ondelete='cascade'
    )
    
    sequence = fields.Integer(
        string='Sequence',
        default=10
    )
    
    # === Product ===
    product_id = fields.Many2one(
        'product.product',
        string='Product',
        required=True,
        domain=[('type', 'in', ['product', 'consu'])]
    )
    
    description = fields.Char(
        string='Description'
    )
    
    uom_id = fields.Many2one(
        'uom.uom',
        string='Unit of Measure',
        required=True
    )
    
    uom_category_id = fields.Many2one(
        'uom.category',
        related='uom_id.category_id',
        string='UOM Category'
    )
    
    # === Quantities ===
    quantity = fields.Float(
        string='Quantity',
        default=1.0,
        required=True,
        digits='Product Unit of Measure'
    )
    
    available_qty = fields.Float(
        string='Available',
        compute='_compute_available_qty',
        digits='Product Unit of Measure'
    )
    
    # === Cost ===
    estimated_unit_cost = fields.Float(
        string='Unit Cost',
        compute='_compute_estimated_cost',
        digits='Product Price'
    )
    
    estimated_total_cost = fields.Float(
        string='Total Cost',
        compute='_compute_estimated_cost',
        digits='Product Price'
    )
    
    # === Budget Integration ===
    job_costing_line_id = fields.Many2one(
        'job.costing.line',
        string='Budget Line',
        domain="[('job_id', '=', parent.job_id), ('cost_type', '=', 'material')]"
    )
    
    budget_remaining = fields.Float(
        string='Budget Remaining',
        related='job_costing_line_id.variance_qty',
        help='Remaining budget quantity for this item'
    )
    
    # === Onchange Methods ===
    @api.onchange('product_id')
    def _onchange_product_id(self):
        """Auto-fill product details."""
        if self.product_id:
            self.description = self.product_id.display_name
            self.uom_id = self.product_id.uom_id.id
            
            # Try to find matching budget line
            if self.wizard_id.job_id:
                budget_line = self.env['job.costing.line'].search([
                    ('job_id', '=', self.wizard_id.job_id.id),
                    ('cost_type', '=', 'material'),
                    ('product_id', '=', self.product_id.id)
                ], limit=1)
                if budget_line:
                    self.job_costing_line_id = budget_line.id
    
    @api.onchange('quantity')
    def _onchange_quantity(self):
        """Warn about budget overruns."""
        if self.job_costing_line_id and self.quantity:
            if self.quantity > self.budget_remaining:
                return {
                    'warning': {
                        'title': _('Budget Exceeded'),
                        'message': _('Requested quantity (%s) exceeds remaining budget (%s)!') % (
                            self.quantity, self.budget_remaining
                        )
                    }
                }
    
    # === Compute Methods ===
    @api.depends('product_id', 'wizard_id.location_id')
    def _compute_available_qty(self):
        for line in self:
            if line.product_id and line.wizard_id.location_id:
                line.available_qty = line.product_id.with_context(
                    location=line.wizard_id.location_id.id
                ).qty_available
            else:
                line.available_qty = 0.0
    
    @api.depends('product_id', 'uom_id', 'quantity')
    def _compute_estimated_cost(self):
        for line in self:
            if line.product_id:
                cost = line.product_id.standard_price
                if line.uom_id and line.uom_id != line.product_id.uom_id:
                    cost = line.product_id.uom_id._compute_price(cost, line.uom_id)
                line.estimated_unit_cost = cost
                line.estimated_total_cost = cost * line.quantity
            else:
                line.estimated_unit_cost = 0.0
                line.estimated_total_cost = 0.0
    
    # === Constraints ===
    @api.constrains('quantity')
    def _check_quantity(self):
        for line in self:
            if line.quantity < 0:
                raise ValidationError(_('Quantity cannot be negative!'))
    
    @api.constrains('uom_id', 'product_id')
    def _check_uom(self):
        for line in self:
            if line.product_id and line.uom_id:
                if line.uom_id.category_id != line.product_id.uom_id.category_id:
                    raise ValidationError(
                        _('Unit of measure %s is not compatible with product %s!') % (
                            line.uom_id.name, line.product_id.display_name
                        )
                    )
