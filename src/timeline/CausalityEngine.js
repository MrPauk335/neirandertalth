/**
 * ============================================================================
 * NEIRANDERTALTH: TIMELINE PARADOX — CAUSALITY ENGINE (src/timeline/CausalityEngine.js)
 * Движок «Эффекта Бабочки»: расчет каскадных мутаций будущего от действий в прошлом.
 * ============================================================================
 */

import { globalEvents } from '../core/EventBus.js';

export class CausalityEngine {
    constructor() {
        this.ripplesHistory = [];
    }

    /**
     * Регистрация вмешательства игрока в таймлайн
     */
    registerIntervention(actionType, epochIndex, timelineGraph, details = {}) {
        const ripple = {
            id: `ripple_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            actionType,
            originEpochIndex: epochIndex,
            originYear: timelineGraph.epochs[epochIndex].yearText,
            timestamp: Date.now(),
            desc: '',
            consequences: []
        };

        timelineGraph.timelineDivergence = Math.min(100, timelineGraph.timelineDivergence + 8);

        switch (actionType) {
            case 'MASSACRE':
                ripple.desc = `Кровавая резня в эпохе [${timelineGraph.epochs[epochIndex].name}] (${details.kills} жертв).`;
                // Каскад на все будущие эпохи
                for (let e = epochIndex + 1; e < timelineGraph.epochs.length; e++) {
                    const future = timelineGraph.epochStates[e];
                    future.population = Math.max(15, future.population - details.kills * 2);
                    future.extinctClans += 1;
                    const cText = `Эпоха [${future.name}]: Вымирание древнего рода привело к депопуляции. Население упало до ${future.population}.`;
                    ripple.consequences.push(cText);
                }
                break;

            case 'SACRED_BEAST_THEFT':
                ripple.desc = `Дерзкий угон священного зверя/техники: «${details.vehicleName}».`;
                for (let e = epochIndex + 1; e < timelineGraph.epochs.length; e++) {
                    const future = timelineGraph.epochStates[e];
                    future.sacredMammothMonuments = true;
                    future.dominantReligion = 'Культ Небесного Всадника на Звере';
                    const cText = `Эпоха [${future.name}]: Воздвигнуты статуи Всадника Откровения! Доминирует культ: ${future.dominantReligion}.`;
                    ripple.consequences.push(cText);
                }
                break;

            case 'DIRTY_EUREKA':
                ripple.desc = `Маргинальное открытие древности: «${details.text}».`;
                for (let e = epochIndex + 1; e < timelineGraph.epochs.length; e++) {
                    const future = timelineGraph.epochStates[e];
                    future.technologyProgress += 20;
                    const cText = `Эпоха [${future.name}]: Технологический рывок! Прогресс цивилизации вырос на +20%.`;
                    ripple.consequences.push(cText);
                }
                break;

            case 'METEOR_IMPACT':
                ripple.desc = `Божественный метеорит обрушился в эпоху [${timelineGraph.epochs[epochIndex].name}].`;
                for (let e = epochIndex + 1; e < timelineGraph.epochs.length; e++) {
                    const future = timelineGraph.epochStates[e];
                    future.ruined = true;
                    future.dominantReligion = 'Секта Падающей Звезды';
                    const cText = `Эпоха [${future.name}]: Земля покрыта древними кратерами. Города выстроены вокруг кратерных озер.`;
                    ripple.consequences.push(cText);
                }
                break;

            case 'MARTIAL_LAW_SURVIVAL':
                ripple.desc = `Игрок выжил в столкновении с гарнизоном 5★ розыска.`;
                for (let e = epochIndex + 1; e < timelineGraph.epochs.length; e++) {
                    const future = timelineGraph.epochStates[e];
                    future.cyberneticCult = true;
                    const cText = `Эпоха [${future.name}]: Военная доктрина стражи ожесточена из-за легенды о Неуязвимом Мятежнике.`;
                    ripple.consequences.push(cText);
                }
                break;
        }

        timelineGraph.ripples.push(ripple);
        this.ripplesHistory.push(ripple);

        globalEvents.emit('TEMPORAL_RIPPLE', ripple);
        return ripple;
    }
}
