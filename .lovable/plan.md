
## Полный анализ данных аккаунта 169262990 (запомнено)

**player_stats:**
- character_name: Яга-Бот 71
- character_gender: Бабай
- character_style: Киберпанк
- avatar_url: https://i.ibb.co/8g3RCqW7/e4197c61fa91.jpg
- fear: 250, energy: 150, watermelons: 0
- boss_level: 1, telekinesis_level: 1
- game_status: playing
- custom_settings: { buttonSize: small, fontFamily: JetBrains Mono, fontSize: 12, fontBrightness: 100, theme: normal, musicVolume: 50, ttsEnabled: false, wishes: [Рваная пижама, Светящиеся глаза, Длинные когти, Борода до колен] }

**profiles:**
- first_name: Dr.White, last_name: SAV AI
- username: shishkarnem
- role: Супер-Бабай
- photo_url: (t.me svg ссылка)

**friends:** пустая таблица (0 строк)
**gallery:** 3 записи с аватарами
**inventory:** пусто
**achievements:** 5 записей

---

## Корневые проблемы найдены

### Проблема 1: ПРОДОЛЖИТЬ не работает

В `Home.tsx` — ПРОДОЛЖИТЬ ведёт на `/hub`. `GameHub` проверяет `dbLoaded && !character` и редиректит на `/`. 

`usePlayerStatsSync` запускается в `AppContent` через `usePlayerStatsSync()`. Но `Home.tsx` делает **свой отдельный** прямой запрос к БД (`checkDB`) параллельно с `usePlayerStatsSync`. Они конкурируют.

Когда пользователь нажимает ПРОДОЛЖИТЬ — `store.character` ещё `null` (sync не завершился), попадает на `/hub`, `GameHub` видит `dbLoaded=false` — показывает спиннер. Потом `dbLoaded` становится `true`, `character` загружается — должно работать. НО: в `GameHub` есть:

```typescript
useEffect(() => {
  if (dbLoaded && !character) {
    navigate("/");
  }
}, [dbLoaded, character]);
```

Это срабатывает в момент когда `dbLoaded=true` устанавливается **одновременно** с `character`. React батчит обновления в одном `setState` вызове, поэтому `dbLoaded=true` и `character=данные` приходят вместе. Но если есть **два** рендера — сначала `dbLoaded=true`, потом `character=...` — то между ними этот эффект выбросит на `/`.

### Проблема 2: Сброс настроек при перезапуске

В `App.tsx` есть `useEffect`:
```typescript
useEffect(() => {
  const { friends, addFriend, toggleFriendAi } = usePlayerStore.getState();
  const danil = friends.find(f => f.name === "ДанИИл");
  if (!danil) {
    addFriend("ДанИИл");
  } else if (!danil.isAiEnabled) {
    toggleFriendAi("ДанИИл");
  }
}, []);
```
Это запускается **сразу при монтировании** — до загрузки из БД. Изменяет `friends` в store. Потом приходит загрузка из БД и перезаписывает friends.

**Но главная причина сброса настроек**: `usePlayerStatsSync` ждёт `profile?.telegram_id`. В `lovable/browser` режиме профиль — `LOVABLE_SUPER_USER` с `telegram_id: 169262991`, поэтому загружаются данные для `169262991`, а не для `169262990`. Для настоящего Telegram аккаунта — всё должно работать. НО:

В `AppContent` строка:
```typescript
useEffect(() => {
  const interval = setInterval(() => {
    updateEnergy();
  }, 1000);
}, [updateEnergy]);
```
`updateEnergy` каждую секунду меняет `energy` в store. Это **тригерит sync-эффект** который смотрит на изменения. Но energy не входит в dependency array sync-эффекта — ок.

**Реальная проблема**: `loadedRef` — это `useRef` внутри хука. При React HMR или повторном рендере компонента хук пересоздаётся, `loadedRef.current = false`. Следующий запуск sync-эффекта снова видит `loadedRef.current = false` и сохраняет baseline не делая write. Но потом следующее изменение СРАЗУ пишет в БД с текущим состоянием store — которое может ещё не быть правильным (energy регенерировалась, etc.).

### Проблема 3: Дублирующий код / лишние файлы

`AdminRole.tsx` существует как файл, но в `App.tsx` маршрут `/admin/role` ведёт на `AdminUsers` — `AdminRole` не используется.

В `Home.tsx` делается отдельный прямой запрос к БД (`checkDB`) хотя `usePlayerStatsSync` уже загружает данные в store. Двойная логика — они могут конфликтовать.

---

## План исправления

### Что делать

1. **Исправить GameHub редирект** — добавить `character` в тот же setState что и `dbLoaded`. В `usePlayerStatsSync` `dbLoaded: true` устанавливается **одновременно** с character — это уже так, но useEffect в GameHub реагирует на каждый отдельный рендер. Исправить: убрать useEffect-редирект из GameHub и заменить на прямую проверку после спиннера — без navigate, просто рендерить `null` если `dbLoaded && !character`.

2. **Упростить Home.tsx** — убрать собственный `checkDB`. Использовать данные из store (`dbLoaded`, `character`, `gameStatus`) которые уже загружает `usePlayerStatsSync`. Home должен просто читать store, не делать свои запросы к БД.

3. **Убрать конкурирующий ДанИИл-эффект из App.tsx** — этот useEffect вмешивается в friends до загрузки из БД. Логика "добавить ДанИИл" уже есть в `usePlayerStatsSync` — убрать дубликат из `AppContent`.

4. **Удалить неиспользуемый файл AdminRole.tsx**.

5. **Стабилизировать sync**: `loadedRef` сбрасывается при изменении `profile?.telegram_id` — это правильно. Но нужно убедиться что он не сбрасывается при обычных ре-рендерах. Хук вызывается в `AppContent` — компонент не пересоздаётся при навигации, поэтому ref должен быть стабильным. Это ок.

### Итог изменений

**Файлы к изменению:**
- `src/pages/Home.tsx` — убрать checkDB, использовать store
- `src/pages/GameHub.tsx` — убрать useEffect-navigate, заменить на inline-check
- `src/App.tsx` — убрать дублирующий ДанИИл-эффект  
- `src/pages/AdminRole.tsx` — удалить

**Файлы без изменений:**
- `usePlayerStatsSync.ts` — логика загрузки правильная, трогать не надо
- `playerStore.ts` — чистый, без localStorage, трогать не надо
- `useTelegramAuth.ts` — правильный
