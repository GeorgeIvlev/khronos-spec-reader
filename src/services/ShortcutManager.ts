/**
 * This logic handle the editor shortcuts
 * P.S. > Please note that editor component has own shortcuts keys!!!
 * But this logic can also affect them if option enabled...
 */

class ShortcutManager {
constructor() {

}
    public addShortcut(key: string, fn: () => void) {
    this.shortcuts.set(key, fn);
  }

  public removeShortcut(key: string) {
    this.shortcuts.delete(key);
  }

  private registerShortcuts() {

  }

  private shortcuts: Map<any, any> = new Map();
}

const shortcutManager = new ShortcutManager();
export default shortcutManager;
