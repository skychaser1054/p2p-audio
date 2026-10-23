-- Additive upgrade; existing songs, playlists and permissions are preserved.
alter table public.songs
 add column if not exists album text not null default '',
 add column if not exists genre text not null default '',
 add column if not exists release_year integer check(release_year between 1000 and 2200),
 add column if not exists track_number integer check(track_number >= 0),
 add column if not exists duration double precision check(duration > 0),
 add column if not exists content_hash text,
 add column if not exists waveform jsonb,
 add column if not exists gain_db double precision check(gain_db between -18 and 6);
create unique index if not exists songs_owner_content_hash_idx on public.songs(owner,content_hash) where content_hash is not null;
alter table public.playlists add column if not exists cover_path text;
alter table public.playlist_songs add column if not exists position integer not null default 0;
create index if not exists playlist_songs_order_idx on public.playlist_songs(playlist_id,position,added_at);
create policy "editors reorder visible playlist songs" on public.playlist_songs for update to authenticated
 using(private.can_edit_playlist(playlist_id)) with check(private.can_edit_playlist(playlist_id));
-- Only ordering can be updated. The playlist/song/added_by identifiers stay immutable.
revoke update on public.playlist_songs from authenticated;
grant update(position) on public.playlist_songs to authenticated;
create table if not exists public.music_state(
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 key text not null check(key in ('playback','settings','bookmarks')),
 value jsonb not null default '{}'::jsonb check(octet_length(value::text) <= 1048576),
 updated_at timestamptz not null default now(),
 primary key(user_id,key)
);
alter table public.music_state enable row level security;
create policy "read own music state" on public.music_state for select to authenticated using(user_id=(select auth.uid()));
create policy "insert own music state" on public.music_state for insert to authenticated with check(user_id=(select auth.uid()));
create policy "update own music state" on public.music_state for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy "delete own music state" on public.music_state for delete to authenticated using(user_id=(select auth.uid()));
grant select,insert,update,delete on public.music_state to authenticated;
create table if not exists public.listening_events(
 id uuid primary key,
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 song_id uuid references public.songs(id) on delete set null,
 title text not null,
 artist text not null,
 album text not null default '',
 listened_seconds double precision not null default 0 check(listened_seconds between 0 and 172800),
 qualified boolean not null default false,
 started_at timestamptz not null default now()
);
alter table public.listening_events enable row level security;
create policy "read own listening events" on public.listening_events for select to authenticated using(user_id=(select auth.uid()));
create policy "insert own listening events" on public.listening_events for insert to authenticated with check(user_id=(select auth.uid()));
create policy "update own listening events" on public.listening_events for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy "delete own listening events" on public.listening_events for delete to authenticated using(user_id=(select auth.uid()));
grant select,insert,update,delete on public.listening_events to authenticated;
create index if not exists listening_events_user_started_idx on public.listening_events(user_id,started_at desc);
