import { EventEmitter } from "node:events";
import { IDocument } from "../modules/documents/document.model.js";

// Define the payload structures for our events
export interface EventPayloads {
  "document.created": { document: IDocument };
  "document.verified": { document: IDocument };
  "document.deleted": { documentId: string; size: number };
  "document.requestSync": void; // Triggered by dashboard on startup
  "document.sync": { documents: IDocument[] }; // Replied by document store
}

// Strictly typed EventBus
class EventBus extends EventEmitter {
  emit<K extends keyof EventPayloads>(
    eventName: K,
    payload: EventPayloads[K]
  ): boolean {
    return super.emit(eventName, payload);
  }

  on<K extends keyof EventPayloads>(
    eventName: K,
    listener: (payload: EventPayloads[K]) => void
  ): this {
    return super.on(eventName, listener);
  }

  off<K extends keyof EventPayloads>(
    eventName: K,
    listener: (payload: EventPayloads[K]) => void
  ): this {
    return super.off(eventName, listener);
  }
}

export const eventBus = new EventBus();
