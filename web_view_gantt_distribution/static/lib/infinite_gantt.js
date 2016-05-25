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
                    .appendTo($container),
                $scroll_left = jQuery('<a/>')
                    .addClass('scroll_left')
                    .appendTo($container),
                $scroll_right = jQuery('<a/>')
                    .addClass('scroll_right')
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
            $container.on('infiniteGantt:add', function(e, record)
            {
                jQuery.fn.infiniteGantt.add_data.apply(
                    $container, [record]);
            });
            $container.on('infiniteGantt:update', function(e, record)
            {
                data.scale.update.apply($container);
            });
            $scroll_left.on('click', function(e)
            {
                config.scroll_click.apply($container, [-1, e]);
            });
            $scroll_right.on('click', function(e)
            {
                config.scroll_click.apply($container, [1, e]);
            });
            $data.on('scroll', jQuery.proxy(config.data_scroll, $container));
            jQuery.each([
                'click', 'drag', 'dragstart', 'dragend', 'dragover',
                'dragenter', 'dragleave', 'drop', 'mouseenter', 'mouseleave',
            ],
            function(index, ev)
            {
                if(data.config['date_cell_' + ev])
                {
                    $data.on(
                        ev,
                        '.task,.group',
                        function(e)
                        {
                            data.config['date_cell_' + ev].apply(
                                $container,
                                [
                                    e, jQuery(this).data('record'),
                                    jQuery(this).data('date')
                                ]
                            );
                        })
                }
            })
        });
        return this;
    };
    jQuery.fn.infiniteGantt.defaults = {
        scale: 'month',
        scales: ['month'],
        date: new Date(),
        scale_month: {
            month_width: '5em',
            margin: 12,
        },
        // pass your own implementation here
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
        // if you set this, drag&drop is turned on
        // write_data: function(record)
        // {
        //     return jQuery.when();
        // }
        // click handler for scrolling buttons
        scroll_click: function(direction, e)
        {
            var $data = $(this).find('.data');
            $data.animate({
                scrollLeft: "+=" + $data.innerWidth() * direction,
            });
        },
        // scroll handler for data div
        data_scroll: function(e)
        {
            var $data = this.find('.data'),
                direction = 0;
            if($data.scrollLeft() + $data.innerWidth() >= $data[0].scrollWidth)
            {
                direction = 1;
            }
            else if($data.scrollLeft() == 0)
            {
                direction = -1;
            }
            if(direction)
            {
                jQuery.fn.infiniteGantt.get_scale(this).extend.apply(
                    this, [direction]
                );
            }
        },
        // dragging a cell
        date_cell_dragstart: function(e, record, date)
        {
            e.originalEvent.dataTransfer.setData(
                'infiniteGantt/task', record.id);
        },
        // dropping a cell
        date_cell_drop: function(e, record, date)
        {
            if(e.originalEvent.dataTransfer.getData('infiniteGantt/task'))
            {
                var $this = jQuery(this),
                    data = jQuery(this).data('infiniteGantt'),
                    dropped_record = data.tasks_by_id[
                        parseInt(e.originalEvent.dataTransfer
                                 .getData('infiniteGantt/task'))
                    ],
                    new_end = date.clone().addMilliseconds(
                        dropped_record.end_date - dropped_record.start_date
                    );
                record.start_date = date;
                record.end_date = new_end;
                if(data.config.write_data)
                {
                    return data.config.write_data.apply(this, [dropped_record])
                    .then(function()
                    {
                        $this.trigger('inifiniteGantt:update');
                    });
                }
            }
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
                    .addMonths(-config.scale_month.margin),
                end_date = current_date.clone().moveToFirstDayOfMonth()
                    .addMonths(config.scale_month.margin);
            data.start_date = start_date;
            data.end_date = end_date;
            $container.empty();
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
                $legend = $this.find('.legend'),
                $years = $data.find('.year'),
                $last_year = $years.last(),
                $months = $data.find('.month'),
                $last_month = $months.last(),
                $dividers = $data.find('.divider');
            if(!$years.length)
            {
                $years = jQuery.fn.infiniteGantt.scale_month
                    ._create_year(data.start_date);
                $last_year = $years.last();
                $data.append($years);
                $data.append(jQuery('<div/>').addClass('divider'));
            }
            for(var date = data.start_date.clone(); date < data.end_date;
                date.addMonths(1))
            {
                if(date < $years.data('date'))
                {
                    if(date.getFullYear() != $years.data('date').getFullYear())
                    {
                        jQuery.fn.infiniteGantt.scale_month
                            ._create_year(date)
                            .insertBefore($years.first());
                        $years = $data.find('.year');
                    }
                    else
                    {
                        $years.data('date', date.clone())
                    }
                }
                if(date > $last_year.data('date') &&
                   date.getFullYear() != $last_year.data('date').getFullYear())
                {
                    $last_year = jQuery.fn.infiniteGantt.scale_month
                        ._create_year(date)
                        .insertAfter($last_year);
                    $years = $years.add($last_year);
                }
                var $year = $years.filter('.' + date.getFullYear());
                if(!$months
                   .filter('.' + date.getFullYear() + '.' + date.getMonth())
                   .length)
                {
                    var $month = jQuery('<div/>')
                        .addClass('month')
                        .addClass(String(date.getFullYear()))
                        .addClass(String(date.getMonth()))
                        .data('date', date.clone())
                        .css('width', data.config.scale_month.month_width)
                        .text(date.toString('MMM'));
                    if(!$months.length)
                    {
                        $months = $month.appendTo($data);
                        $last_month = $month;
                        $dividers = jQuery('<div/>').addClass('divider');
                        $data.append($dividers);
                    }
                    else if(date < $months.data('date'))
                    {
                        $month.insertBefore($months.first());
                        $months = $data.find('.month');
                        $dividers.slice(1, -1).each(function()
                        {
                            jQuery(this).after(
                                jQuery.fn.infiniteGantt.scale_month
                                ._clone_cell(jQuery(this).next(), date)
                            );
                        });
                    }
                    else if(date > $last_month.data('date'))
                    {
                        $month.insertAfter($months.last());
                        $months = $months.add($month);
                        $last_month = $month;
                        $dividers.slice(2).each(function()
                        {
                            jQuery(this).before(
                                jQuery.fn.infiniteGantt.scale_month
                                ._clone_cell(jQuery(this).prev(), date)
                            );
                        });
                    }
                    else
                    {
                        $months.each(function()
                        {
                            if(jQuery(this).data('date') > date)
                            {
                                $month.insertBefore(this);
                                $months = $data.find('.month');
                                var index = $months.index($month);
                                $dividers.slice(1, -1).each(function()
                                {
                                    var $cell = jQuery(
                                        jQuery(this)
                                        .nextUntil('.divider')[index]
                                    );
                                    jQuery.fn.infiniteGantt.scale_month
                                    ._clone_cell($cell, date)
                                    .insertBefore($cell);
                                });
                                return false;
                            };
                        });
                    }
                    $year.width($year.width() + $month.width());
                }
            }
            jQuery.each(data.tasks, function(index, task)
            {
                if(data.tasks_dom[task.id])
                {
                    // TODO: update dom element if necessary
                    return
                }
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
                        .addClass(task.type)
                        .attr('draggable',
                              data.config.date_cell_dragstart &&
                              data.config.write_data ? 'true' : undefined)
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
                $data_insert = jQuery('<div/>').addClass('divider')
                    .insertAfter($data_insert);
                data.tasks_dom[task.id].data.push($data_insert);
            });
            $this.trigger('infiniteGantt:updated');
        },
        // the user requests seeing more data by scrolling to the left or right
        extend: function(direction)
        {
            var $this = jQuery(this),
                data = this.data('infiniteGantt'),
                start_date = undefined,
                end_date = undefined;
            if(direction > 0)
            {
                start_date = data.end_date.clone();
                data.end_date = data.end_date.clone().addMonths(
                    direction * data.config.scale_month.margin);
                end_date = data.end_date.clone();
            }
            else if(direction < 0)
            {
                end_date = data.start_date.clone();
                data.start_date = data.start_date.clone().addMonths(
                    direction * data.config.scale_month.margin);
                start_date = data.start_date.clone();
            }
            if(start_date && end_date)
            {
                data.config.get_data(start_date, end_date)
                .then(function(records)
                {
                    jQuery.each(records, function(index, record)
                    {
                        jQuery.fn.infiniteGantt.add_data.apply(
                            $this, [record]);
                    });
                    jQuery.fn.infiniteGantt.get_scale($this)
                    .update.apply($this);
                });
            }
        },
        _create_year(date)
        {
            return jQuery('<div/>')
                .addClass('year')
                .addClass(String(date.getFullYear()))
                .text(date.toString('yyyy'))
                .width(0)
                .data('date', date.clone());
        },
        _clone_cell($cell, date)
        {
            return $cell.clone()
                .removeClass('occupied')
                .data('record', $cell.data('record'))
                .data('date', date.clone());
        },
    };
    // don't call this function, use $().trigger('inifiniteGantt:add', record)
    // and then $().trigger('inifiniteGantt:update') when you're done adding
    jQuery.fn.infiniteGantt.add_data = function(record)
    {
        var data = jQuery(this).data('infiniteGantt');
        if(record.type != 'task' && record.type != 'group')
        {
            throw 'Unknown record type ' + record.type;
        }
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
    };
    // get current scale
    jQuery.fn.infiniteGantt.get_scale = function($infiniteGantt)
    {
        var config = jQuery($infiniteGantt).data('infiniteGantt').config;
        return jQuery.fn.infiniteGantt['scale_' + config.scale];
    };
}(jQuery));
