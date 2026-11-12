/**
 * ============================================================================
 * NEIRANDERTALTH: TIMELINE PARADOX — TIMELINE GRAPH (src/timeline/TimelineGraph.js)
 * Многомерное древо 5 Эпох, управление переходами и сохранение мутаций истории.
 * ============================================================================
 */

import { globalEvents } from '../core/EventBus.js';

export class TimelineGraph {
    constructor(presetsData) {
        this.epochs = presetsData.epochs;
        this.activeEpochIndex = 0;
        this.timelineDivergence = 0; // 0..100% индекс парадоксальности истории
        this.ripples = []; // Список совершенных игроком вмешательств (Butterfly Effect)

        // Состояние каждой эпохи (может мутировать от действий в прошлом)
        this.epochStates = this.epochs.map(e => ({
            id: e.id,
            name: e.name,
            yearText: e.yearText,
            population: 60 + Math.floor(Math.random() * 30),
            dominantReligion: 'Первобытный Шаманизм',
            technologyProgress: 10,
            ruined: false,
            cyberneticCult: false,
            sacredMammothMonuments: false,
            extinctClans: 0,
            stolenArtifacts: []
        }));
    }

    getCurrentEpoch() {
        return this.epochs[this.activeEpochIndex];
    }

    getCurrentState() {
        return this.epochStates[this.activeEpochIndex];
    }

    jumpToEpoch(targetIndex) {
        if (targetIndex < 0 || targetIndex >= this.epochs.length) return false;
        const prevEpoch = this.epochs[this.activeEpochIndex];
        this.activeEpochIndex = targetIndex;
        const newEpoch = this.epochs[this.activeEpochIndex];

        globalEvents.emit('EPOCH_CHANGED', {
            from: prevEpoch,
            to: newEpoch,
            state: this.getCurrentState()
        });
        return true;
    }

    advanceEpoch() {
        const nextIdx = (this.activeEpochIndex + 1) % this.epochs.length;
        return this.jumpToEpoch(nextIdx);
    }
}
