# Odoo 17 Security Best Practices

## Security Layers

Odoo has multiple security layers:
1. **Access Control** (ACL) - Who can CRUD records
2. **Record Rules** - Which records can be accessed
3. **Field Level Security** - Which fields are visible/editable
4. **Button/View Security** - UI elements visibility

## Creating Security Groups

### Category Definition
```xml
<record id="module_category_my_module" model="ir.module.category">
    <field name="name">My Module</field>
    <field name="description">Manage My Module operations</field>
    <field name="sequence">50</field>
</record>
```

### Group Hierarchy
```xml
<!-- Base User -->
<record id="group_my_module_user" model="res.groups">
    <field name="name">User</field>
    <field name="category_id" ref="module_category_my_module"/>
    <field name="implied_ids" eval="[(4, ref('base.group_user'))]"/>
    <field name="comment">Basic user with read/write access to own records.</field>
</record>

<!-- Manager (inherits from User) -->
<record id="group_my_module_manager" model="res.groups">
    <field name="name">Manager</field>
    <field name="category_id" ref="module_category_my_module"/>
    <field name="implied_ids" eval="[(4, ref('group_my_module_user'))]"/>
    <field name="users" eval="[(4, ref('base.user_root'))]"/>
    <field name="comment">Full access including configuration and all records.</field>
</record>

<!-- Administrator -->
<record id="group_my_module_admin" model="res.groups">
    <field name="name">Administrator</field>
    <field name="category_id" ref="module_category_my_module"/>
    <field name="implied_ids" eval="[(4, ref('group_my_module_manager'))]"/>
    <field name="users" eval="[(4, ref('base.user_root')), (4, ref('base.user_admin'))]"/>
</record>
```

## Access Rights (ACL)

### CSV Format
```csv
id,name,model_id:id,group_id:id,perm_read,perm_write,perm_create,perm_unlink
access_my_model_user,my.model.user,model_my_module_my_model,group_my_module_user,1,1,1,0
access_my_model_manager,my.model.manager,model_my_module_my_model,group_my_module_manager,1,1,1,1
access_my_line_user,my.line.user,model_my_module_my_line,group_my_module_user,1,1,1,0
access_my_line_manager,my.line.manager,model_my_module_my_line,group_my_module_manager,1,1,1,1
```

### Best Practices
- Always specify explicit groups (never use blank group for production)
- Keep ACL simple - use record rules for complex access
- Document which group gets what access

## Record Rules

### Basic Record Rule
```xml
<record id="my_model_own_rule" model="ir.rule">
    <field name="name">My Model: Own Records</field>
    <field name="model_id" ref="model_my_module_my_model"/>
    <field name="domain_force">[('user_id', '=', user.id)]</field>
    <field name="groups" eval="[(4, ref('group_my_module_user'))]"/>
    <field name="perm_read" eval="True"/>
    <field name="perm_write" eval="True"/>
    <field name="perm_create" eval="True"/>
    <field name="perm_unlink" eval="True"/>
</record>
```

### Multi-Company Rule
```xml
<record id="my_model_company_rule" model="ir.rule">
    <field name="name">My Model: Multi-Company</field>
    <field name="model_id" ref="model_my_module_my_model"/>
    <field name="domain_force">[('company_id', 'in', company_ids)]</field>
    <field name="groups" eval="[(4, ref('group_my_module_user'))]"/>
</record>
```

### Global Rule (No Groups)
```xml
<record id="my_model_active_rule" model="ir.rule">
    <field name="name">My Model: Hide Inactive</field>
    <field name="model_id" ref="model_my_module_my_model"/>
    <field name="domain_force">['|', ('active', '=', True), ('active', '=', False)]</field>
    <field name="groups" eval="[]"/>
    <field name="global" eval="True"/>
</record>
```

### Rule with ORM Methods
```xml
<record id="my_model_manager_all_rule" model="ir.rule">
    <field name="name">My Model: Manager Access All</field>
    <field name="model_id" ref="model_my_module_my_model"/>
    <field name="domain_force">[(1, '=', 1)]</field>
    <field name="groups" eval="[(4, ref('group_my_module_manager'))]"/>
</record>
```

## View Security

### Group-Based Visibility
```xml
<field name="sensitive_field" 
       groups="my_module.group_manager"/>

<button name="action_approve" 
        string="Approve"
        type="object"
        groups="my_module.group_manager"/>

<page string="Configuration" 
      groups="my_module.group_admin">
    <field name="config_field"/>
</page>
```

### Invisible with Groups
```xml
<field name="internal_note" 
       invisible="not context.get('is_admin')"/>
```

## Field-Level Security

### Read-Only Fields
```python
class MyModel(models.Model):
    _name = 'my.module.model'
    
    computed_field = fields.Char(
        compute='_compute_field',
        readonly=True  # Always computed
    )
    
    state_field = fields.Char(
        states={
            'confirmed': [('readonly', True)],
            'done': [('readonly', True)],
        }
    )
```

### Groups on Fields
```python
sensitive_data = fields.Char(
    groups='my_module.group_manager'
)
```

## Security Testing

### Check Access Rights
```python
def test_access_rights(self):
    # Check if user has access
    self.env['my.model'].check_access_rights('read')
    self.env['my.model'].check_access_rights('write')
    
    # Check record rules
    self.env['my.model'].check_access_rule('read')
```

### Bypass Security (for automated actions)
```python
def action_admin_operation(self):
    # Use sudo() to bypass all security
    records = self.env['my.model'].sudo().search([...])
    records.write({...})
```

## Common Security Patterns

### Self-Service Records
```xml
<!-- Rule: Users can only see their own records -->
<record id="rule_own_records" model="ir.rule">
    <field name="domain_force">[('user_id', '=', user.id)]</field>
    <field name="groups" eval="[(4, ref('base.group_user'))]"/>
</record>

<!-- Manager sees all -->
<record id="rule_all_records" model="ir.rule">
    <field name="domain_force">[(1, '=', 1)]</field>
    <field name="groups" eval="[(4, ref('group_manager'))]"/>
</record>
```

### Approval Workflow Security
```xml
<!-- Draft records editable by users -->
<record id="rule_draft_editable" model="ir.rule">
    <field name="domain_force">[('state', '=', 'draft')]</field>
    <field name="groups" eval="[(4, ref('group_user'))]"/>
    <field name="perm_write" eval="True"/>
    <field name="perm_unlink" eval="True"/>
</record>

<!-- Confirmed records read-only for users -->
<record id="rule_confirmed_readonly" model="ir.rule">
    <field name="domain_force">[('state', '!=', 'draft')]</field>
    <field name="groups" eval="[(4, ref('group_user'))]"/>
    <field name="perm_write" eval="False"/>
    <field name="perm_unlink" eval="False"/>
</record>
```