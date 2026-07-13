import { EventEmitter } from "events";

class TypedEventEmitter extends EventEmitter {
  // Simple wrapper for now, can be expanded if needed
}

export const eventBus = new TypedEventEmitter();
