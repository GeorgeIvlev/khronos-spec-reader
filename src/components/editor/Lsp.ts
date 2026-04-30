import { invoke, Channel } from '@tauri-apps/api/core'

// Type definitions matching Rust
export interface ClangdResponse {
  id?: number
  method?: string
  result?: any
  error?: any
}

export type ClangdMessage =
  | { type: 'initialize'; rootUri: string }
  | { type: 'didOpen'; uri: string; languageId: string; text: string }
  | { type: 'didChange'; uri: string; changes: { text: string }[] }
  | { type: 'completion'; uri: string; line: number; character: number }
  | { type: 'definition'; uri: string; line: number; character: number }
  | { type: 'hover'; uri: string; line: number; character: number }
  | { type: 'shutdown' }

export class ClangdClient {
  private channel?: Channel<ClangdResponse>
  private messageId = 0
  private pendingRequests = new Map<
    number,
    (response: ClangdResponse) => void
  >()

  async start(
    /**onResponse: (response: ClangdResponse) => void**/
  ): Promise<void> {
    // Create channel that stays open
    this.channel = new Channel<ClangdResponse>()

    this.channel.onmessage = (response: ClangdResponse) => {
      // Resolve pending requests
      // console.log('[CHANNEL MSG]: ', response)
      if (response.id !== undefined && this.pendingRequests.has(response.id)) {
        const resolver = this.pendingRequests.get(response.id)!
        this.pendingRequests.delete(response.id)
        resolver(response)
      }

      // Always notify listener
      // onResponse(response)
    }

    await invoke('clangd_start', { onEvent: this.channel })
  }

  initialize(rootPath: string): Promise<void> {
    return invoke('clangd_send', {
      message: { type: 'initialize', root_uri: rootPath },
    })
  }

  initialized() {
    return invoke('clangd_send', {
      message: { type: 'initialized' },
    })
  }

  async getCompletions(
    filePath: string,
    line: number,
    character: number,
  ): Promise<ClangdResponse> {
    return this.sendRequest({
      type: 'completion',
      uri: `file:///${filePath}`,
      line,
      character,
    })
  }

  async getDefinition(
    filePath: string,
    line: number,
    character: number,
  ): Promise<ClangdResponse> {
    return this.sendRequest({
      type: 'definition',
      uri: `file:///${filePath}`,
      line,
      character,
    })
  }

  async getHover(
    filePath: string,
    line: number,
    character: number,
  ): Promise<ClangdResponse> {
    return this.sendRequest({
      type: 'hover',
      uri: `file://${filePath}`,
      line,
      character,
    })
  }

  private async sendRequest(msg: ClangdMessage): Promise<ClangdResponse> {
    this.messageId++
    const currentId = this.messageId

    return new Promise((resolve) => {
      this.pendingRequests.set(currentId, resolve)
      this.send(msg)
    })
  }

  send(msg: ClangdMessage): Promise<void> {
    return invoke('clangd_send', { message: msg })
  }

  async stop(): Promise<void> {
    await this.send({ type: 'shutdown' })
    await invoke('clangd_stop')
    this.channel = undefined
  }
}

const clangdClient = new ClangdClient()
export default clangdClient
