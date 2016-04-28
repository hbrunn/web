//-*- coding: utf-8 -*-
//© 2016 Therp BV <http://therp.nl>
//License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).

openerp.web_view_gantt_distribution = function(instance)
{
    instance.web_view_gantt_distribution.ViewGanttDistribution = instance
    .web.View.extend({
        searchable: true,
        template: "ViewGanttDistribution",
        display_name: instance.web._lt('Gantt distribution'),
        view_type: "gantt_distribution",
        gantt_config: {
        },
        distribution_target_model_config: {
            distributed_model_field: null,
            target_model_field: null,
        },
        view_loading: function(fields_view)
        {
            var self = this;
            _.each(fields_view.arch.children, function(child)
            {
                self[child.tag] = _.extend({}, self[child.tag], child.attrs);
            });
            this.distributed_view = new instance.web_kanban.KanbanView(
                this,
                new instance.web.DataSetSearch(
                    this, fields_view.arch.attrs.distributed_model,
                    this.dataset.get_context(),
                    this._get_distributed_model_domain()),
                undefined,
                {}
            );
            this.distributed_view.appendTo(
                this.$el.find('div[name="distributed_model"]'));
            return jQuery.when(
                this.distributed_view.start()
            );
        },
        do_search(domain, context, groupby)
        {
            var self = this;
            return jQuery.when(
                this._setup_gantt_view(domain, context, groupby),
                this.distributed_view.do_search(
                    this._get_distributed_model_domain(domain),
                    this.dataset.get_context(),
                    [])
                .then(function()
                {
                    self.$el.find('div[name="distributed_model"]').css(
                        'height',
                        self.distributed_view.$el.find('.oe_kanban_record')
                        .outerHeight() +
                        self.distributed_view.$el.find('.oe_kanban_buttons')
                        .outerHeight()
                    );
                    self.distributed_view.$el.find('.oe_kanban_record')
                    .attr('draggable', true)
                    .on('dragstart', function(ev)
                    {
                        _.each(self.distributed_view.getChildren(),
                        function(group)
                        {
                            _.each(group.getChildren(), function(kanban_record)
                            {
                                if(ev.currentTarget == kanban_record.$el[0])
                                {
                                    ev.originalEvent.dataTransfer.setData(
                                        'text', kanban_record.id);
                                }
                            });
                        });
                    });
                })
            );
        },
        _get_distributed_model_domain: function(main_domain)
        {
            // TODO: add real domain depending on our model's ids
            return [];
        },
        _setup_gantt_view: function(domain, context)
        {
            var self = this,
                deferred = new jQuery.Deferred();
            this.gantt_view = this.$el.find('div[name="distribution_target"]')
            .infiniteGantt(
                _.extend(
                    {}, self.gantt_options, {
                        get_data: function(start_date, end_date)
                        {
                            return self._get_gantt_data(
                                start_date, end_date, domain, context)
                        },
                        date_cell_click: function(ev, record, date)
                        {
                            ev.preventDefault();
                            return self._popup_gantt_record(date, record);
                        },
                        date_cell_dragover: function(ev, record, date)
                        {
                            ev.preventDefault();
                        },
                        date_cell_dragenter: function(ev, record, date)
                        {
                            jQuery(ev.currentTarget).addClass('hover');
                        },
                        date_cell_dragleave: function(ev, record, date)
                        {
                            jQuery(ev.currentTarget).removeClass('hover');
                        },
                        date_cell_drop: function(ev, record, date)
                        {
                            ev.preventDefault();
                            jQuery(ev.currentTarget).removeClass('hover');
                            return self._popup_gantt_record(
                                date, record,
                                ev.originalEvent.dataTransfer.getData("text")
                            );
                        },
                    }));
            return deferred;
        },
        _get_gantt_data: function(domain, context)
        {
            return this.dataset._model.query(['display_name'])
                .context(context)
                .filter(domain)
                .all()
                .then(function(records)
                {
                    return _(records).map(function(record)
                    {
                        return {
                            id: record.id,
                            name: record.display_name,
                            type: 'task',
                        }
                    });
                });
        },
        _popup_gantt_record: function(date, record, id)
        {
            var popup = new instance.web.form.FormOpenPopup(this),
                tm_config = this.distribution_target_model_config,
                context = {};
            context['default_' + tm_config.date_from_field] = date.toString(
                'yyyy-MM-dd');
            context['default_' + tm_config.date_to_field] = date.toString(
                'yyyy-MM-dd');
            context['default_' + tm_config.target_model_field] = parseInt(
                record.id);
            if(id)
            {
                context[
                    'default_' + tm_config.distributed_model_field
                ] = parseInt(id);
            }
            popup.show_element(
                this.fields_view.arch.attrs.distribution_target_model,
                null, context, {});
            return popup;
        },
    });
    instance.web.views.add(
        'gantt_distribution',
        'instance.web_view_gantt_distribution.ViewGanttDistribution'
    );
}
