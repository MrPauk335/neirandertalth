/**
 * ============================================================================
 * NEIRANDERTALTH: TIMELINE PARADOX — PLAYER (src/entities/Player.js)
 * Управление персонажем: пеший бой, стрельба, угон, спринт и респавн.
 * ============================================================================
 */

import { Entity } from './Entity.js';
import { Vector2 } from '../math/Vector2.js';
import { Projectile } from './Projectile.js';
import { PHYSICS_CONFIG } from '../config/constants.js';
import { globalSound } from '../core/SoundSynthesizer.js';
import { globalEvents } from '../core/EventBus.js';

export class Player extends Entity {
    constructor(x, y) {
        super(x, y, 14);
        this.speed = PHYSICS_CONFIG.PLAYER_BASE_SPEED;
        this.state = 'ON_FOOT'; // 'ON_FOOT' | 'DRIVING'
        this.currentVehicle = null;

        this.attackCooldown = 0;
        this.stepTimer = 0;
    }

    update(dt, input, world, entities, currentEpochIndex) {
        if (this.isDead) return;

        if (this.attackCooldown > 0) {
            this.attackCooldown -= dt;
        }

        // Если за рулем транспорта
        if (this.state === 'DRIVING' && this.currentVehicle) {
            const v = this.currentVehicle;

            const move = input.getMovementVector();
            if (input.isKey('KeyW') || input.isKey('ArrowUp')) {
                v.speed = Math.min(v.maxSpeed, v.speed + v.accel * dt);
            } else if (input.isKey('KeyS') || input.isKey('ArrowDown')) {
                v.speed = Math.max(-v.maxSpeed * 0.4, v.speed - v.brake * dt);
            } else {
                v.speed *= Math.max(0, 1 - v.friction * dt);
            }

            const turnFactor = v.speed >= 0 ? 1 : -1;
            if (input.isKey('KeyA') || input.isKey('ArrowLeft')) {
                v.angle -= v.turnSpeed * dt * turnFactor;
            }
            if (input.isKey('KeyD') || input.isKey('ArrowRight')) {
                v.angle += v.turnSpeed * dt * turnFactor;
            }

            this.x = v.x;
            this.y = v.y;
            this.angle = v.angle;

            if (input.isInteract()) {
                this.dismountVehicle();
            }

            if (input.isAttacking()) {
                this.attack(input.mouseWorld, entities, currentEpochIndex);
            }
            return;
        }

        // Пешее перемещение
        const move = input.getMovementVector();
        const curSpeed = input.isSprinting() ? this.speed * PHYSICS_CONFIG.PLAYER_SPRINT_MULT : this.speed;

        if (move.magSq() > 0) {
            const nextX = this.x + move.x * curSpeed * dt;
            const nextY = this.y + move.y * curSpeed * dt;

            if (!world.isSolid(nextX, this.y, this.radius)) this.x = nextX;
            if (!world.isSolid(this.x, nextY, this.radius)) this.y = nextY;

            this.stepTimer += dt;
            if (this.stepTimer > 0.3) {
                this.stepTimer = 0;
                globalSound.playFootstep();
            }
        }

        // Взгляд за курсором мыши
        this.angle = Math.atan2(input.mouseWorld.y - this.y, input.mouseWorld.x - this.x);

        if (input.isInteract()) {
            this.tryMountVehicle(entities);
        }

        if (input.isAttacking()) {
            this.attack(input.mouseWorld, entities, currentEpochIndex);
        }
    }

    tryMountVehicle(entities) {
        let nearest = null;
        let minDistSq = 75 * 75;

        for (let i = 0; i < entities.vehicles.length; i++) {
            const v = entities.vehicles[i];
            if (v.isDead) continue;
            const distSq = this.position.distSq(v.position);
            if (distSq < minDistSq) {
                minDistSq = distSq;
                nearest = v;
            }
        }

        if (nearest) {
            globalSound.playHit();
            if (nearest.driver && nearest.driver !== this) {
                const oldDriver = nearest.driver;
                oldDriver.currentVehicle = null;
                oldDriver.state = 'FLEE';
                oldDriver.takeDamage(20, 'player');
                oldDriver.say('Мой зверь! Держи вора!', 3.0);

                globalEvents.emit('CRIME_COMMITTED', {
                    type: 'THEFT',
                    vehicle: nearest
                });
            }

            this.state = 'DRIVING';
            this.currentVehicle = nearest;
            nearest.driver = this;
            globalEvents.emit('NOTIFICATION', `Оседлан: ${nearest.name}`);
        }
    }

    dismountVehicle() {
        if (!this.currentVehicle) return;
        const v = this.currentVehicle;
        this.x = v.x + Math.cos(v.angle + Math.PI / 2) * (v.radius + 18);
        this.y = v.y + Math.sin(v.angle + Math.PI / 2) * (v.radius + 18);
        v.driver = null;
        this.currentVehicle = null;
        this.state = 'ON_FOOT';
    }

    attack(targetPos, entities, epochIndex) {
        if (this.attackCooldown > 0) return;

        if (epochIndex === 0) {
            // ЭПОХА 0: Костяная дубина (сплэш)
            this.attackCooldown = 0.45;
            globalSound.playHit();
            const hitRadius = 60;

            for (let i = 0; i < entities.npcs.length; i++) {
                const npc = entities.npcs[i];
                if (npc.isDead) continue;
                if (this.position.distSq(npc.position) < hitRadius * hitRadius) {
                    const toNpc = Math.atan2(npc.y - this.y, npc.x - this.x);
                    let diff = Math.abs(toNpc - this.angle);
                    if (diff > Math.PI) diff = Math.PI * 2 - diff;

                    if (diff < Math.PI / 2) {
                        npc.takeDamage(40, 'player');
                        npc.velocity.x = Math.cos(toNpc) * 150;
                        npc.velocity.y = Math.sin(toNpc) * 150;
                        entities.spawnBloodBurst(npc.x, npc.y, 8);
                    }
                }
            }
        } else if (epochIndex === 1) {
            // ЭПОХА 1: Битумное копье
            this.attackCooldown = 0.55;
            globalSound.playShoot('spear');
            const angle = Math.atan2(targetPos.y - this.y, targetPos.x - this.x);
            entities.projectiles.push(new Projectile(
                this.x, this.y, Math.cos(angle) * 480, Math.sin(angle) * 480,
                { owner: 'player', damage: 50, type: 'spear', radius: 5 }
            ));
        } else if (epochIndex === 2) {
            // ЭПОХА 2: Паровой револьвер
            this.attackCooldown = 0.32;
            globalSound.playShoot('steam');
            const angle = Math.atan2(targetPos.y - this.y, targetPos.x - this.x) + (Math.random() - 0.5) * 0.06;
            entities.projectiles.push(new Projectile(
                this.x, this.y, Math.cos(angle) * 820, Math.sin(angle) * 820,
                { owner: 'player', damage: 45, type: 'bullet', radius: 4 }
            ));
        } else {
            // ЭПОХА 3-4: Квантовая плазма / хроно-разрушитель
            this.attackCooldown = 0.22;
            globalSound.playShoot('plasma');
            const angle = Math.atan2(targetPos.y - this.y, targetPos.x - this.x);
            entities.projectiles.push(new Projectile(
                this.x, this.y, Math.cos(angle) * 1050, Math.sin(angle) * 1050,
                { owner: 'player', damage: 65, type: 'plasma', radius: 6 }
            ));
        }
    }

    onDeath(source) {
        globalSound.playExplosion();
        if (this.currentVehicle) {
            this.currentVehicle.driver = null;
            this.currentVehicle = null;
        }
        globalEvents.emit('PLAYER_DIED', { source });

        setTimeout(() => {
            this.hp = this.maxHp;
            this.isDead = false;
            this.x = 2100;
            this.y = 2100;
            this.state = 'ON_FOOT';
            globalEvents.emit('NOTIFICATION', 'Темпоральная петля замкнулась: Первопредок перерожден!');
        }, 2200);
    }

    draw(ctx) {
        if (this.isDead) return;

        if (this.state === 'DRIVING' && this.currentVehicle) {
            // Рисуем силуэт наездника
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.fillStyle = '#00e5ff';
            ctx.beginPath();
            ctx.arc(0, 0, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            return;
        }

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Тень
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(0, 4, 12, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Тело
        ctx.fillStyle = '#00e5ff';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Голова
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(2, 0, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
