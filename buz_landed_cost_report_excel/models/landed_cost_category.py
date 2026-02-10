# -*- coding: utf-8 -*-

from odoo import models, fields, api, _


class LandedCostCategory(models.Model):
    """
    Landed Cost Category Model
    
    This model stores predefined landed cost type categories for classification
    and column mapping in the landed cost report.
    
    Categories determine which column (Landed 1-8, Tax, or Transit) the cost
    will appear in when generating the report.
    """
    _name = 'landed.cost.category'
    _description = 'Landed Cost Category'
    _order = 'sequence, name'
    
    # Basic Fields
    name = fields.Char(
        string='Category Name',
        required=True,
        translate=True,
        help='Display name for the category (e.g., Freight, Customs Duty, Insurance)'
    )
    
    code = fields.Char(
        string='Category Code',
        required=True,
        help='Unique code for the category (e.g., FREIGHT, CUSTOMS, INSURANCE)'
    )
    
    sequence = fields.Integer(
        string='Sequence',
        default=10,
        help='Display order. Determines column order: Landed 1, 2, 3... (1-8)'
    )
    
    # Special Column Flags
    is_transit = fields.Boolean(
        string='Is Transit',
        default=False,
        help='If True, costs of this category will be shown in the Transit column instead of Landed N'
    )
    
    is_tax = fields.Boolean(
        string='Is Tax',
        default=False,
        help='If True, costs of this category will be shown in the Tax column instead of Landed N'
    )
    
    # Status and Display
    active = fields.Boolean(
        string='Active',
        default=True,
        help='Active/Archived status'
    )
    
    color = fields.Integer(
        string='Color Index',
        help='Color index for kanban views'
    )
    
    description = fields.Text(
        string='Description',
        translate=True,
        help='Detailed description of the category'
    )
    
    # Relationships
    product_ids = fields.Many2many(
        'product.template',
        'landed_cost_category_product_rel',
        'category_id',
        'product_id',
        string='Service Products',
        domain=[('landed_cost_ok', '=', True)],
        help='Service products associated with this category'
    )
    
    product_count = fields.Integer(
        string='Product Count',
        compute='_compute_product_count',
        store=True
    )
    
    # SQL Constraints
    _sql_constraints = [
        ('unique_code', 'unique(code)', _('Category code must be unique!')),
        ('unique_name', 'unique(name)', _('Category name must be unique!')),
    ]
    
    @api.depends('product_ids')
    def _compute_product_count(self):
        """Compute the number of products associated with this category."""
        for category in self:
            category.product_count = len(category.product_ids)
    
    @api.constrains('is_transit', 'is_tax', 'sequence')
    def _check_column_assignment(self):
        """
        Ensure a category is not assigned to multiple special columns.
        """
        for category in self:
            if category.is_transit and category.is_tax:
                raise models.ValidationError(_(
                    'A category cannot be both Transit and Tax. Please select only one.'
                ))
            if (category.is_transit or category.is_tax) and category.sequence > 0:
                # Warn if sequence is set but category is marked as transit/tax
                # This is not an error, just suboptimal configuration
                pass
    
    def name_get(self):
        """Display name with code for clarity."""
        result = []
        for category in self:
            name = f"[{category.code}] {category.name}"
            if category.is_transit:
                name += _(' (Transit)')
            elif category.is_tax:
                name += _(' (Tax)')
            result.append((category.id, name))
        return result


class ProductTemplate(models.Model):
    """Extend product.template to add landed cost category relationship."""
    _inherit = 'product.template'
    
    landed_cost_category_ids = fields.Many2many(
        'landed.cost.category',
        'landed_cost_category_product_rel',
        'product_id',
        'category_id',
        string='Landed Cost Categories',
        help='Categories this landed cost product belongs to. Determines column placement in report.'
    )
    
    category_count = fields.Integer(
        string='Category Count',
        compute='_compute_category_count'
    )
    
    def _compute_category_count(self):
        """Compute the number of categories for this product."""
        for product in self:
            product.category_count = len(product.landed_cost_category_ids)