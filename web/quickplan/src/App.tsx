import React, {FC, useEffect, useRef, useState} from 'react';
import {executeExtended} from "../../../submodules/ProjectFlowSyntax/project-flow-syntax/src/setupExtended";
import {configureMonacoWorkers} from "../../../submodules/ProjectFlowSyntax/project-flow-syntax/src/setupCommon";
import {Monaco} from "./components/Monaco";
import {Flow} from "./components/ReactFlow/Flow";
import {MarkerType, Position, ReactFlowProvider} from "@xyflow/react";
import {useStore} from "./store/store";
import 'antd/dist/antd.css'
import './assets/App.css'
import '@xyflow/react/dist/style.css';
import ELK from 'elkjs/lib/elk.bundled.js';
import {runCpm} from './wasm/wasmLoader';

// Constants for layout breakpoints
const BREAKPOINT_NARROW = 768; // px - Switch to 80 columns
const BREAKPOINT_VERTICAL = 576; // px - Switch to vertical layout
const elk = new ELK(); // Layout engine.

export const App: FC = () => {
    // Refs for DOM elements and Monaco instances
    const editorRef = useRef<HTMLDivElement>(null);
    const wrapperRef = useRef<any>(null);
    const languageClientRef = useRef<any>(null);

    // State for layout management
    const [layout, setLayout] = useState('wide'); // 'wide', 'narrow', or 'vertical'
    const flowInstance = useStore(state => state.flowInstance)

    // TODO: Resources and Assignments
    // TODO: Language change to add `<taskId> low? likely? high? <descr>`
    // TODO: Figure out why Monaco editor freezes and does weird stuff

    // Initialize Monaco editor and language client
    useEffect(() => {
        if (!editorRef.current) return;

        configureMonacoWorkers();
        void executeExtended(editorRef.current).then(({wrapper, languageClient}) => {
            wrapperRef.current = wrapper;
            languageClientRef.current = languageClient;
            // Set up notification handler to update ReactFlow.
            languageClient.onNotification('browser/DocumentChange', (params) => {
                // Update the ReactFlow graph depiction.
                const asObj = {...params}
                asObj.content = JSON.parse(asObj.content)
                asObj.project = JSON.parse(asObj.project)
                updateFlowFromDocument(flowInstance, asObj);
            });
        });

        return () => {
            // TODO: Cleanup logic for Monaco editor if needed.
            if (wrapperRef.current) {
                // Nothing yet.
            }
        };
    }, [editorRef.current, flowInstance]);

    // Handle window resize for responsive layout
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < BREAKPOINT_VERTICAL) {
                setLayout('vertical');
            } else if (window.innerWidth < BREAKPOINT_NARROW) {
                setLayout('narrow');
            } else {
                setLayout('wide');
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // Set initial layout

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);


    const styles = getLayoutStyles(layout);

    return (
        <ReactFlowProvider>
            <div style={{
                display: 'flex',
                ...styles.container,
                overflow: 'hidden'
            }}>
                <div style={{
                    ...styles.editor,
                    overflow: 'hidden',
                    border: '1px solid #ddd',
                    boxShadow: '0 0 8px rgba(0,0,0,0.1)'
                }}>
                    <Monaco editorRef={editorRef} style={{width: '100%', height: '100%'}}/>
                </div>

                <div style={{
                    ...styles.flow,
                    overflow: 'hidden',
                    border: '1px solid #ddd',
                    boxShadow: '0 0 8px rgba(0,0,0,0.1)'
                }}>
                    <Flow/>
                </div>
            </div>
        </ReactFlowProvider>
    );
};

// Get styles based on current layout
const getLayoutStyles = (layout: string) => {
    switch (layout) {
        case 'vertical':
            return {
                container: {
                    flexDirection: 'column',
                    height: '100vh'
                },
                editor: {
                    width: '100%',
                    height: '30vh'
                },
                flow: {
                    width: '100%',
                    height: '70vh'
                }
            };
        case 'narrow':
            return {
                container: {
                    flexDirection: 'row',
                    height: '100vh'
                },
                editor: {
                    width: '320px', // Approximately 80 columns
                    height: '100%'
                },
                flow: {
                    flex: 1,
                    height: '100%'
                }
            };
        case 'wide':
        default:
            return {
                container: {
                    flexDirection: 'row',
                    height: '100vh'
                },
                editor: {
                    width: '480px', // Approximately 100-120 columns
                    height: '100%'
                },
                flow: {
                    flex: 1,
                    height: '100%'
                }
            };
    }
};

const updateFlowFromDocument = (flowInstance, data) => {
    const edges = data.project.dependencies.map((e) => {
        const srcId = `${e.source.type}:${e.source.name}`
        const tgtId = `${e.target.type}:${e.target.name}`
        return {
            id: [srcId, tgtId].join(" > "),
            source: srcId,
            target: tgtId,
            sources: [srcId], // For ELK.
            targets: [tgtId], // For ELK.
            markerEnd: {type: MarkerType.ArrowClosed},
            style: {strokeWidth: 3}
        }
    })
    const taskNodes = Object.values(data.project.tasks).map((t) => {
        return {
            id: `${t.type}:${t.name}`,
            type: 'cpmTask',
            position: {x: 0, y: 0},
            data: {
                label: t.name,
                description: t.name + t.name,
                cpm: {
                    durationLow: t.durationLow || 1,
                    durationLikely: t.durationLikely || 2,
                    durationHigh: t.durationHigh || 3,
                },
                predecessors: [],
            }
        }
    })
    // TODO: include milestone nodes in our CPM because otherwise slack/cpm isn't right
    const milestoneNodes = Object.values(data.project.milestones).map((m) => {
        return {
            id: `${m.type}:${m.name}`,
            position: {x: 0, y: 0},
            data: {label: m.name},
            sourcePosition: Position.Right,
            targetPosition: Position.Left
        }
    })
    /**
     * The `runCpm` from WASM returns an object like `{ error: string, chart: Chart }`.
     * Chart is laid out like:
     *
     * type Chart struct {
     *    Nodes  []*Node `json:"nodes"`
     *    Arrows []Arrow `json:"arrows"`
     *    Id     string  `json:"id"`
     *    Title  string  `json:"title"`
     * }
     *
     * type Node struct {
     *    Id          string            `json:"id"`
     *    Title       string            `json:"title"`
     *    Description string            `json:"description"`
     *    Meta        map[string]string `json:"meta"`
     *    Position    NodePosition      `json:"position"`
     *
     *    Duration       float64 `json:"duration"`
     *    DurationLow    int     `json:"durationLow"`    // DurationLow is the minimum length to accomplish the Task in arbitrary units.
     *    DurationLikely int     `json:"durationLikely"` // DurationLikely is the most likely length to accomplish the Task in arbitrary units.
     *    DurationHigh   int     `json:"durationHigh"`   // DurationHigh is the longest length to accomplish the Task in arbitrary units.
     *
     *    Label          string  `json:"label"`
     *    EarliestStart  float64 `json:"earliestStart"`
     *    EarliestFinish float64 `json:"earliestFinish"`
     *    LatestStart    float64 `json:"latestStart"`
     *    LatestFinish   float64 `json:"latestFinish"`
     *    Slack          float64 `json:"slack"`
     *
     *    ...
     * }
     *
     * type Arrow struct {
     *    Id           string `json:"id"`
     *    From         string `json:"from"`
     *    To           string `json:"to"`
     *    CriticalPath bool   `json:"criticalPath"`
     * }
     */
    void runCpm(nodesForWasm(edges, taskNodes))
        .then((chart) => {
            // Create lookup maps for faster access
            const cpmNodesMap = {};
            chart.nodes.forEach(cpmNode => {
                cpmNodesMap[cpmNode.id] = cpmNode;
            });

            const cpmArrowsMap = {};
            chart.arrows.forEach(arrow => {
                cpmArrowsMap[`${arrow.from} > ${arrow.to}`] = arrow;
            });

            // Update nodes with CPM data
            const updatedNodes = taskNodes.map(node => {
                const cpmNode = cpmNodesMap[node.id];
                if (!cpmNode) return node;

                return {
                    ...node,
                    data: {
                        ...node.data,
                        cpm: {
                            ...node.data.cpm,
                            earliestStart: cpmNode.earliestStart,
                            earliestFinish: cpmNode.earliestFinish,
                            latestStart: cpmNode.latestStart,
                            latestFinish: cpmNode.latestFinish,
                            slack: cpmNode.slack,
                            duration: cpmNode.duration
                        }
                    },
                };
            });

            // Update edges with critical path indicators
            const updatedEdges = edges.map(edge => {
                const cpmArrow = cpmArrowsMap[edge.id];
                if (!cpmArrow) return edge;

                const e = {
                    ...edge,
                    data: {
                        ...edge.data,
                        criticalPath: cpmArrow.criticalPath
                    }
                }
                if (e.data.criticalPath) {
                    e.style = {stroke: 'red', strokeWidth: 3, opacity: 0.5}
                    e.markerEnd = {type: MarkerType.ArrowClosed, color: 'red'}
                }
                return e
            });

            return doLayout([...updatedNodes, ...milestoneNodes], updatedEdges);
        })
        .then(([nodesPositioned, edgesPositioned]) => {
            if (!flowInstance) return;
            flowInstance.setNodes(nodesPositioned);
            flowInstance.setEdges(edgesPositioned);
        });
};

const LAYOUT_OPTIONS = {
    'elk.algorithm': 'layered',
    'elk.direction': 'RIGHT',
    'elk.layered.spacing.nodeNodeBetweenLayers': 100,
    'elk.spacing.nodeNode': 80,
}

const doLayout = async (nodes, edges) => {
    const graph = {
        id: 'root',
        layoutOptions: LAYOUT_OPTIONS,
        children: nodes.map((n) => {
            return {...n, width: 150, height: 100}
        }),
        edges: edges
    }
    return elk.layout(graph).then(({children}) => {
        const positionedNodes = children.map((node) => {
            return {...node, position: {x: node.x, y: node.y}};
        });
        return [positionedNodes, edges]
    })
}

/**
 * Transform a CpmTaskNode into the shape our WASM bundle expects:
 *
 * type jsTask struct {
 *    Uid_           string            `json:"uid"`
 *    Title_         string            `json:"title"`
 *    Description_   string            `json:"description"`
 *    Meta_          map[string]string `json:"meta"`
 *    DurationLow    int               `json:"durationLow"`
 *    DurationLikely int               `json:"durationLikely"`
 *    DurationHigh   int               `json:"durationHigh"`
 *    Predecessors_  []string          `json:"predecessors"`
 * }
 *
 */
const nodesForWasm = (edges, nodes) => {
    // First get a map of { target: predecessor[] } from edges.
    const predMap = {}
    for (const {source, targets} of edges) {
        for (const target of targets) {
            if (!predMap[target]) {
                predMap[target] = [source]
                continue
            }
            predMap[target].push(source)
        }
    }
    return nodes.map((n) => {
        return {
            uid: n.id,
            title: '$RESET',
            description: n.data.description,
            meta: {},
            durationLow: n.data.cpm.durationLow,
            durationLikely: n.data.cpm.durationLikely,
            durationHigh: n.data.cpm.durationHigh,
            predecessors: predMap[n.id],
        }
    })
}