/**
 * ============================================================================
 * NEIRANDERTALTH: TIMELINE PARADOX — VECTOR2 (src/math/Vector2.js)
 * Математический класс двумерных векторов для физики и кинематики.
 * ============================================================================
 */

export class Vector2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    set(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }

    copy() {
        return new Vector2(this.x, this.y);
    }

    add(v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }

    sub(v) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }

    mult(n) {
        this.x *= n;
        this.y *= n;
        return this;
    }

    div(n) {
        if (n !== 0) {
            this.x /= n;
            this.y /= n;
        }
        return this;
    }

    mag() {
        return Math.hypot(this.x, this.y);
    }

    magSq() {
        return this.x * this.x + this.y * this.y;
    }

    dot(v) {
        return this.x * v.x + this.y * v.y;
    }

    dist(v) {
        return Math.hypot(this.x - v.x, this.y - v.y);
    }

    distSq(v) {
        const dx = this.x - v.x;
        const dy = this.y - v.y;
        return dx * dx + dy * dy;
    }

    normalize() {
        const m = this.mag();
        if (m !== 0) {
            this.div(m);
        }
        return this;
    }

    setMag(len) {
        return this.normalize().mult(len);
    }

    heading() {
        return Math.atan2(this.y, this.x);
    }

    lerp(target, amount) {
        this.x += (target.x - this.x) * amount;
        this.y += (target.y - this.y) * amount;
        return this;
    }

    static fromAngle(angle, length = 1) {
        return new Vector2(Math.cos(angle) * length, Math.sin(angle) * length);
    }

    static dist(v1, v2) {
        return Math.hypot(v1.x - v2.x, v1.y - v2.y);
    }
}
