# -*- coding: utf-8 -*-
{
    'name': 'Job Costing Management',
    'version': '17.0.1.0.0',
    'category': 'Manufacturing/Project',
    'summary': 'Job costing and material requisition management',
    'description': """
Job Costing Management
======================

This module provides comprehensive job costing and material requisition management:

**Features:**

* **Job Costing**
  - Track budgeted vs actual costs for jobs/projects
  - Cost categories: Material, Labor, Overhead, Subcontractor
  - Profit margin analysis
  - Variance reporting

* **Material Requisition**
  - Request materials for jobs
  - Approval workflow with configurable limits
  - Priority levels (Low, Normal, High, Urgent)
  - Full inventory/stock integration

* **Material Requisition Wizard**
  - Step-by-step guided workflow
  - Real-time cost estimation
  - Budget checking
  - Stock availability warnings

* **Integration**
  - Stock/Inventory management
  - Project management
  - Analytic accounting
  - Employee/HR

**Workflow:**
1. Create job with budget lines
2. Use wizard to request materials
3. Manager approves (if required)
4. Stock picking auto-generated
5. Track actual costs vs budget
    """,
    'author': 'Your Company',
    'website': 'https://www.yourcompany.com',
    'depends': [
        'base',
        'hr',
        'stock',
        'project',
        'analytic',
        'mail',
    ],
    'data': [
        # Security
        'security/security.xml',
        'security/ir.model.access.csv',
        
        # Data
        'data/sequences.xml',
        
        # Views
        'views/job_costing_views.xml',
        'views/material_requisition_views.xml',
        'views/requisition_wizard_views.xml',
        'views/stock_picking_views.xml',
        
        # Menus
        'views/menu.xml',
    ],
    'demo': [
        'demo/demo_data.xml',
    ],
    'installable': True,
    'application': True,
    'auto_install': False,
    'license': 'LGPL-3',
}
