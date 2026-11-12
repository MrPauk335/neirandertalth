/**
 * ============================================================================
 * NEIRANDERTALTH: TIMELINE PARADOX — ENTITY BASE (src/entities/Entity.js)
 * Базовый класс для всех интерактивных сущностей игрового мира.
 * ============================================================================
 */

import { Vector2 } from '../math/Vector2.js';

export class Entity {
    constructor(x = 0, y = 0, radius = 12) {
        this.position = new Vector2(x, y);
        this.velocity = new Vector2(0, 0);
        this.angle = 0;
        this.radius = radius;
        this.isDead = false;
        this.hp = 100;
        this.maxHp = 100;
    }

    get x() {
        return this.position.x;
    }
    set x(val) {
        this.position.x = val;
    }

    get y() {
        return this.position.y;
    }
    set y(val) {
        this.position.y = val;
    }

    takeDamage(amount, source) {
        if (this.isDead) return;
        this.hp = Math.max(0, this.hp - amount);
        if (this.hp <= 0) {
            this.isDead = true;
            this.onDeath(source);
        }
    }

    onDeath(source) {}

    update(dt) {
        this.position.add(this.velocity.copy().mult(dt));
    }

    draw(ctx) {}
}
