export type CDPTarget = {
    id: string;
    title: string;
    url: string;
    type: string;
};
export type PageContent = {
    url: string;
    title: string;
    html: string;
    text: string;
};
export type LogEntry = {
    timestamp: number;
    source: 'console' | 'exception' | 'network' | 'browser';
    level: string;
    text: string;
    url?: string;
};
export declare class CDPClient {
    private client;
    connect(options?: {
        host?: string;
        port?: number;
    }): Promise<void>;
    disconnect(): Promise<void>;
    private requireClient;
    listTargets(options?: {
        host?: string;
        port?: number;
    }): Promise<CDPTarget[]>;
    getPageContent(): Promise<PageContent>;
    navigate(url: string, waitUntil?: 'load' | 'domcontentloaded'): Promise<void>;
    evaluate<T = unknown>(expression: string): Promise<T>;
    click(selector: string): Promise<void>;
    type(selector: string, text: string, delay?: number): Promise<void>;
    waitForSelector(selector: string, timeoutMs?: number): Promise<void>;
    screenshot(options?: {
        fullPage?: boolean;
    }): Promise<string>;
    onConsoleMessage(cb: (msg: {
        level: string;
        text: string;
    }) => void): void;
    subscribeLogs(options: {
        network?: boolean;
    }, cb: (entry: LogEntry) => void): Promise<void>;
}
