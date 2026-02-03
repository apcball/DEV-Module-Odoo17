# -*- coding: utf-8 -*-
"""
Material Requisition Models
===========================

Handles material requests with approval workflow and stock integration.
"""

from odoo import models, fields, api, _
from odoo.exceptions import ValidationError, UserError
from odoo.tools import float_compare, float_is_zero


class MaterialRequisition(models.Model):
    """
    Material Requisition Header.
    
    Main document for requesting materials for a job. Includes approval workflow
    and generates stock pickings upon approval.
    """
    _name = 'material.requisition'
    _description = 'Material Requisition'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'date_request desc, id desc'
    
    # === Identification ===
    name = fields.Char(
        string='Requisition Number',
        required=True,
        copy=False,
        readonly=True,
        default=lambda self: _('New'),
        index=True
    )
    
    origin = fields.Char(
        string='Source Document',
        help='Reference to the document that generated this requisition'
    )
    
    # === Job Reference ===
    job_id = fields.Many2one(
        'job.costing',
        string='Job / Project',
        required=True,
        tracking=True,
        index=True,
        domain=[('state', 'in', ['draft', 'in_progress', 'on_hold'])]
    )
    
    partner_id = fields.Many2one(
        'res.partner',
        related='job_id.partner_id',
        string='Customer',
        store=True
    )
    
    analytic_account_id = fields.Many2one(
        'account.analytic.account',
        string='Analytic Account',
        compute='_compute_analytic_account',
        store=True
    )
    
    # === Requester Info ===
    requester_id = fields.Many2one(
        'hr.employee',
        string='Requester',
        required=True,
        default=lambda self: self.env.user.employee_id,
        tracking=True,
        index=True
    )
    
    department_id = fields.Many2one(
        'hr.department',
        string='Department',
        related='requester_id.department_id',
        store=True
    )
    
    # === Dates ===
    date_request = fields.Datetime(
        string='Request Date',
        required=True,
        default=fields.Datetime.now,
        tracking=True
    )
    
    date_required = fields.Date(
        string='Date Required',
        required=True,
        tracking=True
    )
    
    date_approved = fields.Datetime(
        string='Approved Date',
        readonly=True,
        tracking=True
    )
    
    # === Priority ===
    priority = fields.Selection([
        ('0', 'Low'),
        ('1', 'Normal'),
        ('2', 'High'),
        ('3', 'Urgent')
    ], string='Priority',
       default='1',
       required=True,
       tracking=True
    )
    
    # === State ===
    state = fields.Selection([
        ('draft', 'Draft'),
        ('submit', 'Submitted'),
        ('approve', 'Approved'),
        ('partial', 'Partially Delivered'),
        ('done', 'Done'),
        ('reject', 'Rejected'),
        ('cancel', 'Cancelled')
    ], string='Status',
       default='draft',
       required=True,
       tracking=True,
       index=True
    )
    
    # === Approval ===
    approved_by = fields.Many2one(
        'hr.employee',
        string='Approved By',
        readonly=True,
        tracking=True
    )
    
    approval_limit = fields.Float(
        string='Approval Limit',
        compute='_compute_approval_limit'
    )
    
    needs_approval = fields.Boolean(
        string='Needs Approval',
        compute='_compute_needs_approval',
        store=True
    )
    
    rejection_reason = fields.Text(
        string='Rejection Reason',
        readonly=True,
        tracking=True
    )
    
    # === Location/Delivery ===
    warehouse_id = fields.Many2one(
        'stock.warehouse',
        string='Warehouse',
        required=True,
        default=lambda self: self.env.user._get_default_warehouse(),
        check_company=True
    )
    
    location_id = fields.Many2one(
        'stock.location',
        string='Source Location',
        required=True,
        domain="[('usage', '=', 'internal'), ('id', 'child_of', warehouse_id.view_location_id)]",
        check_company=True
    )
    
    delivery_address_id = fields.Many2one(
        'res.partner',
        string='Delivery Address',
        required=True,
        help='Where the materials should be delivered'
    )
    
    delivery_location_id = fields.Many2one(
        'stock.location',
        string='Delivery Location',
        help='Stock location for delivery (if internal)'
    )
    
    # === Line Items ===
    line_ids = fields.One2many(
        'material.requisition.line',
        'requisition_id',
        string='Requisition Lines',
        copy=True
    )
    
    line_count = fields.Integer(
        string='Line Count',
        compute='_compute_line_count'
    )
    
    # === Costs ===
    total_estimated_cost = fields.Float(
        string='Total Estimated Cost',
        compute='_compute_totals',
        store=True,
        currency_field='company_currency_id'
    )
    
    total_delivered_cost = fields.Float(
        string='Total Delivered Cost',
        compute='_compute_totals',
        store=True,
        currency_field='company_currency_id'
    )
    
    # === Stock Integration ===
    picking_ids = fields.One2many(
        'stock.picking',
        'requisition_id',
        string='Stock Pickings'
    )
    
    picking_count = fields.Integer(
        string='Picking Count',
        compute='_compute_picking_count'
    )
    
    procurement_group_id = fields.Many2one(
        'procurement.group',
        string='Procurement Group',
        copy=False
    )
    
    # === Company/Currency ===
    company_id = fields.Many2one(
        'res.company',
        string='Company',
        default=lambda self: self.env.company,
        required=True
    )
    
    company_currency_id = fields.Many2one(
        'res.currency',
        string='Company Currency',
        related='company_id.currency_id',
        store=True
    )
    
    # === Notes ===
    notes = fields.Text(string='Notes')
    
    # === Constraints ===
    _sql_constraints = [
        ('name_unique', 'UNIQUE(name)', 'Requisition Number must be unique!'),
    ]
    
    # === Default Methods ===
    @api.model_create_multi
    def create(self, vals_list):
        """Generate sequence number on create."""
        for vals in vals_list:
            if vals.get('name', _('New')) == _('New'):
                vals['name'] = self.env['ir.sequence'].next_by_code('material.requisition') or _('New')
        return super(MaterialRequisition, self).create(vals_list)
    
    # === Compute Methods ===
    @api.depends('job_id')
    def _compute_analytic_account(self):
        for req in self:
            if req.job_id and req.job_id.project_id:
                req.analytic_account_id = req.job_id.project_id.analytic_account_id
            else:
                req.analytic_account_id = False
    
    @api.depends('line_ids.estimated_total_cost')
    def _compute_totals(self):
        for req in self:
            req.total_estimated_cost = sum(req.line_ids.mapped('estimated_total_cost'))
            req.total_delivered_cost = sum(req.line_ids.mapped('delivered_total_cost'))
    
    @api.depends('line_ids')
    def _compute_line_count(self):
        for req in self:
            req.line_count = len(req.line_ids)
    
    @api.depends('picking_ids')
    def _compute_picking_count(self):
        for req in self:
            req.picking_count = len(req.picking_ids)
    
    @api.depends('requester_id')
    def _compute_approval_limit(self):
        for req in self:
            # Get approval limit from employee or department
            limit = 0.0
            if req.requester_id:
                limit = req.requester_id.requisition_approval_limit
            if not limit and req.department_id:
                limit = req.department_id.requisition_approval_limit
            req.approval_limit = limit
    
    @api.depends('total_estimated_cost', 'approval_limit')
    def _compute_needs_approval(self):
        for req in self:
            # If requester cannot approve their own requisitions, always needs approval
            # Otherwise, check against limit
            req.needs_approval = req.total_estimated_cost > req.approval_limit
    
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
    
    @api.constrains('date_request', 'date_required')
    def _check_dates(self):
        """Validate required date is not before request date."""
        for req in self:
            if req.date_required and req.date_required < req.date_request.date():
                raise ValidationError(_('Required date cannot be before request date!'))
    
    # === Action Methods ===
    def action_submit(self):
        """Submit requisition for approval."""
        self.ensure_one()
        if self.state != 'draft':
            raise UserError(_('Only draft requisitions can be submitted!'))
        if not self.line_ids:
            raise UserError(_('Please add at least one line item!'))
        
        # Validate quantities
        for line in self.line_ids:
            if float_compare(line.quantity_requested, 0.0, precision_rounding=line.uom_id.rounding or 0.01) <= 0:
                raise UserError(_('Quantity must be positive for product %s!') % line.product_id.display_name)
        
        self.write({'state': 'submit'})
        
        # Auto-approve if within approval limit
        if not self.needs_approval:
            self.action_approve()
    
    def action_approve(self):
        """Approve the requisition."""
        self.ensure_one()
        if self.state not in ['draft', 'submit']:
            raise UserError(_('Only submitted requisitions can be approved!'))
        
        # Set approval info
        vals = {
            'state': 'approve',
            'approved_by': self.env.user.employee_id.id if self.env.user.employee_id else False,
            'date_approved': fields.Datetime.now(),
        }
        
        # Copy requested quantities to approved if not set
        for line in self.line_ids:
            if float_is_zero(line.quantity_approved, precision_rounding=line.uom_id.rounding or 0.01):
                line.quantity_approved = line.quantity_requested
        
        self.write(vals)
        
        # Create procurement group and stock pickings
        self._create_stock_pickings()
    
    def action_reject(self, reason=None):
        """Reject the requisition."""
        self.ensure_one()
        if self.state not in ['draft', 'submit']:
            raise UserError(_('Cannot reject requisition in current state!'))
        
        self.write({
            'state': 'reject',
            'rejection_reason': reason or _('No reason provided')
        })
    
    def action_cancel(self):
        """Cancel the requisition."""
        self.ensure_one()
        if self.state in ['done', 'cancel']:
            raise UserError(_('Cannot cancel completed or cancelled requisition!'))
        
        # Cancel related pickings
        self.picking_ids.filtered(lambda p: p.state not in ['done', 'cancel']).action_cancel()
        
        self.write({'state': 'cancel'})
    
    def action_draft(self):
        """Reset to draft."""
        self.ensure_one()
        if self.state != 'cancel':
            raise UserError(_('Only cancelled requisitions can be reset to draft!'))
        self.write({'state': 'draft', 'rejection_reason': False})
    
    def action_view_pickings(self):
        """View related stock pickings."""
        self.ensure_one()
        action = self.env['ir.actions.actions']._for_xml_id('stock.action_picking_tree_all')
        pickings = self.mapped('picking_ids')
        if len(pickings) > 1:
            action['domain'] = [('id', 'in', pickings.ids)]
        elif pickings:
            form_view = [(self.env.ref('stock.view_picking_form').id, 'form')]
            if 'views' in action:
                action['views'] = form_view + [(state, view) for state, view in action['views'] if view != 'form']
            else:
                action['views'] = form_view
            action['res_id'] = pickings.id
        action['context'] = dict(self._context, default_origin=self.name)
        return action
    
    def action_check_delivery(self):
        """Check and update delivery status."""
        self.ensure_one()
        
        for line in self.line_ids:
            line._compute_quantity_delivered()
        
        # Update state based on delivery
        all_delivered = all(
            float_compare(line.quantity_delivered, line.quantity_approved, 
                         precision_rounding=line.uom_id.rounding or 0.01) >= 0
            for line in self.line_ids
        )
        any_delivered = any(
            float_compare(line.quantity_delivered, 0.0,
                         precision_rounding=line.uom_id.rounding or 0.01) > 0
            for line in self.line_ids
        )
        
        if all_delivered:
            self.write({'state': 'done'})
        elif any_delivered and self.state == 'approve':
            self.write({'state': 'partial'})
    
    # === Business Logic ===
    def _create_stock_pickings(self):
        """Create stock pickings for approved requisition lines."""
        self.ensure_one()
        
        # Create procurement group
        group = self.env['procurement.group'].create({
            'name': self.name,
            'partner_id': self.delivery_address_id.id,
            'move_type': 'direct',
        })
        self.procurement_group_id = group
        
        # Group lines by route/warehouse if needed
        # For simplicity, create one picking per requisition
        picking_type = self.warehouse_id.out_type_id
        
        if not picking_type:
            raise UserError(_('Please configure outgoing picking type for warehouse %s') % self.warehouse_id.name)
        
        # Prepare moves
        moves = []
        for line in self.line_ids.filtered(lambda l: l.quantity_approved > 0):
            move_vals = line._prepare_stock_move_vals(group)
            moves.append((0, 0, move_vals))
        
        if moves:
            picking_vals = {
                'picking_type_id': picking_type.id,
                'partner_id': self.delivery_address_id.id,
                'requisition_id': self.id,
                'job_costing_id': self.job_id.id,
                'location_id': self.location_id.id,
                'location_dest_id': picking_type.default_location_dest_id.id or self.location_id.id,
                'origin': self.name,
                'move_ids_without_package': moves,
                'company_id': self.company_id.id,
            }
            picking = self.env['stock.picking'].create(picking_vals)
            picking.action_confirm()
    
    def get_portal_url(self):
        """Get portal URL for customer to view requisition status."""
        self.ensure_one()
        return '/my/requisitions/%s' % self.id


class MaterialRequisitionLine(models.Model):
    """
    Material Requisition Line Item.
    
    Individual product request within a material requisition.
    Tracks requested, approved, and delivered quantities.
    """
    _name = 'material.requisition.line'
    _description = 'Material Requisition Line'
    _order = 'sequence, id'
    
    # === Parent Reference ===
    requisition_id = fields.Many2one(
        'material.requisition',
        string='Requisition',
        required=True,
        ondelete='cascade',
        index=True
    )
    
    sequence = fields.Integer(
        string='Sequence',
        default=10
    )
    
    state = fields.Selection(
        related='requisition_id.state',
        string='Status',
        store=True
    )
    
    # === Product Info ===
    product_id = fields.Many2one(
        'product.product',
        string='Product',
        required=True,
        domain=[('type', 'in', ['product', 'consu'])],
        index=True
    )
    
    product_tmpl_id = fields.Many2one(
        'product.template',
        related='product_id.product_tmpl_id',
        string='Product Template'
    )
    
    description = fields.Char(
        string='Description',
        required=True
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
    quantity_requested = fields.Float(
        string='Quantity Requested',
        required=True,
        default=1.0,
        digits='Product Unit of Measure'
    )
    
    quantity_approved = fields.Float(
        string='Quantity Approved',
        default=0.0,
        digits='Product Unit of Measure',
        help='Quantity approved by manager (can be less than requested)'
    )
    
    quantity_delivered = fields.Float(
        string='Quantity Delivered',
        compute='_compute_quantity_delivered',
        store=True,
        digits='Product Unit of Measure'
    )
    
    quantity_remaining = fields.Float(
        string='Quantity Remaining',
        compute='_compute_quantity_remaining',
        digits='Product Unit of Measure'
    )
    
    # === Costs ===
    estimated_unit_cost = fields.Float(
        string='Est. Unit Cost',
        compute='_compute_estimated_cost',
        store=True,
        digits='Product Price'
    )
    
    estimated_total_cost = fields.Float(
        string='Est. Total Cost',
        compute='_compute_estimated_cost',
        store=True,
        digits='Product Price'
    )
    
    delivered_unit_cost = fields.Float(
        string='Delivered Unit Cost',
        compute='_compute_delivered_cost',
        store=True,
        digits='Product Price'
    )
    
    delivered_total_cost = fields.Float(
        string='Delivered Total Cost',
        compute='_compute_delivered_cost',
        store=True,
        digits='Product Price'
    )
    
    # === Budget Integration ===
    job_costing_line_id = fields.Many2one(
        'job.costing.line',
        string='Budget Line',
        domain="[('job_id', '=', parent.job_id), ('cost_type', '=', 'material')]",
        help='Link to job costing budget line for tracking'
    )
    
    analytic_account_id = fields.Many2one(
        'account.analytic.account',
        related='requisition_id.analytic_account_id',
        string='Analytic Account',
        store=True
    )
    
    # === Stock Integration ===
    move_ids = fields.Many2many(
        'stock.move',
        'material_req_line_stock_move_rel',
        'line_id', 'move_id',
        string='Stock Moves',
        copy=False
    )
    
    procurement_group_id = fields.Many2one(
        related='requisition_id.procurement_group_id',
        string='Procurement Group',
        store=True
    )
    
    company_id = fields.Many2one(
        related='requisition_id.company_id',
        string='Company',
        store=True
    )
    
    company_currency_id = fields.Many2one(
        related='requisition_id.company_currency_id',
        string='Currency',
        store=True
    )
    
    # === Onchange Methods ===
    @api.onchange('product_id')
    def _onchange_product_id(self):
        """Auto-fill product details."""
        if self.product_id:
            self.description = self.product_id.display_name
            self.uom_id = self.product_id.uom_id.id
    
    @api.onchange('quantity_requested')
    def _onchange_quantity_requested(self):
        """Warn if requesting more than available stock."""
        if self.product_id and self.quantity_requested:
            qty_available = self.product_id.with_context(
                location=self.requisition_id.location_id.id
            ).qty_available
            if self.quantity_requested > qty_available:
                return {
                    'warning': {
                        'title': _('Low Stock'),
                        'message': _('Requested quantity exceeds available stock (%s %s).') % (
                            qty_available, self.uom_id.name
                        )
                    }
                }
    
    # === Compute Methods ===
    @api.depends('product_id', 'uom_id')
    def _compute_estimated_cost(self):
        for line in self:
            if line.product_id:
                # Get cost in line UOM
                cost = line.product_id.standard_price
                if line.uom_id != line.product_id.uom_id:
                    cost = line.product_id.uom_id._compute_price(
                        cost, line.uom_id
                    )
                line.estimated_unit_cost = cost
                line.estimated_total_cost = cost * line.quantity_approved
            else:
                line.estimated_unit_cost = 0.0
                line.estimated_total_cost = 0.0
    
    @api.depends('move_ids.state', 'move_ids.quantity_done')
    def _compute_quantity_delivered(self):
        for line in self:
            # Sum delivered quantities from done stock moves
            qty = 0.0
            for move in line.move_ids.filtered(lambda m: m.state == 'done'):
                qty += move.product_uom._compute_quantity(
                    move.quantity_done, line.uom_id
                )
            line.quantity_delivered = qty
    
    @api.depends('quantity_approved', 'quantity_delivered')
    def _compute_quantity_remaining(self):
        for line in self:
            line.quantity_remaining = line.quantity_approved - line.quantity_delivered
    
    @api.depends('move_ids', 'quantity_delivered')
    def _compute_delivered_cost(self):
        for line in self:
            total_cost = 0.0
            total_qty = 0.0
            
            for move in line.move_ids.filtered(lambda m: m.state == 'done'):
                # Use stock valuation or unit cost
                move_qty = move.product_uom._compute_quantity(
                    move.quantity_done, line.uom_id
                )
                # Get price from stock valuation layer or product cost
                valuation_layers = self.env['stock.valuation.layer'].search([
                    ('stock_move_id', '=', move.id)
                ])
                if valuation_layers:
                    move_cost = sum(valuation_layers.mapped('value'))
                else:
                    move_cost = move_qty * line.product_id.standard_price
                
                total_cost += abs(move_cost)
                total_qty += move_qty
            
            line.delivered_total_cost = total_cost
            line.delivered_unit_cost = total_qty and (total_cost / total_qty) or 0.0
    
    # === Constraints ===
    @api.constrains('quantity_requested', 'quantity_approved')
    def _check_quantities(self):
        for line in self:
            if line.quantity_requested < 0:
                raise ValidationError(_('Requested quantity cannot be negative!'))
            if line.quantity_approved < 0:
                raise ValidationError(_('Approved quantity cannot be negative!'))
            if line.quantity_approved > line.quantity_requested:
                raise ValidationError(
                    _('Approved quantity cannot exceed requested quantity for %s!') % 
                    line.product_id.display_name
                )
    
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
    
    # === Business Methods ===
    def _prepare_stock_move_vals(self, group):
        """Prepare stock move values for procurement."""
        self.ensure_one()
        requisition = self.requisition_id
        
        return {
            'name': self.description,
            'product_id': self.product_id.id,
            'product_uom_qty': self.quantity_approved,
            'product_uom': self.uom_id.id,
            'location_id': requisition.location_id.id,
            'location_dest_id': requisition.delivery_location_id.id or requisition.location_id.id,
            'group_id': group.id,
            'origin': requisition.name,
            'analytic_account_id': self.analytic_account_id.id,
            'requisition_line_ids': [(4, self.id)],
            'company_id': self.company_id.id,
        }
