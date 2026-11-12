/**
 * ============================================================================
 * NEIRANDERTALTH: TIMELINE PARADOX — PARTICLES & PROJECTILES
 * ============================================================================
 */

import { Entity } from './Entity.js';
import { Vector2 } from '../math/Vector2.js';

export class Particle {
    constructor(x, y, options = {}) {
        this.position = new Vector2(x, y);
        this.velocity = new Vector2(options.vx || (Math.random() * 160 - 80), options.vy || (Math.random() * 160 - 80));
        this.life = options.life || 0.4;
        this.maxLife = this.life;
        this.color = options.color || '#ff0055';
        this.size = options.size || 3;
        this.glow = options.glow || false;
        this.friction = options.friction || 0.92;
        this.gravity = options.gravity || 0;
    }

    update(dt) {
        this.life -= dt;
        this.position.x += this.velocity.x * dt;
        this.position.y += this.velocity.y * dt;
        this.velocity.y += this.gravity * dt;
        this.velocity.mult(Math.pow(this.friction, dt * 60));
    }

    draw(ctx) {
        if (this.life <= 0) return;
        const p = this.life / this.maxLife;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p);
        if (this.glow) {
            ctx.shadowBlur = 8;
            ctx.shadowColor = this.color;
        }
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.size * p, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

export class Projectile extends Entity {
    constructor(x, y, vx, vy, options = {}) {
        super(x, y, options.radius || 4);
        this.velocity.set(vx, vy);
        this.damage = options.damage || 25;
        this.owner = options.owner || 'player'; // 'player' | 'npc'
        this.color = options.color || '#ffcc00';
        this.life = options.life || 1.8;
        this.type = options.type || 'bullet'; // 'spear' | 'bullet' | 'plasma' | 'chronos'
    }

    update(dt, world, entities) {
        this.life -= dt;
        if (this.life <= 0) {
            this.isDead = true;
            return;
        }
        super.update(dt);

        if (world.isSolid(this.x, this.y)) {
            this.isDead = true;
            return;
        }

        // Проверка попадания
        if (this.owner === 'player') {
            for (let i = 0; i < entities.npcs.length; i++) {
                const npc = entities.npcs[i];
                if (npc.isDead) continue;
                if (this.position.distSq(npc.position) < (this.radius + npc.radius) ** 2) {
                    this.isDead = true;
                    npc.takeDamage(this.damage, 'player');
                    entities.spawnBloodBurst(this.x, this.y);
                    return;
                }
            }
        } else if (this.owner === 'npc') {
            const player = entities.player;
            if (!player.isDead && this.position.distSq(player.position) < (this.radius + player.radius) ** 2) {
                this.isDead = true;
                player.takeDamage(this.damage, 'npc');
                entities.spawnBloodBurst(this.x, this.y);
                return;
            }
        }
    }

    draw(ctx) {
        if (this.isDead) return;
        ctx.save();
        ctx.translate(this.x, this.y);

        if (this.type === 'plasma' || this.type === 'chronos') {
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.type === 'chronos' ? '#7209b7' : '#00e5ff';
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'spear') {
            ctx.rotate(this.velocity.heading());
            ctx.strokeStyle = '#8d5b4c';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(-12, 0);
            ctx.lineTo(12, 0);
            ctx.stroke();
            ctx.fillStyle = '#111';
            ctx.beginPath();
            ctx.moveTo(12, -3);
            ctx.lineTo(18, 0);
            ctx.lineTo(12, 3);
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}
