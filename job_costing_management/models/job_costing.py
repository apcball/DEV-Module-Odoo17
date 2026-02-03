# -*- coding: utf-8 -*-
"""
Job Costing Management - Main Models
====================================

This module provides comprehensive job costing and material requisition management.
"""

from odoo import models, fields, api, _
from odoo.exceptions import ValidationError, UserError
from odoo.tools import float_compare


class JobCosting(models.Model):
    """
    Main Job Costing model for tracking project costs.
    
    A job costing record represents a project or job with budgeted costs,
    actual costs, and profit margin tracking.
    """
    _name = 'job.costing'
    _description = 'Job Costing'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'date_start desc, id desc'
    
    # === Core Fields ===
    name = fields.Char(
        string='Job Number',
        required=True,
        copy=False,
        readonly=True,
        default=lambda self: _('New'),
        index=True
    )
    
    title = fields.Char(
        string='Job Title',
        required=True,
        tracking=True
    )
    
    partner_id = fields.Many2one(
        'res.partner',
        string='Customer',
        required=True,
        domain=[('customer_rank', '>', 0)],
        tracking=True,
        index=True
    )
    
    project_id = fields.Many2one(
        'project.project',
        string='Project',
        tracking=True
    )
    
    # === Dates ===
    date_start = fields.Date(
        string='Start Date',
        required=True,
        default=fields.Date.today,
        tracking=True
    )
    
    date_end = fields.Date(
        string='End Date',
        tracking=True
    )
    
    # === Responsible Persons ===
    user_id = fields.Many2one(
        'res.users',
        string='Salesperson',
        default=lambda self: self.env.user,
        required=True,
        tracking=True
    )
    
    manager_id = fields.Many2one(
        'hr.employee',
        string='Project Manager',
        tracking=True,
        index=True
    )
    
    # === State ===
    state = fields.Selection([
        ('draft', 'Draft'),
        ('in_progress', 'In Progress'),
        ('on_hold', 'On Hold'),
        ('done', 'Completed'),
        ('cancelled', 'Cancelled')
    ], string='Status',
       default='draft',
       required=True,
       tracking=True,
       index=True
    )
    
    # === Budgeted Costs ===
    total_material_budget = fields.Float(
        string='Material Budget',
        compute='_compute_budget_totals',
        store=True,
        currency_field='company_currency_id'
    )
    
    total_labor_budget = fields.Float(
        string='Labor Budget',
        compute='_compute_budget_totals',
        store=True,
        currency_field='company_currency_id'
    )
    
    total_overhead_budget = fields.Float(
        string='Overhead Budget',
        compute='_compute_budget_totals',
        store=True,
        currency_field='company_currency_id'
    )
    
    total_subcontract_budget = fields.Float(
        string='Subcontract Budget',
        compute='_compute_budget_totals',
        store=True,
        currency_field='company_currency_id'
    )
    
    total_budgeted_cost = fields.Float(
        string='Total Budgeted Cost',
        compute='_compute_budget_totals',
        store=True,
        currency_field='company_currency_id'
    )
    
    # === Actual Costs ===
    total_material_actual = fields.Float(
        string='Material Actual',
        compute='_compute_actual_totals',
        store=True,
        currency_field='company_currency_id'
    )
    
    total_labor_actual = fields.Float(
        string='Labor Actual',
        compute='_compute_actual_totals',
        store=True,
        currency_field='company_currency_id'
    )
    
    total_overhead_actual = fields.Float(
        string='Overhead Actual',
        compute='_compute_actual_totals',
        store=True,
        currency_field='company_currency_id'
    )
    
    total_subcontract_actual = fields.Float(
        string='Subcontract Actual',
        compute='_compute_actual_totals',
        store=True,
        currency_field='company_currency_id'
    )
    
    total_actual_cost = fields.Float(
        string='Total Actual Cost',
        compute='_compute_actual_totals',
        store=True,
        currency_field='company_currency_id'
    )
    
    # === Profit Analysis ===
    profit_margin = fields.Float(
        string='Budgeted Profit %',
        compute='_compute_profit_margins',
        store=True
    )
    
    actual_profit_margin = fields.Float(
        string='Actual Profit %',
        compute='_compute_profit_margins',
        store=True
    )
    
    cost_variance = fields.Float(
        string='Cost Variance',
        compute='_compute_profit_margins',
        store=True,
        currency_field='company_currency_id'
    )
    
    # === Currency ===
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
    
    # === Related Records ===
    job_line_ids = fields.One2many(
        'job.costing.line',
        'job_id',
        string='Budget Lines',
        copy=True
    )
    
    line_count = fields.Integer(
        string='Line Count',
        compute='_compute_line_count'
    )
    
    requisition_ids = fields.One2many(
        'material.requisition',
        'job_id',
        string='Material Requisitions'
    )
    
    requisition_count = fields.Integer(
        string='Requisitions',
        compute='_compute_requisition_count'
    )
    
    picking_ids = fields.One2many(
        'stock.picking',
        'job_costing_id',
        string='Stock Pickings'
    )
    
    picking_count = fields.Integer(
        string='Pickings',
        compute='_compute_picking_count'
    )
    
    # === Notes ===
    note = fields.Html(string='Notes')
    
    # === Constraints ===
    _sql_constraints = [
        ('name_unique', 'UNIQUE(name)', 'Job Number must be unique!'),
    ]
    
    # === Default Methods ===
    @api.model_create_multi
    def create(self, vals_list):
        """Generate sequence number on create."""
        for vals in vals_list:
            if vals.get('name', _('New')) == _('New'):
                vals['name'] = self.env['ir.sequence'].next_by_code('job.costing') or _('New')
        return super(JobCosting, self).create(vals_list)
    
    # === Compute Methods ===
    @api.depends('job_line_ids.planned_total_cost', 'job_line_ids.cost_type')
    def _compute_budget_totals(self):
        """Compute budget totals by cost type."""
        for job in self:
            lines = job.job_line_ids
            job.total_material_budget = sum(
                lines.filtered(lambda l: l.cost_type == 'material').mapped('planned_total_cost')
            )
            job.total_labor_budget = sum(
                lines.filtered(lambda l: l.cost_type == 'labor').mapped('planned_total_cost')
            )
            job.total_overhead_budget = sum(
                lines.filtered(lambda l: l.cost_type == 'overhead').mapped('planned_total_cost')
            )
            job.total_subcontract_budget = sum(
                lines.filtered(lambda l: l.cost_type == 'subcontractor').mapped('planned_total_cost')
            )
            job.total_budgeted_cost = (
                job.total_material_budget + 
                job.total_labor_budget + 
                job.total_overhead_budget +
                job.total_subcontract_budget
            )
    
    @api.depends('requisition_ids.total_delivered_cost', 'job_line_ids.actual_total_cost')
    def _compute_actual_totals(self):
        """Compute actual costs from requisitions and lines."""
        for job in self:
            # Material costs from requisitions
            job.total_material_actual = sum(
                job.requisition_ids.filtered(lambda r: r.state == 'done').mapped('total_delivered_cost')
            )
            
            # Other costs from job lines
            lines = job.job_line_ids
            job.total_labor_actual = sum(
                lines.filtered(lambda l: l.cost_type == 'labor').mapped('actual_total_cost')
            )
            job.total_overhead_actual = sum(
                lines.filtered(lambda l: l.cost_type == 'overhead').mapped('actual_total_cost')
            )
            job.total_subcontract_actual = sum(
                lines.filtered(lambda l: l.cost_type == 'subcontractor').mapped('actual_total_cost')
            )
            
            job.total_actual_cost = (
                job.total_material_actual + 
                job.total_labor_actual + 
                job.total_overhead_actual +
                job.total_subcontract_actual
            )
    
    @api.depends('total_budgeted_cost', 'total_actual_cost')
    def _compute_profit_margins(self):
        """Compute profit margins and variance."""
        for job in self:
            job.cost_variance = job.total_budgeted_cost - job.total_actual_cost
            
            # Budgeted profit (assuming 20% markup for demo)
            if job.total_budgeted_cost > 0:
                job.profit_margin = 20.0  # Placeholder
            else:
                job.profit_margin = 0.0
            
            # Actual profit
            if job.total_actual_cost > 0:
                estimated_revenue = job.total_budgeted_cost * 1.2
                actual_profit = estimated_revenue - job.total_actual_cost
                job.actual_profit_margin = (actual_profit / estimated_revenue) * 100
            else:
                job.actual_profit_margin = 0.0
    
    @api.depends('job_line_ids')
    def _compute_line_count(self):
        for job in self:
            job.line_count = len(job.job_line_ids)
    
    @api.depends('requisition_ids')
    def _compute_requisition_count(self):
        for job in self:
            job.requisition_count = len(job.requisition_ids)
    
    @api.depends('picking_ids')
    def _compute_picking_count(self):
        for job in self:
            job.picking_count = len(job.picking_ids)
    
    # === Onchange Methods ===
    @api.onchange('partner_id')
    def _onchange_partner_id(self):
        """Auto-fill delivery address from partner."""
        if self.partner_id:
            return {'domain': {'project_id': [('partner_id', '=', self.partner_id.id)]}}
    
    @api.constrains('date_start', 'date_end')
    def _check_dates(self):
        """Validate date range."""
        for job in self:
            if job.date_end and job.date_end < job.date_start:
                raise ValidationError(_('End date cannot be before start date!'))
    
    # === Action Methods ===
    def action_start(self):
        """Start the job."""
        self.ensure_one()
        if self.state != 'draft':
            raise UserError(_('Only draft jobs can be started!'))
        if not self.job_line_ids:
            raise UserError(_('Please add at least one budget line before starting!'))
        self.write({'state': 'in_progress'})
    
    def action_hold(self):
        """Put job on hold."""
        self.ensure_one()
        if self.state not in ['in_progress']:
            raise UserError(_('Only in-progress jobs can be put on hold!'))
        self.write({'state': 'on_hold'})
    
    def action_resume(self):
        """Resume held job."""
        self.ensure_one()
        if self.state != 'on_hold':
            raise UserError(_('Only on-hold jobs can be resumed!'))
        self.write({'state': 'in_progress'})
    
    def action_done(self):
        """Complete the job."""
        self.ensure_one()
        if self.state not in ['in_progress', 'on_hold']:
            raise UserError(_('Only active jobs can be completed!'))
        self.write({'state': 'done', 'date_end': fields.Date.today()})
    
    def action_cancel(self):
        """Cancel the job."""
        self.ensure_one()
        if self.state == 'done':
            raise UserError(_('Completed jobs cannot be cancelled!'))
        self.write({'state': 'cancelled'})
    
    def action_draft(self):
        """Reset to draft."""
        self.ensure_one()
        if self.state not in ['cancelled']:
            raise UserError(_('Only cancelled jobs can be reset to draft!'))
        self.write({'state': 'draft'})
    
    def action_view_requisitions(self):
        """Open related requisitions."""
        self.ensure_one()
        return {
            'name': _('Material Requisitions'),
            'type': 'ir.actions.act_window',
            'res_model': 'material.requisition',
            'view_mode': 'tree,form',
            'domain': [('job_id', '=', self.id)],
            'context': {'default_job_id': self.id}
        }
    
    def action_view_pickings(self):
        """Open related stock pickings."""
        self.ensure_one()
        return {
            'name': _('Stock Pickings'),
            'type': 'ir.actions.act_window',
            'res_model': 'stock.picking',
            'view_mode': 'tree,form',
            'domain': [('job_costing_id', '=', self.id)],
        }
    
    def action_create_requisition(self):
        """Launch material requisition wizard."""
        self.ensure_one()
        return {
            'name': _('Create Material Requisition'),
            'type': 'ir.actions.act_window',
            'res_model': 'material.requisition.wizard',
            'view_mode': 'form',
            'target': 'new',
            'context': {'default_job_id': self.id}
        }


class JobCostingLine(models.Model):
    """
    Job Costing Budget Line.
    
    Represents a budget line item for materials, labor, overhead, or subcontractors.
    """
    _name = 'job.costing.line'
    _description = 'Job Costing Line'
    _order = 'sequence, id'
    
    # === Core Fields ===
    job_id = fields.Many2one(
        'job.costing',
        string='Job Costing',
        required=True,
        ondelete='cascade',
        index=True
    )
    
    sequence = fields.Integer(
        string='Sequence',
        default=10
    )
    
    cost_type = fields.Selection([
        ('material', 'Material'),
        ('labor', 'Labor'),
        ('overhead', 'Overhead'),
        ('subcontractor', 'Subcontractor')
    ], string='Cost Type',
       required=True,
       default='material'
    )
    
    product_id = fields.Many2one(
        'product.product',
        string='Product',
        domain=[('type', 'in', ['product', 'consu'])]
    )
    
    description = fields.Char(
        string='Description',
        required=True
    )
    
    uom_id = fields.Many2one(
        'uom.uom',
        string='Unit of Measure'
    )
    
    # === Planned/Budget ===
    planned_qty = fields.Float(
        string='Planned Quantity',
        default=0.0,
        digits='Product Unit of Measure'
    )
    
    planned_unit_cost = fields.Float(
        string='Planned Unit Cost',
        default=0.0,
        digits='Product Price'
    )
    
    planned_total_cost = fields.Float(
        string='Planned Total Cost',
        compute='_compute_planned_total',
        store=True,
        digits='Product Price'
    )
    
    # === Actual ===
    actual_qty = fields.Float(
        string='Actual Quantity',
        compute='_compute_actual_qty',
        store=True,
        digits='Product Unit of Measure'
    )
    
    actual_unit_cost = fields.Float(
        string='Actual Unit Cost',
        compute='_compute_actual_cost',
        store=True,
        digits='Product Price'
    )
    
    actual_total_cost = fields.Float(
        string='Actual Total Cost',
        compute='_compute_actual_cost',
        store=True,
        digits='Product Price'
    )
    
    # === Variance ===
    variance_qty = fields.Float(
        string='Quantity Variance',
        compute='_compute_variance',
        store=True,
        digits='Product Unit of Measure'
    )
    
    variance_amount = fields.Float(
        string='Cost Variance',
        compute='_compute_variance',
        store=True,
        digits='Product Price'
    )
    
    variance_percent = fields.Float(
        string='Variance %',
        compute='_compute_variance',
        store=True
    )
    
    # === Related Records ===
    requisition_line_ids = fields.One2many(
        'material.requisition.line',
        'job_costing_line_id',
        string='Requisition Lines'
    )
    
    company_currency_id = fields.Many2one(
        'res.currency',
        related='job_id.company_currency_id',
        store=True
    )
    
    # === Onchange Methods ===
    @api.onchange('product_id')
    def _onchange_product_id(self):
        """Auto-fill description and UOM from product."""
        if self.product_id:
            self.description = self.product_id.display_name
            self.uom_id = self.product_id.uom_id.id
            self.planned_unit_cost = self.product_id.standard_price
    
    # === Compute Methods ===
    @api.depends('planned_qty', 'planned_unit_cost')
    def _compute_planned_total(self):
        for line in self:
            line.planned_total_cost = line.planned_qty * line.planned_unit_cost
    
    @api.depends('requisition_line_ids.quantity_delivered')
    def _compute_actual_qty(self):
        for line in self:
            line.actual_qty = sum(line.requisition_line_ids.mapped('quantity_delivered'))
    
    @api.depends('requisition_line_ids', 'actual_qty')
    def _compute_actual_cost(self):
        for line in self:
            total_cost = 0.0
            for req_line in line.requisition_line_ids:
                total_cost += req_line.quantity_delivered * req_line.delivered_unit_cost
            line.actual_total_cost = total_cost
            line.actual_unit_cost = line.actual_qty and (total_cost / line.actual_qty) or 0.0
    
    @api.depends('planned_qty', 'actual_qty', 'planned_total_cost', 'actual_total_cost')
    def _compute_variance(self):
        for line in self:
            line.variance_qty = line.planned_qty - line.actual_qty
            line.variance_amount = line.planned_total_cost - line.actual_total_cost
            if line.planned_total_cost > 0:
                line.variance_percent = (line.variance_amount / line.planned_total_cost) * 100
            else:
                line.variance_percent = 0.0
    
    # === Constraints ===
    @api.constrains('planned_qty', 'planned_unit_cost')
    def _check_planned_values(self):
        for line in self:
            if line.planned_qty < 0:
                raise ValidationError(_('Planned quantity cannot be negative!'))
            if line.planned_unit_cost < 0:
                raise ValidationError(_('Planned unit cost cannot be negative!'))
