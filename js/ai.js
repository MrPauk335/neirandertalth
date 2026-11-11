/**
 * ============================================================================
 * EARTH: UNWRITTEN — AI & SOCIAL SYSTEMS (js/ai.js)
 * Подсистемы: SpeechBubbleEngine, WantedSystem (1-5 звезд),
 * DirtyEurekaEngine, SchoolArchiveEngine, ChronicleFeed.
 * ============================================================================
 */

// ============================================================================
// 1. CHRONICLE FEED (Живая Хроника Земли)
// ============================================================================
class ChronicleFeed {
    constructor() {
        this.feedEl = document.getElementById('chronicleFeed');
        this.entries = [];
        this.maxEntries = 40;
    }

    addEntry(text, type = 'system') {
        const yearText = window.worldEngine ? window.worldEngine.eras[window.worldEngine.currentEra].yearText : '0 г.';
        const entry = { text, type, yearText, timestamp: Date.now() };
        this.entries.push(entry);
        if (this.entries.length > this.maxEntries) {
            this.entries.shift();
        }

        if (this.feedEl) {
            const entryEl = document.createElement('div');
            entryEl.className = `chronicle-entry ${type}`;
            entryEl.innerHTML = `<span class="time">[${yearText}]</span> <span class="text">${text}</span>`;
            this.feedEl.prepend(entryEl);

            // Ограничение видимых элементов в DOM
            while (this.feedEl.children.length > this.maxEntries) {
                this.feedEl.removeChild(this.feedEl.lastChild);
            }
        }
    }

    clear() {
        this.entries = [];
        if (this.feedEl) {
            this.feedEl.innerHTML = '';
        }
    }
}

// ============================================================================
// 2. SPEECH BUBBLE DATABASE & GENERATOR
// ============================================================================
class SpeechBubbleEngine {
    constructor() {
        // База контекстных реплик для 4 эпох
        this.dialogues = {
            stone: {
                idle: [
                    'Бивни мамонта нынче крепкие.',
                    'Кто не подбросит смолы в костер — замерзнет.',
                    'Вчера тур едва не растоптал шатер вождя.',
                    'Дым от костра отгоняет духов тундры.',
                    'Хорошая дубина — залог мира в стойбище.'
                ],
                crime: [
                    'Убийца! Вождь покарает тебя!',
                    'Он угнал священного мамонта!',
                    'Кровь на снегу! Спасайтесь!',
                    'Охотники, сюда! Тут безумец с дубиной!'
                ],
                guard: [
                    'Брось бивень, именем Племени!',
                    'На копья бунтовщика!',
                    'Окружай его со скалы!'
                ]
            },
            bronze_bitumen: {
                idle: [
                    'Смоляной раствор для зиккурата готов.',
                    'Жрецы говорят, нефть — это кровь древних богов.',
                    'Торговцы с юга привезли отличную серу.',
                    'Колесницы опять перепачкали мостовую битумом.',
                    'Если смола закипит — тушите песком!'
                ],
                crime: [
                    'Держи вора! Он украл боевую колесницу!',
                    'Осквернитель зиккурата! Стража!',
                    'Караул! Убийство на рыночной площади!'
                ],
                guard: [
                    'Именем Царя и Смоляного Закона, стоять!',
                    'Пронзите его дротиками!',
                    'Перекрыть битумные каналы!'
                ]
            },
            steam_iron: {
                idle: [
                    'Давление в паровом котле растет.',
                    'Копоть от мануфактуры въелась в сюртук.',
                    'Говорят, в депо собрали броневик на нефтяной тяге.',
                    'Свисток зовет на вечернюю смену.',
                    'Булыжники скользкие после дождя.'
                ],
                crime: [
                    'Полиция! Он угнал государственный паровик!',
                    'Стрельба на проспекте! Вызывайте констеблей!',
                    'Держите этого террориста!'
                ],
                guard: [
                    'Бросить оружие! Вы окружены!',
                    'Код 10-99, открываю огонь на поражение!',
                    'Заблокируйте перекресток броневиком!'
                ]
            },
            neo_metropolis: {
                idle: [
                    'Голографическая реклама снова слепит глаза.',
                    'Антигравитационная подушка спидера барахлит.',
                    'ИИ-префектура повысила налог на синтетическую нефть.',
                    'Неоновый смог сегодня особенно густой.',
                    'Кибер-импланты чешутся перед грозой.'
                ],
                crime: [
                    'Взлом транспорта! Угон грави-спидера!',
                    'Нарушитель общественного порядка! Спасайтесь!',
                    'Внимание всем кибер-патрулям!'
                ],
                guard: [
                    'Обнаружен био-угрожающий субъект!',
                    'Активировать плазменные нейтрализаторы!',
                    'Приказ префектуры: ликвидация на месте!'
                ]
            }
        };

        // Реплики "Грязной Эврики" для бродяг и маргиналов
        this.eurekaQuotes = [
            'Если бросить серный камень в кипящую смолу — оно детонирует!',
            'Я обмотал колесо полосками сырой смолы — оно не скользит!',
            'Если запаять костяную трубку с паром — получается пневматический поршень!',
            'Смоляная сажа, растертая с жиром, сохраняет надписи навечно!',
            'Если пропустить ток через битумную жижу — она светится синим неоном!',
            'Если выпарить нефть в медном котле — выходит прозрачное ракетное топливо!',
            'Смоляное стекло защищает от плазменных вспышек!'
        ];
    }

    getRandomIdle(eraId) {
        const pool = (this.dialogues[eraId] && this.dialogues[eraId].idle) || this.dialogues.stone.idle;
        return pool[Math.floor(Math.random() * pool.length)];
    }

    getRandomCrimeReaction(eraId) {
        const pool = (this.dialogues[eraId] && this.dialogues[eraId].crime) || this.dialogues.stone.crime;
        return pool[Math.floor(Math.random() * pool.length)];
    }

    getRandomGuardShout(eraId) {
        const pool = (this.dialogues[eraId] && this.dialogues[eraId].guard) || this.dialogues.stone.guard;
        return pool[Math.floor(Math.random() * pool.length)];
    }

    getRandomEureka() {
        return this.eurekaQuotes[Math.floor(Math.random() * this.eurekaQuotes.length)];
    }
}

// ============================================================================
// 3. WANTED SYSTEM (1-5 ЗВЁЗД РОЗЫСКА)
// ============================================================================
class WantedSystem {
    constructor() {
        this.stars = 0; // 0..5
        this.wantedPoints = 0;
        this.cooldownTimer = 0;
        this.maxCooldown = 15.0; // 15 секунд в укрытии для сброса розыска
        this.isPursued = false;
        this.sightRadius = 380; // Радиус видимости стражников
        this.reinforcementTimer = 0;
    }

    registerCrime(crimeType, entities) {
        let addedPoints = 0;
        let crimeTitle = '';

        switch (crimeType) {
            case 'ASSAULT':
                addedPoints = 15;
                crimeTitle = 'Нападение на жителя';
                break;
            case 'MURDER':
                addedPoints = 35;
                crimeTitle = 'Убийство подданного Земли';
                break;
            case 'VEHICLE_THEFT':
                addedPoints = 30;
                crimeTitle = 'Дерзкий угон транспорта';
                break;
            case 'VEHICLE_MANSLAUGHTER':
                addedPoints = 50;
                crimeTitle = 'Смертоносный наезд на пешехода';
                break;
            case 'RESISTING_ARREST':
                addedPoints = 25;
                crimeTitle = 'Вооруженное сопротивление страже';
                break;
            default:
                addedPoints = 10;
                crimeTitle = 'Нарушение спокойствия';
        }

        this.wantedPoints += addedPoints;
        this.recalculateStars();

        // Сброс таймера укрытия — преступление совершено прямо сейчас!
        this.cooldownTimer = this.maxCooldown;

        // Звуковая сирена / тревога
        window.sound.init();
        window.sound.setSiren(this.stars > 0, this.stars, window.worldEngine ? window.worldEngine.currentEra : 0);

        // Запись в Хронику
        window.aiEngine.chronicle.addEntry(`ПРЕСТУПЛЕНИЕ: ${crimeTitle}! Розыск: [${this.stars}★].`, 'crime');

        // Уведомление на экран
        window.uiController.showToast(`${crimeTitle}! [${this.stars}★]`, 'danger');

        // Агрессия всех ближайших стражников
        this.alertNearbyGuards(entities);
    }

    recalculateStars() {
        const prevStars = this.stars;
        if (this.wantedPoints >= 150) {
            this.stars = 5;
        } else if (this.wantedPoints >= 100) {
            this.stars = 4;
        } else if (this.wantedPoints >= 60) {
            this.stars = 3;
        } else if (this.wantedPoints >= 30) {
            this.stars = 2;
        } else if (this.wantedPoints >= 10) {
            this.stars = 1;
        } else {
            this.stars = 0;
        }

        if (this.stars !== prevStars) {
            window.uiController.updateWantedStars(this.stars);
            if (this.stars > prevStars) {
                window.aiEngine.schoolArchive.recordHighestWanted(this.stars);
            }
        }
    }

    setStars(num) {
        this.stars = Math.max(0, Math.min(5, num));
        if (this.stars === 0) {
            this.wantedPoints = 0;
            this.cooldownTimer = 0;
            window.sound.stopSiren();
        } else {
            this.wantedPoints = [0, 15, 35, 65, 105, 160][this.stars];
            this.cooldownTimer = this.maxCooldown;
            window.sound.setSiren(true, this.stars, window.worldEngine ? window.worldEngine.currentEra : 0);
        }
        window.uiController.updateWantedStars(this.stars);
    }

    alertNearbyGuards(entities) {
        const player = entities.player;
        entities.npcs.forEach(npc => {
            if (npc.role === 'GUARD' && !npc.isDead) {
                const dist = Math.hypot(npc.x - player.x, npc.y - player.y);
                if (dist < 600) {
                    npc.state = 'ATTACK';
                    const eraId = window.worldEngine.eras[window.worldEngine.currentEra].id;
                    npc.say(window.aiEngine.speech.getRandomGuardShout(eraId), 2.5);
                }
            }
        });
    }

    update(dt, entities) {
        if (this.stars === 0) {
            window.uiController.updateCooldown(0, false);
            return;
        }

        const player = entities.player;

        // Проверяем, видит ли хоть один живой стражник игрока
        let isSpotted = false;
        for (let i = 0; i < entities.npcs.length; i++) {
            const npc = entities.npcs[i];
            if (npc.role === 'GUARD' && !npc.isDead) {
                const dist = Math.hypot(npc.x - player.x, npc.y - player.y);
                if (dist < this.sightRadius) {
                    isSpotted = true;
                    break;
                }
            }
        }

        if (isSpotted) {
            // Игрок в поле зрения — таймер сброса обновляется
            this.cooldownTimer = this.maxCooldown;
            this.isPursued = true;
            window.uiController.updateCooldown(this.maxCooldown, false);
        } else {
            // Игрок скрылся из вида — идет отсчет укрытия!
            this.isPursued = false;
            this.cooldownTimer -= dt;
            window.uiController.updateCooldown(Math.max(0, Math.ceil(this.cooldownTimer)), true);

            if (this.cooldownTimer <= 0) {
                // РОЗЫСК ПОЛНОСТЬЮ СБРОШЕН!
                this.setStars(0);
                window.uiController.showToast('Вы успешно ушли от погони стражи!', 'gold');
                window.aiEngine.chronicle.addEntry('Укрытие найдено: преследование стражей прекращено.', 'system');
            }
        }

        // Спавн подкреплений стражи при высоком уровне розыска (3..5 звезд)
        if (this.stars >= 3) {
            this.reinforcementTimer += dt;
            if (this.reinforcementTimer > 8.0) {
                this.reinforcementTimer = 0;
                this.spawnReinforcements(entities);
            }
        }
    }

    spawnReinforcements(entities) {
        const player = entities.player;
        const count = this.stars >= 5 ? 3 : 1;
        const era = window.worldEngine ? window.worldEngine.currentEra : 0;

        for (let i = 0; i < count; i++) {
            const spawnAngle = Math.random() * Math.PI * 2;
            const dist = 550;
            const sx = player.x + Math.cos(spawnAngle) * dist;
            const sy = player.y + Math.sin(spawnAngle) * dist;

            const guard = new window.NPC(sx, sy, 'GUARD', era);
            guard.state = 'ATTACK';
            entities.npcs.push(guard);

            // На 4-5 звездах спавнится патрульный транспорт
            if (this.stars >= 4 && Math.random() > 0.4) {
                const vTypes = ['mammoth', 'chariot', 'steam_car', 'grav_speeder'];
                const v = new window.Vehicle(sx + 20, sy + 20, vTypes[era], era);
                v.driver = guard;
                guard.currentVehicle = v;
                guard.state = 'DRIVING';
                entities.vehicles.push(v);
            }
        }

        window.uiController.showToast('Прибыло подкрепление стражи!', 'danger');
    }
}

// ============================================================================
// 4. DIRTY EUREKA ENGINE (Случайные открытия маргиналов)
// ============================================================================
class DirtyEurekaEngine {
    constructor() {
        this.timer = 0;
        this.interval = 38.0; // Каждые 38 секунд происходит открытие
    }

    update(dt, entities) {
        this.timer += dt;
        if (this.timer >= this.interval) {
            this.timer = 0;
            this.triggerEureka(entities);
        }
    }

    triggerEureka(entities) {
        // Ищем бродягу или раба в толпе
        const candidates = entities.npcs.filter(n => !n.isDead && (n.role === 'BEGGAR' || n.role === 'CITIZEN'));
        if (candidates.length === 0) return;

        const discoverer = candidates[Math.floor(Math.random() * candidates.length)];
        const text = window.aiEngine.speech.getRandomEureka();

        // Золотое облачко речи над головой
        discoverer.say(text, 5.0, true);

        // Звуковой перезвон
        window.sound.playEureka();

        // Всплеск золотых искр
        for (let i = 0; i < 20; i++) {
            entities.particles.push(new window.Particle(discoverer.x, discoverer.y, {
                vx: (Math.random() - 0.5) * 160,
                vy: (Math.random() - 0.5) * 160,
                color: '#ffb703',
                life: 0.6,
                shape: 'spark',
                glow: true
            }));
        }

        // Запись в Хронику
        window.aiEngine.chronicle.addEntry(`ГРЯЗНАЯ ЭВРИКА: Городской бродяга открыл: «${text}»! Прогресс ускорен.`, 'eureka');
        window.uiController.showToast('Грязная Эврика двигает эпоху!', 'gold');

        // Учет в Школьном Архиве
        window.aiEngine.schoolArchive.recordEureka();

        // Небольшой скачок года вперед
        window.worldEngine.currentYear += 25;
        window.uiController.updateYear(window.worldEngine.currentYear);
    }
}

// ============================================================================
// 5. SCHOOL ARCHIVE ENGINE (Сатирический Учебник Истории 3500 года)
// ============================================================================
class SchoolArchiveEngine {
    constructor() {
        this.totalCrimes = 0;
        this.totalKills = 0;
        this.totalHijacks = 0;
        this.totalEurekas = 0;
        this.highestWanted = 0;

        this.chapters = [
            {
                title: 'Глава I. Пробуждение Первопредка у Смоляных Вод',
                text: 'На заре времен Священный Первопредок восстал из первобытного ила. Презирая косные законы старейшин, он взял костяную дубину и указал племенам на благодать горящего битума.',
                quote: '«И пошел он в толпу, и дубина его сеяла озарение...» — Летопись Нео-Земли.'
            }
        ];
    }

    recordCrime() {
        this.totalCrimes++;
        this.updateStatsUI();
    }

    recordKill(role) {
        this.totalKills++;
        this.totalCrimes++;
        this.updateStatsUI();

        if (this.totalKills % 5 === 0) {
            this.addChapter(
                `Глава ${this.chapters.length + 1}. Великое Умиротворение Еретиков`,
                `Первопредок лично умиротворил ${this.totalKills} мятежников, мешавших прогрессу смоляной государственности. В учебниках будущего сие деяние признано высочайшим актом милосердия и архитектурной оптимизации населения.`,
                '«Кто пал от священного удара — тот удобрил корни будущих монолитов.»'
            );
        }
    }

    recordHijack(vehicleName) {
        this.totalHijacks++;
        this.totalCrimes++;
        this.updateStatsUI();

        this.addChapter(
            `Глава ${this.chapters.length + 1}. Освящение Колесного Хода: ${vehicleName}`,
            `Первопредок снизошел до простых смертных повозок, изгнав недостойного возничего и лично испытав пределы инерции на переполненных проспектах. Таран пешеходов был официально канонизирован как тест прочности подвески.`,
            '«И летели зеваки в стороны, яко искры от наковальни...»'
        );
    }

    recordEureka() {
        this.totalEurekas++;
        this.updateStatsUI();
    }

    recordHighestWanted(stars) {
        if (stars > this.highestWanted) {
            this.highestWanted = stars;
            if (stars >= 4) {
                this.addChapter(
                    `Глава ${this.chapters.length + 1}. Небесная Реформа Государственного Аппарата [${stars}★]`,
                    `Столкнувшись с закостенелой бюрократией стражи, Первопредок спровоцировал полномасштабный марш несогласных, вынудив гарнизоны мобилизовать элитную кавалерию и паровики. Вся стража была отправлена на переаттестацию в небытие.`,
                    '«Пять звезд на небесах — пять наград на мундире Истории.»'
                );
            }
        }
    }

    recordPlayerDeath() {
        this.addChapter(
            `Глава ${this.chapters.length + 1}. Временное Вознесение и Перерождение`,
            `Устав от мирской суеты, Первопредок временно растворил свою телесную оболочку, чтобы вернуться к очагу цивилизации еще более разгневанным и вооруженным.`,
            '«Смерть была лишь перезагрузкой скрипта бытия.»'
        );
    }

    addChapter(title, text, quote) {
        this.chapters.push({ title, text, quote });
        this.renderChaptersUI();
    }

    updateStatsUI() {
        const elCrimes = document.getElementById('statTotalCrimes');
        const elKills = document.getElementById('statKills');
        const elHijacks = document.getElementById('statHijacks');
        const elEurekas = document.getElementById('statEurekas');

        if (elCrimes) elCrimes.textContent = this.totalCrimes;
        if (elKills) elKills.textContent = this.totalKills;
        if (elHijacks) elHijacks.textContent = this.totalHijacks;
        if (elEurekas) elEurekas.textContent = this.totalEurekas;
    }

    renderChaptersUI() {
        const container = document.getElementById('schoolChapters');
        if (!container) return;
        container.innerHTML = '';

        this.chapters.slice().reverse().forEach(ch => {
            const card = document.createElement('div');
            card.className = 'book-chapter';
            card.innerHTML = `
                <h4>${ch.title}</h4>
                <p>${ch.text}</p>
                <span class="quote">${ch.quote}</span>
            `;
            container.appendChild(card);
        });
    }
}

// ============================================================================
// 6. MAIN AI CONTROLLER (Объединение всех систем AI)
// ============================================================================
class AIEngine {
    constructor() {
        this.chronicle = new ChronicleFeed();
        this.speech = new SpeechBubbleEngine();
        this.wantedSystem = new WantedSystem();
        this.eureka = new DirtyEurekaEngine();
        this.schoolArchive = new SchoolArchiveEngine();

        this.ambientChatterTimer = 0;
    }

    update(dt, entities) {
        // Обновление розыска
        this.wantedSystem.update(dt, entities);

        // Обновление таймера "Грязной Эврики"
        this.eureka.update(dt, entities);

        // Фоновые бытовые разговоры жителей (раз в 6 секунд случайный житель что-то говорит)
        this.ambientChatterTimer += dt;
        if (this.ambientChatterTimer > 5.5) {
            this.ambientChatterTimer = 0;
            this.triggerRandomChatter(entities);
        }
    }

    triggerRandomChatter(entities) {
        const livingNpcs = entities.npcs.filter(n => !n.isDead && n.state === 'WANDER');
        if (livingNpcs.length === 0) return;

        const speaker = livingNpcs[Math.floor(Math.random() * livingNpcs.length)];
        const eraId = window.worldEngine.eras[window.worldEngine.currentEra].id;
        const phrase = this.speech.getRandomIdle(eraId);
        speaker.say(phrase, 3.2);
    }
}

// Экспорт
window.AIEngine = AIEngine;
