/**
 * ============================================================================
 * NEIRANDERTALTH: TIMELINE PARADOX — PLANET GRID (src/planet/PlanetGrid.js)
 * Карта планеты Земля: процедурные биомы, битумные озера, скалы и здания.
 * ============================================================================
 */

import { WORLD_CONFIG } from '../config/constants.js';
import { PerlinNoise } from '../math/Random.js';

export class PlanetGrid {
    constructor() {
        this.width = WORLD_CONFIG.MAP_WIDTH;
        this.height = WORLD_CONFIG.MAP_HEIGHT;
        this.noise = new PerlinNoise(1337);

        this.tarPits = [];
        this.rocks = [];
        this.trees = [];
        this.buildings = [];
        this.craters = [];

        this.generateGeography();
    }

    generateGeography() {
        this.tarPits = [
            { x: 1300, y: 1400, rx: 140, ry: 95 },
            { x: 2800, y: 1200, rx: 110, ry: 80 },
            { x: 1400, y: 2900, rx: 160, ry: 110 },
            { x: 2900, y: 2800, rx: 130, ry: 90 },
            { x: 2100, y: 800, rx: 100, ry: 70 }
        ];

        // Скалы и деревья
        for (let i = 0; i < 110; i++) {
            const x = Math.random() * this.width;
            const y = Math.random() * this.height;
            // Свободный центр для цивилизации
            if (Math.hypot(x - WORLD_CONFIG.CENTER_X, y - WORLD_CONFIG.CENTER_Y) > 420) {
                if (Math.random() > 0.45) {
                    this.trees.push({ x, y, r: Math.random() * 16 + 14 });
                } else {
                    this.rocks.push({ x, y, r: Math.random() * 20 + 12 });
                }
            }
        }
    }

    rebuildForEpoch(epochIndex, epochState) {
        this.buildings = [];
        const cx = WORLD_CONFIG.CENTER_X;
        const cy = WORLD_CONFIG.CENTER_Y;

        if (epochIndex === 0) {
            // ПЛЕЙСТОЦЕН: Шатры из шкур мамонтов, кострища, тотемы
            const huts = [
                { dx: -220, dy: -180, w: 100, h: 100, type: 'mammoth_tent' },
                { dx: 180, dy: -210, w: 110, h: 95, type: 'mammoth_tent' },
                { dx: -240, dy: 190, w: 105, h: 105, type: 'mammoth_tent' },
                { dx: 210, dy: 220, w: 120, h: 110, type: 'mammoth_tent' },
                { dx: 0, dy: -320, w: 160, h: 90, type: 'bone_shrine' }
            ];
            huts.forEach(h => {
                this.buildings.push({
                    x: cx + h.dx, y: cy + h.dy, w: h.w, h: h.h,
                    type: h.type, color: '#4a3728'
                });
            });
        } else if (epochIndex === 1) {
            // БРОНЗА И БИТУМ: Смоляные Зиккураты, храмовые склады
            this.buildings.push({
                x: cx - 120, y: cy - 120, w: 240, h: 240,
                type: 'grand_ziggurat', color: '#2b231a'
            });
            const zStorage = [
                { dx: -320, dy: -260, w: 150, h: 120 },
                { dx: 260, dy: -280, w: 160, h: 130 },
                { dx: -340, dy: 240, w: 150, h: 140 },
                { dx: 270, dy: 260, w: 170, h: 120 }
            ];
            zStorage.forEach(s => {
                this.buildings.push({
                    x: cx + s.dx, y: cy + s.dy, w: s.w, h: s.h,
                    type: 'tar_granary', color: '#3d3023'
                });
            });
        } else if (epochIndex === 2) {
            // ПАРОВОЙ ВЕК: Закопченные кирпичные фабрики, вокзалы
            const factories = [
                { dx: -300, dy: -290, w: 210, h: 160, type: 'steam_factory' },
                { dx: 150, dy: -310, w: 220, h: 170, type: 'steam_factory' },
                { dx: -320, dy: 160, w: 230, h: 180, type: 'steam_factory' },
                { dx: 160, dy: 170, w: 210, h: 160, type: 'steam_factory' },
                { dx: -70, dy: -200, w: 140, h: 90, type: 'rail_depot' }
            ];
            factories.forEach(f => {
                this.buildings.push({
                    x: cx + f.dx, y: cy + f.dy, w: f.w, h: f.h,
                    type: f.type, color: '#7f2618'
                });
            });
        } else if (epochIndex === 3) {
            // НЕО-МЕГАПОЛИС: Обсидиановые монолиты с неоновыми контурами
            const towers = [
                { dx: -320, dy: -320, w: 220, h: 220, neon: '#00e5ff' },
                { dx: 160, dy: -330, w: 240, h: 230, neon: '#ff0055' },
                { dx: -340, dy: 160, w: 230, h: 240, neon: '#ffb703' },
                { dx: 170, dy: 170, w: 250, h: 250, neon: '#7209b7' },
                { dx: -80, dy: -80, w: 160, h: 160, neon: '#00e5ff', type: 'quantum_nexus' }
            ];
            towers.forEach(t => {
                this.buildings.push({
                    x: cx + t.dx, y: cy + t.dy, w: t.w, h: t.h,
                    type: t.type || 'monolith', color: '#090b10', neon: t.neon
                });
            });
        } else if (epochIndex === 4) {
            // ПАРАДОКС СИНГУЛЯРНОСТИ: Смешанная ткань реальности
            this.buildings.push({
                x: cx - 140, y: cy - 140, w: 280, h: 280,
                type: 'time_monument', color: '#1a0b2e', neon: '#7209b7'
            });
            const ruins = [
                { dx: -340, dy: -300, w: 180, h: 180, type: 'chrono_ruin', neon: '#00e5ff' },
                { dx: 220, dy: -310, w: 190, h: 190, type: 'chrono_ruin', neon: '#ff0055' },
                { dx: -310, dy: 220, w: 200, h: 180, type: 'chrono_ruin', neon: '#ffb703' },
                { dx: 200, dy: 200, w: 210, h: 200, type: 'chrono_ruin', neon: '#06d6a0' }
            ];
            ruins.forEach(r => {
                this.buildings.push({
                    x: cx + r.dx, y: cy + r.dy, w: r.w, h: r.h,
                    type: r.type, color: '#110920', neon: r.neon
                });
            });
        }

        // Если в истории был зафиксирован культ мамонта — возводим колоссальный памятник!
        if (epochState && epochState.sacredMammothMonuments) {
            this.buildings.push({
                x: cx + 380, y: cy - 60, w: 120, h: 120,
                type: 'mammoth_monument', color: '#ffb703', neon: '#ffb703'
            });
        }
    }

    isSolid(x, y, radius = 0) {
        if (x - radius < 80 || x + radius > this.width - 80 ||
            y - radius < 80 || y + radius > this.height - 80) {
            return true;
        }

        for (let i = 0; i < this.buildings.length; i++) {
            const b = this.buildings[i];
            if (x + radius > b.x && x - radius < b.x + b.w &&
                y + radius > b.y && y - radius < b.y + b.h) {
                return true;
            }
        }

        for (let i = 0; i < this.rocks.length; i++) {
            const r = this.rocks[i];
            const distSq = (x - r.x) ** 2 + (y - r.y) ** 2;
            if (distSq < (radius + r.r * 0.8) ** 2) {
                return true;
            }
        }
        return false;
    }
}
