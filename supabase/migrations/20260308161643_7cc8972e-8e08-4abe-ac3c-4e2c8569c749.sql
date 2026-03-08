-- Enable realtime for chat_messages table so all clients receive live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;