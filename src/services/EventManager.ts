export class EventManager {
  private events: { [key: string]: Function[] } = {};

  private static instance: EventManager;

  static {
    console.log('EventManager static initializer');
    EventManager.instance = new EventManager();
  }

  static on(eventName: string, callback: Function) {
    if (!this.instance.events[eventName]) {
      this.instance.events[eventName] = [];
    }
    this.instance.events[eventName].push(callback);
    // Return unsubscribe function
    return () => this.off(eventName, callback);
  }

  // Remove a specific listener
  static off(eventName: string, callback: Function) {
    if (!this.instance.events[eventName]) return;
    this.instance.events[eventName] = this.instance.events[eventName].filter(
      (cb) => cb !== callback,
    );
  }

  // Emit an event with data
  static emit(eventName: string, ...args: any[]) {
    console.log(`Emitting event: ${eventName} with args:`, args);
    console.log('Events: ', this.instance.events);
    if (!this.instance.events[eventName]) return;
    this.instance.events[eventName].forEach((callback) => {
      callback(...args);
    });
  }

  // Subscribe once, then auto-unsubscribe
  static once(eventName: string, callback: Function) {
    const onceWrapper = (...args: any[]) => {
      callback(...args);
      this.off(eventName, onceWrapper);
    };
    return this.on(eventName, onceWrapper);
  }
}
