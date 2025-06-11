import {MonacoEditorLanguageClientWrapper, UserConfig} from 'monaco-editor-wrapper';
import {MonacoLanguageClient} from "monaco-languageclient";
import {configureWorker, defineUserServices, SAMPLE_CODE} from './setupCommon.js';

export const setupConfigExtended = (): UserConfig => {
    const extensionFilesOrContents = new Map();
    extensionFilesOrContents.set('/language-configuration.json', new URL('../language-configuration.json', import.meta.url));
    extensionFilesOrContents.set('/project-flow-syntax-grammar.json', new URL('../syntaxes/project-flow-syntax.tmLanguage.json', import.meta.url));

    return {
        wrapperConfig: {
            serviceConfig: defineUserServices(),
            editorAppConfig: {
                $type: 'extended',
                editorOptions: {
                    minimap: {enabled: false},
                },
                languageId: 'project-flow-syntax',
                code: SAMPLE_CODE,
                useDiffEditor: false,
                extensions: [{
                    config: {
                        name: 'project-flow-syntax-web',
                        publisher: 'generator-langium',
                        version: '1.0.0',
                        engines: {
                            vscode: '*'
                        },
                        contributes: {
                            languages: [{
                                id: 'project-flow-syntax',
                                extensions: [
                                    '.project-flow-syntax'
                                ],
                                configuration: './language-configuration.json'
                            }],
                            grammars: [{
                                language: 'project-flow-syntax',
                                scopeName: 'source.project-flow-syntax',
                                path: './project-flow-syntax-grammar.json'
                            }]
                        }
                    },
                    filesOrContents: extensionFilesOrContents,
                }],
                userConfiguration: {
                    json: JSON.stringify({
                        'workbench.colorTheme': 'Default Dark Modern',
                        'editor.semanticHighlighting.enabled': true
                    })
                }
            }
        },
        languageClientConfig: configureWorker()
    };
};

export const executeExtended = async (htmlElement: HTMLElement): Promise<{
    wrapper: MonacoEditorLanguageClientWrapper;
    languageClient: MonacoLanguageClient;
}> => {
    const userConfig = setupConfigExtended();
    const wrapper = new MonacoEditorLanguageClientWrapper();
    await wrapper.initAndStart(userConfig, htmlElement);
    const languageClient = wrapper.getLanguageClient()!;
    return {wrapper, languageClient};
};
