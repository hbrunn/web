//-*- coding: utf-8 -*-
//© 2016 Therp BV <http://therp.nl>
//License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).

//depends on jQuery, datejs
(function(jQuery)
{
    jQuery.fn.infiniteGantt = function(options)
    {
        var config = jQuery.extend({}, $.fn.infiniteGantt.defaults, options),
            scale = jQuery.fn.infiniteGantt['scale_' + config.scale];
        if(!scale)
        {
            throw 'Unknown scale ' + config.scale;
        }
        this.each(function()
        {

            var data = {
                    tasks: [],
                    tasks_by_id: {},
                    tasks_dom: {},
                    groups: [],
                    groups_by_id: {},
                    groups_dom: {},
                    config: config,
                },
                $container = jQuery(this)
                    .empty()
                    .addClass('infiniteGantt')
                    .data('infiniteGantt', data),
                $legend = jQuery('<div/>')
                    .addClass('legend')
                    .appendTo($container),
                $data = jQuery('<div/>')
                    .addClass('data')
                    .appendTo($container);
            scale.init.apply($container);
            config.get_data(data.start_date, data.end_date)
            .then(function(records)
            {
                jQuery.each(records, function(index, record)
                {
                    jQuery.fn.infiniteGantt.add_data.apply(
                        $container, [record]);
                });
                scale.update.apply($container);
            });
        });
        return this;
    };
    jQuery.fn.infiniteGantt.defaults = {
        scale: 'month',
        scales: ['month'],
        date: new Date(),
        scale_month: {
            month_width: '5em',
            default_margin: 12,
        },
        get_data: function(start_date, end_date)
        {
            return jQuery.when([
                {
                    id: 42,
                    type: 'task',
                    name: 'hello world',
                    start_date: new Date().month(),
                    end_date: new Date().month().next(),
                },
            ]);
        },
    };
    jQuery.fn.infiniteGantt.scale_month = {
        init: function()
        {
            var $this = jQuery(this),
                $container = $this.find('.data'),
                $legend = $this.find('.legend'),
                data = $this.data('infiniteGantt'),
                config = data.config,
                current_date = config.date.clone().clearTime(),
                start_date = current_date.clone().moveToFirstDayOfMonth()
                    .addMonths(-config.scale_month.default_margin),
                end_date = current_date.clone().moveToFirstDayOfMonth()
                    .addMonths(config.scale_month.default_margin),
                $year = jQuery('<div/>').addClass('year')
                    .text(start_date.toString('yyyy'))
                    .width(0)
                    .data('date', start_date);
            data.start_date = start_date;
            data.end_date = end_date;
            $container.empty();
            $container.append($year);
            $container.append(jQuery('<div/>').addClass('divider'));
            for(var date = start_date.clone(); date < end_date;
                date.addMonths(1))
            {
                var $month = jQuery('<div/>')
                    .addClass('month')
                    .css('width', config.scale_month.month_width)
                    .text(date.toString('MMM'))
                    .appendTo($container);
                if($year.data('date').getFullYear() != date.getFullYear())
                {
                    $year = jQuery('<div/>').addClass('year')
                        .text(date.toString('yyyy'))
                        .width(0)
                        .data('date', date.clone())
                        .insertAfter($year);

                }
                $year.width($year.width() + $month.width());
            }
            $container.append(jQuery('<div/>').addClass('divider'));
            $legend.append(
                jQuery('<div/>').html('&nbsp;').addClass('divider'));
            $legend.append(
                jQuery('<div/>').html('&nbsp;').addClass('divider'));
        },
        update: function()
        {
            var $this = jQuery(this),
                data = $this.data('infiniteGantt'),
                $data = $this.find('.data'),
                $legend = $this.find('.legend');
            jQuery.each(data.tasks, function(index, task)
            {
                if(!data.tasks_dom[task.id])
                {
                    data.tasks_dom[task.id] = {
                        legend: jQuery('<div/>')
                            .addClass('task')
                            .text(task.name)
                            .appendTo($legend),
                        data: []
                    }
                    for(var date = data.start_date.clone();
                        date < data.end_date; date.addMonths(1))
                    {
                        var current_date = date.clone(),
                            $cell = jQuery('<div/>')
                            .addClass('task_month')
                            .css('width',
                                 data.config.scale_month.month_width)
                            .data('date', current_date)
                            .html('&nbsp;')
                            .appendTo($data);
                        jQuery.each([
                            'click', 'dragover', 'dragenter', 'dragleave',
                            'drop',
                        ],
                        function(index, ev)
                        {
                            if(data.config['date_cell_' + ev])
                            {
                                $cell.on(ev, function(e)
                                {
                                    data.config['date_cell_' + ev](
                                        e, task,
                                        jQuery(e.currentTarget).data('date'));
                                })
                            }
                        })
                        data.tasks_dom[task.id].data.push($cell);
                    }
                    $data.append(jQuery('<div/>').addClass('divider'));
                }
            });
        },
        extend: function()
        {
        },
    };
    jQuery.fn.infiniteGantt.add_data = function(record)
    {
        var data = jQuery(this).data('infiniteGantt');
        if(record.type == 'task')
        {
            data.tasks.push(record);
            data.tasks_by_id[record.id] = record;
            if(record.start_date && (!data.start_date ||
                                     record.start_date < data.start_date))
            {
                data.start_date = record.start_date.clone();
            }
            if(record.end_date && (!data.end_date ||
                                     record.end_date > data.end_date))
            {
                data.end_date = record.end_date.clone();
            }
        }
        if(record.type == 'group')
        {
            data.groups.push(record);
            data.groups_by_id[record.id] = record;
        }
    }
}(jQuery));
