# Odoo 17 XML View Attributes Guide

## ⚠️ CORE PRINCIPLES

1. **Odoo 17 uses expression-based attributes**
2. **`attrs` and `states` are DEPRECATED** - must NOT be used
3. **Conditions are written as Python-like expressions**
4. **XML must remain valid and escaped when needed** (`<` → `&lt;`)

---

## ✅ ALLOWED ATTRIBUTES (Odoo 17)

### string
```xml
<field name="field_name" string="Label"/>
```

### readonly
```xml
<field name="field_name" readonly="1"/>
<field name="field_name" readonly="state != 'draft'"/>
```

### required
```xml
<field name="field_name" required="1"/>
```

### invisible
```xml
<field name="field_name" invisible="state == 'done'"/>
<field name="field_name" invisible="not user_has_group('base.group_system')"/>
```

### domain
```xml
<field name="partner_id" domain="[('is_company', '=', True)]"/>
```

### context
```xml
<field name="partner_id" context="{'default_is_company': True}"/>
```

### options
```xml
<field name="partner_id" options="{'no_create': True, 'no_open': True}"/>
```

### widget
```xml
<field name="amount_total" widget="monetary"/>
<field name="progress" widget="progressbar"/>
```

### groups
```xml
<field name="field_name" groups="base.group_system"/>
```

---

## ❌ DEPRECATED ATTRIBUTES (FORBIDDEN)

### attrs - DO NOT USE
```xml
<!-- ❌ WRONG -->
<field name="x" attrs="{'invisible':[('state','=','done')]}">

<!-- ✅ CORRECT -->
<field name="x" invisible="state == 'done'">
```

### states - DO NOT USE
```xml
<!-- ❌ WRONG -->
<field name="x" states="draft">

<!-- ✅ CORRECT -->
<field name="x" readonly="state != 'draft'">
```

---

## 🔄 REPLACEMENT RULES

| Deprecated | Replacement |
|------------|-------------|
| `attrs` | `invisible` / `readonly` expressions |
| `states` | `readonly` / `invisible` expressions |

---

## 🎯 BEST PRACTICE EXAMPLE

```xml
<field name="discount" 
       string="Discount %"
       invisible="state == 'done'"
       readonly="amount_total &lt; 1000"
       groups="sales_team.group_sale_salesman"/>
```

---

## ✅ VALIDATION RULES FOR AI

- [ ] **NEVER** generate `attrs`
- [ ] **NEVER** generate `states`
- [ ] **ALWAYS** prefer expression-based logic
- [ ] **ALWAYS** escape XML operators (`<`, `>`)
- [ ] Assume Odoo version = 17 unless specified

---

## 📋 COMMON PATTERNS

### Button with Conditions
```xml
<!-- Odoo 17 Style -->
<button name="action_confirm" 
        string="Confirm"
        type="object"
        class="oe_highlight"
        invisible="state != 'draft'"/>
```

### Field Visibility by State
```xml
<!-- Multiple conditions -->
<field name="cancel_reason" 
       invisible="state != 'cancelled'"
       required="state == 'cancelled'"/>
```

### Group-based Visibility
```xml
<field name="cost_price" 
       invisible="not user_has_group('stock.group_stock_manager')"/>
```

### Computed Visibility
```xml
<field name="delivery_date" 
       invisible="not partner_id or state == 'done'"/>
```

---

## ⚠️ XML ESCAPING

When using comparison operators in expressions:

| Operator | XML Escape | Example |
|----------|------------|---------|
| `<` | `&lt;` | `amount &lt; 1000` |
| `>` | `&gt;` | `amount &gt; 100` |
| `<=` | `&lt;=` | `qty &lt;= 10` |
| `>=` | `&gt;=` | `qty &gt;= 5` |

---

## 🔍 MIGRATION FROM Odoo 16 → 17

### Before (Odoo 16)
```xml
<field name="amount" 
       attrs="{'invisible': [('state', '=', 'done')], 
               'readonly': [('state', '!=', 'draft')]}">
```

### After (Odoo 17)
```xml
<field name="amount" 
       invisible="state == 'done'"
       readonly="state != 'draft'">
```

---

## 📚 REFERENCES

- See `references/view_widgets.md` for available widgets
- See `references/orm_patterns.md` for model patterns
- See `SKILL.md` for complete development guide