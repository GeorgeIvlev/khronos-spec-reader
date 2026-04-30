class GlobalStateManager {
  private static instance: GlobalStateManager
  private static storedValues = new Map()

  static {
    console.log('GlobalStateManager static initializer')
    GlobalStateManager.instance = new GlobalStateManager()
    GlobalStateManager.instance.setup()
  }

  setup() {}

  static getValue(key: string | number) {
    return this.storedValues.get(key)
  }

  static setValue(key: any, value: any) {
    this.storedValues.set(key, value)
  }
}

export default GlobalStateManager
