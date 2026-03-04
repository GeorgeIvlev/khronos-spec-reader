/**
 * This logic handle the editor shortcuts
 * P.S. > Please note that editor component has own shortcuts keys!!!
 * But this logic can also affect them if option enabled...
 */

class ShortcutManager {
  constructor() {
    document.addEventListener('keydown', this.onKeyDown);
  }

  cleanup() {
    document.removeEventListener('keydown', this.onKeyDown);
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
  };

  public addShortcut(key: string, fn: () => void) {
    this.shortcuts.set(key, fn);
  }

  public removeShortcut(key: string) {
    this.shortcuts.delete(key);
  }

  private registerShortcuts() {}

  // modifier, key, fn
  private shortcuts: Map<any, any> = new Map();
}

const shortcutManager = new ShortcutManager();
export default shortcutManager;
