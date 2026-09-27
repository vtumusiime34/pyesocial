# PYE — import, real database, indexing, bug fixes

## What I found in your ZIP

The PYE app you uploaded is complete in look and feel, but it has **no database at all**. Every user, post, PYES video, like, comment, message, wallet balance and game record is stored in the browser's local storage. That single fact is the root cause of most of the bugs on your list:

- Accounts and sessions only exist in one browser — logging in elsewhere shows nothing.
- Uploads of videos, profile pictures and banners are held as temporary browser data and disappear.
- Likes, comments, follows, chats and notifications never reach other people.
- Wallet balances (SPC/GPC) can be edited by anyone from their own browser.
- Nothing is on a server, so Google cannot index any page.

It also ships with 7 built-in demo accounts (PYE official, Maya, Elena, Sophia, Alex, Zeno, Kai), a welcome post and starter videos — fake data you asked to remove — plus the PYE Tube and Live sections you asked to keep out.

So "fix only" here means: keep your exact design, logo, layout and features, and move the data underneath them onto a real backend. No redesign, no new look.

## Plan

### 1. Bring PYE into this project
Move all your screens and components in as-is — same logo, same colours, same layout, same text. Nothing visual changes.

### 2. Turn each section into its own web address
Today the whole app is one page that swaps sections in memory, so Google sees only one page and the back button doesn't work. Each section gets a real address: home, PYES, spaces, conferences, rankings, studio, messages, search, profiles (`/@username`), settings, games, sounds, wallet, admin. Every page gets its own title and description, plus a sitemap and search-engine permissions file so all pages can be indexed.

### 3. Add the Google verification code
The code you sent (`google-site-verification=6mFtWoYojhuFt2fy7VCo6Rh9LrRnh2hATqO8YvLLKzQBUG`) will be added site-wide. Note: Google's verification tokens are normally 43 characters and yours is longer, so it may have been copied with extra characters. I'll add it exactly as given; if Search Console rejects it, send me the token from the "HTML tag" option and I'll swap it.

### 4. Add the real database and file storage
Set up the backend with tables for: accounts and profiles, follows, posts, PYES videos, likes, saves, comments, shares, sounds, conversations and messages, notifications, wallet balances and transactions, game rooms and turns, spaces, conferences, reports and admin logs. Add file storage for videos, images, avatars, banners and audio.

Access rules so people can only read what they should and only change their own content. Wallet balances become server-controlled — nobody can give themselves coins. The **one-time 15 SPC + 2 GPC signup reward** is granted once by the server at account creation and cannot be claimed twice.

### 5. Real sign-up, login, logout and sessions
Proper email and password accounts with Google sign-in, sessions that survive refresh and work across devices, correct logout, and login-required screens that actually redirect instead of silently failing.

### 6. Reconnect every feature to the database
Profile loading and editing, picture and banner uploads, PYES upload/playback/like/comment/share/save, follows, sounds list/search/playback, chats and notifications (live updating), games rooms and turns, wallet and transactions, search and navigation, loading and error states for each.

### 7. Remove what shouldn't be there
Delete the 7 demo accounts, the welcome post and starter videos, and the PYE Tube and Live sections (including their nav entries and data).

### 8. Test and report
I'll run through sign-up (and confirm the reward lands once), login/logout, profile edits with uploads, posting and playing a PYES, like/comment/share/save/follow, sounds, a chat, a game round, wallet, search, and check mobile and desktop layouts plus the browser console. Then I'll report: bugs fixed, remaining issues, files changed.

## Technical notes

- Backend: Lovable Cloud (Postgres + auth + storage) — no external accounts needed.
- The 2,400-line local-storage service is replaced by a database data layer that keeps the same function names, so your screen components stay essentially untouched.
- Routing moves to the project's file-based router (needed for indexable pages); component internals are not rewritten.
- Realtime subscriptions for messages, notifications and game turns instead of repeated polling — this also removes the duplicate-request and slow-loading problems.
- Server-side checks for anything sensitive: wallet changes, signup reward, admin actions, ownership of content.

## Honest scope note

Porting ~16,000 lines onto a real backend is substantial work, not a few patches. I'll do it in stages — database and auth first, then feature-by-feature — so you can see it working as it lands rather than waiting for everything at once.
