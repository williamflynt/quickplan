// Custom Monaco theme for Project Flow Syntax
export const projectFlowSyntaxTheme = {
    base: 'vs-dark' as const,
    inherit: true,
    rules: [
        // Milestones - bright magenta/pink
        { token: 'milestone.prefix', foreground: 'ff79c6', fontStyle: 'bold' },
        { token: 'milestone.name', foreground: 'ff79c6' },
        
        // Resources - bright green
        { token: 'resource.prefix', foreground: '50fa7b', fontStyle: 'bold' },
        { token: 'resource.name', foreground: '50fa7b' },
        
        // Clusters - bright cyan
        { token: 'cluster.prefix', foreground: '8be9fd', fontStyle: 'bold' },
        { token: 'cluster.name', foreground: '8be9fd' },
        
        // Tasks - default white/foreground
        { token: 'task.name', foreground: 'f8f8f2' },
        
        // Negation - red
        { token: 'negate', foreground: 'ff5555', fontStyle: 'bold' },
        
        // Numbers - orange
        { token: 'number', foreground: 'ffb86c' },
        
        // Strings - yellow
        { token: 'string', foreground: 'f1fa8c' },
        
        // Operators - pink
        { token: 'operator', foreground: 'ff79c6' },
        
        // Comments - muted gray
        { token: 'comment', foreground: '6272a4', fontStyle: 'italic' },
        
        // Attribute values - light purple
        { token: 'attribute.value', foreground: 'bd93f9' },
    ],
    colors: {
        'editor.background': '#282a36',
        'editor.foreground': '#f8f8f2',
    }
};
