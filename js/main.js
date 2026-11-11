/**
 * ============================================================================
 * EARTH: UNWRITTEN — MAIN ENGINE & GAME CONTROLLER (js/main.js)
 * Игровой цикл, камера Lerp, координация подсистем, обработчики ввода и HUD.
 * ============================================================================
 */

// ============================================================================
// 1. UI CONTROLLER (Управление HUD и Модальными окнами)
// ============================================================================
class UIController {
    constructor() {
        // Элементы верхнего бара
        this.eraBadge = document.getElementById('eraBadge');
        this.eraName = document.getElementById('eraName');
        this.earthYear = document.getElementById('earthYear');
        this.wantedStars = document.querySelectorAll('#wantedStars .star');
        this.cooldownTimer = document.getElementById('cooldownTimer');
        this.cooldownSeconds = document.getElementById('cooldownSeconds');
        this.hpBar = document.getElementById('hpBar');
        this.hpText = document.getElementById('hpText');
        this.vehicleStatRow = document.getElementById('vehicleStatRow');
        this.vehicleHpBar = document.getElementById('vehicleHpBar');
        this.vehicleSpeedText = document.getElementById('vehicleSpeedText');
        this.vehicleNameLabel = document.getElementById('vehicleNameLabel');
        this.weaponIndicator = document.getElementById('weaponIndicator');
        this.popIndicator = document.getElementById('popIndicator');

        // Подсказка взаимодействия
        this.interactionHint = document.getElementById('interactionHint');

        // Нижняя панель
        this.chronoJumpBtn = document.getElementById('chronoJumpBtn');
        this.eraProgressBar = document.getElementById('eraProgressBar');
        this.chronoProgress = 0; // 0..100%

        this.godModeBtn = document.getElementById('godModeBtn');
        this.schoolArchiveBtn = document.getElementById('schoolArchiveBtn');
        this.controlsBtn = document.getElementById('controlsBtn');
        this.audioToggleBtn = document.getElementById('audioToggleBtn');
        this.audioIcon = document.getElementById('audioIcon');
        this.audioStatus = document.getElementById('audioStatus');

        // Модальные окна
        this.godModal = document.getElementById('godModal');
        this.schoolModal = document.getElementById('schoolModal');
        this.controlsModal = document.getElementById('controlsModal');

        // Тосты
        this.toastContainer = document.getElementById('toastContainer');

        this.initListeners();
    }

    initListeners() {
        // Хроноскачок (+500 лет)
        if (this.chronoJumpBtn) {
            this.chronoJumpBtn.addEventListener('click', () => {
                window.sound.init();
                this.chronoProgress += 34;
                if (this.chronoProgress >= 100) {
                    this.chronoProgress = 0;
                    window.worldEngine.advanceEra(window.game.entities);
                } else {
                    window.worldEngine.currentYear += 500;
                    this.updateYear(window.worldEngine.currentYear);
                    window.sound.playSlash();
                    this.showToast('Время ускорилось на +500 лет!', 'info');
                    window.aiEngine.chronicle.addEntry('Хроноскачок: временной поток сдвинут на 500 лет вперед.', 'system');
                }
                this.eraProgressBar.style.width = `${this.chronoProgress}%`;
            });
        }

        // Переключение аудио
        if (this.audioToggleBtn) {
            this.audioToggleBtn.addEventListener('click', () => {
                const isSoundOn = window.sound.toggleMute();
                this.audioIcon.textContent = isSoundOn ? '🔊' : '🔇';
                this.audioStatus.textContent = isSoundOn ? 'Звук: ВКЛ' : 'Звук: ВЫКЛ';
            });
        }

        // Открытие модалок
        if (this.godModeBtn) {
            this.godModeBtn.addEventListener('click', () => this.openModal(this.godModal));
        }
        if (this.schoolArchiveBtn) {
            this.schoolArchiveBtn.addEventListener('click', () => {
                window.aiEngine.schoolArchive.renderChaptersUI();
                this.openModal(this.schoolModal);
            });
        }
        if (this.controlsBtn) {
            this.controlsBtn.addEventListener('click', () => this.openModal(this.controlsModal));
        }

        // Закрытие модалок
        document.querySelectorAll('[data-close]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetId = e.currentTarget.getAttribute('data-close');
                const targetModal = document.getElementById(targetId);
                if (targetModal) targetModal.style.display = 'none';
            });
        });

        // Кнопка очистки хроники
        const clearBtn = document.getElementById('clearChronicleBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => window.aiEngine.chronicle.clear());
        }

        // Кнопки сил Режима Бога
        const meteorBtn = document.getElementById('godMeteorBtn');
        if (meteorBtn) {
            meteorBtn.addEventListener('click', () => {
                const p = window.game.entities.player;
                window.worldEngine.triggerMeteor(window.game.entities, p.x + 100, p.y + 100);
                this.closeModal(this.godModal);
            });
        }

        const plagueBtn = document.getElementById('godPlagueBtn');
        if (plagueBtn) {
            plagueBtn.addEventListener('click', () => {
                window.worldEngine.triggerBitumenPlague(window.game.entities);
                this.closeModal(this.godModal);
            });
        }

        const goldenAgeBtn = document.getElementById('godGoldenAgeBtn');
        if (goldenAgeBtn) {
            goldenAgeBtn.addEventListener('click', () => {
                window.worldEngine.triggerGoldenAge(window.game.entities);
                this.closeModal(this.godModal);
            });
        }

        const martialLawBtn = document.getElementById('godMartialLawBtn');
        if (martialLawBtn) {
            martialLawBtn.addEventListener('click', () => {
                window.aiEngine.wantedSystem.setStars(5);
                this.showToast('Введено Военное Положение 5★!', 'danger');
                this.closeModal(this.godModal);
            });
        }

        const amnestyBtn = document.getElementById('godAmnestyBtn');
        if (amnestyBtn) {
            amnestyBtn.addEventListener('click', () => {
                window.aiEngine.wantedSystem.setStars(0);
                this.showToast('Великая Амнистия: розыск обнулен!', 'gold');
                this.closeModal(this.godModal);
            });
        }

        const advanceEraBtn = document.getElementById('godAdvanceEraBtn');
        if (advanceEraBtn) {
            advanceEraBtn.addEventListener('click', () => {
                window.worldEngine.advanceEra(window.game.entities);
                this.closeModal(this.godModal);
            });
        }
    }

    openModal(modal) {
        window.sound.init();
        if (modal) modal.style.display = 'flex';
    }

    closeModal(modal) {
        if (modal) modal.style.display = 'none';
    }

    updateEra(era) {
        const eraRoman = ['ЭПОХА I', 'ЭПОХА II', 'ЭПОХА III', 'ЭПОХА IV'][window.worldEngine.currentEra];
        if (this.eraBadge) this.eraBadge.textContent = eraRoman;
        if (this.eraName) this.eraName.textContent = era.name;
        if (this.earthYear) this.earthYear.textContent = era.yearText;

        // Обновление индикатора оружия
        const weaponNames = [
            '🗡️ Оружие: Костяная дубина (сплэш)',
            '🔱 Оружие: Битумное копье (бросок)',
            '🔫 Оружие: Паровой револьвер',
            '⚡ Оружие: Плазменный карабин'
        ];
        if (this.weaponIndicator) {
            this.weaponIndicator.textContent = weaponNames[window.worldEngine.currentEra];
        }
    }

    updateYear(yearVal) {
        if (this.earthYear) {
            if (yearVal < 0) {
                this.earthYear.textContent = `${Math.abs(yearVal)} до н.э.`;
            } else {
                this.earthYear.textContent = `${yearVal} г. н.э.`;
            }
        }
    }

    updateWantedStars(stars) {
        this.wantedStars.forEach((starEl, index) => {
            if (index < stars) {
                starEl.classList.add('active');
            } else {
                starEl.classList.remove('active');
            }
        });
    }

    updateCooldown(seconds, isVisible) {
        if (!this.cooldownTimer) return;
        if (isVisible && seconds > 0) {
            this.cooldownTimer.classList.add('visible');
            if (this.cooldownSeconds) this.cooldownSeconds.textContent = seconds;
        } else {
            this.cooldownTimer.classList.remove('visible');
        }
    }

    updatePlayerStats(player) {
        // Здоровье игрока
        const hpPercent = Math.max(0, (player.hp / player.maxHp) * 100);
        if (this.hpBar) this.hpBar.style.width = `${hpPercent}%`;
        if (this.hpText) this.hpText.textContent = `${Math.ceil(player.hp)} / ${player.maxHp}`;

        // Статус транспорта
        if (player.state === 'DRIVING' && player.currentVehicle) {
            const v = player.currentVehicle;
            if (this.vehicleStatRow) this.vehicleStatRow.style.display = 'flex';
            if (this.vehicleNameLabel) this.vehicleNameLabel.textContent = v.name;
            const vHpPercent = Math.max(0, (v.hp / v.maxHp) * 100);
            if (this.vehicleHpBar) this.vehicleHpBar.style.width = `${vHpPercent}%`;
            const speedKmh = Math.abs(Math.round(v.speed * 0.4));
            if (this.vehicleSpeedText) this.vehicleSpeedText.textContent = `${speedKmh} км/ч`;
        } else {
            if (this.vehicleStatRow) this.vehicleStatRow.style.display = 'none';
        }
    }

    updatePopulation(count) {
        if (this.popIndicator) {
            this.popIndicator.textContent = `👥 Жителей: ${count}`;
        }
    }

    setInteractionHint(visible) {
        if (this.interactionHint) {
            this.interactionHint.style.display = visible ? 'block' : 'none';
        }
    }

    showToast(message, type = 'info') {
        if (!this.toastContainer) return;
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        this.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(40px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 300);
        }, 3200);
    }
}

// ============================================================================
// 2. CAMERA LERP ENGINE (Плавное следование за игроком)
// ============================================================================
class Camera {
    constructor(worldWidth, worldHeight) {
        this.x = 1800;
        this.y = 1800;
        this.targetX = 1800;
        this.targetY = 1800;
        this.lerpSpeed = 0.09;
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
        this.viewportWidth = window.innerWidth;
        this.viewportHeight = window.innerHeight;
    }

    update(targetX, targetY) {
        this.targetX = targetX;
        this.targetY = targetY;

        // Плавная интерполяция Lerp
        this.x += (this.targetX - this.x) * this.lerpSpeed;
        this.y += (this.targetY - this.y) * this.lerpSpeed;

        // Ограничение камеры пределами мира
        const halfW = this.viewportWidth / 2;
        const halfH = this.viewportHeight / 2;
        this.x = Math.max(halfW, Math.min(this.worldWidth - halfW, this.x));
        this.y = Math.max(halfH, Math.min(this.worldHeight - halfH, this.y));
    }

    resize(w, h) {
        this.viewportWidth = w;
        this.viewportHeight = h;
    }
}

// ============================================================================
// 3. INPUT MANAGER
// ============================================================================
class InputManager {
    constructor() {
        this.up = false;
        this.down = false;
        this.left = false;
        this.right = false;

        this.interactJustPressed = false;
        this.attackJustPressed = false;

        this.mouseX = 0;
        this.mouseY = 0;
        this.mouseWorldX = 1800;
        this.mouseWorldY = 1800;

        this.init();
    }

    init() {
        window.addEventListener('keydown', (e) => {
            window.sound.init(); // Активация Web Audio по первому нажатию клавиши

            const code = e.code;
            if (code === 'KeyW' || code === 'ArrowUp') this.up = true;
            if (code === 'KeyS' || code === 'ArrowDown') this.down = true;
            if (code === 'KeyA' || code === 'ArrowLeft') this.left = true;
            if (code === 'KeyD' || code === 'ArrowRight') this.right = true;

            if (code === 'KeyF' || code === 'KeyE') {
                this.interactJustPressed = true;
            }

            if (code === 'Space') {
                this.attackJustPressed = true;
            }

            if (code === 'Escape') {
                // Закрыть открытые модалки
                document.querySelectorAll('.modal-backdrop').forEach(m => m.style.display = 'none');
            }
        });

        window.addEventListener('keyup', (e) => {
            const code = e.code;
            if (code === 'KeyW' || code === 'ArrowUp') this.up = false;
            if (code === 'KeyS' || code === 'ArrowDown') this.down = false;
            if (code === 'KeyA' || code === 'ArrowLeft') this.left = false;
            if (code === 'KeyD' || code === 'ArrowRight') this.right = false;
        });

        window.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });

        window.addEventListener('mousedown', (e) => {
            window.sound.init(); // Активация Web Audio
            if (e.button === 0) {
                // ЛКМ
                this.attackJustPressed = true;
            }
        });
    }

    updateMouseWorld(camera) {
        this.mouseWorldX = this.mouseX + camera.x - camera.viewportWidth / 2;
        this.mouseWorldY = this.mouseY + camera.y - camera.viewportHeight / 2;
    }

    resetFrameFlags() {
        this.interactJustPressed = false;
        this.attackJustPressed = false;
    }
}

// ============================================================================
// 4. MAIN GAME ENGINE
// ============================================================================
class GameEngine {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.entities = {
            player: null,
            npcs: [],
            vehicles: [],
            projectiles: [],
            particles: []
        };

        this.lastTime = performance.now();
        this.isRunning = false;

        this.init();
    }

    init() {
        // Создание глобальных подсистем
        window.uiController = new UIController();
        window.worldEngine = new window.WorldEngine();
        window.aiEngine = new window.AIEngine();

        this.input = new InputManager();
        this.camera = new Camera(window.worldEngine.width, window.worldEngine.height);

        // Масштабирование холста
        this.handleResize();
        window.addEventListener('resize', () => this.handleResize());

        // Создание игрока в центре карты
        this.entities.player = new window.Player(1800, 1800);

        // Первоначальный спавн популяции NPC и техники
        this.spawnInitialWorldEntities();

        // Запуск игрового цикла
        this.isRunning = true;
        requestAnimationFrame((t) => this.loop(t));

        window.uiController.updateEra(window.worldEngine.eras[0]);
        window.uiController.showToast('Добро пожаловать в EARTH: UNWRITTEN!', 'gold');
    }

    handleResize() {
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = window.innerWidth * dpr;
        this.canvas.height = window.innerHeight * dpr;
        this.canvas.style.width = `${window.innerWidth}px`;
        this.canvas.style.height = `${window.innerHeight}px`;
        this.ctx.scale(dpr, dpr);
        this.camera.resize(window.innerWidth, window.innerHeight);
    }

    spawnInitialWorldEntities() {
        const centerX = 1800;
        const centerY = 1800;

        // Спавн 55 жителей различных ролей
        for (let i = 0; i < 55; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 420 + 80;
            const x = centerX + Math.cos(angle) * dist;
            const y = centerY + Math.sin(angle) * dist;

            let role = 'CITIZEN';
            const rand = Math.random();
            if (rand < 0.22) role = 'GUARD';
            else if (rand < 0.42) role = 'BEGGAR';

            this.entities.npcs.push(new window.NPC(x, y, role, 0));
        }

        // Спавн первобытных зверей (мамонты и туры)
        const beastTypes = ['mammoth', 'auroch', 'mammoth', 'auroch', 'mammoth'];
        for (let i = 0; i < beastTypes.length; i++) {
            const angle = (i / beastTypes.length) * Math.PI * 2;
            const dist = 300 + Math.random() * 100;
            const x = centerX + Math.cos(angle) * dist;
            const y = centerY + Math.sin(angle) * dist;
            this.entities.vehicles.push(new window.Vehicle(x, y, beastTypes[i], 0));
        }
    }

    loop(currentTime) {
        if (!this.isRunning) return;

        let dt = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        // Защита от спирали смерти при сворачивании вкладки
        if (dt > 0.1) dt = 0.1;
        if (dt < 0.001) dt = 0.001;

        this.update(dt);
        this.render();

        this.input.resetFrameFlags();
        requestAnimationFrame((t) => this.loop(t));
    }

    update(dt) {
        this.input.updateMouseWorld(this.camera);

        // Обновление мира
        window.worldEngine.update(dt);

        // Обновление игрока
        this.entities.player.update(dt, this.input, window.worldEngine, this.entities);

        // Камера следует за игроком
        this.camera.update(this.entities.player.x, this.entities.player.y);

        // Обновление транспорта
        for (let i = 0; i < this.entities.vehicles.length; i++) {
            this.entities.vehicles[i].update(dt, window.worldEngine, this.entities);
        }

        // Обновление NPC
        for (let i = 0; i < this.entities.npcs.length; i++) {
            this.entities.npcs[i].update(dt, this.entities.player, window.worldEngine, this.entities);
        }

        // Обновление снарядов
        for (let i = this.entities.projectiles.length - 1; i >= 0; i--) {
            const p = this.entities.projectiles[i];
            p.update(dt, window.worldEngine, this.entities);
            if (p.isDead) {
                this.entities.projectiles.splice(i, 1);
            }
        }

        // Обновление частиц
        for (let i = this.entities.particles.length - 1; i >= 0; i--) {
            const part = this.entities.particles[i];
            part.update(dt);
            if (part.life <= 0) {
                this.entities.particles.splice(i, 1);
            }
        }

        // Обновление подсистем AI
        window.aiEngine.update(dt, this.entities);

        // Проверка близости к транспорту для подсказки [F] / [E]
        this.checkInteractionPrompts();

        // Обновление HUD
        window.uiController.updatePlayerStats(this.entities.player);
        const livingPop = this.entities.npcs.filter(n => !n.isDead).length;
        window.uiController.updatePopulation(livingPop);
    }

    checkInteractionPrompts() {
        const player = this.entities.player;
        if (player.state === 'DRIVING') {
            window.uiController.setInteractionHint(true);
            return;
        }

        let nearVehicle = false;
        for (let i = 0; i < this.entities.vehicles.length; i++) {
            const v = this.entities.vehicles[i];
            if (v.isDead) continue;
            const distSq = (player.x - v.x) ** 2 + (player.y - v.y) ** 2;
            if (distSq < 80 * 80) {
                nearVehicle = true;
                break;
            }
        }
        window.uiController.setInteractionHint(nearVehicle);
    }

    render() {
        const ctx = this.ctx;
        const width = window.innerWidth;
        const height = window.innerHeight;

        ctx.clearRect(0, 0, width, height);

        ctx.save();
        // Смещение камеры: центр экрана совмещен с (camera.x, camera.y)
        ctx.translate(width / 2 - this.camera.x, height / 2 - this.camera.y);

        // 1. Отрисовка мира и построек
        window.worldEngine.draw(ctx, this.camera);

        // 2. Отрисовка транспорта (пустого)
        for (let i = 0; i < this.entities.vehicles.length; i++) {
            this.entities.vehicles[i].draw(ctx);
        }

        // 3. Отрисовка NPC
        for (let i = 0; i < this.entities.npcs.length; i++) {
            this.entities.npcs[i].draw(ctx);
        }

        // 4. Отрисовка Игрока
        this.entities.player.draw(ctx);

        // 5. Отрисовка снарядов
        for (let i = 0; i < this.entities.projectiles.length; i++) {
            this.entities.projectiles[i].draw(ctx);
        }

        // 6. Отрисовка частиц
        for (let i = 0; i < this.entities.particles.length; i++) {
            this.entities.particles[i].draw(ctx);
        }

        // 7. Светофильтр текущей эпохи (Ambient Color)
        const era = window.worldEngine.eras[window.worldEngine.currentEra];
        ctx.fillStyle = era.ambientColor;
        ctx.fillRect(0, 0, window.worldEngine.width, window.worldEngine.height);

        ctx.restore();
    }
}

// Запуск игры после полной загрузки документа
window.addEventListener('DOMContentLoaded', () => {
    window.game = new GameEngine();
});
