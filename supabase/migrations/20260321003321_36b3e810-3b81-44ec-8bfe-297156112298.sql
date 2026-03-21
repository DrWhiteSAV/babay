
CREATE TABLE public.friend_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_telegram_id bigint NOT NULL,
  to_telegram_id bigint NOT NULL,
  from_character_name text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(from_telegram_id, to_telegram_id)
);

ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Friend requests viewable by everyone" ON public.friend_requests FOR SELECT TO public USING (true);
CREATE POLICY "Friend requests insertable by anyone" ON public.friend_requests FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Friend requests updatable by anyone" ON public.friend_requests FOR UPDATE TO public USING (true);
CREATE POLICY "Friend requests deletable by anyone" ON public.friend_requests FOR DELETE TO public USING (true);
