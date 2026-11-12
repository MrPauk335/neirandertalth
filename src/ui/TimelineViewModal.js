/**
 * ============================================================================
 * NEIRANDERTALTH: TIMELINE PARADOX — TIMELINE VIEW MODAL (src/ui/TimelineViewModal.js)
 * Интерактивное древо 4D-таймлайна: выбор эпохи, просмотр эффекта бабочки и вход.
 * ============================================================================
 */

import { globalEvents } from '../core/EventBus.js';

export class TimelineViewModal {
    constructor(timelineGraph, causalityEngine) {
        this.timelineGraph = timelineGraph;
        this.causalityEngine = causalityEngine;
        this.modal = document.getElementById('timelineModal');
        this.container = document.getElementById('timelineBranchesContainer');
        this.divergenceBar = document.getElementById('timelineDivergenceFill');
        this.divergenceText = document.getElementById('timelineDivergenceText');

        this.init();
    }

    init() {
        const openBtn = document.getElementById('timelineViewBtn');
        if (openBtn) {
            openBtn.addEventListener('click', () => this.open());
        }

        const closeBtn = document.getElementById('closeTimelineModalBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }
    }

    open() {
        this.render();
        if (this.modal) this.modal.style.display = 'flex';
    }

    close() {
        if (this.modal) this.modal.style.display = 'none';
    }

    render() {
        if (!this.container) return;
        this.container.innerHTML = '';

        const currentIdx = this.timelineGraph.activeEpochIndex;
        const div = this.timelineGraph.timelineDivergence;

        if (this.divergenceBar) this.divergenceBar.style.width = `${div}%`;
        if (this.divergenceText) this.divergenceText.textContent = `Парадоксальность: ${div}%`;

        this.timelineGraph.epochs.forEach((ep, idx) => {
            const state = this.timelineGraph.epochStates[idx];
            const isActive = idx === currentIdx;

            const card = document.createElement('div');
            card.className = `timeline-epoch-card ${isActive ? 'active-epoch' : ''}`;
            card.innerHTML = `
                <div class="epoch-header">
                    <span class="epoch-num">ЭПОХА ${idx}</span>
                    <span class="epoch-year">${ep.yearText}</span>
                </div>
                <h3>${ep.name}</h3>
                <p class="epoch-desc">${ep.desc}</p>
                <div class="epoch-mutations">
                    <div class="mut-item">👥 Население: <strong>${state.population}</strong></div>
                    <div class="mut-item">⛪ Религия: <strong>${state.dominantReligion}</strong></div>
                    <div class="mut-item">⚙️ Тех-прогресс: <strong>${state.technologyProgress}%</strong></div>
                    ${state.sacredMammothMonuments ? '<div class="mut-badge gold">🦣 Культ Первородного Зверя</div>' : ''}
                    ${state.ruined ? '<div class="mut-badge red">☄️ Древний Кратер Катастрофы</div>' : ''}
                </div>
                <button class="dive-epoch-btn" data-epoch="${idx}">
                    ${isActive ? 'ВЫ ЗДЕСЬ (GTA РЕЖИМ)' : '🚀 ВОЙТИ В ЭТУ ЭПОХУ (GTA)'}
                </button>
            `;

            const btn = card.querySelector('.dive-epoch-btn');
            btn.addEventListener('click', () => {
                if (!isActive) {
                    this.timelineGraph.jumpToEpoch(idx);
                    globalEvents.emit('NOTIFICATION', `Хроно-прыжок в [${ep.name}]!`);
                }
                this.close();
            });

            this.container.appendChild(card);
        });

        // Отображение недавних бабочек-вмешательств
        const ripplesList = document.getElementById('recentRipplesList');
        if (ripplesList) {
            ripplesList.innerHTML = '';
            const ripples = this.timelineGraph.ripples.slice(-5).reverse();
            if (ripples.length === 0) {
                ripplesList.innerHTML = '<div class="no-ripples">История не возмущена вмешательствами.</div>';
            } else {
                ripples.forEach(r => {
                    const el = document.createElement('div');
                    el.className = 'ripple-item';
                    el.innerHTML = `
                        <strong>${r.desc}</strong>
                        <ul>${r.consequences.map(c => `<li>${c}</li>`).join('')}</ul>
                    `;
                    ripplesList.appendChild(el);
                });
            }
        }
    }
}
