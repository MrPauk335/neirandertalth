/**
 * ============================================================================
 * NEIRANDERTALTH: TIMELINE PARADOX — CHRONICLE FEED (src/ui/ChronicleFeed.js)
 * Живая Хроника Земли: поток исторических событий, преступлений и открытий.
 * ============================================================================
 */

import { globalEvents } from '../core/EventBus.js';

export class ChronicleFeed {
    constructor() {
        this.container = document.getElementById('chronicleFeed');
        this.maxItems = 45;

        globalEvents.on('CHRONICLE_LOG', (data) => this.addEntry(data.text, data.type));
    }

    addEntry(text, type = 'system') {
        if (!this.container) return;

        const entry = document.createElement('div');
        entry.className = `chronicle-entry ${type}`;
        entry.innerHTML = `<span class="time">[Летопись]</span> <span class="text">${text}</span>`;

        this.container.prepend(entry);

        while (this.container.children.length > this.maxItems) {
            this.container.removeChild(this.container.lastChild);
        }
    }

    clear() {
        if (this.container) this.container.innerHTML = '';
    }
}
