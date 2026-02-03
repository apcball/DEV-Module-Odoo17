# -*- coding: utf-8 -*-
{
    'name': '{{MODULE_NAME}}',
    'version': '17.0.1.0.0',
    'category': '{{CATEGORY}}',
    'summary': '{{SUMMARY}}',
    'description': """
{{DESCRIPTION}}
    """,
    'author': '{{AUTHOR}}',
    'website': '{{WEBSITE}}',
    'license': 'LGPL-3',
    'depends': [
        'base',
        'mail',
    ],
    'data': [
        'security/security.xml',
        'security/ir.model.access.csv',
        'data/sequence.xml',
        'views/{{MODEL_NAME}}_views.xml',
        'views/menu.xml',
    ],
    'demo': [],
    'installable': True,
    'application': True,
    'auto_install': False,
}