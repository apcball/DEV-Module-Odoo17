# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
from odoo.exceptions import ValidationError, UserError

import logging
_logger = logging.getLogger(__name__)


class {{CLASS_NAME}}(models.Model):
    _name = '{{MODULE_NAME}}.{{MODEL_NAME}}'
    _description = '{{DESCRIPTION}}'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'create_date desc'

    # Basic Fields
    name = fields.Char(
        string='Name',
        required=True,
        copy=False,
        readonly=True,
        default=lambda self: _('New'),
        tracking=True
    )
    
    state = fields.Selection([
        ('draft', 'Draft'),
        ('confirmed', 'Confirmed'),
        ('done', 'Done'),
    ], string='Status', default='draft', required=True, tracking=True)
    
    date = fields.Date(
        string='Date',
        default=fields.Date.context_today,
        tracking=True
    )
    
    # Relational Fields
    user_id = fields.Many2one(
        'res.users',
        string='Responsible',
        default=lambda self: self.env.user,
        tracking=True
    )
    
    company_id = fields.Many2one(
        'res.company',
        string='Company',
        required=True,
        default=lambda self: self.env.company,
        tracking=True
    )
    
    partner_id = fields.Many2one(
        'res.partner',
        string='Partner',
        tracking=True
    )
    
    # Computed Fields
    amount_total = fields.Float(
        string='Total Amount',
        compute='_compute_amount_total',
        store=True
    )
    
    line_ids = fields.One2many(
        '{{MODULE_NAME}}.{{MODEL_NAME}}.line',
        'parent_id',
        string='Lines'
    )
    
    # SQL Constraints
    _sql_constraints = [
        ('name_unique', 'unique(name)', 'Name must be unique!'),
    ]
    
    @api.depends('line_ids.amount')
    def _compute_amount_total(self):
        for record in self:
            record.amount_total = sum(line.amount for line in record.line_ids)
    
    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if vals.get('name', _('New')) == _('New'):
                vals['name'] = self.env['ir.sequence'].next_by_code('{{MODULE_NAME}}.{{MODEL_NAME}}') or _('New')
        return super({{CLASS_NAME}}, self).create(vals_list)
    
    def action_confirm(self):
        for record in self:
            if record.state != 'draft':
                raise UserError(_('Only draft records can be confirmed.'))
            record.write({'state': 'confirmed'})
        return True
    
    def action_done(self):
        for record in self:
            if record.state != 'confirmed':
                raise UserError(_('Only confirmed records can be marked as done.'))
            record.write({'state': 'done'})
        return True
    
    def action_reset_to_draft(self):
        for record in self:
            if record.state == 'done':
                raise UserError(_('Cannot reset done records.'))
            record.write({'state': 'draft'})
        return True


class {{CLASS_NAME}}Line(models.Model):
    _name = '{{MODULE_NAME}}.{{MODEL_NAME}}.line'
    _description = '{{DESCRIPTION}} Line'
    
    parent_id = fields.Many2one(
        '{{MODULE_NAME}}.{{MODEL_NAME}}',
        string='Parent',
        required=True,
        ondelete='cascade'
    )
    
    sequence = fields.Integer(string='Sequence', default=10)
    
    name = fields.Char(string='Description', required=True)
    
    product_id = fields.Many2one(
        'product.product',
        string='Product'
    )
    
    quantity = fields.Float(string='Quantity', default=1.0)
    
    unit_price = fields.Float(string='Unit Price', default=0.0)
    
    amount = fields.Float(
        string='Amount',
        compute='_compute_amount',
        store=True
    )
    
    @api.depends('quantity', 'unit_price')
    def _compute_amount(self):
        for line in self:
            line.amount = line.quantity * line.unit_price