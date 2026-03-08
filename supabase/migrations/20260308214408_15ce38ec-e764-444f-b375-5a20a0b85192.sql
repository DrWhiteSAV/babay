
-- PVP Rooms table
CREATE TABLE public.pvp_rooms (
  id TEXT NOT NULL PRIMARY KEY,
  organizer_telegram_id BIGINT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'Сложная',
  status TEXT NOT NULL DEFAULT 'waiting',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  timer_ends_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.pvp_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "PVP rooms viewable by everyone" ON public.pvp_rooms FOR SELECT USING (true);
CREATE POLICY "PVP rooms insertable by anyone" ON public.pvp_rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "PVP rooms updatable by anyone" ON public.pvp_rooms FOR UPDATE USING (true);
CREATE POLICY "PVP rooms deletable by anyone" ON public.pvp_rooms FOR DELETE USING (true);

-- PVP Room Members table
CREATE TABLE public.pvp_room_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES public.pvp_rooms(id) ON DELETE CASCADE,
  telegram_id BIGINT NOT NULL,
  character_name TEXT,
  avatar_url TEXT,
  status TEXT NOT NULL DEFAULT 'joined',
  score INTEGER NOT NULL DEFAULT 0,
  finished_at TIMESTAMP WITH TIME ZONE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (room_id, telegram_id)
);

ALTER TABLE public.pvp_room_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "PVP members viewable by everyone" ON public.pvp_room_members FOR SELECT USING (true);
CREATE POLICY "PVP members insertable by anyone" ON public.pvp_room_members FOR INSERT WITH CHECK (true);
CREATE POLICY "PVP members updatable by anyone" ON public.pvp_room_members FOR UPDATE USING (true);
CREATE POLICY "PVP members deletable by anyone" ON public.pvp_room_members FOR DELETE USING (true);
