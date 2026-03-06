export class EventManager {
  private events: { [key: string]: Function[] } = {};

  private static instance: EventManager;

  static {
    console.log('EventManager static initializer');
    EventManager.instance = new EventManager();
  }

  on(eventName: string, callback: Function) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);
    // Return unsubscribe function
    return () => this.off(eventName, callback);
  }

  // Remove a specific listener
  off(eventName: string, callback: Function) {
    if (!this.events[eventName]) return;
    this.events[eventName] = this.events[eventName].filter(
      (cb) => cb !== callback,
    );
  }

  // Emit an event with data
  emit(eventName: string, ...args: any[]) {
    console.log(`Emitting event: ${eventName} with args:`, args);
    console.log('Events: ', this.events);
    if (!this.events[eventName]) return;
    this.events[eventName].forEach((callback) => {
      callback(...args);
    });
  }

  // Subscribe once, then auto-unsubscribe
  once(eventName: string, callback: Function) {
    const onceWrapper = (...args: any[]) => {
      callback(...args);
      this.off(eventName, onceWrapper);
    };
    return this.on(eventName, onceWrapper);
  }
}
