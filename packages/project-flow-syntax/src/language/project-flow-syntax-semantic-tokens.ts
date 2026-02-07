import type { AstNode } from 'langium';
import { CstUtils } from 'langium';
import { AbstractSemanticTokenProvider, type SemanticTokenAcceptor } from 'langium/lsp';
import { SemanticTokenTypes } from 'vscode-languageserver';
import {
    isResource,
    isMilestone,
    isCluster,
    isTask,
    isAttribute,
    isDependencySegment,
    isAssignment,
    isExplodeTask,
    isImplodeTask,
    isSplitTask,
} from './generated/ast.js';

export class ProjectFlowSyntaxSemanticTokenProvider extends AbstractSemanticTokenProvider {

    protected highlightElement(node: AstNode, acceptor: SemanticTokenAcceptor): void {
        if (isResource(node)) {
            this.highlightTerminal(node, 'RESOURCE_PREFIX', SemanticTokenTypes.type, acceptor);
            acceptor({ node, property: 'name', type: SemanticTokenTypes.type });
        } else if (isMilestone(node)) {
            this.highlightTerminal(node, 'MILESTONE_PREFIX', SemanticTokenTypes.enumMember, acceptor);
            acceptor({ node, property: 'name', type: SemanticTokenTypes.enumMember });
        } else if (isCluster(node)) {
            this.highlightTerminal(node, 'CLUSTER_PREFIX', SemanticTokenTypes.decorator, acceptor);
            acceptor({ node, property: 'name', type: SemanticTokenTypes.decorator });
        } else if (isTask(node)) {
            acceptor({ node, property: 'name', type: SemanticTokenTypes.property });
            this.highlightTerminals(node, 'NUMBER', SemanticTokenTypes.number, acceptor);
            if (node.description !== undefined) {
                this.highlightTerminals(node, 'STRING_VALUE', SemanticTokenTypes.string, acceptor);
            }
        } else if (isAttribute(node)) {
            acceptor({ node, property: 'name', type: SemanticTokenTypes.property });
            this.highlightAttributeValue(node, acceptor);
        } else if (isDependencySegment(node)) {
            acceptor({ node, keyword: '>', type: SemanticTokenTypes.operator });
        } else if (isAssignment(node)) {
            acceptor({ node, keyword: '>', type: SemanticTokenTypes.operator });
        } else if (isExplodeTask(node)) {
            acceptor({ node, keyword: '!', type: SemanticTokenTypes.operator });
        } else if (isImplodeTask(node)) {
            acceptor({ node, keyword: '/', type: SemanticTokenTypes.operator });
        } else if (isSplitTask(node)) {
            acceptor({ node, keyword: '*', type: SemanticTokenTypes.operator });
            acceptor({ node, keyword: '>', type: SemanticTokenTypes.operator });
        }
    }

    private highlightTerminal(node: AstNode, terminalName: string, type: string, acceptor: SemanticTokenAcceptor): void {
        const cstNode = node.$cstNode;
        if (!cstNode) return;
        for (const leaf of CstUtils.flattenCst(cstNode)) {
            if (leaf.tokenType.name === terminalName) {
                acceptor({ cst: leaf, type });
                return;
            }
        }
    }

    private highlightTerminals(node: AstNode, terminalName: string, type: string, acceptor: SemanticTokenAcceptor): void {
        const cstNode = node.$cstNode;
        if (!cstNode) return;
        for (const leaf of CstUtils.flattenCst(cstNode)) {
            if (leaf.tokenType.name === terminalName) {
                acceptor({ cst: leaf, type });
            }
        }
    }

    private highlightAttributeValue(node: AstNode, acceptor: SemanticTokenAcceptor): void {
        const cstNode = node.$cstNode;
        if (!cstNode) return;
        for (const leaf of CstUtils.flattenCst(cstNode)) {
            if (leaf.tokenType.name === 'STRING_VALUE') {
                acceptor({ cst: leaf, type: SemanticTokenTypes.string });
            } else if (leaf.tokenType.name === 'NUMBER') {
                acceptor({ cst: leaf, type: SemanticTokenTypes.number });
            }
        }
    }
}
