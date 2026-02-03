# Odoo 17 View Widgets Reference

## Field Widgets

### Basic Widgets
| Widget | Usage | Example |
|--------|-------|---------|
| `char` | Single line text | <field name="name"/> |
| `text` | Multi-line text | <field name="note"/> |
| `integer` | Whole numbers | <field name="quantity"/> |
| `float` | Decimal numbers | <field name="amount"/> |
| `boolean` | True/False | <field name="active"/> |
| `date` | Date picker | <field name="date"/> |
| `datetime` | Date + Time | <field name="create_date"/> |
| `selection` | Dropdown | <field name="state"/> |

### Monetary Widgets
```xml
<field name="amount" widget="monetary" options="{'currency_field': 'currency_id'}"/>
<field name="currency_id" invisible="1"/>
```

### Relation Widgets
```xml
<!-- Many2one -->
<field name="partner_id" options="{'no_create': True, 'no_open': True}"/>

<!-- One2many / Many2many -->
<field name="line_ids" mode="tree,kanban">
    <tree editable="bottom">
        <field name="product_id"/>
        <field name="quantity"/>
    </tree>
</field>
```

### Special Widgets

#### Status Bar
```xml
<field name="state" widget="statusbar" 
       statusbar_visible="draft,sent,sale,done"/>
```

#### Badge
```xml
<field name="state" widget="badge" 
       decoration-success="state=='done'"
       decoration-info="state=='draft'"/>
```

#### Progress Bar
```xml
<field name="progress" widget="progressbar" 
       options="{'editable': true, 'max_value': 100}"
       nolabel="1"/>
```

#### Percentage
```xml
<field name="discount" widget="percentage"/>
```

#### Email
```xml
<field name="email" widget="email"/>
```

#### URL
```xml
<field name="website" widget="url"/>
```

#### Phone
```xml
<field name="phone" widget="phone"/>
```

#### Image
```xml
<field name="image_1920" widget="image" 
       options="{'size': [90, 90], 'preview_image': 'image_128'}"/>
```

#### Binary (File)
```xml
<field name="attachment" widget="binary" filename="attachment_name"/>
<field name="attachment_name" invisible="1"/>
```

#### HTML
```xml
<field name="description" widget="html" 
       options="{'style-inline': true}"
       placeholder="Enter description..."/>
```

#### Radio
```xml
<field name="priority" widget="radio" options="{'horizontal': true}"
       nolabel="1"/>
```

#### Priority (Stars)
```xml
<field name="priority" widget="priority"/>
```

#### Handle (Drag to reorder)
```xml
<tree>
    <field name="sequence" widget="handle"/>
    <field name="name"/>
</tree>
```

#### Many2many Checkboxes
```xml
<field name="tag_ids" widget="many2many_checkboxes"/>
```

#### Many2many Tags
```xml
<field name="tag_ids" widget="many2many_tags" 
       options="{'color_field': 'color', 'no_create': True}"
       placeholder="Select tags..."/>
```

#### Selection Badge
```xml
<field name="state" widget="selection_badge"/
```

#### Time Picker
```xml
<field name="scheduled_time" widget="float_time"/>
```

#### Date/Time with Options
```xml
<field name="date" 
       options="{'datepicker': {'daysOfWeekDisabled': [0, 6]}}"/>
```

## Button Widgets

### Stat Button
```xml
<button name="%(action_purchase_orders)d" 
        type="action" 
        class="oe_stat_button" 
        icon="fa-shopping-cart"
        groups="purchase.group_purchase_user">
    <field name="purchase_count" widget="statinfo" string="Purchases"/
</button>
```

### Object Button
```xml
<button name="action_confirm" 
        string="Confirm" 
        type="object" 
        class="oe_highlight"
        confirm="Are you sure?"
        invisible="state != 'draft'"
        groups="my_module.group_manager"/>
```

### Action Button
```xml
<button name="%(action_my_action)d" 
        string="Open" 
        type="action"/>
```

## Container Widgets

### Notebook (Tabs)
```xml
<notebook>
    <page string="General" name="general">
        <group>
            <field name="name"/>
        </group>
    </page>
    
    <page string="Lines" name="lines">
        <field name="line_ids"/>
    </page>
</notebook>
```

### Group
```xml
<group>
    <group string="Left Column">
        <field name="field1"/>
        <field name="field2"/>
    </group>
    
    <group string="Right Column">
        <field name="field3"/>
        <field name="field4"/>
    </group>
</group>
```

### Sheet
```xml
<sheet>
    <div class="oe_title">
        <h1><field name="name"/></h1>
    </div>
    <!-- Content -->
</sheet>
```

## Tree View Decorations

```xml
<tree decoration-muted="state=='cancel'"
      decoration-success="state=='done'"
      decoration-info="state=='draft'"
      decoration-warning="state=='pending'"
      decoration-danger="amount > 10000"
      decoration-bf="priority=='high'"
      decoration-it="active==False"
      editable="top|bottom"
      multi_edit="1"
      delete="false"
      create="false"
>
    <field name="name"/>
    <field name="amount"/>
    <field name="state"/>
</tree>
```

## Form View Options

### Create/Edit Options
```xml
<form create="false" edit="false" delete="false"
      duplicate="false"
      js_class="my_custom_form"
>
```

### Chatter
```xml
<div class="oe_chatter">
    <field name="message_follower_ids" groups="base.group_user"/>
    <field name="activity_ids"/>
    <field name="message_ids"/>
</div>
```