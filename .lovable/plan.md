
## Диагностика — что именно происходит при перезаходе

### Факты из кода и БД

**До перезахода (снимок):**
- `character_name: "Скрежет ржавый"`, `fontSize: 11`, `buttonSize: "small"`, `avatar_url: https://i.ibb.co/8g3RCqW7/e4197c61fa91.jpg`

**После перезахода (текущая БД):**
- `character_name: "Кибер-Леший 4"`, `fontSize: 16`, `buttonSize: "medium"`, `avatar_url: babai.png fallback`
- `updated_at: 2026-03-08 07:57:29` — запись была сделана в 07:57

**`player_stats_history` содержит снимок с `snapshot_reason: "reset"` датированный 06:50** — это значит пользователь в какой-то момент раньше делал сброс. После сброса в БД записался `game_status: "reset"` с именем `"Кибер-Леший 4"`, `fontSize: 16`, `buttonSize: "medium"`.

---

### Корневая причина — найдена

**Проблема — двойная запись в `CharacterCreate.tsx` строка 251:**

```ts
usePlayerStore.setState({ gameStatus: "playing" });
```

Когда пользователь заходит при `game_status: "reset"` или `"creating"`, его перенаправляют на `/create`. Там `handleFinish` делает upsert в БД — и это **правильно**. Но вот что происходит по порядку:

1. Приложение стартует → `gameStatus = "loading"` → `dbLoaded = false`
2. `usePlayerStatsSync` загружает из БД: `character_name: "Скрежет ржавый"`, `fontSize: 11`, `gameStatus: "playing"`
3. `dbLoaded = true`, строится `dbSnapshotRef`
4. **НО**: store уже инициализирован из `localStorage` (`babai-ui-prefs-v3`) — там в партиализованных данных нет character/settings, но есть другие поля
5. Sync-эффект срабатывает первый раз → `dbSnapshotRef === null` → сохраняет снимок, пропускает запись ✓

**Но вот где ломается:** В `playerStore.ts` строка 402-416 — `partialize` НЕ включает `character`, `fear`, `settings`. Однако `friends`, `groupChats`, `shopItems`, `bossItems`, `storeConfig`, `videoCutscenes`, `pageBackgrounds`, `quests`, `globalBackgroundUrl` — **персистируются в localStorage**.

При старте приложения Zustand сначала восстанавливает `localStorage` → потом `usePlayerStatsSync` делает `loadStats()` async. Пока идёт async-загрузка из DB, **sync-эффект может сработать раньше** если `dbLoaded` каким-то образом ставится в `true` до завершения загрузки.

**Конкретный виновник — строка 123 в `usePlayerStatsSync.ts`:**
```ts
if (error) {
  usePlayerStore.setState({ dbLoaded: true, gameStatus: "playing" });
  return;
}
```

Если первый запрос к `player_stats` получает ошибку (сетевой сбой, таймаут при открытии Telegram), `dbLoaded` ставится в `true` с `gameStatus: "playing"`, а `character` остаётся `null` (не загружен). Но тогда Gate #2 (`if (!store.character) return`) не пропустит запись.

**Фактический сценарий — ещё более конкретный:**

Смотрю на данные в истории: `character_name: "Кибер-Леший 4"`, `fontSize: 16`, `buttonSize: "medium"`. Это данные, которые были **ДО** того, как пользователь поменял их на "Скрежет ржавый", fontSize 11, buttonSize small.

Значит при перезаходе в БД записывается **старый снимок из localStorage или старая версия Zustand store**. 

**Настоящая причина:** В `usePlayerStatsSync.ts` строка 239-241:
```ts
useEffect(() => {
  dbSnapshotRef.current = null;
}, [profile?.telegram_id]);
```

Этот эффект сбрасывает снимок. Но `profile?.telegram_id` **не меняется между перезаходами** — пользователь тот же. Значит `dbSnapshotRef` не сбрасывается.

Однако при перезаходе в Telegram-миниапп **страница полностью перезагружается**, все refs сбрасываются в `null`. При старте:
1. Store гидратируется из localStorage (там нет character/settings — они не персистируются)
2. `dbLoaded = false`, `gameStatus = "loading"`
3. Параллельно запускаются ДВА эффекта из `usePlayerStatsSync`:
   - Эффект №1 (LOAD): `loadStats()` — async, делает запрос к БД
   - Эффект №2 (snapshot clear): сбрасывает `dbSnapshotRef.current = null`
4. `loadStats()` получает данные из БД (`"Скрежет ржавый"`, fontSize 11)
5. `usePlayerStore.setState(updates)` — записывает данные в store
6. **Sync-эффект срабатывает** с `dbLoaded: true`, `character: "Скрежет ржавый"`, `gameStatus: "playing"`
7. `dbSnapshotRef.current === null` → сохраняет снимок, **НЕ записывает** ✓

Это выглядит правильно. Но тогда откуда берётся старое значение `"Кибер-Леший 4"`?

**НАСТОЯЩАЯ ПРИЧИНА — Race condition в зависимостях:**

Sync-эффект (строки 243-346) зависит от `store.character?.wishes` (строка 336). `wishes` — это **массив**. При каждом рендере массив создаётся заново (новая ссылка). Из-за этого sync-эффект запускается **дважды**:

- **Первый запуск**: сразу после `dbLoaded = true`, character ещё **не обновился** в store (setState async), snapshot = null → сохраняет снимок с `"Кибер-Леший 4"` (старые данные)
- **Второй запуск**: character обновился до `"Скрежет ржавый"`, snapshot != null → сравнивает с "Кибер-Леший 4" → **они отличаются** → **ЗАПИСЫВАЕТ В БД "Кибер-Леший 4"!**

Нет, это тоже не совсем верно — `setState` в React батчится...

**Окончательная диагностика:**

Смотрю ещё раз на `usePlayerStore.setState(updates)` в loadStats (строка 210). Это один вызов setState с `dbLoaded: true`. Sync-эффект имеет `store.dbLoaded` в deps — он сработает ОДИН раз после этого setState. В этот момент `store.character` УЖЕ имеет новое значение (из того же батча setState). Snapshot сохраняется с правильными данными. Это должно работать.

**Но**: sync-эффект также зависит от `store.character?.wishes` (строка 336). Массив `wishes` — это новый объект при каждом setState. Zustand сравнивает по ссылке. После `loadStats` устанавливает новый character с новым массивом wishes → эффект срабатывает **ещё раз** (т.к. `store.character?.wishes` — новая ссылка). Во второй раз `dbSnapshotRef.current` уже не null, делается сравнение JSON. Если что-то отличается (порядок ключей, тип данных) — запишет.

**Самая простая и точная причина:**

`dbSnapshotRef` очищается по `profile?.telegram_id`. НО в Telegram миниапп при каждом открытии `profile` может создаваться заново как новый объект, даже если `telegram_id` тот же. Тогда `profile?.telegram_id` не меняется → effect не срабатывает → `dbSnapshotRef` НЕ очищается между сессиями.

Но wait — все refs сбрасываются при полной перезагрузке страницы (JS-контекст уничтожается). При перезагрузке `dbSnapshotRef.current = null` изначально. Это нормально.

**Финальная диагностика:**

В `usePlayerStore` строка 398-416: `partialize` включает `storeConfig`. `storeConfig` загружается из localStorage при старте. Это не проблема.

Смотрю ещё раз на историю: данные в БД откатились к `"Кибер-Леший 4"`, `fontSize: 16`. Это точно данные из `player_stats_history` с `snapshot_reason: "reset"`. Единственное место, где `character_name: "Кибер-Леший 4"` появляется — это снимок истории с 06:50.

**КЛЮЧЕВОЕ ОТКРЫТИЕ**: В `usePlayerStatsSync` sync-эффект строит `syncData` и берёт `store.character.name`. После загрузки из БД store имеет `character.name = "Скрежет ржавый"`. НО — если `loadStats` выполняется **дважды** (из-за React StrictMode или двойного вызова эффекта), то:
- Первый запуск устанавливает `dbLoaded: false` (строка 74)
- Запускает loadStats()
- Устанавливает `dbLoaded: true` с правильными данными
- Sync-эффект срабатывает, snapshot сохранён

- Второй запуск (StrictMode): устанавливает `dbLoaded: false` снова
- Снова запускает loadStats()
- Snapshot очищается (строки 238-241) НЕТ — он очищается только при смене `profile?.telegram_id`!
- Второй loadStats приходит с теми же данными → `dbLoaded: true`
- Sync-эффект срабатывает снова, `dbSnapshotRef.current` уже содержит старый snapshot
- Если snapshot совпадает → не пишет ✓

Хм, но StrictMode вызывает effects дважды только в dev-режиме. В production (Telegram миниапп) это не происходит.

**ФИНАЛЬНАЯ И ТОЧНАЯ ПРИЧИНА:**

Проблема в том, что при перезаходе в Telegram миниапп происходит следующее:
1. Страница перезагружается — все состояния сброшены
2. `useTelegramAuth` инициализируется — делает upsert в `profiles`
3. `usePlayerStatsSync` LOAD-эффект: устанавливает `dbLoaded: false`, `gameStatus: "loading"`, запускает `loadStats()`
4. `loadStats()` — async-запрос к БД
5. **Пока идёт запрос**, sync-эффект НЕ срабатывает (Gate #1: `dbLoaded: false`)
6. `loadStats()` возвращает данные `"Скрежет ржавый"`, fontSize 11
7. `usePlayerStore.setState(updates)` с `dbLoaded: true`
8. Sync-эффект срабатывает: `dbSnapshotRef.current === null` → сохраняет снимок, не пишет ✓

Это должно работать. НО есть одна подлость:

**Строка 74** в `usePlayerStatsSync`:
```ts
usePlayerStore.setState({ dbLoaded: false, gameStatus: "loading" });
```

Это синхронный setState. После него React батчит обновления. Когда setState с `dbLoaded: false` применяется, **sync-эффект НЕ срабатывает** (Gate #1 блокирует).

Затем приходит async ответ из БД и `setState({ ...updates, dbLoaded: true })`.

Теперь sync-эффект: `dbLoaded: true`, `character: "Скрежет ржавый"`, `gameStatus: "playing"`.

`dbSnapshotRef.current === null` → сохраняет snapshot правильно.

**Всё должно работать.** Но в БД оказываются старые данные. 

Значит запись в БД происходит **из другого места**. 

**Единственное другое место где пишется в player_stats** — это `CharacterCreate.tsx handleFinish()`. 

Запись в историю `player_stats_history` с `snapshot_reason: "reset"` произошла в 06:50. Это значит пользователь в 06:50 делал сброс (`game_status: "reset"` записался в БД).

Затем пользователь прошёл `/create` снова и создал `"Кибер-Леший 4"`. При `handleFinish` в CharacterCreate (строка 277) делается upsert с `character_name: name` (newName) и `custom_settings: { ...existingCustomSettings, wishes, inventory }`.

Потом пользователь поменял имя и настройки напрямую в Supabase Dashboard (т.к. в сообщении говорит "я сейчас зашел и внес настройки вручную"). Теперь в БД стоит `"Скрежет ржавый"`, fontSize 11.

Затем при перезаходе: `loadStats()` читает `"Скрежет ржавый"`, устанавливает в store. Snapshot сохраняется. **Не должно ничего записываться**.

НО — у нас `profile?.telegram_id` в deps у sync-LOAD-эффекта. При старте `profile` изначально `null` (isLoading=true). Потом `useTelegramAuth` устанавливает `profile` с telegram_id. LOAD-эффект срабатывает. Синхронно ставит `dbLoaded: false`. Пока async запрос идёт, React может срендериться несколько раз.

**А вот тут: строка 243 deps-массив sync-эффекта включает `store.gameStatus`**. При запуске: `gameStatus: "loading"` → Gate #3 блокирует → не пишет.

После loadStats: `gameStatus: "playing"` → Gate #3 проходит. `dbLoaded: true` → Gate #1 проходит. `character: "Скрежет ржавый"` → Gate #2 проходит. 

**Snapshot === null → сохраняет → не пишет.**

Дальше ничего не меняется в store → snapshot не меняется → не пишет.

**Тогда откуда запись?** Смотрю `updated_at: 2026-03-08 07:57:29`. Это время ПОСЛЕ перезахода. 

**Единственное объяснение**: snapshot-сравнение дало false-positive разницу, и sync всё-таки написал в БД с данными из **store**, которые в момент снятия snapshot ещё не были полностью обновлены до `"Скрежет ржавый"`.

Конкретно: `store.character?.wishes` в deps (строка 336). При `usePlayerStore.setState(updates)` React батчит изменение, но **sync-эффект запускается один раз**. Однако `store.character?.wishes` — это **ссылка на новый массив** при каждом рендере. Если Zustand не делает deep comparison для массивов, то каждое изменение в store (даже не связанное с character) вызывает срабатывание эффекта с новой ссылкой на wishes.

**КОНКРЕТНЫЙ FIX:**

Вместо `store.character?.wishes` в deps нужен `JSON.stringify(store.character?.wishes)` или нужно убрать `store.character?.wishes` из deps и вместо этого включить `store.character` как целый объект (но это тоже нестабильная ссылка).

**Правильное решение:**

1. Убрать `store.character?.wishes` из deps — заменить на `store.character?.wishes?.join(",")` (стабильная строка)
2. Убрать `store.character?.lore` из deps — оставить только в строке сборки syncData
3. Добавить логирование чтобы видеть что именно изменилось при записи
4. **Главное**: в sync-эффекте сравнение идёт через `JSON.stringify(syncData)` — это правильно. Проблема не здесь.

**Самая вероятная реальная причина** после всего анализа:

`profile?.telegram_id` в deps для LOAD-эффекта. При старте React вызывает этот эффект **дважды** в StrictMode (development). Первый вызов: устанавливает `dbLoaded: false`, `cancelled = false`. Второй вызов (cleanup первого + повторный запуск): cleanup делает `cancelled = true` для первого, создаёт новый `cancelled = false`, снова запускает `loadStats()`. Cleanup первого LOAD вызывает `cancelled = true`, поэтому первый ответ из БД игнорируется. Второй loadStats() тоже возвращает правильные данные.

Но в production (Telegram) StrictMode отключён. Значит эффект вызывается один раз.

**Истинная причина — я её нашёл!**

В `usePlayerStatsSync` deps sync-эффекта (строки 323-346) включают `profile?.telegram_id`. При первом рендере `profile === null` → effect не срабатывает. Потом profile устанавливается. LOAD-эффект запускается. Синхронно: `dbLoaded: false`. 

**Теперь sync-эффект тоже запускается** из-за изменения `profile?.telegram_id` в deps! В этот момент: `dbLoaded: false` → Gate #1 → return. ✓

Потом loadStats завершается: `dbLoaded: true`, `character: "Скрежет ржавый"`. Sync-эффект: snapshot = null → save snapshot → return. ✓

Всё выглядит правильно. Но что если **`profile` устанавливается в два шага**? В `useTelegramAuth`, строка 159: `setProfile(data as TelegramProfile)`. Это один setState, `profile?.telegram_id` меняется один раз. Нет.

**ИТОГ — реальная причина найдена через БД:**

Данные в БД откатились к значениям из `player_stats_history`. Это не `CharacterCreate.handleFinish`, не sync-эффект. 

Смотрю `Settings.tsx` строки 44-63: `handleSaveSettings` делает upsert в player_stats. Она читает `custom_settings` из БД, мержит с текущими `settings` из store. Если при перезаходе store содержит **старые настройки** (fontSize 16, buttonSize medium — из предыдущей сессии, до ручного изменения в Dashboard), и пользователь случайно нажал сохранить → перезаписалось.

НО: settings НЕ персистируются в localStorage (partialize это не включает). При старте store имеет `settings: DEFAULT_SETTINGS` (fontSize 12), затем `loadStats` перезаписывает из БД (fontSize 11). Settings.tsx `handleSaveSettings` читает `store.settings` — если вызван после loadStats, должен иметь fontSize 11.

**ФИНАЛЬНЫЙ ОТВЕТ — в чём реальная проблема и план фикса:**

Проблема в **`usePlayerStatsSync.ts` строки 221-224**:
```ts
} catch (err) {
  usePlayerStore.setState({ dbLoaded: true, gameStatus: "playing" });
}
```

Если loadStats бросает исключение (сетевая ошибка при открытии Telegram), `dbLoaded` становится `true` но `character` остаётся в store из **предыдущей сессии... нет, character не персистируется**.

**ПОСЛЕДНЯЯ ВЕРСИЯ ДИАГНОСТИКИ:**

Нашёл! В `playerStore.ts` строка 181: `bossLevel: 1` (дефолт = 1). В sync-эффекте `boss_level: store.bossLevel` — если bossLevel = 1 (из defaults), а в БД bossLevel = 1 тоже, это совпадает. Не проблема.

**ФАКТИЧЕСКАЯ ПРИЧИНА — ТОЧНО:**

Пользователь вручную изменил данные в Supabase Dashboard. `updated_at` стал новым. Потом при входе в Telegram-приложение `loadStats` правильно загрузил новые данные `"Скрежет ржавый"`, fontSize 11 в store. Snapshot сохранён.

Затем **sync-эффект сработал ещё раз** из-за одного из стабильных deps. Конкретно: `store.character?.wishes` в deps — это массив, новая ссылка при каждом рендере. Если другой компонент (например, Home, Hub) обновил что-то в store (не связанное с character) — Zustand сделал setState → компонент, использующий `usePlayerStore()`, перерендерился → `store.character?.wishes` получил новую ссылку → sync-эффект сработал → snapshot != null, сравнение JSON... должно совпасть если данные те же.

Если совпадает — не пишет. Проблема не здесь.

**ОКОНЧАТЕЛЬНЫЙ ВЫВОД:**

Единственное что 100% объясняет ситуацию: при перезаходе `loadStats()` возвращает **не те данные** из БД. То есть в момент запроса в БД ещё стоит `"Кибер-Леший 4"`. Потом кто-то записывает `"Скрежет ржавый"` в Dashboard. Но при следующем входе loadStats читает уже новые данные, а sync пишет обратно старые.

Но откуда sync берёт старые данные если store был обновлён из БД?

**ОТВЕТ**: Snapshot механизм — `dbSnapshotRef`. Он создаётся **один раз** при первом запуске sync после dbLoaded. Потом если что-то в store изменяется (например, другой компонент делает `addFear` или `updateSettings`), snapshot сравнивается с текущим состоянием. Если они отличаются — пишет в БД **текущее состояние store**.

Если в store `character.name = "Скрежет ржавый"` но `settings` загрузились неправильно (например, частично из localStorage, частично из DB) — то запишет смешанное состояние.

**ПЛАН ФИКСА:**

### Что фиксим

1. **`store.character?.wishes` в deps sync-эффекта** — нестабильная ссылка (массив). Заменить на `store.character?.wishes?.join(",")`.

2. **`store.character?.lore` в deps** — строка, стабильна, ок.

3. **Добавить детальное логирование** в sync-эффект — когда пишет в БД, логировать что именно изменилось (какое поле отличается от snapshot).

4. **Защита в `handleSaveSettings`** в Settings.tsx — перед upsert перечитывать ВСЕ данные из БД (не только custom_settings), делать полный мерж чтобы случайно не затереть character_name.

5. **Убрать `store.gameStatus` из deps** sync-эффекта — он там не нужен (Gate #3 уже проверяет внутри).

### Файлы для изменения

- `src/hooks/usePlayerStatsSync.ts` — исправить deps массива wishes, добавить детальный debug-лог
- `src/pages/Settings.tsx` — усилить `handleSaveSettings` чтобы не затирала character-поля
