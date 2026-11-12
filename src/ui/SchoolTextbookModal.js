/**
 * ============================================================================
 * NEIRANDERTALTH: TIMELINE PARADOX — PLANET MAP & SCHOOL TEXTBOOK MODALS
 * ============================================================================
 */

export class PlanetMapModal {
    constructor(civManager, timelineGraph) {
        this.civManager = civManager;
        this.timelineGraph = timelineGraph;
        this.modal = document.getElementById('planetModal');
        this.container = document.getElementById('planetFactionsList');

        this.init();
    }

    init() {
        const btn = document.getElementById('planetMapBtn');
        if (btn) btn.addEventListener('click', () => this.open());

        const closeBtn = document.getElementById('closePlanetModalBtn');
        if (closeBtn) closeBtn.addEventListener('click', () => this.close());
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

        this.civManager.factions.forEach(f => {
            const card = document.createElement('div');
            card.className = 'faction-card';
            card.innerHTML = `
                <div class="faction-header">
                    <h4>${f.name}</h4>
                    <span class="badge">Эпоха ${f.epoch}</span>
                </div>
                <div class="faction-stats">
                    <div>👥 Население: <strong>${f.population}</strong></div>
                    <div>🌾 Запасы пищи: <strong>${f.food}</strong></div>
                    <div>🛢️ Битум: <strong>${f.bitumenReserves}</strong></div>
                    <div>⚡ Технологии: <strong>${f.techScore}</strong></div>
                </div>
                <div class="faction-status">Текущая деятельность: <em>${f.status}</em></div>
            `;
            this.container.appendChild(card);
        });
    }
}

export class SchoolTextbookModal {
    constructor(historicalRecord) {
        this.historicalRecord = historicalRecord;
        this.modal = document.getElementById('schoolModal');
        this.chaptersContainer = document.getElementById('schoolChapters');

        this.init();
    }

    init() {
        const btn = document.getElementById('schoolArchiveBtn');
        if (btn) btn.addEventListener('click', () => this.open());

        const closeBtn = document.getElementById('closeSchoolModalBtn');
        if (closeBtn) closeBtn.addEventListener('click', () => this.close());
    }

    open() {
        this.render();
        if (this.modal) this.modal.style.display = 'flex';
    }

    close() {
        if (this.modal) this.modal.style.display = 'none';
    }

    render() {
        if (!this.chaptersContainer) return;
        this.chaptersContainer.innerHTML = '';

        const st = this.historicalRecord.stats;
        const killsEl = document.getElementById('statKills');
        const hijacksEl = document.getElementById('statHijacks');
        const eurekasEl = document.getElementById('statEurekas');
        const jumpsEl = document.getElementById('statJumps');

        if (killsEl) killsEl.textContent = st.totalKills;
        if (hijacksEl) hijacksEl.textContent = st.totalHijacks;
        if (eurekasEl) eurekasEl.textContent = st.totalEurekas;
        if (jumpsEl) jumpsEl.textContent = st.temporalJumps;

        this.historicalRecord.chapters.slice().reverse().forEach(ch => {
            const card = document.createElement('div');
            card.className = 'book-chapter';
            card.innerHTML = `
                <h4>${ch.title}</h4>
                <p>${ch.text}</p>
                <span class="quote">${ch.quote}</span>
            `;
            this.chaptersContainer.appendChild(card);
        });
    }
}
