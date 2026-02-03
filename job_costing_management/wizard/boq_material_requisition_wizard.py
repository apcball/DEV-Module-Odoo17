# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
from odoo.exceptions import ValidationError


class BOQMaterialRequisitionWizard(models.TransientModel):
    _name = 'boq.material.requisition.wizard'
    _description = 'BOQ Material Requisition Wizard'

    boq_id = fields.Many2one('boq.boq', string='BOQ', required=True)
    project_id = fields.Many2one('project.project', string='Project', related='boq_id.project_id', readonly=True)
    job_order_id = fields.Many2one('job.order', string='Job Order', related='boq_id.job_order_id', readonly=True)
    job_cost_sheet_id = fields.Many2one('job.cost.sheet', string='Job Cost Sheet', related='boq_id.job_cost_sheet_id', readonly=True)
    
    # Requisition details
    purpose = fields.Text(string='Purpose/Reason', required=True)
    required_date = fields.Date(string='Required Date', required=True, default=fields.Date.today)
    priority = fields.Selection([
        ('low', 'Low'),
        ('normal', 'Normal'),
        ('high', 'High'),
        ('urgent', 'Urgent')
    ], string='Priority', default='normal')
    
    # Wizard State - Controls which view is shown
    wizard_state = fields.Selection([
        ('selection', 'Material Selection'),
        ('preview', 'Preview & Confirm')
    ], string='Wizard State', default='selection', required=True)
    
    # Search and Filter Fields
    search_term = fields.Char(string='Search Products', placeholder='Search by name or code...')
    category_filter = fields.Many2one('boq.category', string='Filter by BOQ Category')
    product_category_filter = fields.Many2one('product.category', string='Filter by Product Category')
    cost_type_filter = fields.Selection([
        ('material', 'Material'),
        ('labor', 'Labor'),
        ('overhead', 'Overhead'),
        ('all', 'All Types')
    ], string='Filter by Cost Type', default='material')
    
    # Lines - All BOQ lines available for selection
    line_ids = fields.One2many('boq.material.requisition.wizard.line', 'wizard_id', string='BOQ Lines')
    
    # Filtered lines (computed for display)
    filtered_line_ids = fields.One2many('boq.material.requisition.wizard.line', 'wizard_id', 
                                        string='Filtered BOQ Lines',
                                        compute='_compute_filtered_lines',
                                        readonly=True)
    
    # Summary Statistics
    total_lines_count = fields.Integer(string='Total Lines', compute='_compute_statistics', readonly=True)
    selected_lines_count = fields.Integer(string='Selected Lines', compute='_compute_statistics', readonly=True)
    selected_total_quantity = fields.Float(string='Total Requested Quantity', compute='_compute_statistics', readonly=True)
    selected_total_cost = fields.Float(string='Total Estimated Cost', compute='_compute_statistics', readonly=True, 
                                       currency_field='currency_id')
    
    # Currency for cost display
    currency_id = fields.Many2one('res.currency', string='Currency', 
                                 default=lambda self: self.env.company.currency_id)
    
    # Group by options
    group_by = fields.Selection([
        ('none', 'No Grouping'),
        ('category', 'Group by BOQ Category'),
        ('product_category', 'Group by Product Category')
    ], string='Group By', default='category')
    
    # Available categories for quick select
    available_category_ids = fields.Many2many('boq.category', string='Available Categories', 
                                             compute='_compute_available_categories')
    
    @api.depends('line_ids', 'line_ids.selected')
    def _compute_statistics(self):
        for record in self:
            record.total_lines_count = len(record.line_ids)
            selected_lines = record.line_ids.filtered('selected')
            record.selected_lines_count = len(selected_lines)
            record.selected_total_quantity = sum(selected_lines.mapped('requested_quantity'))
            record.selected_total_cost = sum(selected_lines.mapped('total_cost'))
    
    @api.depends('line_ids', 'search_term', 'category_filter', 'product_category_filter', 
                 'cost_type_filter', 'group_by')
    def _compute_filtered_lines(self):
        for record in self:
            lines = record.line_ids
            
            # Apply search term filter
            if record.search_term:
                search_lower = record.search_term.lower()
                lines = lines.filtered(lambda l: 
                    search_lower in (l.product_id.name or '').lower() or
                    search_lower in (l.product_id.default_code or '').lower() or
                    search_lower in (l.description or '').lower()
                )
            
            # Apply BOQ category filter
            if record.category_filter:
                lines = lines.filtered(lambda l: l.boq_line_id.category_id == record.category_filter)
            
            # Apply product category filter
            if record.product_category_filter:
                lines = lines.filtered(lambda l: l.product_id.categ_id == record.product_category_filter)
            
            # Apply cost type filter (currently only material is supported)
            if record.cost_type_filter == 'material':
                # All lines have products, so keep all
                pass
            
            # Store result - this is a workaround since we can't actually filter One2many
            # The view will handle display ordering via context
            record.filtered_line_ids = lines
    
    @api.depends('boq_id')
    def _compute_available_categories(self):
        for record in self:
            if record.boq_id:
                record.available_category_ids = record.boq_id.category_ids
            else:
                record.available_category_ids = False
    
    @api.model
    def default_get(self, fields_list):
        """Set default values including BOQ lines with remaining quantities"""
        res = super().default_get(fields_list)
        
        # Get BOQ from context
        boq_id = self.env.context.get('active_id')
        if boq_id and self.env.context.get('active_model') == 'boq.boq':
            boq = self.env['boq.boq'].browse(boq_id)
            res['boq_id'] = boq_id
            res['purpose'] = f'Material requisition from BOQ: {boq.name}'
            
            # Check if BOQ has any lines
            if not boq.line_ids:
                raise ValidationError(_('The selected BOQ has no lines. Please add BOQ lines before creating a material requisition.'))
            
            # Get BOQ lines with products and remaining quantities
            lines_with_products = boq.line_ids.filtered(lambda l: l.product_id)
            if not lines_with_products:
                raise ValidationError(_('The selected BOQ has no lines with products assigned. Please assign products to BOQ lines before creating a material requisition.'))
            
            lines_with_remaining = lines_with_products.filtered(lambda l: l.remaining_qty > 0)
            if not lines_with_remaining:
                raise ValidationError(_(
                    'All BOQ lines with products have been fully requisitioned. No remaining quantities available for requisition.\n\n'
                    'BOQ lines with products: %d\n'
                    'Lines fully requisitioned: %d'
                ) % (len(lines_with_products), len(lines_with_products)))
            
            line_vals = []
            for line in lines_with_remaining:
                # Ensure we have all required data
                if not line.product_id:
                    continue  # Skip lines without products
                
                line_vals.append((0, 0, {
                    'boq_line_id': line.id,
                    'product_id': line.product_id.id,
                    'description': line.description or line.product_id.name,
                    'boq_quantity': line.adjusted_quantity,
                    'requisitioned_quantity': line.total_requisitioned_qty,
                    'remaining_quantity': line.remaining_qty,
                    'requested_quantity': line.remaining_qty,  # Default to remaining quantity
                    'uom_id': line.uom_id.id if line.uom_id else line.product_id.uom_id.id,
                    'estimated_cost': line.unit_cost,
                    'category_id': line.category_id.id if line.category_id else False,
                    'product_category_id': line.product_id.categ_id.id if line.product_id.categ_id else False,
                    'selected': False,  # Do not select by default
                }))
            
            if not line_vals:
                raise ValidationError(_('No valid BOQ lines found for requisition creation. Please ensure BOQ lines have products and remaining quantities.'))
            
            res['line_ids'] = line_vals
        
        return res
    
    def action_select_all(self):
        """Select all filtered lines"""
        self.ensure_one()
        # Select all lines that match current filters
        for line in self.line_ids:
            line.selected = True
        return {'type': 'ir.actions.act_window_close'}
    
    def action_deselect_all(self):
        """Deselect all lines"""
        self.ensure_one()
        self.line_ids.write({'selected': False})
        return {'type': 'ir.actions.act_window_close'}
    
    def action_select_by_category(self, category_id=None):
        """Select all lines in a specific category"""
        self.ensure_one()
        if category_id:
            lines = self.line_ids.filtered(lambda l: l.category_id.id == category_id)
            lines.write({'selected': True})
        return {'type': 'ir.actions.act_window_close'}
    
    def action_clear_filters(self):
        """Clear all search filters"""
        self.ensure_one()
        self.search_term = False
        self.category_filter = False
        self.product_category_filter = False
        self.cost_type_filter = 'material'
        return {'type': 'ir.actions.act_window_close'}
    
    def action_go_to_preview(self):
        """Move to preview state"""
        self.ensure_one()
        
        # Validate that at least one line is selected
        selected_lines = self.line_ids.filtered('selected')
        if not selected_lines:
            raise ValidationError(_('Please select at least one BOQ line to create requisition.'))
        
        # Check for invalid quantities
        invalid_lines = selected_lines.filtered(lambda l: l.requested_quantity <= 0)
        if invalid_lines:
            raise ValidationError(_('Requested quantity must be greater than zero for all selected lines.'))
        
        # Check for lines exceeding remaining quantity
        exceeding_lines = selected_lines.filtered(lambda l: l.requested_quantity > l.remaining_quantity)
        if exceeding_lines:
            # Just warn, don't block - user can proceed if needed
            pass
        
        self.wizard_state = 'preview'
        return {
            'type': 'ir.actions.act_window',
            'res_model': self._name,
            'res_id': self.id,
            'view_mode': 'form',
            'target': 'new',
            'context': self.env.context,
        }
    
    def action_go_back_to_selection(self):
        """Go back to selection state"""
        self.ensure_one()
        self.wizard_state = 'selection'
        return {
            'type': 'ir.actions.act_window',
            'res_model': self._name,
            'res_id': self.id,
            'view_mode': 'form',
            'target': 'new',
            'context': self.env.context,
        }
    
    def action_create_requisition(self):
        """Create material requisition from selected lines"""
        self.ensure_one()
        selected_lines = self.line_ids.filtered('selected')
        
        if not selected_lines:
            raise ValidationError(_('Please select at least one BOQ line to create requisition.'))
        
        # Check for lines with zero or negative quantities
        invalid_lines = selected_lines.filtered(lambda l: l.requested_quantity <= 0)
        if invalid_lines:
            raise ValidationError(_('Requested quantity must be greater than zero for all selected lines.'))
        
        # Validate selected lines have required data
        lines_missing_product = selected_lines.filtered(lambda l: not l.product_id)
        if lines_missing_product:
            raise ValidationError(_('The following lines are missing products and cannot be processed:\n%s') % 
                                '\n'.join([f'- {line.description}' for line in lines_missing_product]))
        
        lines_missing_uom = selected_lines.filtered(lambda l: not l.uom_id)
        if lines_missing_uom:
            raise ValidationError(_('The following lines are missing unit of measure and cannot be processed:\n%s') % 
                                '\n'.join([f'- {line.description}' for line in lines_missing_uom]))
        
        # Create material requisition
        requisition_vals = {
            'project_id': self.project_id.id,
            'job_order_id': self.job_order_id.id if self.job_order_id else False,
            'job_cost_sheet_id': self.job_cost_sheet_id.id if self.job_cost_sheet_id else False,
            'boq_id': self.boq_id.id,
            'purpose': self.purpose,
            'required_date': self.required_date,
            'priority': self.priority,
            'line_ids': []
        }
        
        for line in selected_lines:
            # Find the corresponding job cost line for this BOQ line
            job_cost_line = False
            if line.boq_line_id.cost_line_ids:
                job_cost_line = line.boq_line_id.cost_line_ids[0]
            
            req_line_vals = {
                'product_id': line.product_id.id,
                'description': line.description,
                'quantity': line.requested_quantity,
                'uom_id': line.uom_id.id,
                'estimated_cost': line.estimated_cost,
                'boq_line_id': line.boq_line_id.id,
                'job_cost_line_id': job_cost_line.id if job_cost_line else False,
            }
            requisition_vals['line_ids'].append((0, 0, req_line_vals))
        
        requisition = self.env['material.requisition'].create(requisition_vals)
        
        return {
            'name': _('Material Requisition'),
            'type': 'ir.actions.act_window',
            'res_model': 'material.requisition',
            'view_mode': 'form',
            'res_id': requisition.id,
            'target': 'current',
        }


class BOQMaterialRequisitionWizardLine(models.TransientModel):
    _name = 'boq.material.requisition.wizard.line'
    _description = 'BOQ Material Requisition Wizard Line'
    _order = 'category_sequence, sequence, id'

    wizard_id = fields.Many2one('boq.material.requisition.wizard', string='Wizard', required=True, ondelete='cascade')
    selected = fields.Boolean(string='Select', default=False)
    
    # Sequence for ordering
    sequence = fields.Integer(string='Sequence', default=10)
    category_sequence = fields.Integer(string='Category Sequence', default=10, 
                                      compute='_compute_category_sequence', store=True)
    
    # BOQ line information
    boq_line_id = fields.Many2one('boq.line', string='BOQ Line', required=True)
    product_id = fields.Many2one('product.product', string='Product', required=False)
    description = fields.Text(string='Description', required=True)
    uom_id = fields.Many2one('uom.uom', string='Unit of Measure', required=False)
    estimated_cost = fields.Float(string='Estimated Unit Cost')
    
    # Category information for grouping
    category_id = fields.Many2one('boq.category', string='BOQ Category')
    category_name = fields.Char(string='Category Name', related='category_id.name', readonly=True, store=True)
    product_category_id = fields.Many2one('product.category', string='Product Category')
    product_category_name = fields.Char(string='Product Category Name', related='product_category_id.name', readonly=True, store=True)
    
    # Quantity tracking
    boq_quantity = fields.Float(string='BOQ Quantity', readonly=True)
    requisitioned_quantity = fields.Float(string='Already Requisitioned', readonly=True)
    remaining_quantity = fields.Float(string='Remaining Quantity', readonly=True)
    requested_quantity = fields.Float(string='Requested Quantity', required=True)
    
    # Computed fields
    total_cost = fields.Float(string='Total Cost', compute='_compute_total_cost')
    quantity_status = fields.Selection([
        ('within', 'Within BOQ'),
        ('exceed', 'Exceeds BOQ'),
        ('complete', 'Fully Requisitioned')
    ], string='Status', compute='_compute_quantity_status')
    
    # Display flags
    has_warning = fields.Boolean(string='Has Warning', compute='_compute_quantity_status', store=False)
    
    @api.depends('category_id', 'category_id.sequence')
    def _compute_category_sequence(self):
        for record in self:
            record.category_sequence = record.category_id.sequence if record.category_id else 999
    
    @api.depends('requested_quantity', 'estimated_cost')
    def _compute_total_cost(self):
        for record in self:
            record.total_cost = record.requested_quantity * record.estimated_cost
    
    @api.depends('requested_quantity', 'remaining_quantity')
    def _compute_quantity_status(self):
        for record in self:
            if record.remaining_quantity <= 0:
                record.quantity_status = 'complete'
                record.has_warning = False
            elif record.requested_quantity > record.remaining_quantity:
                record.quantity_status = 'exceed'
                record.has_warning = True
            else:
                record.quantity_status = 'within'
                record.has_warning = False
    
    @api.onchange('boq_line_id')
    def _onchange_boq_line_id(self):
        """Update fields when BOQ line changes"""
        if self.boq_line_id:
            self.product_id = self.boq_line_id.product_id
            self.description = self.boq_line_id.description or (self.boq_line_id.product_id.name if self.boq_line_id.product_id else '')
            self.uom_id = self.boq_line_id.uom_id or (self.boq_line_id.product_id.uom_id if self.boq_line_id.product_id else False)
            self.estimated_cost = self.boq_line_id.unit_cost
            self.boq_quantity = self.boq_line_id.adjusted_quantity
            self.requisitioned_quantity = self.boq_line_id.total_requisitioned_qty
            self.remaining_quantity = self.boq_line_id.remaining_qty
            self.requested_quantity = self.boq_line_id.remaining_qty
            self.category_id = self.boq_line_id.category_id
            if self.boq_line_id.product_id:
                self.product_category_id = self.boq_line_id.product_id.categ_id
    
    @api.constrains('requested_quantity')
    def _check_requested_quantity(self):
        """Validate requested quantity"""
        for record in self:
            if record.requested_quantity < 0:
                raise ValidationError(_('Requested quantity cannot be negative for line: %s') % record.description)
    
    @api.constrains('product_id', 'selected')
    def _check_selected_line_data(self):
        """Ensure selected lines have required data"""
        for record in self:
            if record.selected:
                if not record.product_id:
                    raise ValidationError(_('Selected line "%s" must have a product assigned.') % record.description)
                if not record.uom_id:
                    raise ValidationError(_('Selected line "%s" must have a unit of measure.') % record.description)
    
    @api.onchange('requested_quantity')
    def _onchange_requested_quantity(self):
        """Show warning when requested quantity exceeds remaining quantity"""
        if self.requested_quantity and self.remaining_quantity:
            if self.requested_quantity > self.remaining_quantity:
                warning_msg = _(
                    'Warning: Requested quantity (%s %s) exceeds remaining BOQ quantity (%s %s).\n'
                    'You can still proceed if needed.'
                ) % (
                    self.requested_quantity, self.uom_id.name or '',
                    self.remaining_quantity, self.uom_id.name or ''
                )
                
                return {
                    'warning': {
                        'title': _('BOQ Quantity Exceeded'),
                        'message': warning_msg
                    }
                }