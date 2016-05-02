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
                    scale: scale,
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
            $container.bind('infiniteGantt:add', function(e, record)
            {
                jQuery.fn.infiniteGantt.add_data.apply(
                    $container, [record]);
            });
            $container.bind('infiniteGantt:update', function(e, record)
            {
                data.scale.update.apply($container);
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
                    // needs to be a unique scalar
                    id: 42,
                    // this can be 'task' or 'group'
                    type: 'task',
                    name: 'hello world',
                    // datejs objects
                    start_date: new Date().month(),
                    end_date: new Date().month().next(),
                },
            ]);
        },
    };
    jQuery.fn.infiniteGantt.scale_month = {
        // prepare a header for this scale
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
        // there's been data added, do what is necessary to show it
        update: function()
        {
            var $this = jQuery(this),
                data = $this.data('infiniteGantt'),
                $data = $this.find('.data'),
                $data_insert = null,
                $legend = $this.find('.legend');
            jQuery.each(data.tasks, function(index, task)
            {
                if(!data.tasks_dom[task.id])
                {
                    data.tasks_dom[task.id] = {
                        $legend: jQuery('<div/>')
                            .addClass(task.type)
                            .data('record', task)
                            .text(task.name),
                        data: [],
                    }
                    if(task.parent_id && data.tasks_dom[task.parent_id])
                    {
                        data.tasks_dom[task.id].$legend.insertAfter(
                            data.tasks_dom[task.parent_id].$legend);
                        $data_insert = jQuery(
                            data.tasks_dom[task.parent_id].data.slice(-1)[0]);
                    }
                    else
                    {
                        data.tasks_dom[task.id].$legend.appendTo($legend);
                        $data_insert = $data.children().last();
                    }
                    for(var date = data.start_date.clone();
                        date < data.end_date; date.addMonths(1))
                    {
                        var current_date = date.clone(),
                            $cell = jQuery('<div/>')
                            .addClass(task.type + '_month')
                            .css('width',
                                 data.config.scale_month.month_width)
                            .data('date', current_date)
                            .data('record', task)
                            .html('&nbsp;')
                            .insertAfter($data_insert);
                        data.tasks_dom[task.id].data.push($cell[0]);
                        $cell.toggleClass(
                            'occupied',
                            task.type == 'task' &&
                            (!task.start_date ||
                             task.start_date && date >= task.start_date) &&
                            (!task.end_date ||
                             task.end_date && date <=task.end_date)
                        )
                        $data_insert = $cell;
                    }
                    jQuery.each([
                        'click', 'dragover', 'dragenter', 'dragleave',
                        'drop', 'mouseenter', 'mouseleave',
                    ],
                    function(index, ev)
                    {
                        if(data.config['date_cell_' + ev])
                        {
                            jQuery(data.tasks_dom[task.id].data).on(ev, function(e)
                            {
                                data.config['date_cell_' + ev](
                                    e, task,
                                    jQuery(e.currentTarget).data('date'));
                            })
                        }
                    })
                    $data_insert = jQuery('<div/>').addClass('divider')
                        .insertAfter($data_insert);
                    data.tasks_dom[task.id].data.push($data_insert);
                }
            });
            $this.trigger('infiniteGantt:updated');
        },
        // the user requests seeing more data by scrolling to the left or right
        extend: function(direction)
        {
        },
    };
    // don't call this function, use $().trigger('inifiniteGantt:add', record)
    // and then $().trigger('inifiniteGantt:update') when you're done adding
    jQuery.fn.infiniteGantt.add_data = function(record)
    {
        var data = jQuery(this).data('infiniteGantt');
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
}(jQuery));
