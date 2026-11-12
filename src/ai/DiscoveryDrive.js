/**
 * ============================================================================
 * NEIRANDERTALTH: TIMELINE PARADOX — DISCOVERY DRIVE (src/ai/DiscoveryDrive.js)
 * «Грязная Эврика»: случайные открытия маргиналов, двигающие цивилизацию.
 * ============================================================================
 */

import { TIMELINE_CONFIG } from '../config/constants.js';
import { globalSound } from '../core/SoundSynthesizer.js';
import { globalEvents } from '../core/EventBus.js';

export class DiscoveryDrive {
    constructor() {
        this.timer = 0;
        this.quotes = [
            'Если смешать горячий битум с костяной крошкой — получается броня!',
            'Колеса на смоляной оси крутятся втрое быстрее!',
            'Если запаять пар в медный цилиндр — он толкает поршень!',
            'Вспышка серы в замкнутой трубке выбрасывает свинцовый шарик!',
            'Кристалл очищенной смолы светится синим неоновым огнем!',
            'Антигравитационная подушка держит вес целого мамонта!',
            'Время не течет по прямой — это кольцевой разлом!'
        ];
    }

    update(dt, entities, causalityEngine, timelineGraph) {
        this.timer += dt;
        if (this.timer >= TIMELINE_CONFIG.BASE_EUREKA_INTERVAL) {
            this.timer = 0;
            this.triggerEureka(entities, causalityEngine, timelineGraph);
        }
    }

    triggerEureka(entities, causalityEngine, timelineGraph) {
        const candidates = entities.npcs.filter(n => !n.isDead && (n.role === 'BEGGAR' || n.role === 'CITIZEN'));
        if (candidates.length === 0) return;

        const speaker = candidates[Math.floor(Math.random() * candidates.length)];
        const text = this.quotes[Math.floor(Math.random() * this.quotes.length)];

        speaker.say(text, 5.0, true);
        globalSound.playEureka();
        entities.spawnSparks(speaker.x, speaker.y, 18, '#ffb703');

        causalityEngine.registerIntervention('DIRTY_EUREKA', timelineGraph.activeEpochIndex, timelineGraph, { text });

        globalEvents.emit('CHRONICLE_LOG', {
            text: `ГРЯЗНАЯ ЭВРИКА: «${text}»! Прогресс ускорен.`,
            type: 'eureka'
        });
        globalEvents.emit('NOTIFICATION', 'Грязная Эврика сдвинула ход цивилизации!');
    }
}
