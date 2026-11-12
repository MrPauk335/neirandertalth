/**
 * ============================================================================
 * NEIRANDERTALTH: TIMELINE PARADOX — INPUT MANAGER (src/core/InputManager.js)
 * Управление вводом: клавиатура, мышь, экранные координаты в мировые.
 * ============================================================================
 */

import { Vector2 } from '../math/Vector2.js';
import { globalSound } from './SoundSynthesizer.js';

export class InputManager {
    constructor() {
        this.keys = new Map();
        this.justPressed = new Set();
        this.mouseScreen = new Vector2(0, 0);
        this.mouseWorld = new Vector2(0, 0);
        this.isMouseDown = false;
        this.mouseJustPressed = false;
        this.wheelDelta = 0;

        this.init();
    }

    init() {
        window.addEventListener('keydown', (e) => {
            globalSound.init();
            if (!this.keys.get(e.code)) {
                this.justPressed.add(e.code);
            }
            this.keys.set(e.code, true);

            // Предотвращение скролла страницы стрелками и пробелом
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) {
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys.set(e.code, false);
        });

        window.addEventListener('mousemove', (e) => {
            this.mouseScreen.set(e.clientX, e.clientY);
        });

        window.addEventListener('mousedown', (e) => {
            globalSound.init();
            if (e.button === 0) {
                this.isMouseDown = true;
                this.mouseJustPressed = true;
            }
        });

        window.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.isMouseDown = false;
            }
        });

        window.addEventListener('wheel', (e) => {
            this.wheelDelta = Math.sign(e.deltaY);
        }, { passive: true });
    }

    updateMouseWorld(camera) {
        this.mouseWorld.x = (this.mouseScreen.x - camera.viewportWidth / 2) / camera.zoom + camera.position.x;
        this.mouseWorld.y = (this.mouseScreen.y - camera.viewportHeight / 2) / camera.zoom + camera.position.y;
    }

    isKey(code) {
        return !!this.keys.get(code);
    }

    isKeyJustPressed(code) {
        return this.justPressed.has(code);
    }

    getMovementVector() {
        const move = new Vector2(0, 0);
        if (this.isKey('KeyW') || this.isKey('ArrowUp')) move.y -= 1;
        if (this.isKey('KeyS') || this.isKey('ArrowDown')) move.y += 1;
        if (this.isKey('KeyA') || this.isKey('ArrowLeft')) move.x -= 1;
        if (this.isKey('KeyD') || this.isKey('ArrowRight')) move.x += 1;
        if (move.x !== 0 || move.y !== 0) {
            move.normalize();
        }
        return move;
    }

    isSprinting() {
        return this.isKey('ShiftLeft') || this.isKey('ShiftRight');
    }

    isInteract() {
        return this.isKeyJustPressed('KeyF') || this.isKeyJustPressed('KeyE');
    }

    isAttacking() {
        return this.mouseJustPressed || this.isKeyJustPressed('Space');
    }

    endFrame() {
        this.justPressed.clear();
        this.mouseJustPressed = false;
        this.wheelDelta = 0;
    }
}
