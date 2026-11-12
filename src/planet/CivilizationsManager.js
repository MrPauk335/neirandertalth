/**
 * ============================================================================
 * NEIRANDERTALTH: TIMELINE PARADOX — CIVILIZATIONS MANAGER (src/planet/CivilizationsManager.js)
 * Симуляция автономной жизни племен, городов, религий, войн и открытий.
 * ============================================================================
 */

import { globalEvents } from '../core/EventBus.js';

export class CivilizationsManager {
    constructor() {
        this.factions = [
            {
                id: 'faction_prime',
                name: 'Племя Смоляного Огня (Неандертальцы)',
                epoch: 0,
                population: 48,
                food: 120,
                bitumenReserves: 80,
                techScore: 15,
                morale: 85,
                status: 'Охота на мамонтов в тундре'
            },
            {
                id: 'faction_ziggurat',
                name: 'Царство Черного Зиккурата',
                epoch: 1,
                population: 140,
                food: 350,
                bitumenReserves: 420,
                techScore: 55,
                morale: 90,
                status: 'Строительство смоляных каналов и колесниц'
            },
            {
                id: 'faction_steam',
                name: 'Индустриальный Синдикат Поршня',
                epoch: 2,
                population: 320,
                food: 800,
                bitumenReserves: 1100,
                techScore: 140,
                morale: 70,
                status: 'Выплавка паровых броневиков и булыжных мостовых'
            },
            {
                id: 'faction_cyber',
                name: 'Нео-Петролеум Директорат',
                epoch: 3,
                population: 850,
                food: 2200,
                bitumenReserves: 3400,
                techScore: 380,
                morale: 80,
                status: 'Производство антигравитационных спидеров и плазмы'
            }
        ];

        this.simTimer = 0;
    }

    update(dt, timelineGraph) {
        this.simTimer += dt;
        if (this.simTimer >= 5.0) {
            this.simTimer = 0;
            this.stepSimulation(timelineGraph);
        }
    }

    stepSimulation(timelineGraph) {
        const currentEpoch = timelineGraph.activeEpochIndex;
        const currentFaction = this.factions[Math.min(this.factions.length - 1, currentEpoch)];

        if (!currentFaction) return;

        // Автономный прирост ресурсов и динамика жизни
        currentFaction.food += Math.floor(Math.random() * 8 + 2);
        currentFaction.bitumenReserves += Math.floor(Math.random() * 6 + 1);

        if (currentFaction.food > 200 && Math.random() > 0.6) {
            currentFaction.population += 1;
            timelineGraph.getCurrentState().population = currentFaction.population;
        }

        // Случайные события автономной цивилизации
        const events = [
            'Успешная облава на первобытного тура у битумной топи.',
            'Жрецы смолы провели ритуал очищения колесниц.',
            'В мануфактурах внедрен новый паровой клапан высокого давления.',
            'Квантовый монолит завершил картирование пространственных аномалий.'
        ];

        if (Math.random() > 0.7) {
            const evText = events[Math.min(events.length - 1, currentEpoch)];
            currentFaction.status = evText;
            globalEvents.emit('CHRONICLE_LOG', {
                text: `[${currentFaction.name}]: ${evText}`,
                type: 'system'
            });
        }
    }
}
