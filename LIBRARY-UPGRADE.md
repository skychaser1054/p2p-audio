# Music library and player upgrade

The existing theme, account system, storage, social features, and player remain in place. Library tools are accessible from Library; Up Next is also available beside the mini player.

## Included

- Queue editing with drag handles and touch-friendly move buttons, play next, add to end, removal, shuffle without repeating a track within a cycle, repeat off/all/one, queue-to-playlist, and saved queue restoration.
- Paused last-song restoration, saved positions, account-scoped local state with cloud backup, playback speed with pitch preservation, sleep timer, A–B loops, and bookmarks.
- Album and artist browsing, sorting, selection, multi-song queue/playlist actions, library mixes, and a per-song menu. Large lists render in batches.
- Song metadata and cover editing, playlist names/covers/order, and JSON track-list import/export. Imports match existing library files; they do not download audio.
- Multiple-file/folder imports, reviewable titles/artists, sequential uploads, stage progress, per-file failures, retries, stop-after-current-file, SHA-256 duplicate detection, embedded metadata, verified artwork fallback, and synced-lyrics lookup.
- Account-scoped offline audio and artwork in IndexedDB, removable downloads, and a cached public app shell. Downloading must complete online first. Offline startup requires a previously saved, valid sign-in and profile. Browser/OS eviction can remove downloads. Signing out removes access until that account signs in again.
- Listening history, minutes and qualified plays, song/artist/album rankings, listening calendar, CSV export, recording opt-out, and history deletion. Seeking and time suspended in the background are excluded. Older listening cannot be reconstructed. History queries currently show at most the latest 10,000 events in the selected period.
- Lyrics appearance controls, LRC import/export, manual timing tools, and temporary suspension of auto-scroll while reading older lines. Automatic matching preserves existing lyrics/artwork. Word highlighting requires word timestamps; missing word timestamps are not invented.
- Desktop 10-band EQ with migration from previous settings, custom presets, optional crossfade, reverb, and analyzed volume matching. Waveform/loudness analysis is an explicit per-song action. Crossfade defaults off. It is not a guarantee of sample-accurate gapless playback.
- Keyboard commands: Space/K play-pause, arrows seek, Shift-arrows previous/next, M mute, F full player, Q queue, B bookmark, Ctrl/Cmd-K search and commands. Typing fields and dialogs keep their native behavior.
- Update fingerprints cover the separate JS/CSS assets. Navigation remains network-first and falls back to the offline shell. Private audio, storage URLs, authentication, and database requests never enter the service-worker cache. The existing five-second top update notification is retained.

## Platform boundaries

On iPhone/iPad the player keeps direct media output for background/screen-lock reliability. Desktop Web Audio effects are not applied there. Haptics depend on browser support. The website is still a website/PWA; this update does not create a QML desktop application, librespot integration, or a Spotify/YouTube downloader.

Artwork and lyrics depend on confident catalog matches and provider availability. Failed matches remain reviewable; no service can guarantee a correct picture or word-aligned lyrics for every file.

## Backend

`database/library_upgrade.sql` records the additive schema changes applied to the connected project. Existing rows remain intact. New state and listening tables use authenticated, own-account RLS. Playlist editors receive UPDATE access only to the ordering column. Audio/cover storage uses the existing policies.

## Validation

Run `npm test` for queue, restoration, race-condition, metadata, offline isolation, EQ migration, and service-worker tests. Run `npm run build` after changing JS/CSS/worker assets and before publishing to refresh their cache-busting version.

The tests use Node and browser API test doubles. Real Safari playback, headphone behavior, desktop audio effects, and visual layout need device verification; no physical-device results are claimed.

## Lyrics and text interaction update

The lyrics view exposes Find lyrics and Save lyrics, plus a pencil editor and a gear for timing/appearance/file tools. Automatic lookup checks missing lyrics on library load and playback, including shared tracks, with a six-hour retry cooldown for unmatched tracks. Owner saves update the song record; other accounts save a personal copy in local device storage. Existing text is preserved. A match depends on provider coverage and the library scan runs while the app is open.

Copy, cut, paste, native context menus, and user text selection are blocked across the site, including forms. Keyboard typing, file imports, song seeking, and application lyric highlighting remain available. These browser interaction restrictions are not content encryption or DRM.

## File picker appearance

File inputs use matching transparent PNG icons for music, artwork, folders, and documents. Native file inputs remain in place so phone/desktop file dialogs, accepted formats, folder selection, existing upload handlers, and disabled states work as before. Selected filenames and sizes appear on the button. Public PNG data is embedded in the versioned file-picker module for offline use; no upload content enters the app-shell cache.

## iOS upload repair and direct-file URL import

Audio pickers show all files so the iOS Files provider does not grey out music with missing MIME information. The app validates supported formats after selection. Song and cover uploads materialize nonempty bytes before sending, normalize audio MIME types from the filename, and send an ArrayBuffer body. Errors identify preparation, artwork, audio transfer, or library saving. Empty/incomplete iCloud files prompt a local download and retry.

Upload Song also offers Import from a link. It accepts HTTPS direct audio-file URLs with browser-accessible downloads, up to 50 MB and ten minutes. Existing MP3 audio is kept; other decodable mono/stereo audio is converted to 192 kbps MP3 in a worker with lamejs 1.2.1. Metadata is read from the original file before MP3 encoding, then the existing title/artwork/lyrics/upload flow runs. Missing required artist/title/artwork pauses for review rather than inventing values. The URL option does not extract audio from YouTube, Spotify, SoundCloud, HTML pages, streaming manifests, or protected media. Some file hosts block cross-origin downloads. No site credentials are sent to the download host.

Drag-and-drop links are accepted in the URL field. Existing clipboard/highlight restrictions remain in effect. Browser codec support and actual iPhone file-provider behavior still require device verification. The test suite covers binary upload bodies, empty/truncated files, MIME normalization, link validation, and remote response handling. The real encoder also produced independently verified mono/stereo MP3 test files at 44.1/48 kHz.

## Partial lyric timing repair

A lyric record is no longer considered fully synced merely because one or more lines contain timestamps. Incomplete timing preserves all text and remains eligible for automatic repair. Plain embedded lyrics are also checked for a complete timed match during upload. The lookup considers both exact and search results, preferring complete word timings when available, with line timings as a fallback. Existing text must be compatible and concurrent edits are protected before automatic replacement. The lyrics gear reports whether timings are word-level, line-level, incomplete, or absent. Individual word highlighting is available only when the matched source provides word timestamps.
