/**
 * ============================================================================
 * NEIRANDERTALTH: TIMELINE PARADOX — RANDOM & NOISE (src/math/Random.js)
 * Детерминированный генератор псевдослучайных чисел и 2D-шум Перлина.
 * ============================================================================
 */

export class Random {
    constructor(seed = 133742) {
        this.seed = seed;
    }

    /**
     * Mulberry32 алгоритм генерации [0, 1)
     */
    next() {
        let t = (this.seed += 0x6D2B79F5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    range(min, max) {
        return min + this.next() * (max - min);
    }

    rangeInt(min, max) {
        return Math.floor(this.range(min, max + 1));
    }

    choice(array) {
        return array[Math.floor(this.next() * array.length)];
    }
}

/**
 * Упрощенный 2D градиентный шум для биомов и высот
 */
export class PerlinNoise {
    constructor(seed = 42) {
        this.p = new Uint8Array(512);
        const rand = new Random(seed);
        const permutation = new Uint8Array(256);
        for (let i = 0; i < 256; i++) permutation[i] = i;
        for (let i = 255; i > 0; i--) {
            const j = Math.floor(rand.next() * (i + 1));
            const tmp = permutation[i];
            permutation[i] = permutation[j];
            permutation[j] = tmp;
        }
        for (let i = 0; i < 512; i++) {
            this.p[i] = permutation[i & 255];
        }
    }

    fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    lerp(t, a, b) {
        return a + t * (b - a);
    }

    grad(hash, x, y) {
        const h = hash & 7;
        const u = h < 4 ? x : y;
        const v = h < 4 ? y : x;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }

    noise2D(x, y) {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        const xf = x - Math.floor(x);
        const yf = y - Math.floor(y);

        const u = this.fade(xf);
        const v = this.fade(yf);

        const aa = this.p[this.p[X] + Y];
        const ab = this.p[this.p[X] + Y + 1];
        const ba = this.p[this.p[X + 1] + Y];
        const bb = this.p[this.p[X + 1] + Y + 1];

        return this.lerp(
            v,
            this.lerp(u, this.grad(aa, xf, yf), this.grad(ba, xf - 1, yf)),
            this.lerp(u, this.grad(ab, xf, yf - 1), this.grad(bb, xf - 1, yf - 1))
        );
    }
}
