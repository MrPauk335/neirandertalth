/**
 * ============================================================================
 * NEIRANDERTALTH: TIMELINE PARADOX — VEHICLE & MOUNT (src/entities/VehicleMount.js)
 * Звери и транспорт 5 Эпох: мамонты, колесницы, паровики, грави-спидеры.
 * Физика угона, инерция, сбивание пешеходов на скорости.
 * ============================================================================
 */

import { Entity } from './Entity.js';
import { Vector2 } from '../math/Vector2.js';
import { PHYSICS_CONFIG } from '../config/constants.js';
import { globalSound } from '../core/SoundSynthesizer.js';
import { globalEvents } from '../core/EventBus.js';

export class VehicleMount extends Entity {
    constructor(x, y, typeId = 'mammoth', epochIndex = 0) {
        super(x, y, 26);
        this.typeId = typeId;
        this.epochIndex = epochIndex;

        this.speed = 0;
        this.maxSpeed = 220;
        this.accel = 180;
        this.brake = 240;
        this.turnSpeed = 2.4;
        this.friction = 1.8;
        this.mass = 1200;
        this.hp = 300;
        this.maxHp = 300;
        this.driver = null;

        this.configureType();
    }

    configureType() {
        switch (this.typeId) {
            case 'mammoth':
                this.name = 'Шерстистый Мамонт';
                this.maxSpeed = 165;
                this.accel = 130;
                this.turnSpeed = 1.8;
                this.mass = 2500;
                this.hp = 500;
                this.radius = 32;
                this.color = '#5a3d28';
                break;
            case 'auroch':
                this.name = 'Первобытный Тур';
                this.maxSpeed = 220;
                this.accel = 200;
                this.turnSpeed = 2.6;
                this.mass = 900;
                this.hp = 240;
                this.radius = 22;
                this.color = '#3d2b1f';
                break;
            case 'sabertooth':
                this.name = 'Боевой Саблезуб';
                this.maxSpeed = 280;
                this.accel = 260;
                this.turnSpeed = 3.2;
                this.mass = 650;
                this.hp = 200;
                this.radius = 20;
                this.color = '#c68b59';
                break;
            case 'chariot':
                this.name = 'Битумная Боевая Колесница';
                this.maxSpeed = 270;
                this.accel = 230;
                this.turnSpeed = 2.2;
                this.friction = 1.4;
                this.mass = 1300;
                this.hp = 280;
                this.radius = 24;
                this.color = '#1f1e1d';
                break;
            case 'rhino':
                this.name = 'Смоляной Броне-Носорог';
                this.maxSpeed = 190;
                this.accel = 150;
                this.turnSpeed = 1.9;
                this.mass = 2400;
                this.hp = 480;
                this.radius = 28;
                this.color = '#4a4d4e';
                break;
            case 'steam_tank':
                this.name = 'Тяжелый Паровой Броневик';
                this.maxSpeed = 280;
                this.accel = 240;
                this.turnSpeed = 1.9;
                this.friction = 1.2;
                this.mass = 3200;
                this.hp = 600;
                this.radius = 30;
                this.color = '#6e3020';
                break;
            case 'grav_speeder':
                this.name = 'Квантовый Грави-Спидер';
                this.maxSpeed = 440;
                this.accel = 400;
                this.turnSpeed = 3.4;
                this.friction = 0.8;
                this.mass = 1400;
                this.hp = 350;
                this.radius = 24;
                this.color = '#0a101d';
                break;
            case 'chronos_beast':
                this.name = 'Хроно-Биомодулированный Мамонт';
                this.maxSpeed = 340;
                this.accel = 320;
                this.turnSpeed = 2.8;
                this.mass = 3000;
                this.hp = 800;
                this.radius = 34;
                this.color = '#7209b7';
                break;
            default:
                this.name = 'Ездовой Зверь';
                this.color = '#555';
        }
        this.maxHp = this.hp;
    }

    update(dt, world, entities) {
        if (this.isDead) return;

        if (this.driver) {
            this.driver.x = this.x;
            this.driver.y = this.y;
            this.driver.angle = this.angle;
        } else {
            this.speed *= Math.max(0, 1 - this.friction * dt * 2);
        }

        const moveDist = this.speed * dt;
        const nextX = this.x + Math.cos(this.angle) * moveDist;
        const nextY = this.y + Math.sin(this.angle) * moveDist;

        if (world.isSolid(nextX, nextY, this.radius)) {
            if (Math.abs(this.speed) > 70) {
                globalSound.playCrash();
                this.takeDamage(Math.abs(this.speed) * 0.12, 'world');
            }
            this.speed = -this.speed * 0.3;
        } else {
            this.x = nextX;
            this.y = nextY;
        }

        // GTA-ТАРАН ПЕШЕХОДОВ
        if (Math.abs(this.speed) > PHYSICS_CONFIG.PEDESTRIAN_COLLISION_THRESHOLD) {
            this.checkRamCollisions(entities);
        }
    }

    checkRamCollisions(entities) {
        const hitSpeed = Math.abs(this.speed);
        for (let i = 0; i < entities.npcs.length; i++) {
            const npc = entities.npcs[i];
            if (npc.isDead || npc === this.driver) continue;

            const distSq = (this.x - npc.x) ** 2 + (this.y - npc.y) ** 2;
            if (distSq < (this.radius + npc.radius + 6) ** 2) {
                const damage = (hitSpeed / this.maxSpeed) * (this.mass / 11);
                const knockAngle = Math.atan2(npc.y - this.y, npc.x - this.x);
                const knockForce = hitSpeed * PHYSICS_CONFIG.RAM_KNOCKBACK_FORCE;

                npc.velocity.x = Math.cos(knockAngle) * knockForce;
                npc.velocity.y = Math.sin(knockAngle) * knockForce;

                globalSound.playCrash();
                entities.spawnBloodBurst(npc.x, npc.y, 16);

                npc.takeDamage(damage, this.driver === entities.player ? 'player' : 'vehicle');

                if (this.driver === entities.player) {
                    globalEvents.emit('CRIME_COMMITTED', {
                        type: 'RAM_MANSLAUGHTER',
                        victim: npc
                    });
                }
                this.speed *= 0.85;
            }
        }
    }

    draw(ctx) {
        if (this.isDead) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Тень
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(2, 6, this.radius * 1.1, this.radius * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();

        switch (this.typeId) {
            case 'mammoth':
            case 'chronos_beast':
                this.drawMammoth(ctx);
                break;
            case 'auroch':
                this.drawAuroch(ctx);
                break;
            case 'chariot':
                this.drawChariot(ctx);
                break;
            case 'steam_tank':
                this.drawSteamTank(ctx);
                break;
            case 'grav_speeder':
                this.drawGravSpeeder(ctx);
                break;
            default:
                ctx.fillStyle = this.color;
                ctx.fillRect(-this.radius, -this.radius / 2, this.radius * 2, this.radius);
        }

        // Полоска прочности
        if (this.hp < this.maxHp) {
            ctx.rotate(-this.angle);
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(-22, -this.radius - 12, 44, 5);
            ctx.fillStyle = '#06d6a0';
            ctx.fillRect(-22, -this.radius - 12, 44 * (this.hp / this.maxHp), 5);
        }

        ctx.restore();
    }

    drawMammoth(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, 28, 20, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#422c1d';
        ctx.beginPath();
        ctx.arc(20, 0, 14, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#e9ecef';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(26, -8);
        ctx.quadraticCurveTo(42, -14, 46, -4);
        ctx.moveTo(26, 8);
        ctx.quadraticCurveTo(42, 14, 46, 4);
        ctx.stroke();

        ctx.strokeStyle = '#422c1d';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(30, 0);
        ctx.lineTo(44, 0);
        ctx.stroke();

        ctx.fillStyle = '#9b2226';
        ctx.fillRect(-8, -12, 18, 24);
    }

    drawAuroch(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, 22, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#e9ecef';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(14, -6);
        ctx.lineTo(24, -14);
        ctx.moveTo(14, 6);
        ctx.lineTo(24, 14);
        ctx.stroke();
    }

    drawChariot(ctx) {
        ctx.fillStyle = '#3d2b1f';
        ctx.beginPath();
        ctx.ellipse(26, 0, 18, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#8d5b4c';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(-6, 0);
        ctx.stroke();

        ctx.fillStyle = '#1a1918';
        ctx.fillRect(-24, -15, 20, 30);
        ctx.strokeStyle = '#ffb703';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-24, -15, 20, 30);
    }

    drawSteamTank(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(-26, -18, 52, 36);
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 2;
        ctx.strokeRect(-26, -18, 52, 36);

        ctx.fillStyle = '#3a3a3a';
        ctx.fillRect(8, -12, 16, 24);

        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(-8, -8, 5, 0, Math.PI * 2);
        ctx.fill();
    }

    drawGravSpeeder(ctx) {
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.moveTo(28, 0);
        ctx.lineTo(-20, -16);
        ctx.lineTo(-12, 0);
        ctx.lineTo(-20, 16);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#00e5ff';
        ctx.stroke();
    }
}
