/**
 * ============================================================================
 * EARTH: UNWRITTEN — ENTITIES ENGINE (js/entities.js)
 * Классы: Particle, Projectile, Player, Vehicle, NPC.
 * Полная физика движения, угона, стрельбы, тарана и процедурный рендеринг.
 * ============================================================================
 */

// ============================================================================
// 1. PARTICLE SYSTEM (Система частиц)
// ============================================================================
class Particle {
    constructor(x, y, options = {}) {
        this.x = x;
        this.y = y;
        this.vx = options.vx || (Math.random() * 160 - 80);
        this.vy = options.vy || (Math.random() * 160 - 80);
        this.size = options.size || Math.random() * 4 + 2;
        this.maxLife = options.life || Math.random() * 0.4 + 0.3;
        this.life = this.maxLife;
        this.color = options.color || '#ff0055';
        this.shape = options.shape || 'circle'; // 'circle', 'rect', 'spark'
        this.gravity = options.gravity || 0;
        this.friction = options.friction || 0.92;
        this.glow = options.glow || false;
    }

    update(dt) {
        this.life -= dt;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vy += this.gravity * dt;
        this.vx *= Math.pow(this.friction, dt * 60);
        this.vy *= Math.pow(this.friction, dt * 60);
    }

    draw(ctx) {
        if (this.life <= 0) return;
        const progress = this.life / this.maxLife;
        ctx.save();
        ctx.globalAlpha = Math.max(0, progress);

        if (this.glow) {
            ctx.shadowBlur = 8;
            ctx.shadowColor = this.color;
        }

        ctx.fillStyle = this.color;
        if (this.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * progress, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.shape === 'rect') {
            const s = this.size * progress;
            ctx.fillRect(this.x - s / 2, this.y - s / 2, s, s);
        } else if (this.shape === 'spark') {
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
            ctx.stroke();
        }
        ctx.restore();
    }
}

// ============================================================================
// 2. PROJECTILE (Снаряды: камни, копья, пули, плазма)
// ============================================================================
class Projectile {
    constructor(x, y, vx, vy, options = {}) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = options.radius || 4;
        this.damage = options.damage || 20;
        this.owner = options.owner || null; // 'player' или 'npc'
        this.color = options.color || '#ffcc00';
        this.life = options.life || 1.8;
        this.type = options.type || 'bullet'; // 'rock', 'spear', 'bullet', 'plasma'
        this.isDead = false;
        this.trailTimer = 0;
    }

    update(dt, world, entities) {
        if (this.isDead) return;
        this.life -= dt;
        if (this.life <= 0) {
            this.isDead = true;
            return;
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Генерация шлейфа частиц
        this.trailTimer += dt;
        if (this.trailTimer > 0.03) {
            this.trailTimer = 0;
            if (this.type === 'plasma') {
                entities.particles.push(new Particle(this.x, this.y, {
                    size: 3, life: 0.25, color: '#00e5ff', glow: true, vx: -this.vx * 0.05, vy: -this.vy * 0.05
                }));
            } else if (this.type === 'bullet') {
                entities.particles.push(new Particle(this.x, this.y, {
                    size: 2, life: 0.15, color: '#999999', vx: 0, vy: 0
                }));
            }
        }

        // Коллизия с препятствиями мира (скалы, стены)
        if (world.isSolid(this.x, this.y)) {
            this.isDead = true;
            this.createImpactSparks(entities);
            return;
        }

        // Коллизия с существами
        if (this.owner === 'player') {
            // Проверка попадания по NPC
            for (let i = 0; i < entities.npcs.length; i++) {
                const npc = entities.npcs[i];
                if (npc.isDead) continue;
                const distSq = (this.x - npc.x) ** 2 + (this.y - npc.y) ** 2;
                if (distSq < (this.radius + npc.radius) ** 2) {
                    this.isDead = true;
                    npc.takeDamage(this.damage, 'player', entities);
                    this.createHitBlood(entities);
                    return;
                }
            }
        } else if (this.owner === 'npc') {
            // Проверка попадания по игроку
            const player = entities.player;
            const distSq = (this.x - player.x) ** 2 + (this.y - player.y) ** 2;
            if (distSq < (this.radius + player.radius) ** 2) {
                this.isDead = true;
                player.takeDamage(this.damage, 'npc', entities);
                this.createHitBlood(entities);
                return;
            }
        }
    }

    createImpactSparks(entities) {
        for (let i = 0; i < 6; i++) {
            entities.particles.push(new Particle(this.x, this.y, {
                vx: (Math.random() - 0.5) * 120,
                vy: (Math.random() - 0.5) * 120,
                color: this.type === 'plasma' ? '#00e5ff' : '#ffb703',
                life: 0.2,
                shape: 'spark',
                glow: true
            }));
        }
    }

    createHitBlood(entities) {
        for (let i = 0; i < 8; i++) {
            entities.particles.push(new Particle(this.x, this.y, {
                vx: (Math.random() - 0.5) * 160,
                vy: (Math.random() - 0.5) * 160,
                color: '#d90429',
                life: 0.35,
                shape: 'circle'
            }));
        }
    }

    draw(ctx) {
        if (this.isDead) return;
        ctx.save();
        ctx.translate(this.x, this.y);

        if (this.type === 'plasma') {
            ctx.shadowBlur = 12;
            ctx.shadowColor = '#00e5ff';
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#00e5ff';
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'spear') {
            const angle = Math.atan2(this.vy, this.vx);
            ctx.rotate(angle);
            ctx.strokeStyle = '#8d5b4c';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(-12, 0);
            ctx.lineTo(12, 0);
            ctx.stroke();
            ctx.fillStyle = '#222';
            ctx.beginPath();
            ctx.moveTo(12, -3);
            ctx.lineTo(18, 0);
            ctx.lineTo(12, 3);
            ctx.closePath();
            ctx.fill();
        } else {
            // Пуля или камень
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}

// ============================================================================
// 3. VEHICLE (Звери и Транспорт: Мамонт, Тур, Колесница, Паровик, Грави-кар)
// ============================================================================
class Vehicle {
    constructor(x, y, typeId, eraIndex = 0) {
        this.x = x;
        this.y = y;
        this.typeId = typeId; // 'mammoth', 'auroch', 'chariot', 'rhino', 'steam_car', 'grav_speeder'
        this.eraIndex = eraIndex;

        this.angle = Math.random() * Math.PI * 2;
        this.speed = 0;
        this.maxSpeed = 220;
        this.accel = 180;
        this.brake = 240;
        this.turnSpeed = 2.4;
        this.friction = 1.8;
        this.mass = 800; // Влияет на урон при таране пешеходов
        this.radius = 26;

        this.hp = 250;
        this.maxHp = 250;
        this.driver = null; // Ссылка на Player или NPC
        this.isDead = false;

        this.trailTimer = 0;
        this.configureType();
    }

    configureType() {
        switch (this.typeId) {
            case 'mammoth':
                this.name = 'Шерстистый Мамонт';
                this.maxSpeed = 160;
                this.accel = 120;
                this.turnSpeed = 1.8;
                this.mass = 2200;
                this.hp = 450;
                this.radius = 32;
                this.color = '#5a3d28';
                break;
            case 'auroch':
                this.name = 'Первобытный Тур';
                this.maxSpeed = 210;
                this.accel = 190;
                this.turnSpeed = 2.6;
                this.mass = 950;
                this.hp = 220;
                this.radius = 22;
                this.color = '#3d2b1f';
                break;
            case 'chariot':
                this.name = 'Битумная Колесница';
                this.maxSpeed = 260;
                this.accel = 220;
                this.turnSpeed = 2.2;
                this.friction = 1.4;
                this.mass = 1200;
                this.hp = 260;
                this.radius = 24;
                this.color = '#1f1e1d';
                break;
            case 'rhino':
                this.name = 'Броне-Носорог';
                this.maxSpeed = 190;
                this.accel = 150;
                this.turnSpeed = 1.9;
                this.mass = 2400;
                this.hp = 480;
                this.radius = 28;
                this.color = '#4a4d4e';
                break;
            case 'steam_car':
                this.name = 'Паровой Броневик';
                this.maxSpeed = 280;
                this.accel = 240;
                this.turnSpeed = 2.0;
                this.friction = 1.2;
                this.mass = 3000;
                this.hp = 550;
                this.radius = 28;
                this.color = '#7d3c26';
                break;
            case 'grav_speeder':
                this.name = 'Грави-Спидер Нео-Земли';
                this.maxSpeed = 420;
                this.accel = 380;
                this.turnSpeed = 3.2;
                this.friction = 0.8; // Легкий дрифт над землей
                this.mass = 1400;
                this.hp = 350;
                this.radius = 24;
                this.color = '#0f172a';
                break;
            default:
                this.name = 'Повозка';
                this.color = '#666';
        }
        this.maxHp = this.hp;
    }

    update(dt, world, entities) {
        if (this.isDead) return;

        // Если есть водитель, управление передается ему
        if (this.driver) {
            // Координаты водителя синхронизируются с транспортом
            this.driver.x = this.x;
            this.driver.y = this.y;
            this.driver.angle = this.angle;
        } else {
            // Без водителя естественное затухание скорости
            this.speed *= Math.max(0, 1 - this.friction * dt * 2);
        }

        // Перемещение по курсу
        const moveDist = this.speed * dt;
        const newX = this.x + Math.cos(this.angle) * moveDist;
        const newY = this.y + Math.sin(this.angle) * moveDist;

        // Проверка столкновения со статическими стенами мира
        if (world.isSolid(newX, newY, this.radius)) {
            // Удар о стену
            if (Math.abs(this.speed) > 70) {
                window.sound.playCrash();
                this.takeDamage(Math.abs(this.speed) * 0.15, entities);
                // Эффект искр и дыма
                for (let i = 0; i < 6; i++) {
                    entities.particles.push(new Particle(this.x, this.y, {
                        vx: (Math.random() - 0.5) * 100,
                        vy: (Math.random() - 0.5) * 100,
                        color: '#ffb703',
                        life: 0.25,
                        shape: 'spark'
                    }));
                }
            }
            this.speed = -this.speed * 0.3; // Отскок
        } else {
            this.x = newX;
            this.y = newY;
        }

        // Выхлоп / следы копыт / грави-свечение
        this.trailTimer += dt;
        if (this.trailTimer > 0.08 && Math.abs(this.speed) > 30) {
            this.trailTimer = 0;
            this.spawnTrailParticles(entities);
        }

        // ТАРАН ПЕШЕХОДОВ (GTA-ФИЗИКА СБИВАНИЯ)
        if (Math.abs(this.speed) > 75) {
            this.checkPedestrianCollisions(entities);
        }
    }

    spawnTrailParticles(entities) {
        const backX = this.x - Math.cos(this.angle) * this.radius;
        const backY = this.y - Math.sin(this.angle) * this.radius;

        if (this.typeId === 'steam_car') {
            // Черный дым и пар
            entities.particles.push(new Particle(backX, backY, {
                size: 6, life: 0.5, color: 'rgba(50, 50, 50, 0.7)', vx: -Math.cos(this.angle) * 30, vy: -Math.sin(this.angle) * 30 - 20
            }));
        } else if (this.typeId === 'grav_speeder') {
            // Голубое неоновое ионное свечение
            entities.particles.push(new Particle(backX, backY, {
                size: 4, life: 0.3, color: '#00e5ff', glow: true, vx: -Math.cos(this.angle) * 40, vy: -Math.sin(this.angle) * 40
            }));
        } else {
            // Пыль от копыт / колес
            entities.particles.push(new Particle(backX, backY, {
                size: 3, life: 0.3, color: 'rgba(160, 130, 90, 0.5)', vx: (Math.random() - 0.5) * 20, vy: (Math.random() - 0.5) * 20
            }));
        }
    }

    checkPedestrianCollisions(entities) {
        const hitSpeed = Math.abs(this.speed);
        for (let i = 0; i < entities.npcs.length; i++) {
            const npc = entities.npcs[i];
            if (npc.isDead || npc === this.driver) continue;

            const distSq = (this.x - npc.x) ** 2 + (this.y - npc.y) ** 2;
            if (distSq < (this.radius + npc.radius + 6) ** 2) {
                // СБИВАНИЕ ПЕШЕХОДА
                const damage = (hitSpeed / this.maxSpeed) * (this.mass / 12);
                const knockAngle = Math.atan2(npc.y - this.y, npc.x - this.x);
                const knockForce = hitSpeed * 1.4;

                npc.vx = Math.cos(knockAngle) * knockForce;
                npc.vy = Math.sin(knockAngle) * knockForce;

                // Кровь и звук
                window.sound.playCrash();
                for (let p = 0; p < 14; p++) {
                    entities.particles.push(new Particle(npc.x, npc.y, {
                        vx: Math.cos(knockAngle) * knockForce * 0.7 + (Math.random() - 0.5) * 120,
                        vy: Math.sin(knockAngle) * knockForce * 0.7 + (Math.random() - 0.5) * 120,
                        color: '#d90429',
                        life: 0.5,
                        size: 4
                    }));
                }

                npc.takeDamage(damage, this.driver === entities.player ? 'player' : 'vehicle', entities);

                // Если за рулем игрок — регистрируем наезд и розыск!
                if (this.driver === entities.player && window.aiEngine) {
                    window.aiEngine.wantedSystem.registerCrime('VEHICLE_MANSLAUGHTER', entities);
                }

                // Транспорт слегка замедляется от удара
                this.speed *= 0.85;
            }
        }
    }

    takeDamage(amount, entities) {
        this.hp -= amount;
        if (this.hp <= 0 && !this.isDead) {
            this.hp = 0;
            this.isDead = true;
            this.explode(entities);
        }
    }

    explode(entities) {
        window.sound.playExplosion();
        // Вспышка и обломки
        for (let i = 0; i < 28; i++) {
            entities.particles.push(new Particle(this.x, this.y, {
                vx: (Math.random() - 0.5) * 320,
                vy: (Math.random() - 0.5) * 320,
                color: Math.random() > 0.5 ? '#ff5400' : '#ffb703',
                size: Math.random() * 6 + 3,
                life: 0.6,
                glow: true
            }));
        }

        // Если был водитель, он катапультируется с уроном
        if (this.driver) {
            this.driver.takeDamage(40, 'explosion', entities);
            this.driver.currentVehicle = null;
            this.driver.state = 'ON_FOOT';
            this.driver = null;
        }
    }

    draw(ctx) {
        if (this.isDead) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Тень под транспортом
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(2, 6, this.radius * 1.1, this.radius * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Процедурный визуал по типам
        switch (this.typeId) {
            case 'mammoth':
                this.drawMammoth(ctx);
                break;
            case 'auroch':
                this.drawAuroch(ctx);
                break;
            case 'chariot':
                this.drawChariot(ctx);
                break;
            case 'rhino':
                this.drawRhino(ctx);
                break;
            case 'steam_car':
                this.drawSteamCar(ctx);
                break;
            case 'grav_speeder':
                this.drawGravSpeeder(ctx);
                break;
            default:
                ctx.fillStyle = this.color;
                ctx.fillRect(-this.radius, -this.radius / 2, this.radius * 2, this.radius);
        }

        // Полоска прочности (если поврежден)
        if (this.hp < this.maxHp) {
            ctx.rotate(-this.angle); // Отменяем вращение для полоски
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(-20, -this.radius - 12, 40, 5);
            ctx.fillStyle = '#06d6a0';
            ctx.fillRect(-20, -this.radius - 12, 40 * (this.hp / this.maxHp), 5);
        }

        ctx.restore();
    }

    drawMammoth(ctx) {
        // Тело мамонта
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, 28, 20, 0, 0, Math.PI * 2);
        ctx.fill();

        // Голова и хобот
        ctx.fillStyle = '#422c1d';
        ctx.beginPath();
        ctx.arc(20, 0, 14, 0, Math.PI * 2);
        ctx.fill();

        // Бивни (огромные изогнутые)
        ctx.strokeStyle = '#e9ecef';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(26, -8);
        ctx.quadraticCurveTo(42, -14, 46, -4);
        ctx.moveTo(26, 8);
        ctx.quadraticCurveTo(42, 14, 46, 4);
        ctx.stroke();

        // Хобот
        ctx.strokeStyle = '#422c1d';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(30, 0);
        ctx.lineTo(44, 0);
        ctx.stroke();

        // Седло из шкур
        ctx.fillStyle = '#9b2226';
        ctx.fillRect(-8, -12, 18, 24);
    }

    drawAuroch(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, 22, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        // Рога
        ctx.strokeStyle = '#e9ecef';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(14, -6);
        ctx.lineTo(24, -14);
        ctx.moveTo(14, 6);
        ctx.lineTo(24, 14);
        ctx.stroke();
    }

    drawChariot(ctx) {
        // Лошадь/тур в упряжке спереди
        ctx.fillStyle = '#3d2b1f';
        ctx.beginPath();
        ctx.ellipse(26, 0, 18, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Дышло упряжи
        ctx.strokeStyle = '#8d5b4c';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(-6, 0);
        ctx.stroke();

        // Корпус колесницы из смоляного дерева
        ctx.fillStyle = '#1a1918';
        ctx.fillRect(-24, -15, 20, 30);
        ctx.strokeStyle = '#ffb703';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-24, -15, 20, 30);

        // Колеса с серпами
        ctx.fillStyle = '#8b5a2b';
        ctx.fillRect(-18, -18, 8, 3);
        ctx.fillRect(-18, 15, 8, 3);
    }

    drawRhino(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, 26, 18, 0, 0, Math.PI * 2);
        ctx.fill();

        // Массивный рог
        ctx.fillStyle = '#dcdcdc';
        ctx.beginPath();
        ctx.moveTo(22, -4);
        ctx.lineTo(38, 0);
        ctx.lineTo(22, 4);
        ctx.closePath();
        ctx.fill();

        // Броня из битума
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 3;
        ctx.strokeRect(-12, -14, 22, 28);
    }

    drawSteamCar(ctx) {
        // Корпус броневика
        ctx.fillStyle = this.color;
        ctx.fillRect(-26, -18, 52, 36);
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 2;
        ctx.strokeRect(-26, -18, 52, 36);

        // Паровой котел и капот спереди
        ctx.fillStyle = '#3a3a3a';
        ctx.fillRect(8, -12, 16, 24);

        // Паровая труба
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(-8, -8, 5, 0, Math.PI * 2);
        ctx.fill();

        // Гусеницы / 4 массивных чугунных колеса
        ctx.fillStyle = '#1c1c1c';
        ctx.fillRect(-22, -22, 14, 5);
        ctx.fillRect(8, -22, 14, 5);
        ctx.fillRect(-22, 17, 14, 5);
        ctx.fillRect(8, 17, 14, 5);
    }

    drawGravSpeeder(ctx) {
        // Обтекаемый корпус спидера будущего
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.moveTo(28, 0);
        ctx.lineTo(-20, -16);
        ctx.lineTo(-12, 0);
        ctx.lineTo(-20, 16);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#00e5ff';
        ctx.stroke();

        // Кабина с голографическим фонарем
        ctx.fillStyle = '#ff0055';
        ctx.beginPath();
        ctx.arc(2, 0, 6, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ============================================================================
// 4. PLAYER (Главный герой)
// ============================================================================
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.angle = 0;
        this.radius = 14;

        this.hp = 100;
        this.maxHp = 100;
        this.speed = 190;
        this.state = 'ON_FOOT'; // 'ON_FOOT' или 'DRIVING'
        this.currentVehicle = null;

        this.attackCooldown = 0;
        this.stepTimer = 0;
        this.isDead = false;
    }

    update(dt, input, world, entities) {
        if (this.isDead) return;

        if (this.attackCooldown > 0) {
            this.attackCooldown -= dt;
        }

        if (this.state === 'DRIVING' && this.currentVehicle) {
            // УПРАВЛЕНИЕ ТРАНСПОРТОМ
            const v = this.currentVehicle;

            // Газ / тормоз
            if (input.up) {
                v.speed = Math.min(v.maxSpeed, v.speed + v.accel * dt);
            } else if (input.down) {
                v.speed = Math.max(-v.maxSpeed * 0.4, v.speed - v.brake * dt);
            } else {
                // Естественное торможение
                v.speed *= Math.max(0, 1 - v.friction * dt);
            }

            // Поворот руля (зависит от направления движения)
            const turnFactor = v.speed >= 0 ? 1 : -1;
            if (input.left) {
                v.angle -= v.turnSpeed * dt * turnFactor * (Math.abs(v.speed) / v.maxSpeed + 0.2);
            }
            if (input.right) {
                v.angle += v.turnSpeed * dt * turnFactor * (Math.abs(v.speed) / v.maxSpeed + 0.2);
            }

            // Синхронизация координат
            this.x = v.x;
            this.y = v.y;
            this.angle = v.angle;

            // Клавиша спешивания [F] или [E]
            if (input.interactJustPressed) {
                this.dismountVehicle();
            }

            // Стрельба / атака с транспорта
            if (input.attackJustPressed) {
                this.performAttack(input.mouseWorldX, input.mouseWorldY, entities);
            }
            return;
        }

        // ПЕШЕЕ ДВИЖЕНИЕ
        let moveX = 0;
        let moveY = 0;
        if (input.up) moveY -= 1;
        if (input.down) moveY += 1;
        if (input.left) moveX -= 1;
        if (input.right) moveX += 1;

        if (moveX !== 0 || moveY !== 0) {
            const len = Math.hypot(moveX, moveY);
            moveX /= len;
            moveY /= len;

            const nextX = this.x + moveX * this.speed * dt;
            const nextY = this.y + moveY * this.speed * dt;

            // Коллизии со стенами
            if (!world.isSolid(nextX, this.y, this.radius)) {
                this.x = nextX;
            }
            if (!world.isSolid(this.x, nextY, this.radius)) {
                this.y = nextY;
            }

            // Звук шагов
            this.stepTimer += dt;
            if (this.stepTimer > 0.32) {
                this.stepTimer = 0;
                window.sound.playFootstep();
            }
        }

        // Поворот за курсором мыши
        this.angle = Math.atan2(input.mouseWorldY - this.y, input.mouseWorldX - this.x);

        // Проверка угона / посадки на ближайший транспорт
        if (input.interactJustPressed) {
            this.tryMountVehicle(entities);
        }

        // Атака
        if (input.attackJustPressed) {
            this.performAttack(input.mouseWorldX, input.mouseWorldY, entities);
        }
    }

    tryMountVehicle(entities) {
        let closestVehicle = null;
        let minDistSq = 75 * 75; // Радиус взаимодействия

        for (let i = 0; i < entities.vehicles.length; i++) {
            const v = entities.vehicles[i];
            if (v.isDead) continue;
            const distSq = (this.x - v.x) ** 2 + (this.y - v.y) ** 2;
            if (distSq < minDistSq) {
                minDistSq = distSq;
                closestVehicle = v;
            }
        }

        if (closestVehicle) {
            // УГОН!
            window.sound.playMount();
            if (closestVehicle.driver && closestVehicle.driver !== this) {
                // Выбиваем старого водителя
                const victim = closestVehicle.driver;
                victim.currentVehicle = null;
                victim.state = 'ON_FOOT';
                victim.takeDamage(15, 'player', entities);
                victim.say('Мой зверь! Держи вора!', 3.0);
                victim.state = 'FLEE';

                // Регистрируем преступление
                if (window.aiEngine) {
                    window.aiEngine.wantedSystem.registerCrime('VEHICLE_THEFT', entities);
                }
            }

            this.state = 'DRIVING';
            this.currentVehicle = closestVehicle;
            closestVehicle.driver = this;

            window.uiController.showToast(`Вы оседлали: ${closestVehicle.name}!`, 'info');
        }
    }

    dismountVehicle() {
        if (!this.currentVehicle) return;
        window.sound.playMount();
        // Спешиваемся сбоку от транспорта
        const offsetAngle = this.currentVehicle.angle + Math.PI / 2;
        this.x = this.currentVehicle.x + Math.cos(offsetAngle) * (this.currentVehicle.radius + 18);
        this.y = this.currentVehicle.y + Math.sin(offsetAngle) * (this.currentVehicle.radius + 18);

        this.currentVehicle.driver = null;
        this.currentVehicle = null;
        this.state = 'ON_FOOT';
    }

    performAttack(targetX, targetY, entities) {
        if (this.attackCooldown > 0) return;
        const era = window.worldEngine ? window.worldEngine.currentEra : 0;

        if (era === 0) {
            // ЭПОХА 1: Удар дубиной из бивня мамонта (ближний бой, сплэш)
            this.attackCooldown = 0.45;
            window.sound.playHit();
            window.sound.playSlash();

            const hitRadius = 55;
            const hitAngle = this.angle;

            // Проверка попаданий в секторе
            for (let i = 0; i < entities.npcs.length; i++) {
                const npc = entities.npcs[i];
                if (npc.isDead) continue;
                const dist = Math.hypot(npc.x - this.x, npc.y - this.y);
                if (dist < hitRadius) {
                    const angleToNpc = Math.atan2(npc.y - this.y, npc.x - this.x);
                    let angleDiff = Math.abs(angleToNpc - hitAngle);
                    if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

                    if (angleDiff < Math.PI / 2.2) {
                        npc.takeDamage(35, 'player', entities);
                        // Отбрасывание
                        npc.vx = Math.cos(angleToNpc) * 140;
                        npc.vy = Math.sin(angleToNpc) * 140;
                    }
                }
            }

            // Частицы дугового замаха
            for (let a = -0.5; a <= 0.5; a += 0.2) {
                const pAngle = this.angle + a;
                entities.particles.push(new Particle(
                    this.x + Math.cos(pAngle) * 35,
                    this.y + Math.sin(pAngle) * 35,
                    { life: 0.15, size: 3, color: '#e9ecef', vx: Math.cos(pAngle) * 50, vy: Math.sin(pAngle) * 50 }
                ));
            }
        } else if (era === 1) {
            // ЭПОХА 2: Бросок битумного копья
            this.attackCooldown = 0.6;
            window.sound.playSlash();
            const angle = Math.atan2(targetY - this.y, targetX - this.x);
            const speed = 440;
            entities.projectiles.push(new Projectile(this.x, this.y, Math.cos(angle) * speed, Math.sin(angle) * speed, {
                owner: 'player', damage: 45, type: 'spear', radius: 6
            }));
        } else if (era === 2) {
            // ЭПОХА 3: Выстрел из парового револьвера
            this.attackCooldown = 0.35;
            window.sound.playShoot('steam');
            const angle = Math.atan2(targetY - this.y, targetX - this.x) + (Math.random() - 0.5) * 0.08;
            const speed = 750;
            entities.projectiles.push(new Projectile(this.x, this.y, Math.cos(angle) * speed, Math.sin(angle) * speed, {
                owner: 'player', damage: 40, type: 'bullet', radius: 4, color: '#ffb703'
            }));
            // Вспышка и пороховой дым
            entities.particles.push(new Particle(this.x + Math.cos(angle) * 18, this.y + Math.sin(angle) * 18, {
                size: 5, life: 0.2, color: 'rgba(255, 200, 50, 0.9)', glow: true
            }));
        } else if (era === 3) {
            // ЭПОХА 4: Плазменный карабин
            this.attackCooldown = 0.22;
            window.sound.playShoot('plasma');
            const angle = Math.atan2(targetY - this.y, targetX - this.x);
            const speed = 900;
            entities.projectiles.push(new Projectile(this.x, this.y, Math.cos(angle) * speed, Math.sin(angle) * speed, {
                owner: 'player', damage: 55, type: 'plasma', radius: 5, color: '#00e5ff'
            }));
        }
    }

    takeDamage(amount, source, entities) {
        if (this.isDead) return;
        this.hp -= amount;
        window.sound.playHit();

        // Кровь игрока
        for (let i = 0; i < 6; i++) {
            entities.particles.push(new Particle(this.x, this.y, {
                color: '#ff0055', life: 0.3, size: 3
            }));
        }

        if (this.hp <= 0) {
            this.hp = 0;
            this.isDead = true;
            this.handleDeath(entities);
        }
    }

    handleDeath(entities) {
        window.sound.playExplosion();
        if (this.currentVehicle) {
            this.currentVehicle.driver = null;
            this.currentVehicle = null;
        }
        window.uiController.showToast('ВЫ ПОГИБЛИ! Перерождение Первопредка...', 'danger');
        window.aiEngine.schoolArchive.recordPlayerDeath();

        // Быстрое воскрешение через 2.5 секунды в центре карты
        setTimeout(() => {
            this.hp = this.maxHp;
            this.isDead = false;
            this.x = 1800;
            this.y = 1800;
            this.state = 'ON_FOOT';
            window.aiEngine.wantedSystem.setStars(0);
            window.uiController.showToast('Первопредок вернулся к костру цивилизации!', 'gold');
        }, 2500);
    }

    draw(ctx) {
        if (this.isDead) return;

        // Если за рулем — рисуем только если это открытое седло
        if (this.state === 'DRIVING' && this.currentVehicle) {
            // Рисуем поверх зверя мини-силуэт наездника
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);
            ctx.fillStyle = '#00e5ff';
            ctx.beginPath();
            ctx.arc(0, 0, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            return;
        }

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Тень под ногами
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(0, 4, 12, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Тело игрока
        ctx.fillStyle = '#00e5ff'; // Неоновый/лазурный акцент главного героя
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Голова / шлем
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(2, 0, 8, 0, Math.PI * 2);
        ctx.fill();

        // Оружие в руках
        const era = window.worldEngine ? window.worldEngine.currentEra : 0;
        if (era === 0) {
            // Дубина из бивня
            ctx.fillStyle = '#e9ecef';
            ctx.fillRect(8, 4, 16, 5);
        } else if (era === 1) {
            // Копье
            ctx.strokeStyle = '#8d5b4c';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(4, 6);
            ctx.lineTo(26, 6);
            ctx.stroke();
        } else if (era === 2) {
            // Револьвер
            ctx.fillStyle = '#222';
            ctx.fillRect(8, 4, 10, 4);
        } else if (era === 3) {
            // Плазменная винтовка
            ctx.fillStyle = '#7209b7';
            ctx.fillRect(6, 4, 18, 5);
            ctx.fillStyle = '#00e5ff';
            ctx.fillRect(16, 5, 8, 3);
        }

        ctx.restore();
    }
}

// ============================================================================
// 5. NPC (Жители, Бродяги с Эврикой, Стражники)
// ============================================================================
class NPC {
    constructor(x, y, role = 'CITIZEN', eraIndex = 0) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.angle = Math.random() * Math.PI * 2;
        this.radius = 12;

        this.role = role; // 'CITIZEN', 'BEGGAR', 'GUARD'
        this.eraIndex = eraIndex;
        this.hp = role === 'GUARD' ? 90 : 45;
        this.maxHp = this.hp;
        this.speed = role === 'GUARD' ? 170 : 110;
        this.state = 'WANDER'; // 'WANDER', 'WORK', 'CHAT', 'FLEE', 'ATTACK'

        // Таймеры поведения
        this.stateTimer = Math.random() * 4 + 2;
        this.attackCooldown = 0;
        this.targetX = this.x;
        this.targetY = this.y;
        this.isDead = false;

        // Речевые облачка (Speech Bubble)
        this.speechText = '';
        this.speechTimer = 0;
        this.speechMaxTime = 0;
        this.isEureka = false;

        this.configureAppearance();
    }

    configureAppearance() {
        if (this.role === 'GUARD') {
            this.color = '#d90429'; // Красный мундир / боевая раскраска
            this.weaponType = this.eraIndex >= 2 ? 'ranged' : 'melee';
        } else if (this.role === 'BEGGAR') {
            this.color = '#7f5539'; // Грязная дерюга
            this.weaponType = 'none';
        } else {
            this.color = '#4361ee'; // Мирный житель
            this.weaponType = 'none';
        }
    }

    say(text, duration = 3.5, isEureka = false) {
        this.speechText = text;
        this.speechTimer = duration;
        this.speechMaxTime = duration;
        this.isEureka = isEureka;
    }

    takeDamage(amount, source, entities) {
        if (this.isDead) return;
        this.hp -= amount;

        // Всплеск крови
        for (let i = 0; i < 7; i++) {
            entities.particles.push(new Particle(this.x, this.y, {
                color: '#d90429', life: 0.35, size: 3
            }));
        }

        if (source === 'player') {
            // Преступление зафиксировано
            if (window.aiEngine) {
                window.aiEngine.wantedSystem.registerCrime('ASSAULT', entities);
            }
        }

        if (this.hp <= 0) {
            this.hp = 0;
            this.isDead = true;
            this.handleDeath(source, entities);
        } else {
            // Раненый реагирует
            if (this.role === 'GUARD') {
                this.state = 'ATTACK';
                this.say('Именем закона, стоять!', 2.0);
            } else {
                this.state = 'FLEE';
                this.say('Убийца! Помогите!', 2.5);
            }
        }
    }

    handleDeath(source, entities) {
        if (source === 'player' && window.aiEngine) {
            window.aiEngine.wantedSystem.registerCrime('MURDER', entities);
            window.aiEngine.schoolArchive.recordKill(this.role);
        }

        // Крик агонии соседей
        for (let i = 0; i < entities.npcs.length; i++) {
            const neighbor = entities.npcs[i];
            if (neighbor !== this && !neighbor.isDead) {
                const dist = Math.hypot(neighbor.x - this.x, neighbor.y - this.y);
                if (dist < 180 && neighbor.role !== 'GUARD') {
                    neighbor.state = 'FLEE';
                    if (Math.random() > 0.6) neighbor.say('Труп! Спасайтесь!', 2.5);
                }
            }
        }
    }

    update(dt, player, world, entities) {
        if (this.isDead) return;

        // Таймер облачка речи
        if (this.speechTimer > 0) {
            this.speechTimer -= dt;
            if (this.speechTimer <= 0) {
                this.speechText = '';
            }
        }

        if (this.attackCooldown > 0) {
            this.attackCooldown -= dt;
        }

        // Физическое затухание отбрасывания (knockback)
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vx *= Math.pow(0.85, dt * 60);
        this.vy *= Math.pow(0.85, dt * 60);

        // ИИ ПОВЕДЕНИЕ В ЗАВИСИМОСТИ ОТ СОСТОЯНИЯ
        const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);
        const wanted = window.aiEngine ? window.aiEngine.wantedSystem.stars : 0;

        // Если стражник и есть розыск — атакуем игрока!
        if (this.role === 'GUARD' && wanted > 0) {
            this.state = 'ATTACK';
        }

        switch (this.state) {
            case 'WANDER':
                this.stateTimer -= dt;
                if (this.stateTimer <= 0) {
                    this.stateTimer = Math.random() * 4 + 2;
                    this.targetX = this.x + (Math.random() - 0.5) * 200;
                    this.targetY = this.y + (Math.random() - 0.5) * 200;
                }
                this.moveTo(this.targetX, this.targetY, this.speed * 0.5, dt, world);
                break;

            case 'FLEE':
                // Убегаем прочь от игрока
                const fleeAngle = Math.atan2(this.y - player.y, this.x - player.x);
                this.targetX = this.x + Math.cos(fleeAngle) * 250;
                this.targetY = this.y + Math.sin(fleeAngle) * 250;
                this.moveTo(this.targetX, this.targetY, this.speed * 1.3, dt, world);
                break;

            case 'ATTACK':
                // Стражник преследует игрока
                if (distToPlayer > 35) {
                    this.moveTo(player.x, player.y, this.speed, dt, world);
                }

                // Атака игрока
                if (distToPlayer < 45 && this.attackCooldown <= 0) {
                    this.attackCooldown = 0.8;
                    window.sound.playHit();
                    player.takeDamage(15, 'npc', entities);
                    this.say('Сдавайся!', 1.2);
                } else if (distToPlayer < 240 && distToPlayer > 80 && this.weaponType === 'ranged' && this.attackCooldown <= 0) {
                    // Дистанционная стрельба стражи
                    this.attackCooldown = 1.4;
                    window.sound.playShoot(this.eraIndex >= 3 ? 'plasma' : 'steam');
                    const shootAngle = Math.atan2(player.y - this.y, player.x - this.x);
                    entities.projectiles.push(new Projectile(this.x, this.y, Math.cos(shootAngle) * 600, Math.sin(shootAngle) * 600, {
                        owner: 'npc', damage: 18, color: '#d90429'
                    }));
                }
                break;
        }
    }

    moveTo(tx, ty, moveSpeed, dt, world) {
        const dx = tx - this.x;
        const dy = ty - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 8) {
            this.angle = Math.atan2(dy, dx);
            const stepX = (dx / dist) * moveSpeed * dt;
            const stepY = (dy / dist) * moveSpeed * dt;

            if (!world.isSolid(this.x + stepX, this.y, this.radius)) {
                this.x += stepX;
            }
            if (!world.isSolid(this.x, this.y + stepY, this.radius)) {
                this.y += stepY;
            }
        }
    }

    draw(ctx) {
        if (this.isDead) {
            // Труп на земле
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

        // Тело NPC
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Голова
        ctx.fillStyle = '#ffdfba';
        ctx.beginPath();
        ctx.arc(3, 0, 6, 0, Math.PI * 2);
        ctx.fill();

        // Отличительный знак стражника / шлем
        if (this.role === 'GUARD') {
            ctx.fillStyle = '#ffd166';
            ctx.fillRect(4, -4, 4, 8);
        }

        ctx.restore();

        // ОТРИСОВКА РЕЧЕВОГО ОБЛАЧКА (SPEECH BUBBLE) НАД ГОЛОВОЙ
        if (this.speechText && this.speechTimer > 0) {
            this.drawSpeechBubble(ctx);
        }
    }

    drawSpeechBubble(ctx) {
        ctx.save();
        ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        const metrics = ctx.measureText(this.speechText);
        const bubbleW = metrics.width + 16;
        const bubbleH = 24;
        const bx = this.x - bubbleW / 2;
        const by = this.y - this.radius - bubbleH - 12;

        const alpha = Math.min(1, this.speechTimer * 2);
        ctx.globalAlpha = alpha;

        // Фон бабла
        ctx.shadowBlur = this.isEureka ? 12 : 6;
        ctx.shadowColor = this.isEureka ? '#ffb703' : 'rgba(0,0,0,0.5)';
        ctx.fillStyle = this.isEureka ? '#ffb703' : '#ffffff';
        ctx.strokeStyle = this.isEureka ? '#fff' : '#1e293b';
        ctx.lineWidth = 1.5;

        // Скругленный прямоугольник
        this.roundRect(ctx, bx, by, bubbleW, bubbleH, 6, true, true);

        // Хвостик облачка
        ctx.beginPath();
        ctx.moveTo(this.x - 4, by + bubbleH);
        ctx.lineTo(this.x, by + bubbleH + 6);
        ctx.lineTo(this.x + 4, by + bubbleH);
        ctx.closePath();
        ctx.fillStyle = this.isEureka ? '#ffb703' : '#ffffff';
        ctx.fill();
        ctx.stroke();

        // Текст внутри облачка
        ctx.fillStyle = this.isEureka ? '#090b10' : '#0f172a';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.speechText, this.x, by + bubbleH / 2);

        ctx.restore();
    }

    roundRect(ctx, x, y, width, height, radius, fill, stroke) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        if (fill) ctx.fill();
        if (stroke) ctx.stroke();
    }
}

// Экспорт классов
window.Particle = Particle;
window.Projectile = Projectile;
window.Vehicle = Vehicle;
window.Player = Player;
window.NPC = NPC;
