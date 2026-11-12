/**
 * ============================================================================
 * NEIRANDERTALTH: TIMELINE PARADOX — CANVAS RENDERER (src/render/CanvasRenderer.js)
 * Высокопроизводительный конвейер рендеринга на Canvas 2D.
 * ============================================================================
 */

export class CanvasRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.animTime = 0;
    }

    render(world, entities, camera, currentEpoch, divergenceLevel = 0) {
        const ctx = this.ctx;
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.animTime += 0.016;

        ctx.clearRect(0, 0, width, height);

        ctx.save();
        // Трансформация камеры
        ctx.translate(width / 2, height / 2);
        ctx.scale(camera.zoom, camera.zoom);
        ctx.translate(-camera.position.x, -camera.position.y);

        // 1. Грунт и ландшафт
        ctx.fillStyle = currentEpoch.groundColor;
        ctx.fillRect(0, 0, world.width, world.height);

        // 2. Дороги и перекрестки цивилизации
        this.drawRoads(ctx, world, currentEpoch);

        // 3. Битумные озера с анимированными пузырями
        this.drawTarPits(ctx, world, currentEpoch);

        // 4. Деревья и скалы
        this.drawFoliage(ctx, world, currentEpoch);

        // 5. Архитектурные комплексы
        this.drawBuildings(ctx, world);

        // 6. Транспорт
        for (let i = 0; i < entities.vehicles.length; i++) {
            entities.vehicles[i].draw(ctx);
        }

        // 7. Пешие гуманоиды (Неандертальцы, граждане, стража)
        for (let i = 0; i < entities.npcs.length; i++) {
            entities.npcs[i].draw(ctx);
        }

        // 8. Игрок
        entities.player.draw(ctx);

        // 9. Снаряды
        for (let i = 0; i < entities.projectiles.length; i++) {
            entities.projectiles[i].draw(ctx);
        }

        // 10. Частицы
        for (let i = 0; i < entities.particles.length; i++) {
            entities.particles[i].draw(ctx);
        }

        // 11. Светофильтр эпохи (Ambient Filter)
        ctx.fillStyle = currentEpoch.ambientColor;
        ctx.fillRect(0, 0, world.width, world.height);

        // Границы карты мира
        ctx.strokeStyle = '#d90429';
        ctx.lineWidth = 10;
        ctx.strokeRect(60, 60, world.width - 120, world.height - 120);

        ctx.restore();

        // 12. Пост-эффект темпорального разлома (если дивергенция высока)
        if (divergenceLevel > 20) {
            this.drawParadoxVignette(ctx, width, height, divergenceLevel);
        }
    }

    drawRoads(ctx, world, epoch) {
        ctx.fillStyle = epoch.roadColor;
        const roadW = epoch.index >= 3 ? 95 : 75;

        // Центральные проспекты
        ctx.fillRect(0, world.height / 2 - roadW / 2, world.width, roadW);
        ctx.fillRect(world.width / 2 - roadW / 2, 0, roadW, world.height);

        // Кольцевая дорога
        ctx.strokeStyle = epoch.roadColor;
        ctx.lineWidth = roadW * 0.8;
        ctx.beginPath();
        ctx.arc(world.width / 2, world.height / 2, 540, 0, Math.PI * 2);
        ctx.stroke();

        // Неоновая разметка в будущем
        if (epoch.index >= 3) {
            ctx.strokeStyle = '#00e5ff';
            ctx.lineWidth = 2;
            ctx.setLineDash([16, 16]);
            ctx.beginPath();
            ctx.moveTo(0, world.height / 2);
            ctx.lineTo(world.width, world.height / 2);
            ctx.moveTo(world.width / 2, 0);
            ctx.lineTo(world.width / 2, world.height);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }

    drawTarPits(ctx, world, epoch) {
        for (let i = 0; i < world.tarPits.length; i++) {
            const pit = world.tarPits[i];
            ctx.save();
            ctx.fillStyle = '#0f0e0d';
            ctx.beginPath();
            ctx.ellipse(pit.x, pit.y, pit.rx, pit.ry, 0, 0, Math.PI * 2);
            ctx.fill();

            // Всплывающие пузыри
            const bScale = Math.sin(this.animTime * 2.5 + i) * 0.5 + 0.5;
            ctx.fillStyle = '#ff5400';
            ctx.beginPath();
            ctx.arc(pit.x + Math.sin(i * 1.5) * 20, pit.y + Math.cos(i * 1.5) * 15, 5 * bScale, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    drawFoliage(ctx, world, epoch) {
        for (let i = 0; i < world.trees.length; i++) {
            const t = world.trees[i];
            ctx.fillStyle = epoch.index >= 3 ? '#1e293b' : '#386641';
            ctx.beginPath();
            ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
            ctx.fill();
        }

        for (let i = 0; i < world.rocks.length; i++) {
            const r = world.rocks[i];
            ctx.fillStyle = '#5c677d';
            ctx.beginPath();
            ctx.ellipse(r.x, r.y, r.r, r.r * 0.7, 0.4, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawBuildings(ctx, world) {
        for (let i = 0; i < world.buildings.length; i++) {
            const b = world.buildings[i];
            ctx.save();

            // Тень
            ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
            ctx.fillRect(b.x + 8, b.y + 10, b.w, b.h);

            // Фасад
            ctx.fillStyle = b.color;
            ctx.fillRect(b.x, b.y, b.w, b.h);

            // Неоновая окантовка или контуры
            if (b.neon) {
                ctx.strokeStyle = b.neon;
                ctx.lineWidth = 3;
                ctx.shadowBlur = 12;
                ctx.shadowColor = b.neon;
                ctx.strokeRect(b.x, b.y, b.w, b.h);
            }

            // Шатры из бивней
            if (b.type === 'mammoth_tent') {
                ctx.strokeStyle = '#e9ecef';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(b.x, b.y + b.h);
                ctx.lineTo(b.x + b.w / 2, b.y);
                ctx.lineTo(b.x + b.w, b.y + b.h);
                ctx.stroke();

                ctx.fillStyle = '#ff5400';
                ctx.beginPath();
                ctx.arc(b.x + b.w / 2, b.y + b.h / 2, 7, 0, Math.PI * 2);
                ctx.fill();
            } else if (b.type === 'grand_ziggurat') {
                ctx.strokeStyle = '#ffb703';
                ctx.lineWidth = 2;
                ctx.strokeRect(b.x + 20, b.y + 20, b.w - 40, b.h - 40);
                ctx.strokeRect(b.x + 45, b.y + 45, b.w - 90, b.h - 90);
            } else if (b.type === 'mammoth_monument') {
                // Золотой монумент мамонту от культа всадника!
                ctx.fillStyle = '#ffb703';
                ctx.font = 'bold 24px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('🦣 СВЯЩЕННЫЙ ЗВЕРЬ', b.x + b.w / 2, b.y + b.h / 2 + 8);
            }

            ctx.restore();
        }
    }

    drawParadoxVignette(ctx, w, h, level) {
        ctx.save();
        const intensity = (level / 100) * 0.45;
        const grad = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.7);
        grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        grad.addColorStop(1, `rgba(114, 9, 183, ${intensity})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
    }
}
