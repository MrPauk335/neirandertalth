/**
 * ============================================================================
 * NEIRANDERTALTH: TIMELINE PARADOX — HUD MANAGER (src/ui/HUDManager.js)
 * Управление всеми элементами Glassmorphism HUD, звездами розыска и тостами.
 * ============================================================================
 */

import { globalEvents } from '../core/EventBus.js';

export class HUDManager {
    constructor() {
        this.eraBadge = document.getElementById('eraBadge');
        this.eraName = document.getElementById('eraName');
        this.earthYear = document.getElementById('earthYear');
        this.wantedStars = document.querySelectorAll('#wantedStars .star');
        this.cooldownTimer = document.getElementById('cooldownTimer');
        this.cooldownSeconds = document.getElementById('cooldownSeconds');
        this.hpBar = document.getElementById('hpBar');
        this.hpText = document.getElementById('hpText');
        this.vehicleStatRow = document.getElementById('vehicleStatRow');
        this.vehicleHpBar = document.getElementById('vehicleHpBar');
        this.vehicleSpeedText = document.getElementById('vehicleSpeedText');
        this.vehicleNameLabel = document.getElementById('vehicleNameLabel');
        this.weaponIndicator = document.getElementById('weaponIndicator');
        this.popIndicator = document.getElementById('popIndicator');
        this.divergenceIndicator = document.getElementById('divergenceIndicator');
        this.toastContainer = document.getElementById('toastContainer');
        this.interactionPrompt = document.getElementById('interactionHint');

        this.initEvents();
    }

    initEvents() {
        globalEvents.on('WANTED_CHANGED', (data) => this.updateWantedStars(data.stars));
        globalEvents.on('COOLDOWN_TICK', (data) => this.updateCooldown(data.seconds, data.isHidden));
        globalEvents.on('NOTIFICATION', (msg) => this.showToast(msg, 'info'));
    }

    updateEpoch(epoch, state) {
        if (this.eraBadge) this.eraBadge.textContent = `ЭПОХА ${epoch.index}`;
        if (this.eraName) this.eraName.textContent = epoch.name;
        if (this.earthYear) this.earthYear.textContent = epoch.yearText;
        if (this.weaponIndicator) this.weaponIndicator.textContent = `🗡️ ${epoch.playerWeapon.name}`;
    }

    updateWantedStars(stars) {
        this.wantedStars.forEach((starEl, idx) => {
            if (idx < stars) {
                starEl.classList.add('active');
            } else {
                starEl.classList.remove('active');
            }
        });
    }

    updateCooldown(seconds, isHidden) {
        if (!this.cooldownTimer) return;
        if (isHidden && seconds > 0) {
            this.cooldownTimer.classList.add('visible');
            if (this.cooldownSeconds) this.cooldownSeconds.textContent = seconds;
        } else {
            this.cooldownTimer.classList.remove('visible');
        }
    }

    updatePlayerStats(player) {
        const hpP = Math.max(0, (player.hp / player.maxHp) * 100);
        if (this.hpBar) this.hpBar.style.width = `${hpP}%`;
        if (this.hpText) this.hpText.textContent = `${Math.ceil(player.hp)} / ${player.maxHp}`;

        if (player.state === 'DRIVING' && player.currentVehicle) {
            const v = player.currentVehicle;
            if (this.vehicleStatRow) this.vehicleStatRow.style.display = 'flex';
            if (this.vehicleNameLabel) this.vehicleNameLabel.textContent = v.name;
            const vHpP = Math.max(0, (v.hp / v.maxHp) * 100);
            if (this.vehicleHpBar) this.vehicleHpBar.style.width = `${vHpP}%`;
            const kmh = Math.abs(Math.round(v.speed * 0.4));
            if (this.vehicleSpeedText) this.vehicleSpeedText.textContent = `${kmh} км/ч`;
        } else {
            if (this.vehicleStatRow) this.vehicleStatRow.style.display = 'none';
        }
    }

    updatePopulation(count, divergence) {
        if (this.popIndicator) this.popIndicator.textContent = `👥 Население: ${count}`;
        if (this.divergenceIndicator) this.divergenceIndicator.textContent = `🌀 Парадокс: ${divergence}%`;
    }

    setInteractionPrompt(visible) {
        if (this.interactionPrompt) {
            this.interactionPrompt.style.display = visible ? 'block' : 'none';
        }
    }

    showToast(message, type = 'info') {
        if (!this.toastContainer) return;
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        this.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(40px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 300);
        }, 3200);
    }
}
