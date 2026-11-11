/**
 * ============================================================================
 * EARTH: UNWRITTEN — WORLD ENGINE (js/world.js)
 * Карта Земли, процедурные биомы, смена 4 эпох и архитектурный рендеринг.
 * ============================================================================
 */

class WorldEngine {
    constructor() {
        this.width = 3600;
        this.height = 3600;

        // Матрица 4 эпох
        this.currentEra = 0;
        this.eras = [
            {
                id: 'stone',
                name: 'КАМЕННЫЙ ВЕК',
                yearText: '-10 000 до н.э.',
                yearNumeric: -10000,
                groundColor: '#78855a',
                roadColor: '#626e47',
                riverColor: '#3d6377',
                tarColor: '#1a1918',
                ambientColor: 'rgba(255, 230, 200, 0.05)',
                structuresName: 'Стойбища и Костры'
            },
            {
                id: 'bronze_bitumen',
                name: 'БРОНЗОВО-БИТУМНЫЙ ВЕК',
                yearText: '-2 500 до н.э.',
                yearNumeric: -2500,
                groundColor: '#c29d5b',
                roadColor: '#8a6e38',
                riverColor: '#305872',
                tarColor: '#121110',
                ambientColor: 'rgba(255, 170, 50, 0.08)',
                structuresName: 'Смоляные Зиккураты'
            },
            {
                id: 'steam_iron',
                name: 'ПАРОВОЙ ВЕК ЖЕЛЕЗА',
                yearText: '1880 г. н.э.',
                yearNumeric: 1880,
                groundColor: '#474a51',
                roadColor: '#2b2d31',
                riverColor: '#284654',
                tarColor: '#0a0a0a',
                ambientColor: 'rgba(100, 100, 110, 0.08)',
                structuresName: 'Чугунные Мануфактуры'
            },
            {
                id: 'neo_metropolis',
                name: 'НЕО-МЕГАПОЛИС',
                yearText: '2150 г. н.э.',
                yearNumeric: 2150,
                groundColor: '#0a0e17',
                roadColor: '#111827',
                riverColor: '#005f73',
                tarColor: '#05070a',
                ambientColor: 'rgba(0, 229, 255, 0.06)',
                structuresName: 'Обсидиановые Монолиты'
            }
        ];

        // Год Земли (динамический)
        this.currentYear = this.eras[0].yearNumeric;

        // Коллекция статических препятствий и структур
        this.buildings = [];
        this.tarPits = [];
        this.craters = [];
        this.foliage = [];

        // Анимационные таймеры
        this.animTimer = 0;

        // Генерация начального мира
        this.generateWorld();
    }

    generateWorld() {
        this.buildings = [];
        this.tarPits = [];
        this.foliage = [];

        // 1. Битумные озера и топи (природная геохимическая аномалия Земли)
        const pitCenters = [
            { x: 1200, y: 1300, rx: 110, ry: 80 },
            { x: 2400, y: 1100, rx: 90, ry: 70 },
            { x: 1400, y: 2500, rx: 130, ry: 90 },
            { x: 2600, y: 2400, rx: 100, ry: 85 }
        ];
        pitCenters.forEach(p => {
            this.tarPits.push({
                x: p.x,
                y: p.y,
                rx: p.rx,
                ry: p.ry
            });
        });

        // 2. Деревья / рощи / скалы по краям мира
        for (let i = 0; i < 90; i++) {
            const x = Math.random() * this.width;
            const y = Math.random() * this.height;
            // Не спавним прямо в центре карты (там городская зона)
            if (Math.hypot(x - 1800, y - 1800) > 350) {
                this.foliage.push({
                    x: x,
                    y: y,
                    radius: Math.random() * 16 + 14,
                    type: Math.random() > 0.4 ? 'tree' : 'rock'
                });
            }
        }

        // 3. Здания текущей эпохи
        this.buildEraStructures();
    }

    buildEraStructures() {
        this.buildings = [];
        const centerX = 1800;
        const centerY = 1800;

        if (this.currentEra === 0) {
            // ЭПОХА 1: Каменный Век — шатры из шкур, костры, тотемы
            const offsets = [
                { dx: -180, dy: -160, w: 90, h: 90, type: 'hut' },
                { dx: 160, dy: -180, w: 100, h: 90, type: 'hut' },
                { dx: -200, dy: 170, w: 95, h: 95, type: 'hut' },
                { dx: 180, dy: 190, w: 110, h: 100, type: 'hut' },
                { dx: 0, dy: -280, w: 140, h: 80, type: 'totem_circle' },
                { dx: -350, dy: 0, w: 90, h: 120, type: 'bone_palisade' },
                { dx: 350, dy: 0, w: 90, h: 120, type: 'bone_palisade' }
            ];

            offsets.forEach(o => {
                this.buildings.push({
                    x: centerX + o.dx,
                    y: centerY + o.dy,
                    w: o.w,
                    h: o.h,
                    type: o.type,
                    color: '#4a3728'
                });
            });
        } else if (this.currentEra === 1) {
            // ЭПОХА 2: Бронзово-Битумный Век — ступенчатые зиккураты, смоляные склады
            this.buildings.push({
                x: centerX - 100,
                y: centerY - 100,
                w: 200,
                h: 200,
                type: 'ziggurat',
                color: '#2b231a'
            });

            const zOffsets = [
                { dx: -280, dy: -240, w: 130, h: 100, type: 'tar_storage' },
                { dx: 220, dy: -260, w: 140, h: 110, type: 'tar_storage' },
                { dx: -290, dy: 220, w: 130, h: 120, type: 'tar_storage' },
                { dx: 230, dy: 230, w: 150, h: 110, type: 'tar_storage' }
            ];
            zOffsets.forEach(o => {
                this.buildings.push({
                    x: centerX + o.dx,
                    y: centerY + o.dy,
                    w: o.w,
                    h: o.h,
                    type: o.type,
                    color: '#3d3023'
                });
            });
        } else if (this.currentEra === 2) {
            // ЭПОХА 3: Паровой Век Железа — кирпичные заводы, мануфактуры с трубами
            const factoryOffsets = [
                { dx: -260, dy: -260, w: 180, h: 130, type: 'factory' },
                { dx: 120, dy: -270, w: 190, h: 140, type: 'factory' },
                { dx: -270, dy: 140, w: 200, h: 150, type: 'factory' },
                { dx: 140, dy: 150, w: 180, h: 140, type: 'factory' },
                { dx: -60, dy: -180, w: 120, h: 70, type: 'station' }
            ];
            factoryOffsets.forEach(o => {
                this.buildings.push({
                    x: centerX + o.dx,
                    y: centerY + o.dy,
                    w: o.w,
                    h: o.h,
                    type: o.type,
                    color: '#7f2618'
                });
            });
        } else if (this.currentEra === 3) {
            // ЭПОХА 4: Нео-Мегаполис — монолитные небоскребы из обсидиана с неоном
            const skyOffsets = [
                { dx: -280, dy: -280, w: 180, h: 180, type: 'monolith', neon: '#00e5ff' },
                { dx: 130, dy: -290, w: 200, h: 190, type: 'monolith', neon: '#ff0055' },
                { dx: -290, dy: 130, w: 190, h: 200, type: 'monolith', neon: '#ffb703' },
                { dx: 140, dy: 140, w: 210, h: 210, type: 'monolith', neon: '#7209b7' },
                { dx: -70, dy: -70, w: 140, h: 140, type: 'nexus_core', neon: '#00e5ff' }
            ];
            skyOffsets.forEach(o => {
                this.buildings.push({
                    x: centerX + o.dx,
                    y: centerY + o.dy,
                    w: o.w,
                    h: o.h,
                    type: o.type,
                    color: '#090b10',
                    neon: o.neon
                });
            });
        }
    }

    /**
     * Проверка коллизии точки или круга с препятствиями (здания, скалы, кратеры).
     */
    isSolid(x, y, radius = 0) {
        // Границы карты Земли
        if (x - radius < 60 || x + radius > this.width - 60 ||
            y - radius < 60 || y + radius > this.height - 60) {
            return true;
        }

        // Коллизия со зданиями (AABB с учетом радиуса)
        for (let i = 0; i < this.buildings.length; i++) {
            const b = this.buildings[i];
            if (x + radius > b.x && x - radius < b.x + b.w &&
                y + radius > b.y && y - radius < b.y + b.h) {
                return true;
            }
        }

        // Коллизия со скалами
        for (let i = 0; i < this.foliage.length; i++) {
            const f = this.foliage[i];
            if (f.type === 'rock') {
                const distSq = (x - f.x) ** 2 + (y - f.y) ** 2;
                if (distSq < (radius + f.radius * 0.8) ** 2) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Продвижение Эпохи вперед (Хроноскачок).
     */
    advanceEra(entities) {
        if (this.currentEra >= this.eras.length - 1) {
            // Зацикливание или переход в трансцендентную стадию
            this.currentEra = 0;
            this.currentYear = this.eras[0].yearNumeric;
        } else {
            this.currentEra++;
            this.currentYear = this.eras[this.currentEra].yearNumeric;
        }

        // Перестройка архитектуры
        this.buildEraStructures();

        // Звуковая фанфара
        window.sound.playEraFanfare();

        // Обновление транспорта на улицах города под новую эпоху
        this.respawnEraVehicles(entities);

        // Обновление стражников
        this.updateNPCArmament(entities);

        // Уведомление в Хронику и интерфейс
        const era = this.eras[this.currentEra];
        window.uiController.updateEra(era);
        window.aiEngine.chronicle.addEntry(
            `ХРОНОСКАЧОК: Земля вступила в [${era.name}] (${era.yearText})! Архитектура и технологии трансформированы.`,
            'era'
        );
        window.uiController.showToast(`НОВАЯ ЭПОХА: ${era.name}!`, 'gold');
    }

    /**
     * Смена транспорта в мире на соответствующий новой эпохе.
     */
    respawnEraVehicles(entities) {
        // Очищаем свободный транспорт (кроме того, в котором сидит игрок)
        entities.vehicles = entities.vehicles.filter(v => v.driver === entities.player);

        const typesByEra = [
            ['mammoth', 'auroch'],
            ['chariot', 'rhino'],
            ['steam_car', 'steam_car'],
            ['grav_speeder', 'grav_speeder']
        ];

        const types = typesByEra[this.currentEra];

        // Спавним 6 новых единиц техники/зверей вокруг поселения
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const dist = 320 + Math.random() * 140;
            const vx = 1800 + Math.cos(angle) * dist;
            const vy = 1800 + Math.sin(angle) * dist;
            const chosenType = types[i % types.length];

            const vehicle = new window.Vehicle(vx, vy, chosenType, this.currentEra);
            entities.vehicles.push(vehicle);
        }
    }

    /**
     * Обновление экипировки и одежды стражи при смене эпохи.
     */
    updateNPCArmament(entities) {
        entities.npcs.forEach(npc => {
            npc.eraIndex = this.currentEra;
            npc.configureAppearance();
        });
    }

    /**
     * Катаклизм Режима Бога: Метеоритный Удар.
     */
    triggerMeteor(entities, targetX = 1800, targetY = 1800) {
        window.sound.playExplosion();
        // Кратер
        this.craters.push({
            x: targetX,
            y: targetY,
            radius: 80,
            life: 60.0
        });

        // Взрывная волна и урон
        const blastRadius = 240;
        for (let i = 0; i < entities.npcs.length; i++) {
            const npc = entities.npcs[i];
            const dist = Math.hypot(npc.x - targetX, npc.y - targetY);
            if (dist < blastRadius) {
                npc.takeDamage(120, 'meteor', entities);
            }
        }

        if (Math.hypot(entities.player.x - targetX, entities.player.y - targetY) < blastRadius) {
            entities.player.takeDamage(75, 'meteor', entities);
        }

        // Огненные искры и дым
        for (let i = 0; i < 50; i++) {
            entities.particles.push(new window.Particle(targetX, targetY, {
                vx: (Math.random() - 0.5) * 350,
                vy: (Math.random() - 0.5) * 350,
                color: Math.random() > 0.5 ? '#ff5400' : '#ffb703',
                size: Math.random() * 8 + 4,
                life: 0.8,
                glow: true
            }));
        }

        window.aiEngine.chronicle.addEntry(
            `БОЖЕСТВЕННЫЙ КАТАКЛИЗМ: Пылающий метеорит врезался в земную твердь!`,
            'crime'
        );
        window.uiController.showToast('Метеорит обрушился на Землю!', 'danger');
    }

    /**
     * Катаклизм Режима Бога: Битумный Мор (Ядовитое облако).
     */
    triggerBitumenPlague(entities) {
        window.sound.playCrash();
        for (let i = 0; i < entities.npcs.length; i++) {
            const npc = entities.npcs[i];
            if (Math.random() > 0.3) {
                npc.takeDamage(35, 'plague', entities);
                npc.say('Мор! Черная смола в воздухе!', 3.0);
                npc.state = 'FLEE';
            }
        }
        window.aiEngine.chronicle.addEntry(
            `БИТУМНЫЙ МОР: Испарения смоляных глубин поразили городские кварталы!`,
            'crime'
        );
        window.uiController.showToast('Битумная Чума охватила город!', 'danger');
    }

    /**
     * Благословение Режима Бога: Золотой Век.
     */
    triggerGoldenAge(entities) {
        window.sound.playEureka();
        entities.npcs.forEach(npc => {
            npc.hp = npc.maxHp;
            if (Math.random() > 0.5) {
                npc.say('Слава Небожителям! Золотой Век!', 3.0, true);
            }
        });
        entities.player.hp = entities.player.maxHp;
        window.aiEngine.chronicle.addEntry(
            `ЗОЛОТОЙ ВЕК: Мир озарен благоденствием и массовыми открытиями!`,
            'eureka'
        );
        window.uiController.showToast('Наступил Золотой Век Прозрения!', 'gold');
    }

    update(dt) {
        this.animTimer += dt;
        // Затухание кратеров
        for (let i = this.craters.length - 1; i >= 0; i--) {
            this.craters[i].life -= dt;
            if (this.craters[i].life <= 0) {
                this.craters.splice(i, 1);
            }
        }
    }

    draw(ctx, camera) {
        const era = this.eras[this.currentEra];

        // 1. Фоновая заливка грунта
        ctx.fillStyle = era.groundColor;
        ctx.fillRect(0, 0, this.width, this.height);

        // 2. Дороги и перекрестки цивилизации
        this.drawRoads(ctx, era);

        // 3. Битумные озера и топи
        this.drawTarPits(ctx, era);

        // 4. Кратеры от метеоритов
        this.drawCraters(ctx);

        // 5. Деревья и скалы
        this.drawFoliage(ctx);

        // 6. Здания и архитектура
        this.drawBuildings(ctx, era);

        // 7. Границы карты мира
        ctx.strokeStyle = '#d90429';
        ctx.lineWidth = 8;
        ctx.strokeRect(40, 40, this.width - 80, this.height - 80);
    }

    drawRoads(ctx, era) {
        ctx.fillStyle = era.roadColor;

        // Главные осевые проспекты через центр (1800, 1800)
        const roadWidth = this.currentEra === 3 ? 90 : 70;
        ctx.fillRect(0, 1800 - roadWidth / 2, this.width, roadWidth);
        ctx.fillRect(1800 - roadWidth / 2, 0, roadWidth, this.height);

        // Кольцевая дорога
        ctx.lineWidth = roadWidth * 0.8;
        ctx.strokeStyle = era.roadColor;
        ctx.beginPath();
        ctx.arc(1800, 1800, 480, 0, Math.PI * 2);
        ctx.stroke();

        // В Нео-Мегаполисе рисуем неоновую разметку
        if (this.currentEra === 3) {
            ctx.strokeStyle = '#00e5ff';
            ctx.lineWidth = 2;
            ctx.setLineDash([16, 16]);
            ctx.beginPath();
            ctx.moveTo(0, 1800);
            ctx.lineTo(this.width, 1800);
            ctx.moveTo(1800, 0);
            ctx.lineTo(1800, this.height);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }

    drawTarPits(ctx, era) {
        for (let i = 0; i < this.tarPits.length; i++) {
            const pit = this.tarPits[i];
            ctx.save();
            ctx.fillStyle = era.tarColor;
            ctx.beginPath();
            ctx.ellipse(pit.x, pit.y, pit.rx, pit.ry, 0, 0, Math.PI * 2);
            ctx.fill();

            // Анимация пузырей смолы
            const bubbleScale = Math.sin(this.animTimer * 2 + i) * 0.5 + 0.5;
            ctx.fillStyle = '#ff5400';
            ctx.beginPath();
            ctx.arc(pit.x + Math.sin(i) * 20, pit.y + Math.cos(i) * 15, 4 * bubbleScale, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    }

    drawCraters(ctx) {
        for (let i = 0; i < this.craters.length; i++) {
            const c = this.craters[i];
            ctx.save();
            ctx.fillStyle = '#1c1917';
            ctx.beginPath();
            ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#ff5400';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.restore();
        }
    }

    drawFoliage(ctx) {
        for (let i = 0; i < this.foliage.length; i++) {
            const f = this.foliage[i];
            ctx.save();
            if (f.type === 'tree') {
                // Дерево / Папоротник
                ctx.fillStyle = this.currentEra === 3 ? '#1e293b' : '#386641';
                ctx.beginPath();
                ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = this.currentEra === 3 ? '#00e5ff' : '#6a994e';
                ctx.beginPath();
                ctx.arc(f.x - 3, f.y - 3, f.radius * 0.6, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Каменный валун
                ctx.fillStyle = '#5c677d';
                ctx.beginPath();
                ctx.ellipse(f.x, f.y, f.radius, f.radius * 0.7, 0.4, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
    }

    drawBuildings(ctx, era) {
        for (let i = 0; i < this.buildings.length; i++) {
            const b = this.buildings[i];
            ctx.save();

            // Тень здания
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.fillRect(b.x + 10, b.y + 12, b.w, b.h);

            // Основной фасад
            ctx.fillStyle = b.color;
            ctx.fillRect(b.x, b.y, b.w, b.h);

            // Детализация по типам архитектуры
            if (b.type === 'hut') {
                // Шатер из бивней
                ctx.strokeStyle = '#e9ecef';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(b.x, b.y + b.h);
                ctx.lineTo(b.x + b.w / 2, b.y);
                ctx.lineTo(b.x + b.w, b.y + b.h);
                ctx.stroke();
                // Костер в центре
                ctx.fillStyle = '#ff5400';
                ctx.beginPath();
                ctx.arc(b.x + b.w / 2, b.y + b.h / 2, 6, 0, Math.PI * 2);
                ctx.fill();
            } else if (b.type === 'ziggurat') {
                // Ступени зиккурата
                ctx.strokeStyle = '#ffb703';
                ctx.lineWidth = 2;
                ctx.strokeRect(b.x + 15, b.y + 15, b.w - 30, b.h - 30);
                ctx.strokeRect(b.x + 35, b.y + 35, b.w - 70, b.h - 70);
                ctx.fillStyle = '#ffb703';
                ctx.fillRect(b.x + b.w / 2 - 15, b.y + b.h / 2 - 15, 30, 30);
            } else if (b.type === 'factory') {
                // Окна мануфактуры и дымящая труба
                ctx.fillStyle = '#ffbe0b';
                ctx.fillRect(b.x + 12, b.y + 14, 16, 16);
                ctx.fillRect(b.x + 40, b.y + 14, 16, 16);
                ctx.fillRect(b.x + 68, b.y + 14, 16, 16);
                // Труба
                ctx.fillStyle = '#1c1c1c';
                ctx.beginPath();
                ctx.arc(b.x + b.w - 20, b.y + 20, 10, 0, Math.PI * 2);
                ctx.fill();
            } else if (b.type === 'monolith') {
                // Неоновый монолит будущего
                ctx.strokeStyle = b.neon || '#00e5ff';
                ctx.lineWidth = 3;
                ctx.shadowBlur = 14;
                ctx.shadowColor = b.neon || '#00e5ff';
                ctx.strokeRect(b.x, b.y, b.w, b.h);

                // Голографические полосы
                ctx.fillStyle = b.neon || '#00e5ff';
                ctx.fillRect(b.x + 10, b.y + 10, b.w - 20, 4);
                ctx.fillRect(b.x + 10, b.y + b.h - 14, b.w - 20, 4);
            }

            ctx.restore();
        }
    }
}

// Экспорт
window.WorldEngine = WorldEngine;
