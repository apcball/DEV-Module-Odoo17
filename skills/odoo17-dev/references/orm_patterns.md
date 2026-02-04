# Advanced ORM Patterns for Odoo 17

## Computed Fields Patterns

### Computed with Store and Search
```python
amount_total = fields.Float(
    compute='_compute_amount_total',
    store=True,
    search='_search_amount_total'
)

def _compute_amount_total(self):
    for record in self:
        record.amount_total = sum(line.subtotal for line in record.line_ids)

def _search_amount_total(self, operator, value):
    return [('line_ids.subtotal', operator, value)]
```

### Inverse Function (Editable Computed)
```python
total = fields.Float(
    compute='_compute_total',
    inverse='_set_total'
)

def _compute_total(self):
    for record in self:
        record.total = record.subtotal + record.tax

def _set_total(self):
    for record in self:
        record.tax = record.total - record.subtotal
```

## Batch Operations

### Efficient Bulk Updates
```python
def action_confirm_all(self):
    """Confirm multiple records efficiently"""
    # Don't search inside loop
    records = self.search([('state', '=', 'draft')])
    
    # Use write with sudo for performance
    records.sudo().write({'state': 'confirmed'})
    
    # Post messages in batch
    for record in records:
        record.message_post(body=_("Confirmed in batch"))
```

### Read Group for Aggregations
```python
def get_summary_by_partner(self):
    """Get aggregated data by partner"""
    result = self.read_group(
        domain=[('state', '=', 'confirmed')],
        fields=['amount:sum', 'partner_id'],
        groupby=['partner_id']
    )
    return result
```

## Advanced Relationships

### Polymorphic Inheritance
```python
class Document(models.Model):
    _name = 'my.document'
    
    res_model = fields.Char('Resource Model')
    res_id = fields.Integer('Resource ID')
    
    def get_record(self):
        self.ensure_one()
        return self.env[self.res_model].browse(self.res_id)
```

### Delegation Inheritance
```python
class CustomPartner(models.Model):
    _name = 'my.custom.partner'
    _inherits = {'res.partner': 'partner_id'}
    
    partner_id = fields.Many2one('res.partner', required=True, ondelete='cascade')
    custom_field = fields.Char('Custom Field')
```

## Cache Management

### Proper Cache Invalidation
```python
@api.depends('line_ids.amount', 'line_ids.quantity')
def _compute_total(self):
    for record in self:
        record.total = sum(line.amount * line.quantity for line in record.line_ids)

# Force recompute
def action_refresh(self):
    self.invalidate_recordset(['total'])
    self._compute_total()
```

## Context Usage

### Proper Context Handling
```python
def create_invoice(self):
    self.ensure_one()
    invoice_vals = {
        'partner_id': self.partner_id.id,
        'invoice_line_ids': [(0, 0, {
            'name': self.name,
            'quantity': 1,
            'price_unit': self.amount,
        })],
    }
    # Use with_context to set default values
    invoice = self.env['account.move'].with_context(
        default_move_type='out_invoice'
    ).create(invoice_vals)
    return invoice
```

## Error Handling Patterns

### Validation with Context
```python
@api.constrains('amount')
def _check_amount(self):
    if self.env.context.get('skip_amount_check'):
        return
    for record in self:
        if record.amount < 0:
            raise ValidationError(_('Amount must be positive'))

# Call with context to skip
def action_import(self):
    record.with_context(skip_amount_check=True).write({'amount': -100})
```

### Transaction Management
```python
def action_process_with_rollback(self):
    """Process with automatic rollback on error"""
    try:
        with self.env.cr.savepoint():
            self._process_step_1()
            self._process_step_2()
    except Exception as e:
        _logger.error("Processing failed: %s", e)
        raise UserError(_('Processing failed. No changes were saved.'))
```