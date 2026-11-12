/**
 * ============================================================================
 * NEIRANDERTALTH: TIMELINE PARADOX — SOUND SYNTHESIZER (src/core/SoundSynthesizer.js)
 * Процедурный синтезатор звука на Web Audio API. 100% процедурный.
 * ============================================================================
 */

export class SoundSynthesizer {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.isMuted = false;
        this.isInitialized = false;

        this.sirenOsc = null;
        this.sirenLfo = null;
        this.sirenGain = null;
        this.isSirenActive = false;
    }

    init() {
        if (this.isInitialized && this.ctx && this.ctx.state === 'running') return;
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;

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
            console.warn('Не удалось инициализировать Web Audio:', e);
        }
    }

    toggleMute() {
        this.init();
        this.isMuted = !this.isMuted;
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.35, this.ctx.currentTime);
        }
        return !this.isMuted;
    }

    createNoiseBuffer(duration = 0.5) {
        if (!this.ctx) return null;
        const size = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, size, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < size; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }

    playFootstep() {
        if (!this.isInitialized || this.isMuted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(65 + Math.random() * 20, now);
        osc.frequency.exponentialRampToValueAtTime(25, now + 0.05);

        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.06);
    }

    playHit() {
        if (!this.isInitialized || this.isMuted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(240, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.12);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.13);
    }

    playShoot(type = 'steam') {
        if (!this.isInitialized || this.isMuted) return;
        const now = this.ctx.currentTime;

        if (type === 'plasma' || type === 'chronos') {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type === 'chronos' ? 'sawtooth' : 'sine';
            osc.frequency.setValueAtTime(type === 'chronos' ? 1400 : 920, now);
            osc.frequency.exponentialRampToValueAtTime(80, now + 0.18);

            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now);
            osc.stop(now + 0.19);
        } else {
            const noise = this.createNoiseBuffer(0.28);
            if (!noise) return;

            const node = this.ctx.createBufferSource();
            node.buffer = noise;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(2600, now);
            filter.frequency.exponentialRampToValueAtTime(120, now + 0.22);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

            node.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);
            node.start(now);
            node.stop(now + 0.26);
        }
    }

    playExplosion() {
        if (!this.isInitialized || this.isMuted) return;
        const now = this.ctx.currentTime;
        const noise = this.createNoiseBuffer(1.2);
        if (!noise) return;

        const node = this.ctx.createBufferSource();
        node.buffer = noise;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, now);
        filter.frequency.exponentialRampToValueAtTime(50, now + 1.1);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.65, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

        node.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        node.start(now);
        node.stop(now + 1.22);
    }

    playCrash() {
        if (!this.isInitialized || this.isMuted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.2);

        gain.gain.setValueAtTime(0.45, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.21);
    }

    playEureka() {
        if (!this.isInitialized || this.isMuted) return;
        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const start = now + idx * 0.08;

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, start);

            gain.gain.setValueAtTime(0.18, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.45);

            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(start);
            osc.stop(start + 0.46);
        });
    }

    playTimeWarp() {
        if (!this.isInitialized || this.isMuted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.4);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.8);

        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.35, now + 0.4);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.9);
    }

    setSiren(active, wantedStars = 1, epochIndex = 0) {
        if (!this.isInitialized || this.isMuted) {
            this.stopSiren();
            return;
        }

        if (active && !this.isSirenActive) {
            const now = this.ctx.currentTime;
            this.sirenOsc = this.ctx.createOscillator();
            this.sirenGain = this.ctx.createGain();
            this.sirenLfo = this.ctx.createOscillator();
            const lfoGain = this.ctx.createGain();

            if (epochIndex >= 2) {
                this.sirenOsc.type = epochIndex >= 3 ? 'sawtooth' : 'square';
                this.sirenOsc.frequency.setValueAtTime(620, now);
                this.sirenLfo.frequency.setValueAtTime(1.5 + wantedStars * 0.3, now);
                lfoGain.gain.setValueAtTime(200, now);
            } else {
                this.sirenOsc.type = 'triangle';
                this.sirenOsc.frequency.setValueAtTime(180, now);
                this.sirenLfo.frequency.setValueAtTime(0.8, now);
                lfoGain.gain.setValueAtTime(45, now);
            }

            this.sirenLfo.connect(this.sirenOsc.frequency);
            const vol = Math.min(0.04 + wantedStars * 0.03, 0.2);
            this.sirenGain.gain.setValueAtTime(vol, now);

            this.sirenOsc.connect(this.sirenGain);
            this.sirenGain.connect(this.masterGain);

            this.sirenOsc.start(now);
            this.sirenLfo.start(now);
            this.isSirenActive = true;
        } else if (!active && this.isSirenActive) {
            this.stopSiren();
        }
    }

    stopSiren() {
        if (!this.isSirenActive) return;
        try {
            if (this.sirenOsc) {
                const now = this.ctx.currentTime;
                this.sirenGain.gain.linearRampToValueAtTime(0.001, now + 0.1);
                this.sirenOsc.stop(now + 0.12);
                this.sirenLfo.stop(now + 0.12);
            }
        } catch (e) {}
        this.sirenOsc = null;
        this.sirenLfo = null;
        this.sirenGain = null;
        this.isSirenActive = false;
    }
}

export const globalSound = new SoundSynthesizer();
