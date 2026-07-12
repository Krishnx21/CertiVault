import { EventEmitter } from "events";
import { IDocument } from "../modules/documents/document.model.js";

type EventMap = {
  documentCreated: (doc: IDocument) => void;
  documentUpdated: (doc: IDocument) => void;
  documentDeleted: (id: string) => void;
};

class TypedEventEmitter extends EventEmitter {
  emit<K extends keyof EventMap>(eventName: K, ...args: Parameters<EventMap[K]>): boolean {
    return super.emit(eventName, ...args);
  }

  on<K extends keyof EventMap>(eventName: K, listener: EventMap[K]): this {
    return super.on(eventName, listener);
  }
}

export const eventBus = new TypedEventEmitter();
