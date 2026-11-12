/**
 * ============================================================================
 * NEIRANDERTALTH: TIMELINE PARADOX — HUMANOID AI (src/entities/HumanoidAI.js)
 * Неандертальцы, граждане, стражники и шаманы: логика ИИ, диалоги, баблы речи.
 * ============================================================================
 */

import { Entity } from './Entity.js';
import { Vector2 } from '../math/Vector2.js';
import { Projectile } from './Projectile.js';
import { globalSound } from '../core/SoundSynthesizer.js';
import { globalEvents } from '../core/EventBus.js';

export class HumanoidAI extends Entity {
    constructor(x, y, role = 'CITIZEN', epochIndex = 0) {
        super(x, y, 12);
        this.role = role; // 'CITIZEN' | 'GUARD' | 'BEGGAR' | 'SHAMAN'
        this.epochIndex = epochIndex;

        this.hp = role === 'GUARD' ? 95 : (role === 'SHAMAN' ? 120 : 45);
        this.maxHp = this.hp;
        this.speed = role === 'GUARD' ? 175 : 110;
        this.state = 'WANDER'; // 'WANDER' | 'FLEE' | 'ATTACK'

        this.targetPos = new Vector2(this.x, this.y);
        this.stateTimer = Math.random() * 4 + 2;
        this.attackCooldown = 0;

        this.speechText = '';
        this.speechTimer = 0;
        this.isEureka = false;

        this.configureAppearance();
    }

    configureAppearance() {
        if (this.role === 'GUARD') {
            this.color = '#d90429';
            this.weaponType = this.epochIndex >= 2 ? 'ranged' : 'melee';
        } else if (this.role === 'BEGGAR') {
            this.color = '#7f5539';
            this.weaponType = 'none';
        } else if (this.role === 'SHAMAN') {
            this.color = '#7209b7';
            this.weaponType = 'magic';
        } else {
            this.color = '#4361ee';
            this.weaponType = 'none';
        }
    }

    say(text, duration = 3.2, isEureka = false) {
        this.speechText = text;
        this.speechTimer = duration;
        this.isEureka = isEureka;
    }

    update(dt, player, world, entities, wantedLevel) {
        if (this.isDead) return;

        if (this.speechTimer > 0) {
            this.speechTimer -= dt;
            if (this.speechTimer <= 0) this.speechText = '';
        }

        if (this.attackCooldown > 0) {
            this.attackCooldown -= dt;
        }

        // Физическое затухание отбрасывания
        this.position.add(this.velocity.copy().mult(dt));
        this.velocity.mult(Math.pow(0.85, dt * 60));

        const distToPlayer = this.position.dist(player.position);

        if (this.role === 'GUARD' && wantedLevel > 0) {
            this.state = 'ATTACK';
        }

        switch (this.state) {
            case 'WANDER':
                this.stateTimer -= dt;
                if (this.stateTimer <= 0) {
                    this.stateTimer = Math.random() * 4 + 2;
                    this.targetPos.set(
                        this.x + (Math.random() - 0.5) * 200,
                        this.y + (Math.random() - 0.5) * 200
                    );
                }
                this.moveTo(this.targetPos, this.speed * 0.5, dt, world);
                break;

            case 'FLEE':
                const fleeDir = this.position.copy().sub(player.position).normalize();
                this.targetPos = this.position.copy().add(fleeDir.mult(250));
                this.moveTo(this.targetPos, this.speed * 1.3, dt, world);
                break;

            case 'ATTACK':
                if (distToPlayer > 35) {
                    this.moveTo(player.position, this.speed, dt, world);
                }

                if (distToPlayer < 45 && this.attackCooldown <= 0) {
                    this.attackCooldown = 0.8;
                    globalSound.playHit();
                    player.takeDamage(16, 'npc');
                    this.say('Сдавайся!', 1.2);
                } else if (distToPlayer < 260 && distToPlayer > 80 && this.weaponType === 'ranged' && this.attackCooldown <= 0) {
                    this.attackCooldown = 1.3;
                    globalSound.playShoot(this.epochIndex >= 3 ? 'plasma' : 'steam');
                    const angle = Math.atan2(player.y - this.y, player.x - this.x);
                    entities.projectiles.push(new Projectile(
                        this.x, this.y, Math.cos(angle) * 600, Math.sin(angle) * 600,
                        { owner: 'npc', damage: 18, color: '#d90429' }
                    ));
                }
                break;
        }
    }

    moveTo(target, moveSpeed, dt, world) {
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 8) {
            this.angle = Math.atan2(dy, dx);
            const stepX = (dx / dist) * moveSpeed * dt;
            const stepY = (dy / dist) * moveSpeed * dt;

            if (!world.isSolid(this.x + stepX, this.y, this.radius)) this.x += stepX;
            if (!world.isSolid(this.x, this.y + stepY, this.radius)) this.y += stepY;
        }
    }

    onDeath(source) {
        if (source === 'player') {
            globalEvents.emit('CRIME_COMMITTED', {
                type: 'MURDER',
                victim: this
            });
        }
    }

    draw(ctx) {
        if (this.isDead) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.fillStyle = 'rgba(150, 20, 20, 0.4)';
            ctx.beginPath();
            ctx.ellipse(0, 0, 14, 8, this.angle, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            return;
        }

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Тень
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 3, 10, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Тело
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Голова
        ctx.fillStyle = '#ffdfba';
        ctx.beginPath();
        ctx.arc(3, 0, 6, 0, Math.PI * 2);
        ctx.fill();

        // Атрибуты роли
        if (this.role === 'GUARD') {
            ctx.fillStyle = '#ffd166';
            ctx.fillRect(4, -4, 4, 8);
        } else if (this.role === 'SHAMAN') {
            ctx.fillStyle = '#ff0055';
            ctx.beginPath();
            ctx.arc(0, 0, 8, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();

        // Рендеринг речевого облачка над головой
        if (this.speechText && this.speechTimer > 0) {
            this.drawSpeechBubble(ctx);
        }
    }

    drawSpeechBubble(ctx) {
        ctx.save();
        ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        const metrics = ctx.measureText(this.speechText);
        const w = metrics.width + 16;
        const h = 24;
        const bx = this.x - w / 2;
        const by = this.y - this.radius - h - 12;

        ctx.globalAlpha = Math.min(1, this.speechTimer * 2);
        ctx.shadowBlur = this.isEureka ? 12 : 5;
        ctx.shadowColor = this.isEureka ? '#ffb703' : 'rgba(0,0,0,0.4)';
        ctx.fillStyle = this.isEureka ? '#ffb703' : '#ffffff';
        ctx.strokeStyle = this.isEureka ? '#fff' : '#1e293b';
        ctx.lineWidth = 1.5;

        // Округлый прямоугольник
        ctx.beginPath();
        ctx.roundRect(bx, by, w, h, 6);
        ctx.fill();
        ctx.stroke();

        // Хвостик
        ctx.beginPath();
        ctx.moveTo(this.x - 4, by + h);
        ctx.lineTo(this.x, by + h + 6);
        ctx.lineTo(this.x + 4, by + h);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = this.isEureka ? '#090b10' : '#0f172a';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.speechText, this.x, by + h / 2);

        ctx.restore();
    }
}
