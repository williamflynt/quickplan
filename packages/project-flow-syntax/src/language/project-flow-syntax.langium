grammar ProjectFlowSyntax

entry Project:
    lines+=Line*;

Line:
    EntityDefinition | Operation;

EntityDefinition:
    Task | Resource | Milestone | Cluster;

Task:
    name=ID
        (Attributes?) |
        // Designed to help enter duration and description quickly, as if typing notes/mind-mapping.
        (name=ID durationLow=NUMBER durationLikely=NUMBER durationHigh=NUMBER description=STRING_VALUE?) |
        (name=ID durationLow=NUMBER durationHigh=NUMBER description=STRING_VALUE?) |
        (name=ID durationLikely=NUMBER description=STRING_VALUE?) |
        (name=ID description=STRING_VALUE);

Resource:
    RESOURCE_PREFIX name=ID Attributes?;

Milestone:
    MILESTONE_PREFIX name=ID Attributes?;

Cluster:
    CLUSTER_PREFIX name=ID (':' items+=(Task | Milestone) (',' items+=(Task | Milestone))*)?;

fragment Attributes:
    '(' attributes+=Attribute? (',' attributes+=Attribute)* ')';

Attribute:
    name=ID ':' (value=STRING_VALUE | value=SIMPLE_VALUE | value=NUMBER | value=ID | value = NEGATE);

Operation:
    DependencyChain | Assignment | SplitTask |
    RemoveEntity | ExplodeTask | ImplodeTask;

DependencyChain:
    (leftMost+=(Task | Milestone) (',' leftMost+=(Task | Milestone))* segments+=DependencySegment+);

DependencySegment:
    (remove?=REMOVE_OP | '>') rightSide+=(Task | Milestone) (',' rightSide+=(Task | Milestone))*;

Assignment:
    (resources+=Resource (',' resources+=Resource)* (remove?=REMOVE_OP | '>') tasks+=Task (',' tasks+=Task)*) |
    (tasks+=Task (',' tasks+=Task)* (remove?=REMOVE_OP | '>') resources+=Resource (',' resources+=Resource)*);

SplitTask:
    (left?='*' '>' task=Task) | (task=Task '>' right?='*');

RemoveEntity:
    NEGATE entity=EntityDefinition;

ExplodeTask:
    task=Task '!' (
        count=NUMBER |
        (tasks+=Task (',' tasks+=Task)+)
    );

ImplodeTask:
    tasks+=Task (',' tasks+=Task)+ '/' target=Task;

hidden terminal WS: /\s+/;
hidden terminal SL_COMMENT: /#[^\n\r]*/;
hidden terminal ML_COMMENT: /"""[\s\S]*?"""/;

terminal MILESTONE_PREFIX: /%/;
terminal RESOURCE_PREFIX: /\$/;
terminal CLUSTER_PREFIX: /@/;

terminal REMOVE_OP: /~>/;
terminal NEGATE: /~/;
terminal ID: /[_a-zA-Z][\w_.-]*/;
terminal NUMBER returns number: /[1-9]+\d*/;
terminal STRING_VALUE: /"[^"]*"/;
terminal SIMPLE_VALUE: /[^,():>\s]+/;
