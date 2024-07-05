module.exports = grammar({
    name: 'project_flow_syntax',

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

        dependency: $ => seq(
            $.roadmap_items,
            optional($.negation_op),
            $.required_by_op,
            $.roadmap_items
        ),

        task_split_operation: $ => choice(
            seq($.new_task_sigil, $.required_by_op, $.task),
            seq($.task, $.required_by_op, $.new_task_sigil)
        ),

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

        tasks: $ => seq(
            $.task,
            repeat(seq($.separator, $.task))
        ),

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

        cluster_sigil: $ => seq(optional($.whitespace), '@', optional($.whitespace)),
        comment_sigil: $ => seq(optional($.whitespace), '#', optional($.whitespace)),
        milestone_sigil: $ => seq(optional($.whitespace), '%', optional($.whitespace)),
        new_task_sigil: $ => seq(optional($.whitespace), '*', optional($.whitespace)),
        resource_sigil: $ => seq(optional($.whitespace), '$', optional($.whitespace)),

        explode_op: $ => seq(optional($.whitespace), '!', optional($.whitespace)),
        implode_op: $ => seq($.negation_op, $.explode_op),
        required_by_op: $ => seq(optional($.whitespace), '>', optional($.whitespace)),
        negation_op: $ => seq(optional($.whitespace), '~', optional($.whitespace)),

        kv_separator: $ => seq(optional($.whitespace), ':', optional($.whitespace)),
        separator: $ => choice(
            seq(optional($.whitespace), ',', optional($.whitespace)),
            $.whitespace
        ),

        number: $ => /[0-9]+/,

        whitespace: $ => /[ \t]+/,

        newline: $ => /[\n\r]+/
    }
});
