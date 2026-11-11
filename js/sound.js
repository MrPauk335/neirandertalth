/**
 * ============================================================================
 * EARTH: UNWRITTEN — SOUND ENGINE (js/sound.js)
 * Процедурный синтезатор звуков на чистом Web Audio API.
 * 100% автономный: не требует внешних mp3/wav файлов или внешних библиотек.
 * ============================================================================
 */

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.isMuted = false;
        this.isInitialized = false;

        // Таймеры и состояния для циклических звуков
        this.sirenOsc = null;
        this.sirenLfo = null;
        this.sirenGain = null;
        this.isSirenPlaying = false;

        this.engineOsc = null;
        this.engineGain = null;
        this.isEnginePlaying = false;

        // Привязываем методы
        this.init = this.init.bind(this);
    }

    /**
     * Инициализация аудиоконтекста по первому взаимодействию пользователя.
     */
    init() {
        if (this.isInitialized && this.ctx && this.ctx.state === 'running') return;

        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) {
                console.warn('Web Audio API не поддерживается данным браузером.');
                return;
            }

            if (!this.ctx) {
                this.ctx = new AudioCtx();
                this.masterGain = this.ctx.createGain();
                this.masterGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
                this.masterGain.connect(this.ctx.destination);
            }

            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }

            this.isInitialized = true;
        } catch (e) {
            console.error('Ошибка инициализации Web Audio API:', e);
        }
    }

    /**
     * Переключение режима беззвучия.
     */
    toggleMute() {
        this.init();
        this.isMuted = !this.isMuted;
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.35, this.ctx.currentTime);
        }
        return !this.isMuted;
    }

    /**
     * Создание буфера белого шума для выстрелов, шагов и взрывов.
     */
    createNoiseBuffer(duration = 0.5) {
        if (!this.ctx) return null;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }

    /**
     * Звук пешего шага.
     */
    playFootstep() {
        if (!this.isInitialized || this.isMuted) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(70 + Math.random() * 20, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.06);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.07);
    }

    /**
     * Звук удара дубиной / кулаком (Blunt hit).
     */
    playHit() {
        if (!this.isInitialized || this.isMuted) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.13);
    }

    /**
     * Звук свиста клинка / копья.
     */
    playSlash() {
        if (!this.isInitialized || this.isMuted) return;
        const now = this.ctx.currentTime;
        const noise = this.createNoiseBuffer(0.15);
        if (!noise) return;

        const noiseNode = this.ctx.createBufferSource();
        noiseNode.buffer = noise;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1400, now);
        filter.frequency.exponentialRampToValueAtTime(400, now + 0.14);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

        noiseNode.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        noiseNode.start(now);
        noiseNode.stop(now + 0.15);
    }

    /**
     * Звук выстрела (снаряд / револьвер / плазма).
     */
    playShoot(type = 'steam') {
        if (!this.isInitialized || this.isMuted) return;
        const now = this.ctx.currentTime;

        if (type === 'plasma') {
            // Футуристический плазменный импульс
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(950, now);
            osc.frequency.exponentialRampToValueAtTime(120, now + 0.18);

            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start(now);
            osc.stop(now + 0.19);
        } else {
            // Классический огнестрельный выстрел или щелчок пневматики
            const noise = this.createNoiseBuffer(0.3);
            if (!noise) return;

            const noiseNode = this.ctx.createBufferSource();
            noiseNode.buffer = noise;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(2800, now);
            filter.frequency.exponentialRampToValueAtTime(180, now + 0.25);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.45, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

            // Добавляем саб-басовый хлопок
            const sub = this.ctx.createOscillator();
            const subGain = this.ctx.createGain();
            sub.type = 'triangle';
            sub.frequency.setValueAtTime(140, now);
            sub.frequency.exponentialRampToValueAtTime(30, now + 0.2);
            subGain.gain.setValueAtTime(0.4, now);
            subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

            noiseNode.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);

            sub.connect(subGain);
            subGain.connect(this.masterGain);

            noiseNode.start(now);
            sub.start(now);
            noiseNode.stop(now + 0.3);
            sub.stop(now + 0.21);
        }
    }

    /**
     * Звук взрыва (метеорит, граната или детонация паровика).
     */
    playExplosion() {
        if (!this.isInitialized || this.isMuted) return;
        const now = this.ctx.currentTime;
        const noise = this.createNoiseBuffer(1.2);
        if (!noise) return;

        const noiseNode = this.ctx.createBufferSource();
        noiseNode.buffer = noise;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, now);
        filter.frequency.exponentialRampToValueAtTime(60, now + 1.1);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

        // Тяжелый низкочастотный рокот
        const sub = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(90, now);
        sub.frequency.exponentialRampToValueAtTime(25, now + 0.8);
        subGain.gain.setValueAtTime(0.6, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

        noiseNode.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        sub.connect(subGain);
        subGain.connect(this.masterGain);

        noiseNode.start(now);
        sub.start(now);
        noiseNode.stop(now + 1.25);
        sub.stop(now + 0.85);
    }

    /**
     * Звук столкновения / тарана транспортом.
     */
    playCrash() {
        if (!this.isInitialized || this.isMuted) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.2);

        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.21);
    }

    /**
     * Звук посадки / угона транспорта.
     */
    playMount() {
        if (!this.isInitialized || this.isMuted) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(520, now + 0.15);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.17);
    }

    /**
     * Колокольный перезвон открытия «Грязной Эврики».
     */
    playEureka() {
        if (!this.isInitialized || this.isMuted) return;
        const now = this.ctx.currentTime;

        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const noteStart = now + idx * 0.08;

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, noteStart);

            gain.gain.setValueAtTime(0.2, noteStart);
            gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.5);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start(noteStart);
            osc.stop(noteStart + 0.52);
        });
    }

    /**
     * Торжественная фанфара смены Эпохи (Chrono-Shift).
     */
    playEraFanfare() {
        if (!this.isInitialized || this.isMuted) return;
        const now = this.ctx.currentTime;

        const chordNotes = [
            [261.63, 329.63, 392.00], // C major
            [293.66, 369.99, 440.00], // D major
            [329.63, 415.30, 493.88], // E major
            [523.25, 659.25, 783.99, 1046.50] // C major high
        ];

        chordNotes.forEach((chord, chordIdx) => {
            const chordStart = now + chordIdx * 0.22;
            const duration = chordIdx === 3 ? 0.9 : 0.2;

            chord.forEach(freq => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = chordIdx === 3 ? 'sawtooth' : 'triangle';
                osc.frequency.setValueAtTime(freq, chordStart);

                gain.gain.setValueAtTime(0.12, chordStart);
                gain.gain.exponentialRampToValueAtTime(0.001, chordStart + duration);

                osc.connect(gain);
                gain.connect(this.masterGain);

                osc.start(chordStart);
                osc.stop(chordStart + duration + 0.05);
            });
        });
    }

    /**
     * Управление звуком сирены розыска (Police Siren).
     */
    setSiren(active, wantedLevel = 1, era = 0) {
        if (!this.isInitialized || this.isMuted) {
            this.stopSiren();
            return;
        }

        if (active && !this.isSirenPlaying) {
            const now = this.ctx.currentTime;
            this.sirenOsc = this.ctx.createOscillator();
            this.sirenGain = this.ctx.createGain();

            // LFO для модуляции частоты сирены
            this.sirenLfo = this.ctx.createOscillator();
            const lfoGain = this.ctx.createGain();

            if (era >= 2) {
                // Паровая сирена или полицейская сирена будущего
                this.sirenOsc.type = era === 3 ? 'sawtooth' : 'square';
                this.sirenOsc.frequency.setValueAtTime(650, now);

                this.sirenLfo.frequency.setValueAtTime(1.2 + wantedLevel * 0.4, now);
                lfoGain.gain.setValueAtTime(220, now);
            } else {
                // Древний боевой рог / раковина
                this.sirenOsc.type = 'sawtooth';
                this.sirenOsc.frequency.setValueAtTime(220, now);

                this.sirenLfo.frequency.setValueAtTime(0.7, now);
                lfoGain.gain.setValueAtTime(45, now);
            }

            this.sirenLfo.connect(this.sirenOsc.frequency);

            const volume = Math.min(0.04 + wantedLevel * 0.03, 0.22);
            this.sirenGain.gain.setValueAtTime(volume, now);

            this.sirenOsc.connect(this.sirenGain);
            this.sirenGain.connect(this.masterGain);

            this.sirenOsc.start(now);
            this.sirenLfo.start(now);
            this.isSirenPlaying = true;
        } else if (!active && this.isSirenPlaying) {
            this.stopSiren();
        }
    }

    /**
     * Остановка сирены.
     */
    stopSiren() {
        if (!this.isSirenPlaying) return;
        const now = this.ctx ? this.ctx.currentTime : 0;
        try {
            if (this.sirenOsc) {
                this.sirenGain.gain.linearRampToValueAtTime(0.001, now + 0.1);
                this.sirenOsc.stop(now + 0.12);
                this.sirenLfo.stop(now + 0.12);
            }
        } catch (e) {
            // Игнорируем возможные гонки остановки
        }
        this.sirenOsc = null;
        this.sirenLfo = null;
        this.sirenGain = null;
        this.isSirenPlaying = false;
    }
}

// Экспортируем глобальный экземпляр синтезатора
window.sound = new SoundEngine();
