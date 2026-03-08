
-- Migrate existing chat_messages to canonical chat_key format: smaller_tid_larger_tid
-- Maps:
--   "169262990_Биосный Бабай"   -> "169262990_169262991"   (Скрежет+Биосный)
--   "6497746504_Скрежет Ржавый" -> "169262990_6497746504"  (Скрежет+Шкряб, sender=Шкряб)
--   "169262990_Шкряб Теневой"   -> "169262990_6497746504"  (same conversation, sender=Скрежет)

UPDATE public.chat_messages
SET chat_key = '169262990_169262991'
WHERE chat_key = '169262990_Биосный Бабай';

UPDATE public.chat_messages
SET chat_key = '169262990_6497746504'
WHERE chat_key = '6497746504_Скрежет Ржавый';

UPDATE public.chat_messages
SET chat_key = '169262990_6497746504'
WHERE chat_key = '169262990_Шкряб Теневой';
