//-*- coding: utf-8 -*-
//© 2016 Therp BV <http://therp.nl>
//License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).

openerp.web_widget_one2many_tags = function(instance)
{
    openerp.web_widget_one2many_tags.FieldOne2ManyTags =
    instance.web.form.FieldMany2ManyTags.extend({
        initialize_texttext: function()
        {
            var self = this,
                result = this._super.apply(this, arguments),
                removeTag = result.ext.tags.removeTag;
            result.plugins = 'tags arrow filter';
            result.ext.core.onSetInputData = function(e, data)
            {
                this.input().val(data);
            };
            result.filter = {
                items: []
            };
            result.ext.arrow = {
                onArrowClick: function(e)
                {
                    var context = {},
                        key = _.str.sprintf(
                            'default_%s', self.field.relation_field)
                    context[key] = self.field_manager.datarecord.id;
                    self._search_create_popup('form', undefined, context);
                },
            }
            result.ext.tags.removeTag = function(tag)
            {
                var id = tag.data("id"),
                    dataset = new instance.web.DataSet(
                        self, self.field.relation, self.build_context());
                dataset.unlink([id]);
                return removeTag(tag);
            };
            return result;
        },
    });
    instance.web.form.widgets.add(
        'one2many_tags',
        'instance.web_widget_one2many_tags.FieldOne2ManyTags'
    );
}
