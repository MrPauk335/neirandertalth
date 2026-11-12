/**
 * ============================================================================
 * NEIRANDERTALTH: TIMELINE PARADOX — CONSTANTS (src/config/constants.js)
 * Системные константы физики, мира, розыска и темпоральных разломов.
 * ============================================================================
 */

export const WORLD_CONFIG = {
    MAP_WIDTH: 4200,
    MAP_HEIGHT: 4200,
    CENTER_X: 2100,
    CENTER_Y: 2100,
    CHUNK_SIZE: 150,
    INITIAL_POPULATION: 70,
    MAX_PARTICLES: 800,
    MAX_PROJECTILES: 120
};

export const PHYSICS_CONFIG = {
    PLAYER_BASE_SPEED: 210,
    PLAYER_SPRINT_MULT: 1.45,
    PEDESTRIAN_COLLISION_THRESHOLD: 75, // Скорость транспорта для летального тарана
    RAM_KNOCKBACK_FORCE: 1.6,
    FRICTION_DEFAULT: 0.92,
    TURNING_LERP: 0.12
};

export const TIMELINE_CONFIG = {
    TOTAL_EPOCHS: 5,
    BASE_EUREKA_INTERVAL: 35.0, // Секунд между открытиями
    MAX_CAUSALITY_RIPPLES: 50,
    PARADOX_THRESHOLD: 100 // Уровень парадокса для схлопывания реальности
};

export const WANTED_CONFIG = {
    COOLDOWN_TIME: 15.0,
    SIGHT_RADIUS: 420,
    CRIME_POINTS: {
        ASSAULT: 15,
        MURDER: 40,
        THEFT: 30,
        RAM_MANSLAUGHTER: 55,
        BLASPHEMY: 25,
        TEMPORAL_BREACH: 80
    },
    STAR_THRESHOLDS: [0, 15, 35, 70, 120, 180]
};
