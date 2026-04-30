/**
 * This logic handle the editor shortcuts
 * P.S. > Please note that editor component has own shortcuts keys!!!
 * But this logic can also affect them if option enabled...
 */
import EventManager from '@services/EventManager'

const threshold = 300
let lastTime = 0

class ShortcutManager {
  constructor() {
    EventManager.listen('keydown', this.onKeyDown)
  }

  cleanup() {
    // @ts-ignore
    window.eventListeners?.forEach((unlisten: Function) => {
      unlisten()
    })
  }

  private onKeyDown = (e: KeyboardEvent) => {
    // if (e.ctrlKey) {
    //   e.which == 9;
    // }
    // if (e.altKey) {
    // }
    // if (e.shiftKey) {
    // }
    // console.log('shortcut manager keydown', e);
    // const key = e.key;
    // if (this.shortcuts.has(key)) {
    //   const fn = this.shortcuts.get(key);
    //   fn();
    // }

    if (e.key !== 'Shift' || e.repeat) return

    const now = Date.now()
    const isDouble = now - lastTime < threshold

    if (isDouble) {
      lastTime = 0
      e.preventDefault()
      e.stopPropagation()
      EventManager.emit('file-select-start')
    } else {
      lastTime = now
    }
  }

  public addShortcut(key: string, fn: () => void) {
    this.shortcuts.set(key, fn)
  }

  public removeShortcut(key: string) {
    this.shortcuts.delete(key)
  }

  private registerShortcuts() {}

  // modifier, key, fn
  private shortcuts: Map<any, any> = new Map()
}

const shortcutManager = new ShortcutManager()
export default shortcutManager
