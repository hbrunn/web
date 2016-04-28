# -*- coding: utf-8 -*-
# © 2016 Therp BV <http://therp.nl>
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).
{
    "name": "Gantt distribution",
    "version": "8.0.1.0.0",
    "author": "Therp BV,Odoo Community Association (OCA)",
    "license": "AGPL-3",
    "category": "Hidden/Dependency",
    "summary": "Distribute records on others based on time",
    "depends": [
        'web',
    ],
    "data": [
        'views/templates.xml',
        'security/ir.model.access.csv',
    ],
    "qweb": [
        'static/src/xml/web_view_gantt_distribution.xml',
    ],
    "test": [
    ],
    "images": [
    ],
    "pre_init_hook": False,
    "post_init_hook": False,
    "uninstall_hook": False,
    "auto_install": False,
    "installable": True,
    "application": False,
    "external_dependencies": {
        'python': [],
    },
}
