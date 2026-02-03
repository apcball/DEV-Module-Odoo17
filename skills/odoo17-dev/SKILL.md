---
name: odoo17-dev
description: Comprehensive Odoo 17 development skill for building custom modules, including ORM patterns, view inheritance, security best practices, wizard development, and module structure. Use when creating or modifying Odoo 17 modules, models, views, security rules, wizards, reports, or any Odoo development tasks.
---

# Odoo 17 Development

Complete guide for developing Odoo 17 modules with best practices and patterns.

## Quick Start

### Module Structure
```
my_module/
├── __manifest__.py          # Module metadata
├── __init__.py              # Package init
├── models/
│   ├── __init__.py
│   └── *.py                 # Business logic
├── views/
│   └── *.xml                # UI definitions
├── security/
│   ├── ir.model.access.csv  # Access rights
│   └── security.xml         # Groups & rules
├── data/
│   └── *.xml                # Demo/initial data
├── wizard/
│   ├── __init__.py
│   └── *.py                 # Wizard logic
├── reports/
│   └── *.xml                # QWeb reports
└── static/
    └── description/
        └── index.html       # Module description
```

## Core Development Patterns

### 1. Model Development (ORM)

#### Basic Model Structure
```python
from odoo import models, fields, api, _
from odoo.exceptions import ValidationError, UserError

class MyModel(models.Model):
    _name = 'my.module.model'
    _description = 'My Model Description'
    _inherit = ['mail.thread', 'mail.activity.mixin']  # Optional
    _order = 'create_date desc'
    
    # Fields
    name = fields.Char(string='Name', required=True, tracking=True)
    state = fields.Selection([
        ('draft', 'Draft'),
        ('confirmed', 'Confirmed'),
        ('done', 'Done'),
    ], string='Status', default='draft', tracking=True)
    
    # Computed Fields
    total_amount = fields.Float(compute='_compute_total', store=True)
    
    # Relational Fields
    partner_id = fields.Many2one('res.partner', string='Customer')
    line_ids = fields.One2many('my.module.line', 'parent_id', string='Lines')
    tag_ids = fields.Many2many('my.module.tag', string='Tags')
    
    @api.depends('line_ids.amount')
    def _compute_total(self):
        for record in self:
            record.total_amount = sum(line.amount for line in record.line_ids)
    
    def action_confirm(self):
        for record in self:
            if record.state != 'draft':
                raise UserError(_('Only draft records can be confirmed.'))
            record.write({'state': 'confirmed'})
```

#### Important ORM Methods
- `create()` - Override to add custom logic on creation
- `write()` - Override to add custom logic on update
- `unlink()` - Override for deletion logic
- `copy()` - Override for duplication logic
- `search()` - Use with proper domain
- `browse()` - Get records by ID

#### Constraints & Validation
```python
@api.constrains('amount', 'quantity')
def _check_positive_values(self):
    for record in self:
        if record.amount < 0:
            raise ValidationError(_('Amount must be positive.'))

_sql_constraints = [
    ('unique_name', 'unique(name)', 'Name must be unique!'),
    ('check_amount', 'check(amount >= 0)', 'Amount cannot be negative!'),
]
```

### 2. View Development (XML)

#### Form View Best Practices
```xml
<record id="view_my_model_form" model="ir.ui.view">
    <field name="name">my.model.form</field>
    <field name="model">my.module.model</field>
    <field name="arch" type="xml">
        <form string="My Model">
            <header>
                <button name="action_confirm" string="Confirm" 
                        type="object" class="oe_highlight"
                        invisible="state != 'draft'"/>
                <field name="state" widget="statusbar" 
                       statusbar_visible="draft,confirmed,done"/>
            </header>
            <sheet>
                <div class="oe_title">
                    <h1><field name="name" placeholder="Name..."/></h1>
                </div>
                <group>
                    <group>
                        <field name="partner_id"/>
                        <field name="date"/>
                    </group>
                    <group>
                        <field name="amount" widget="monetary"/>
                        <field name="currency_id" invisible="1"/>
                    </group>
                </group>
                <notebook>
                    <page string="Lines" name="lines">
                        <field name="line_ids">
                            <tree editable="bottom">
                                <field name="product_id"/>
                                <field name="quantity"/>
                                <field name="price_unit"/>
                            </tree>
                        </field>
                    </page>
                </notebook>
            </sheet>
            <div class="oe_chatter">
                <field name="message_follower_ids"/>
                <field name="activity_ids"/>
                <field name="message_ids"/>
            </div>
        </form>
    </field>
</record>
```

#### Tree View with Decorations
```xml
<tree decoration-muted="state=='done'" 
      decoration-info="state=='draft'"
      decoration-warning="amount > 1000">
    <field name="name"/>
    <field name="amount" widget="monetary"/>
    <field name="state" widget="badge"/>
</tree>
```

#### View Inheritance
```xml
<!-- Add field after existing field -->
<record id="view_partner_form_inherit" model="ir.ui.view">
    <field name="name">res.partner.form.inherit</field>
    <field name="model">res.partner</field>
    <field name="inherit_id" ref="base.view_partner_form"/>
    <field name="arch" type="xml">
        <field name="vat" position="after">
            <field name="custom_field"/>
        </field>
        
        <!-- Replace attribute -->
        <field name="name" position="attributes">
            <attribute name="readonly">1</attribute>
        </field>
        
        <!-- Add before -->
        <xpath expr="//group[@name='sale']" position="before">
            <group string="Custom Info">
                <field name="custom_field"/>
            </group>
        </xpath>
    </field>
</record>
```

### 3. Security

#### Groups Definition
```xml
<record id="module_category_my_module" model="ir.module.category">
    <field name="name">My Module</field>
    <field name="sequence">50</field>
</record>

<record id="group_my_module_user" model="res.groups">
    <field name="name">User</field>
    <field name="category_id" ref="module_category_my_module"/>
    <field name="implied_ids" eval="[(4, ref('base.group_user'))]"/>
</record>

<record id="group_my_module_manager" model="res.groups">
    <field name="name">Manager</field>
    <field name="category_id" ref="module_category_my_module"/>
    <field name="implied_ids" eval="[(4, ref('group_my_module_user'))]"/>
</record>
```

#### Access Rights (ir.model.access.csv)
```csv
id,name,model_id:id,group_id:id,perm_read,perm_write,perm_create,perm_unlink
access_my_model_user,my.model.user,model_my_module_model,group_my_module_user,1,1,1,0
access_my_model_manager,my.model.manager,model_my_module_model,group_my_module_manager,1,1,1,1
```

#### Record Rules
```xml
<record id="my_model_company_rule" model="ir.rule">
    <field name="name">My Model: Multi-Company</field>
    <field name="model_id" ref="model_my_module_model"/>
    <field name="domain_force">[('company_id', 'in', company_ids)]</field>
    <field name="groups" eval="[(4, ref('group_my_module_user'))]"/>
</record>
```

### 4. Wizard Development

#### Two-Step Wizard Pattern
```python
class MyWizard(models.TransientModel):
    _name = 'my.module.wizard'
    _description = 'My Wizard'
    
    state = fields.Selection([
        ('selection', 'Selection'),
        ('preview', 'Preview'),
    ], default='selection')
    
    # Selection fields
    partner_id = fields.Many2one('res.partner')
    line_ids = fields.One2many('my.module.wizard.line', 'wizard_id')
    
    # Preview fields
    summary = fields.Text(compute='_compute_summary')
    
    def action_next(self):
        self.ensure_one()
        if self.state == 'selection':
            self._prepare_lines()
            self.state = 'preview'
            return {
                'type': 'ir.actions.act_window',
                'res_model': self._name,
                'res_id': self.id,
                'view_mode': 'form',
                'target': 'new',
            }
        else:
            return self.action_create()
    
    def action_create(self):
        # Create actual records
        return {'type': 'ir.actions.act_window_close'}
```

#### Wizard View with States
```xml
<form>
    <field name="state" invisible="1"/>
    
    <!-- Selection State -->
    <div invisible="state != 'selection'">
        <group>
            <field name="partner_id"/>
        </group>
        <field name="line_ids">
            <tree editable="bottom">
                <field name="product_id"/>
                <field name="quantity"/>
            </tree>
        </field>
    </div>
    
    <!-- Preview State -->
    <div invisible="state != 'preview'">
        <field name="summary"/>
    </div>
    
    <footer>
        <button name="action_next" string="Next" type="object" 
                class="oe_highlight" invisible="state != 'selection'"/>
        <button name="action_create" string="Create" type="object" 
                class="oe_highlight" invisible="state != 'preview'"/>
        <button string="Cancel" class="btn-secondary" special="cancel"/>
    </footer>
</form>
```

### 5. Best Practices

#### Performance
- Use `store=True` for computed fields that are searched/sorted
- Add database indexes on frequently queried fields
- Use `read_group()` for aggregations instead of Python loops
- Avoid `search()` inside loops

#### Error Handling
```python
try:
    result = super().create(vals)
except Exception as e:
    _logger.error("Error creating record: %s", str(e))
    raise UserError(_('Failed to create record: %s') % str(e))
```

#### Translation
```python
from odoo import _

# Always use _() for user-facing strings
raise UserError(_('This field is required.'))
name = fields.Char(string=_('Name'))
```

#### Logging
```python
import logging
_logger = logging.getLogger(__name__)

_logger.info("Processing %s records", len(records))
_logger.warning("Deprecated method called")
_logger.error("Failed to process: %s", str(e))
```

## Common Patterns

### Auto-Create Sequence
```python
@api.model_create_multi
def create(self, vals_list):
    for vals in vals_list:
        if vals.get('name', _('New')) == _('New'):
            vals['name'] = self.env['ir.sequence'].next_by_code('my.module') or _('New')
    return super().create(vals_list)
```

### Smart Buttons
```xml
<button name="%(action_purchase_orders)d" 
        type="action" 
        class="oe_stat_button" 
        icon="fa-shopping-cart">
    <field name="purchase_count" widget="statinfo" string="Purchases"/>
</button>
```

### Domain Filtering
```python
@api.onchange('partner_id')
def _onchange_partner(self):
    if self.partner_id:
        return {'domain': {'contact_id': [('parent_id', '=', self.partner_id.id)]}}
```

## References

For detailed information, see:
- `references/orm_patterns.md` - Advanced ORM patterns
- `references/view_widgets.md` - Available widgets and their usage
- `references/security_guide.md` - Complete security implementation
- `references/wizard_patterns.md` - Advanced wizard patterns
- `assets/module_template/` - Starter module template

## Quick Commands

Use scripts in `scripts/` directory:
- `scripts/create_model.py` - Generate model boilerplate
- `scripts/create_view.py` - Generate view XML
- `scripts/validate_module.py` - Check module structure