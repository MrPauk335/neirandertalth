/**
 * ============================================================================
 * NEIRANDERTALTH: TIMELINE PARADOX — EVENT BUS (src/core/EventBus.js)
 * Шина событий (Pub/Sub) для слабой связанности подсистем движка.
 * ============================================================================
 */

export class EventBus {
    constructor() {
        this.listeners = new Map();
    }

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
        return () => this.off(event, callback);
    }

    off(event, callback) {
        if (!this.listeners.has(event)) return;
        const callbacks = this.listeners.get(event).filter(cb => cb !== callback);
        this.listeners.set(event, callbacks);
    }

    emit(event, data) {
        if (!this.listeners.has(event)) return;
        const callbacks = this.listeners.get(event);
        for (let i = 0; i < callbacks.length; i++) {
            try {
                callbacks[i](data);
            } catch (err) {
                console.error(`Ошибка в обработчике события [${event}]:`, err);
            }
        }
    }
}

export const globalEvents = new EventBus();
