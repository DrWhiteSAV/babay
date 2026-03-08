
## Проблема

`public/sw.js` — сервис-воркер кэширует все запросы к `supabase.co` (строка 35). Стратегия: если есть в кэше — отдать кэш, не идти в сеть. Из-за этого при каждом входе в приложение `usePlayerStatsSync` получает не живой ответ из базы, а устаревший кэшированный ответ от прошлого сеанса.

Это объясняет всё:
- Настройки, аватар, имя — всё что изменилось в БД — не применяется при повторном входе
- Если не выходить из приложения — всё работает (кэша ещё нет / данные в памяти актуальные)
- Проблема на всех аккаунтах одинаково

## Решение

Убрать `supabase.co` из кэшируемых хостов в сервис-воркере. API-запросы к базе данных никогда не должны кэшироваться. Кэшируются только статические медиафайлы (картинки, аудио, видео).

```text
БЫЛО:
  const isAsset =
    event.request.destination === 'image'  ← OK
    || 'video'                              ← OK
    || 'audio'                              ← OK
    || hostname.includes('ibb.co')          ← OK
    || hostname.includes('pixabay.com')     ← OK
    || hostname.includes('unsplash.com')    ← OK
    || hostname.includes('picsum.photos')   ← OK
    || hostname.includes('supabase.co');    ← ВОТ ЭТО УБРАТЬ

БУДЕТ:
  const isAsset =
    event.request.destination === 'image'
    || event.request.destination === 'video'
    || event.request.destination === 'audio'
    || url.hostname.includes('ibb.co')
    || url.hostname.includes('pixabay.com')
    || url.hostname.includes('unsplash.com')
    || url.hostname.includes('picsum.photos');
    // supabase.co — НЕ кэшируется, всегда живая сеть
```

Дополнительно: сменить версию кэша (`babai-v2`) чтобы старый кэш был принудительно очищен при следующем входе.

## Что меняется

- Файл: `public/sw.js` — 2 изменения:
  1. `CACHE_NAME = 'babai-v2'` (сброс старого кэша)
  2. Убрать `url.hostname.includes('supabase.co')` из условия isAsset

- `detectEntryMode` в `useTelegramAuth.ts` — Telegram-проверка перед iframe-проверкой (бонусное исправление из предыдущего анализа, чтобы реальный аккаунт читался корректно через SDK)

## Что НЕ меняется

- База данных не трогается
- Логика загрузки `usePlayerStatsSync` не трогается
- Медиафайлы (картинки, видео, аудио) по-прежнему кэшируются
