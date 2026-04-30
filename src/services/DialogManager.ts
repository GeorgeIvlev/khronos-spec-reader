import { open } from '@tauri-apps/plugin-dialog'

interface IFilter {
  name: string
  extensions: string[]
}

// { name: 'Code', extensions: ['js', 'ts', 'jsx', 'tsx'] },
// { name: 'All', extensions: ['*'] },

interface IOpenSettings {
  multiple?: boolean
  filters?: IFilter[]
  directory?: boolean
}

class DialogManager {
  openDialog = (options?: IOpenSettings) => {
    return open(options)
  }
}

export default DialogManager
