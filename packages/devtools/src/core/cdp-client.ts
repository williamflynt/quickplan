import CDP from 'chrome-remote-interface'

export type CDPTarget = {
  id: string
  title: string
  url: string
  type: string
}

export type PageContent = {
  url: string
  title: string
  html: string
  text: string
}

export type LogEntry = {
  timestamp: number
  source: 'console' | 'exception' | 'network' | 'browser'
  level: string
  text: string
  url?: string
}

export class CDPClient {
  private client: CDP.Client | undefined

  async connect(options?: { host?: string; port?: number }): Promise<void> {
    const port = options?.port ?? 9222
    const host = options?.host ?? 'localhost'

    // Retry with exponential backoff
    let lastError: Error | undefined
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        this.client = await CDP({ host, port })
        await Promise.all([
          this.client.Page.enable(),
          this.client.Runtime.enable(),
          this.client.DOM.enable(),
        ])
        return
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err))
        await new Promise((r) => setTimeout(r, 100 * 2 ** attempt))
      }
    }
    throw new Error(
      `Failed to connect to CDP at ${host}:${port}: ${lastError?.message}`,
    )
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close()
      this.client = undefined
    }
  }

  private requireClient(): CDP.Client {
    if (!this.client) throw new Error('Not connected. Call connect() first.')
    return this.client
  }

  async listTargets(options?: {
    host?: string
    port?: number
  }): Promise<CDPTarget[]> {
    const targets = await CDP.List({
      host: options?.host ?? 'localhost',
      port: options?.port ?? 9222,
    })
    return targets.map((t) => ({
      id: t.id,
      title: t.title,
      url: t.url,
      type: t.type,
    }))
  }

  async getPageContent(): Promise<PageContent> {
    const client = this.requireClient()

    const urlResult = await client.Runtime.evaluate({
      expression: 'document.location.href',
    })
    const titleResult = await client.Runtime.evaluate({
      expression: 'document.title',
    })
    const htmlResult = await client.Runtime.evaluate({
      expression: 'document.documentElement.outerHTML',
    })
    const textResult = await client.Runtime.evaluate({
      expression: 'document.body.innerText',
    })

    return {
      url: String(urlResult.result.value ?? ''),
      title: String(titleResult.result.value ?? ''),
      html: String(htmlResult.result.value ?? ''),
      text: String(textResult.result.value ?? ''),
    }
  }

  async navigate(
    url: string,
    waitUntil: 'load' | 'domcontentloaded' = 'load',
  ): Promise<void> {
    const client = this.requireClient()
    await client.Page.navigate({ url })

    if (waitUntil === 'load') {
      await client.Page.loadEventFired()
    } else {
      await client.Page.domContentEventFired()
    }
  }

  async evaluate<T = unknown>(expression: string): Promise<T> {
    const client = this.requireClient()
    const result = await client.Runtime.evaluate({
      expression,
      returnByValue: true,
    })

    if (result.exceptionDetails) {
      throw new Error(
        result.exceptionDetails.text ??
          result.exceptionDetails.exception?.description ??
          'Evaluation failed',
      )
    }

    return result.result.value as T
  }

  async click(selector: string): Promise<void> {
    const client = this.requireClient()

    const doc = await client.DOM.getDocument()
    const node = await client.DOM.querySelector({
      nodeId: doc.root.nodeId,
      selector,
    })

    if (!node.nodeId) {
      throw new Error(`Element not found: ${selector}`)
    }

    const box = await client.DOM.getBoxModel({ nodeId: node.nodeId })
    const content = box.model.content
    // content is [x1,y1, x2,y2, x3,y3, x4,y4]
    const cx = (content[0] + content[2] + content[4] + content[6]) / 4
    const cy = (content[1] + content[3] + content[5] + content[7]) / 4

    await client.Input.dispatchMouseEvent({
      type: 'mousePressed',
      x: cx,
      y: cy,
      button: 'left',
      clickCount: 1,
    })
    await client.Input.dispatchMouseEvent({
      type: 'mouseReleased',
      x: cx,
      y: cy,
      button: 'left',
      clickCount: 1,
    })
  }

  async type(selector: string, text: string, delay = 0): Promise<void> {
    const client = this.requireClient()

    // Focus the element
    const doc = await client.DOM.getDocument()
    const node = await client.DOM.querySelector({
      nodeId: doc.root.nodeId,
      selector,
    })
    if (!node.nodeId) {
      throw new Error(`Element not found: ${selector}`)
    }
    await client.DOM.focus({ nodeId: node.nodeId })

    // Type each character
    for (const char of text) {
      await client.Input.dispatchKeyEvent({ type: 'keyDown', text: char })
      await client.Input.dispatchKeyEvent({ type: 'keyUp', text: char })
      if (delay > 0) {
        await new Promise((r) => setTimeout(r, delay))
      }
    }
  }

  async waitForSelector(selector: string, timeoutMs = 5000): Promise<void> {
    const client = this.requireClient()
    const start = Date.now()

    while (Date.now() - start < timeoutMs) {
      const result = await client.Runtime.evaluate({
        expression: `document.querySelector(${JSON.stringify(selector)}) !== null`,
      })
      if (result.result.value === true) return
      await new Promise((r) => setTimeout(r, 100))
    }

    throw new Error(`Timed out waiting for selector: ${selector}`)
  }

  async screenshot(options?: { fullPage?: boolean }): Promise<string> {
    const client = this.requireClient()

    const params: { format: string; captureBeyondViewport?: boolean } = {
      format: 'png',
    }
    if (options?.fullPage) {
      params.captureBeyondViewport = true
    }

    const result = await client.Page.captureScreenshot(params as never)
    return result.data
  }

  onConsoleMessage(cb: (msg: { level: string; text: string }) => void): void {
    const client = this.requireClient()
    client.Runtime.consoleAPICalled((event) => {
      cb({
        level: event.type,
        text: event.args.map((a) => a.value ?? a.description ?? '').join(' '),
      })
    })
  }

  async subscribeLogs(
    options: { network?: boolean },
    cb: (entry: LogEntry) => void,
  ): Promise<void> {
    const client = this.requireClient()

    // Enable Log domain for browser-level log entries
    await client.Log.enable()

    // Console API calls (console.log, console.warn, etc.)
    client.Runtime.consoleAPICalled((event) => {
      cb({
        timestamp: event.timestamp ?? Date.now(),
        source: 'console',
        level: event.type,
        text: event.args.map((a) => a.value ?? a.description ?? '').join(' '),
      })
    })

    // Uncaught exceptions
    client.Runtime.exceptionThrown((event) => {
      const ex = event.exceptionDetails
      cb({
        timestamp: Date.now(),
        source: 'exception',
        level: 'error',
        text: ex.exception?.description ?? ex.text ?? 'Unknown exception',
        url: ex.url,
      })
    })

    // Browser-level log entries (security, deprecation, etc.)
    client.Log.entryAdded((event) => {
      const entry = event.entry
      cb({
        timestamp: entry.timestamp ?? Date.now(),
        source: 'browser',
        level: entry.level,
        text: entry.text,
        url: entry.url,
      })
    })

    // Network events (optional)
    if (options.network) {
      await client.Network.enable()

      client.Network.requestWillBeSent((event) => {
        cb({
          timestamp: Date.now(),
          source: 'network',
          level: 'info',
          text: `${event.request.method} ${event.request.url}`,
          url: event.request.url,
        })
      })

      client.Network.responseReceived((event) => {
        const status = event.response.status
        const level = status >= 400 ? 'error' : 'info'
        cb({
          timestamp: Date.now(),
          source: 'network',
          level,
          text: `${status} ${event.response.url}`,
          url: event.response.url,
        })
      })

      client.Network.loadingFailed((event) => {
        cb({
          timestamp: Date.now(),
          source: 'network',
          level: 'error',
          text: `FAILED ${event.errorText} (${event.type ?? 'unknown'})`,
        })
      })
    }
  }
}
