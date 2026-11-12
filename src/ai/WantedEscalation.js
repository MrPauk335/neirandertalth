/**
 * ============================================================================
 * NEIRANDERTALTH: TIMELINE PARADOX — WANTED ESCALATION (src/ai/WantedEscalation.js)
 * 5 Звезд розыска: эскалация угроз, погоня стражи, 15-секундный кулдаун в укрытии.
 * ============================================================================
 */

import { WANTED_CONFIG } from '../config/constants.js';
import { globalSound } from '../core/SoundSynthesizer.js';
import { globalEvents } from '../core/EventBus.js';
import { HumanoidAI } from '../entities/HumanoidAI.js';
import { VehicleMount } from '../entities/VehicleMount.js';

export class WantedEscalation {
    constructor() {
        this.stars = 0; // 0..5
        this.points = 0;
        this.cooldownTimer = 0;
        this.reinforceTimer = 0;

        globalEvents.on('CRIME_COMMITTED', (data) => this.onCrime(data));
    }

    onCrime(data) {
        let added = WANTED_CONFIG.CRIME_POINTS[data.type] || 20;
        this.points += added;
        this.recalculateStars();
        this.cooldownTimer = WANTED_CONFIG.COOLDOWN_TIME;

        globalEvents.emit('NOTIFICATION', `Преступление: ${data.type}! [${this.stars}★]`);
    }

    recalculateStars() {
        const prev = this.stars;
        const th = WANTED_CONFIG.STAR_THRESHOLDS;
        let newStars = 0;

        for (let i = th.length - 1; i >= 1; i--) {
            if (this.points >= th[i]) {
                newStars = i;
                break;
            }
        }
        this.stars = newStars;

        if (this.stars !== prev) {
            globalEvents.emit('WANTED_CHANGED', { stars: this.stars });
            globalSound.setSiren(this.stars > 0, this.stars);
        }
    }

    setStars(num) {
        this.stars = Math.max(0, Math.min(5, num));
        this.points = WANTED_CONFIG.STAR_THRESHOLDS[this.stars];
        this.cooldownTimer = this.stars > 0 ? WANTED_CONFIG.COOLDOWN_TIME : 0;
        globalEvents.emit('WANTED_CHANGED', { stars: this.stars });
        globalSound.setSiren(this.stars > 0, this.stars);
    }

    update(dt, player, entities, epochIndex) {
        if (this.stars === 0) return;

        // Проверяем прямую видимость стражи
        let isSpotted = false;
        for (let i = 0; i < entities.npcs.length; i++) {
            const npc = entities.npcs[i];
            if (npc.role === 'GUARD' && !npc.isDead) {
                if (npc.position.dist(player.position) < WANTED_CONFIG.SIGHT_RADIUS) {
                    isSpotted = true;
                    break;
                }
            }
        }

        if (isSpotted) {
            this.cooldownTimer = WANTED_CONFIG.COOLDOWN_TIME;
            globalEvents.emit('COOLDOWN_TICK', { seconds: WANTED_CONFIG.COOLDOWN_TIME, isHidden: false });
        } else {
            this.cooldownTimer -= dt;
            globalEvents.emit('COOLDOWN_TICK', { seconds: Math.max(0, Math.ceil(this.cooldownTimer)), isHidden: true });

            if (this.cooldownTimer <= 0) {
                this.setStars(0);
                globalEvents.emit('NOTIFICATION', 'Розыск сброшен: вы скрылись от стражи!');
                globalEvents.emit('COOLDOWN_TICK', { seconds: 0, isHidden: false });
            }
        }

        // Спавн подкрепления при высоком розыске
        if (this.stars >= 3) {
            this.reinforceTimer += dt;
            if (this.reinforceTimer > 7.5) {
                this.reinforceTimer = 0;
                this.spawnReinforcements(player, entities, epochIndex);
            }
        }
    }

    spawnReinforcements(player, entities, epochIndex) {
        const count = this.stars >= 5 ? 3 : 1;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 520;
            const sx = player.x + Math.cos(angle) * dist;
            const sy = player.y + Math.sin(angle) * dist;

            const guard = new HumanoidAI(sx, sy, 'GUARD', epochIndex);
            guard.state = 'ATTACK';
            guard.say('Стоять, именем Эпохи!', 2.5);
            entities.npcs.push(guard);

            // На 4-5 звездах призываем патрульный транспорт
            if (this.stars >= 4 && Math.random() > 0.4) {
                const types = ['mammoth', 'chariot', 'steam_tank', 'grav_speeder', 'chronos_beast'];
                const v = new VehicleMount(sx + 20, sy + 20, types[epochIndex], epochIndex);
                v.driver = guard;
                entities.vehicles.push(v);
            }
        }
        globalEvents.emit('NOTIFICATION', 'Подкрепление стражи прибыло на перехват!');
    }
}
