# 🤖 AGENT.md — Инженерные Протоколы Архитектуры
> **Руководство для последующих ИИ-агентов и ведущих разработчиков проекта «NEIRANDERTALTH: TIMELINE PARADOX».**

---

## 1. Модульная Структура и Изоляция (`src/`)

Кодовая база строго разбита на 8 изолированных пакетов:
1. `src/config/`: Константы физики, розыска и таймлайна.
2. `src/math/`: Векторы `Vector2` и детерминированный шум `Random`/`PerlinNoise`.
3. `src/core/`: Оркестратор `Engine`, шина `EventBus`, ввод `InputManager`, звук `SoundSynthesizer`.
4. `src/timeline/`: `TimelineGraph`, `CausalityEngine`, `HistoricalRecord`.
5. `src/planet/`: `PlanetGrid`, `CivilizationsManager`.
6. `src/entities/`: `Player`, `VehicleMount`, `HumanoidAI`, `Projectile`, `Particle`.
7. `src/ai/`: `WantedEscalation`, `DiscoveryDrive`.
8. `src/render/` и `src/ui/`: `Camera2D`, `CanvasRenderer`, `HUDManager`, модальные окна.

### Правило Связности:
Все модули взаимодействуют через `globalEvents` (`EventBus.js`). Запрещено создавать жесткие кольцевые импорты между `Engine` и дочерними классами.

---

## 2. Протокол Добавления Новых Эпох

При введении новых эпох:
1. Добавить запись в `assets/data/timeline_presets.json`.
2. Добавить архитектурные примитивы в `PlanetGrid.rebuildForEpoch()`.
3. Добавить типы транспорта в `VehicleMount.configureType()`.
4. Проверить расчет каскадов в `CausalityEngine`.

---

## 3. Запрет на Упрощение Кода
Запрещено схлопывать модули обратно в монолитные файлы, удалять классы векторов или убирать шину событий. Любое расширение обязано следовать принципам SOLID и чистой архитектуры.
