/**
 * ============================================================================
 * NEIRANDERTALTH: TIMELINE PARADOX — CAMERA 2D (src/render/Camera2D.js)
 * Плавная камера с поддержкой масштабирования, тряски экрана и следования.
 * ============================================================================
 */

import { Vector2 } from '../math/Vector2.js';

export class Camera2D {
    constructor(worldWidth, worldHeight) {
        this.position = new Vector2(worldWidth / 2, worldHeight / 2);
        this.target = new Vector2(worldWidth / 2, worldHeight / 2);
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;

        this.viewportWidth = window.innerWidth;
        this.viewportHeight = window.innerHeight;

        this.zoom = 1.0;
        this.targetZoom = 1.0;
        this.lerpSpeed = 0.09;

        this.shakeTime = 0;
        this.shakeIntensity = 0;
    }

    setTarget(x, y) {
        this.target.set(x, y);
    }

    shake(intensity = 10, duration = 0.3) {
        this.shakeIntensity = intensity;
        this.shakeTime = duration;
    }

    zoomBy(delta) {
        this.targetZoom = Math.max(0.65, Math.min(1.6, this.targetZoom - delta * 0.15));
    }

    update(dt) {
        // Плавный зум
        this.zoom += (this.targetZoom - this.zoom) * 0.1;

        // Плавное следование за целью
        this.position.lerp(this.target, this.lerpSpeed);

        // Ограничение камеры миром
        const halfW = (this.viewportWidth / 2) / this.zoom;
        const halfH = (this.viewportHeight / 2) / this.zoom;

        this.position.x = Math.max(halfW, Math.min(this.worldWidth - halfW, this.position.x));
        this.position.y = Math.max(halfH, Math.min(this.worldHeight - halfH, this.position.y));

        // Тряска экрана
        if (this.shakeTime > 0) {
            this.shakeTime -= dt;
            const ox = (Math.random() - 0.5) * this.shakeIntensity;
            const oy = (Math.random() - 0.5) * this.shakeIntensity;
            this.position.x += ox;
            this.position.y += oy;
        }
    }

    resize(w, h) {
        this.viewportWidth = w;
        this.viewportHeight = h;
    }
}
