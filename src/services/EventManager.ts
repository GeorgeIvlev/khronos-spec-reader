class EventManager {
  private events: { [key: string]: Function[] } = {};
  private listeners: { [key: string]: Function[] } = {};

  private static instance: EventManager;

  static {
    console.log('EventManager static initializer');
    EventManager.instance = new EventManager();
    EventManager.instance.setup();
  }

  // Initialization procedure
  setup() {
    window.addEventListener('beforeunload', this.cleanup);
  }

  cleanup() {
    console.log('CLEANUP EVENTS!');

    for (const [key, handlers] of Object.entries(EventManager.instance.listeners)) {
      for (const handler of handlers) {
        // @ts-ignore
        window.removeEventListener(key, handler);
      }
    }
  }

  static on(eventName: string, callback: Function) {
    if (!this.instance.events[eventName]) {
      this.instance.events[eventName] = [];
    }
    this.instance.events[eventName].push(callback);
    // Return unsubscribe function
    // @ts-ignore
    return () => this.off(eventName, callback);
  }

  // Remove a specific listener
  static off(eventName: string) {
    if (!this.instance.events[eventName]) return;
    this.instance.events[eventName] = [];
  }

  // Emit an event with data
  static emit(eventName: string, ...args: any[]) {
    // console.log(`Emitting event: ${eventName} with args:`, args)

    if (!this.instance.events[eventName]) return;
    this.instance.events[eventName].forEach((callback) => {
      callback(...args);
    });
  }

  // Subscribe once, then auto-unsubscribe
  static once(eventName: string, callback: Function) {
    const onceWrapper = (...args: any[]) => {
      callback(...args);
      // @ts-ignore
      this.off(eventName, onceWrapper);
    };
    return this.on(eventName, onceWrapper);
  }

  static listen(key: string, callback: Function) {
    if (!EventManager.instance.listeners[key]) {
      EventManager.instance.listeners[key] = [];
    }
    EventManager.instance.listeners[key].push(callback);
    // @ts-ignore
    window.addEventListener(key, callback);
  }
}

export default EventManager;
