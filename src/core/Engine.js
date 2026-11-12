/**
 * ============================================================================
 * NEIRANDERTALTH: TIMELINE PARADOX — MAIN ENGINE (src/core/Engine.js)
 * Главный оркестратор движка: связка всех подсистем, игровой цикл, хроно-прыжки.
 * ============================================================================
 */

import { WORLD_CONFIG } from '../config/constants.js';
import { globalEvents } from './EventBus.js';
import { globalSound } from './SoundSynthesizer.js';
import { InputManager } from './InputManager.js';
import { TimelineGraph } from '../timeline/TimelineGraph.js';
import { CausalityEngine } from '../timeline/CausalityEngine.js';
import { HistoricalRecord } from '../timeline/HistoricalRecord.js';
import { PlanetGrid } from '../planet/PlanetGrid.js';
import { CivilizationsManager } from '../planet/CivilizationsManager.js';
import { WantedEscalation } from '../ai/WantedEscalation.js';
import { DiscoveryDrive } from '../ai/DiscoveryDrive.js';
import { Camera2D } from '../render/Camera2D.js';
import { CanvasRenderer } from '../render/CanvasRenderer.js';
import { HUDManager } from '../ui/HUDManager.js';
import { ChronicleFeed } from '../ui/ChronicleFeed.js';
import { TimelineViewModal } from '../ui/TimelineViewModal.js';
import { PlanetMapModal, SchoolTextbookModal } from '../ui/SchoolTextbookModal.js';
import { Player } from '../entities/Player.js';
import { HumanoidAI } from '../entities/HumanoidAI.js';
import { VehicleMount } from '../entities/VehicleMount.js';
import { Particle } from '../entities/Projectile.js';

export class Engine {
    constructor(presetsData) {
        this.canvas = document.getElementById('gameCanvas');
        this.timelineGraph = new TimelineGraph(presetsData);
        this.causalityEngine = new CausalityEngine();
        this.historicalRecord = new HistoricalRecord();
        this.civManager = new CivilizationsManager();
        this.world = new PlanetGrid();
        this.wantedSystem = new WantedEscalation();
        this.discoveryDrive = new DiscoveryDrive();

        this.input = new InputManager();
        this.camera = new Camera2D(this.world.width, this.world.height);
        this.renderer = new CanvasRenderer(this.canvas);

        this.hud = new HUDManager();
        this.chronicle = new ChronicleFeed();
        this.timelineModal = new TimelineViewModal(this.timelineGraph, this.causalityEngine);
        this.planetModal = new PlanetMapModal(this.civManager, this.timelineGraph);
        this.schoolModal = new SchoolTextbookModal(this.historicalRecord);

        this.entities = {
            player: new Player(WORLD_CONFIG.CENTER_X, WORLD_CONFIG.CENTER_Y),
            npcs: [],
            vehicles: [],
            projectiles: [],
            particles: [],
            spawnBloodBurst: (x, y, count = 10) => {
                for (let i = 0; i < count; i++) {
                    this.entities.particles.push(new Particle(x, y, {
                        vx: (Math.random() - 0.5) * 180,
                        vy: (Math.random() - 0.5) * 180,
                        color: '#d90429',
                        life: 0.35,
                        size: 3.5
                    }));
                }
            },
            spawnSparks: (x, y, count = 12, color = '#ffb703') => {
                for (let i = 0; i < count; i++) {
                    this.entities.particles.push(new Particle(x, y, {
                        vx: (Math.random() - 0.5) * 150,
                        vy: (Math.random() - 0.5) * 150,
                        color,
                        life: 0.4,
                        size: 3,
                        glow: true
                    }));
                }
            }
        };

        this.lastTime = performance.now();
        this.init();
    }

    init() {
        this.handleResize();
        window.addEventListener('resize', () => this.handleResize());

        // Связываем события
        globalEvents.on('EPOCH_CHANGED', (data) => this.onEpochChanged(data));
        globalEvents.on('CRIME_COMMITTED', (data) => this.onCrimeCommitted(data));
        globalEvents.on('PLAYER_DIED', (data) => this.historicalRecord.recordKill('PLAYER', 0));

        // Первоначальное наполнение мира
        this.populateEpochEntities();
        this.world.rebuildForEpoch(0, this.timelineGraph.getCurrentState());
        this.hud.updateEpoch(this.timelineGraph.getCurrentEpoch(), this.timelineGraph.getCurrentState());

        // Привязываем кнопки нижней панели
        const jumpBtn = document.getElementById('chronoJumpBtn');
        if (jumpBtn) {
            jumpBtn.addEventListener('click', () => {
                this.timelineGraph.advanceEpoch();
            });
        }

        const godMeteorBtn = document.getElementById('godMeteorBtn');
        if (godMeteorBtn) {
            godMeteorBtn.addEventListener('click', () => {
                this.triggerMeteorStrike();
            });
        }

        const godGoldenAgeBtn = document.getElementById('godGoldenAgeBtn');
        if (godGoldenAgeBtn) {
            godGoldenAgeBtn.addEventListener('click', () => {
                this.triggerGoldenAge();
            });
        }

        const audioToggleBtn = document.getElementById('audioToggleBtn');
        if (audioToggleBtn) {
            audioToggleBtn.addEventListener('click', () => {
                const on = globalSound.toggleMute();
                document.getElementById('audioIcon').textContent = on ? '🔊' : '🔇';
                document.getElementById('audioStatus').textContent = on ? 'Звук: ВКЛ' : 'Звук: ВЫКЛ';
            });
        }

        // Запуск цикла
        requestAnimationFrame((t) => this.loop(t));
        this.chronicle.addEntry('Хроно-маяк активирован: Земля готова к исследованию 4D-континуума.', 'system');
    }

    handleResize() {
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = window.innerWidth * dpr;
        this.canvas.height = window.innerHeight * dpr;
        this.canvas.style.width = `${window.innerWidth}px`;
        this.canvas.style.height = `${window.innerHeight}px`;
        this.renderer.ctx.scale(dpr, dpr);
        this.camera.resize(window.innerWidth, window.innerHeight);
    }

    onEpochChanged(data) {
        globalSound.playTimeWarp();
        this.camera.shake(20, 0.6);

        // Перестройка архитектуры
        this.world.rebuildForEpoch(data.to.index, data.state);
        this.hud.updateEpoch(data.to, data.state);

        // Репопуляция сущностей под новую эпоху
        this.populateEpochEntities();

        // Запись в исторический рекорд
        this.historicalRecord.recordJump(data.from, data.to);

        this.chronicle.addEntry(
            `ХРОНО-ПРЫЖОК: Переход в [${data.to.name}] (${data.to.yearText})! Мутации реальности активированы.`,
            'era'
        );
        this.hud.showToast(`Вы переместились в: ${data.to.name}!`, 'gold');
    }

    onCrimeCommitted(data) {
        if (data.type === 'MURDER') {
            this.historicalRecord.recordKill(data.victim.role, 1);
            if (Math.random() > 0.4) {
                this.causalityEngine.registerIntervention(
                    'MASSACRE',
                    this.timelineGraph.activeEpochIndex,
                    this.timelineGraph,
                    { kills: 1 }
                );
            }
        } else if (data.type === 'THEFT') {
            this.historicalRecord.recordHijack(data.vehicle.name);
            this.causalityEngine.registerIntervention(
                'SACRED_BEAST_THEFT',
                this.timelineGraph.activeEpochIndex,
                this.timelineGraph,
                { vehicleName: data.vehicle.name }
            );
        }
    }

    populateEpochEntities() {
        const cx = WORLD_CONFIG.CENTER_X;
        const cy = WORLD_CONFIG.CENTER_Y;
        const ep = this.timelineGraph.getCurrentEpoch();
        const epState = this.timelineGraph.getCurrentState();

        this.entities.npcs = [];
        this.entities.vehicles = this.entities.vehicles.filter(v => v.driver === this.entities.player);

        const pop = epState.population;
        for (let i = 0; i < pop; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 450 + 70;
            const x = cx + Math.cos(angle) * dist;
            const y = cy + Math.sin(angle) * dist;

            let role = 'CITIZEN';
            const r = Math.random();
            if (r < 0.22) role = 'GUARD';
            else if (r < 0.38) role = 'BEGGAR';
            else if (r < 0.45) role = 'SHAMAN';

            this.entities.npcs.push(new HumanoidAI(x, y, role, ep.index));
        }

        const vTypes = ep.spawnVehicles;
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const dist = 320 + Math.random() * 100;
            const x = cx + Math.cos(angle) * dist;
            const y = cy + Math.sin(angle) * dist;
            const chosenType = vTypes[i % vTypes.length];
            this.entities.vehicles.push(new VehicleMount(x, y, chosenType, ep.index));
        }
    }

    triggerMeteorStrike() {
        const p = this.entities.player;
        const tx = p.x + 120;
        const ty = p.y + 120;

        globalSound.playExplosion();
        this.camera.shake(25, 0.8);
        this.entities.spawnSparks(tx, ty, 40, '#ff5400');

        for (let i = 0; i < this.entities.npcs.length; i++) {
            const npc = this.entities.npcs[i];
            if (npc.position.dist({ x: tx, y: ty }) < 260) {
                npc.takeDamage(150, 'meteor');
            }
        }

        this.causalityEngine.registerIntervention(
            'METEOR_IMPACT',
            this.timelineGraph.activeEpochIndex,
            this.timelineGraph
        );
        this.hud.showToast('Метеорит обрушился на Землю! Будущее мутировало.', 'danger');
        document.getElementById('godModal').style.display = 'none';
    }

    triggerGoldenAge() {
        globalSound.playEureka();
        this.entities.player.hp = this.entities.player.maxHp;
        this.entities.npcs.forEach(n => {
            n.hp = n.maxHp;
            if (Math.random() > 0.4) n.say('Золотой Век Прозрения!', 3.0, true);
        });
        this.hud.showToast('Наступил Золотой Век Цивилизации!', 'gold');
        document.getElementById('godModal').style.display = 'none';
    }

    loop(currentTime) {
        let dt = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        if (dt > 0.1) dt = 0.1;
        if (dt < 0.001) dt = 0.001;

        this.update(dt);
        this.render();

        this.input.endFrame();
        requestAnimationFrame((t) => this.loop(t));
    }

    update(dt) {
        this.input.updateMouseWorld(this.camera);

        const currentEpoch = this.timelineGraph.getCurrentEpoch();
        const curIdx = currentEpoch.index;

        // Зум колесиком мыши
        if (this.input.wheelDelta !== 0) {
            this.camera.zoomBy(this.input.wheelDelta);
        }

        // Обновление игрока
        this.entities.player.update(dt, this.input, this.world, this.entities, curIdx);

        // Камера следует за игроком
        this.camera.setTarget(this.entities.player.x, this.entities.player.y);
        this.camera.update(dt);

        // Обновление транспорта
        for (let i = 0; i < this.entities.vehicles.length; i++) {
            this.entities.vehicles[i].update(dt, this.world, this.entities);
        }

        // Обновление NPC
        for (let i = 0; i < this.entities.npcs.length; i++) {
            this.entities.npcs[i].update(dt, this.entities.player, this.world, this.entities, this.wantedSystem.stars);
        }

        // Обновление снарядов
        for (let i = this.entities.projectiles.length - 1; i >= 0; i--) {
            const p = this.entities.projectiles[i];
            p.update(dt, this.world, this.entities);
            if (p.isDead) this.entities.projectiles.splice(i, 1);
        }

        // Обновление частиц
        for (let i = this.entities.particles.length - 1; i >= 0; i--) {
            const part = this.entities.particles[i];
            part.update(dt);
            if (part.life <= 0) this.entities.particles.splice(i, 1);
        }

        // Автономная цивилизация
        this.civManager.update(dt, this.timelineGraph);

        // Розыск и Эврика
        this.wantedSystem.update(dt, this.entities.player, this.entities, curIdx);
        this.discoveryDrive.update(dt, this.entities, this.causalityEngine, this.timelineGraph);

        // Проверка близости к транспорту для [F]/[E]
        this.checkMountPrompts();

        // Обновление HUD
        this.hud.updatePlayerStats(this.entities.player);
        const livingPop = this.entities.npcs.filter(n => !n.isDead).length;
        this.hud.updatePopulation(livingPop, this.timelineGraph.timelineDivergence);
    }

    checkMountPrompts() {
        const player = this.entities.player;
        if (player.state === 'DRIVING') {
            this.hud.setInteractionPrompt(true);
            return;
        }

        let near = false;
        for (let i = 0; i < this.entities.vehicles.length; i++) {
            const v = this.entities.vehicles[i];
            if (v.isDead) continue;
            if (player.position.distSq(v.position) < 80 * 80) {
                near = true;
                break;
            }
        }
        this.hud.setInteractionPrompt(near);
    }

    render() {
        const currentEpoch = this.timelineGraph.getCurrentEpoch();
        this.renderer.render(
            this.world,
            this.entities,
            this.camera,
            currentEpoch,
            this.timelineGraph.timelineDivergence
        );
    }
}

// Загрузка пресетов и старт
async function start() {
    try {
        const res = await fetch('./assets/data/timeline_presets.json');
        const presetsData = await res.json();
        window.game = new Engine(presetsData);
    } catch (err) {
        console.error('Ошибка загрузки timeline_presets.json:', err);
    }
}

window.addEventListener('DOMContentLoaded', start);
