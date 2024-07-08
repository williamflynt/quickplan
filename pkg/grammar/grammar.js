module.exports = grammar({
    name: 'project_flow_syntax',

    // Allow whitespace between rules without specifying every time.
    extras: $ => [
        $.whitespace,
    ],

    precedences: $ => [
        [$.task_split_operation, $.roadmap_item],
    ],

    rules: {
        source: $ => choice(
            $.commands,
            $.response,
            $.interactive_session
        ),

        commands: $ => seq(
            $.command,
            repeat(seq($.newline, $.command))
        ),

        interactive_session: $ => repeat1(seq(
            $.command,
            $.newline,
            $.response,
            optional($.newline)
        )),

        command: $ => choice(
            $.dependency,
            $.task_split_operation,
            $.entity_create_or_update,
            $.entity_remove,
            $.task_explode_implode,
            $.cluster_operation,
            $.comment,
            $.resource_assignment
        ),

        comment: $ => seq($.comment_sigil, /[^\n\r]*/),

        dependency: $ => choice(
            seq($.roadmap_items, optional($.negation_op), $.required_by_op, $.roadmap_items)
        ),

        task_split_operation: $ => prec.left(choice(
            seq($.new_task_sigil, $.required_by_op, $.task),
            seq($.task, $.required_by_op, $.new_task_sigil)
        )),

        entity_create_or_update: $ => $.entity,

        entity_remove: $ => seq(
            $.negation_op,
            $.entity
        ),

        task_explode_implode: $ => choice(
            seq($.task, $.explode_op, $.number),
            seq($.tasks, $.implode_op, $.task)
        ),

        cluster_operation: $ => seq(
            optional($.negation_op),
            $.cluster_sigil,
            $.identifier,
            $.kv_separator,
            $.roadmap_items
        ),

        resource_assignment: $ => seq(
            $.resources,
            optional($.negation_op),
            $.required_by_op,
            $.tasks
        ),

        roadmap_items: $ => seq(
            $.roadmap_item,
            repeat(seq($.separator, $.roadmap_item))
        ),

        roadmap_item: $ => choice(
            $.task,
            $.milestone
        ),

        entity: $ => choice(
            $.roadmap_item,
            $.resource
        ),

        tasks: $ => prec(1, seq(
            $.task,
            repeat(seq($.separator, $.task))
        )),

        task: $ => seq(
            $.identifier,
            optional($.attributes)
        ),

        milestone: $ => seq(
            $.milestone_sigil,
            $.identifier,
            optional($.attributes)
        ),

        resource: $ => seq(
            $.resource_sigil,
            $.identifier,
            optional($.attributes)
        ),

        resources: $ => seq(
            $.resource,
            repeat(seq($.separator, $.resource))
        ),

        attributes: $ => seq(
            '(',
            choice(
                $.negation_op,
                seq($.attribute, repeat(seq($.separator, $.attribute)))
            ),
            ')'
        ),

        attribute: $ => seq(
            $.identifier,
            $.kv_separator,
            choice(
                $.quoted_value,
                $.value,
                $.negation_op
            )
        ),

        quoted_value: $ => seq(
            '"',
            repeat(choice(
                /[^"\\\n\r]/,
                seq('\\', /./),
                $.newline
            )),
            '"'
        ),

        value: $ => /[^,)"]+/,

        response: $ => seq(
            $.number,
            optional(seq($.whitespace, /[^\n\r]*/))
        ),

        identifier: $ => /[A-Za-z][A-Za-z0-9_-]*/,

        cluster_sigil: $ => '@',
        comment_sigil: $ => '#',
        milestone_sigil: $ => '%',
        new_task_sigil: $ => '*',
        resource_sigil: $ => '$',

        explode_op: $ => '!',
        implode_op: $ => seq('~', '!'),
        required_by_op: $ => '>',
        negation_op: $ => '~',

        kv_separator: $ => ':',
        separator: $ => ',',

        whitespace: $ => /[ \t]+/,
        newline: $ => /[\n\r]+/,

        number: $ => /[0-9]+/,
    }
});
