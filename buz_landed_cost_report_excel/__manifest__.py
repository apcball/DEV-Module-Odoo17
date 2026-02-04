# -*- coding: utf-8 -*-
{
    'name': 'Landed Cost Report Excel Export',
    'version': '17.0.1.0.0',
    'category': 'Inventory/Inventory',
    'summary': 'Export Landed Cost Reports to Excel with dynamic service columns',
    'description': """
Landed Cost Report Excel Export
===============================

This module provides comprehensive Excel export functionality for Landed Cost reports
with the following features:

* Single-sheet Excel export with dynamic service columns
* Professional formatting with headers, totals, and colors
* Tree view showing landed costs as columns (not rows)
* On-screen preview functionality
* Wizard-based report generation with date range filtering

Excel Column Structure:
- Fixed columns: DocNo, Date, RefNo, PrdID, PrdName, QT, PricePerUnit, Cost, Rate, Discount, Exp
- Dynamic columns: Landed Cost Service columns (from Service Products)
- Fixed columns: Tax, Transit, CostBath, Cost per unit, InvtName
    """,
    'author': 'Buz Software',
    'website': 'https://www.buzsoftware.com',
    'depends': [
        'base',
        'stock',
        'stock_landed_costs',
        'product',
    ],
    'external_dependencies': {
        'python': ['xlsxwriter'],
    },
    'data': [
        'security/ir.model.access.csv',
        'wizards/landed_cost_report_wizard_view.xml',
        'views/landed_cost_report_views.xml',
    ],
    'assets': {
        'web.assets_backend': [
            'buz_landed_cost_report_excel/static/src/xml/landed_cost_report_templates.xml',
        ],
    },
    'installable': True,
    'application': False,
    'auto_install': False,
    'license': 'LGPL-3',
}
