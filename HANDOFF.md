# Rafael De Agua EPK — Handoff

Luxury DJ / Producer electronic press kit for Rafael De Agua (LIKEWTER). Static site, no build step, no framework.
Last state: Sep 22 2026, git head `Revert "Remove the originals player"`. Not deployed yet.

## Folder

```
rafael-de-agua-epk/
  index.html          DJ page (hero, position, sound + DJ sets + watch, in the room, press kit, bookings)
  producer.html       Producer page (works, services, process, enquiries)
  style.css           all styling, CSS variables at the top
  site.js             all behaviour (players, carousels, slideshow, reveal)
  assets/             web-sized images, audio previews, the room loop, YouTube thumbnails
  assets/real/        66 graded photos from the Jersey City Public Library party (live-92xx.jpg)
  downloads/          one-sheet PDF, press-photos zip, logo-pack zip
  tools/onesheet.py   regenerates the one-sheet PDF (facts at the top of the file), fonts in tools/fonts/
  tools/serve.py      preview server for the desktop app's Browser pane
  CONTENT_TODO.md     what is real, what is still owed
```

## Run it locally

Any static server works. From the project folder:

```bash
python3 -m http.server 4520
```

Open http://localhost:4520. Open `index.html` from Finder does NOT work: the SoundCloud and YouTube players need an http origin.

In the Claude desktop app the Browser pane cannot read this folder, so the preview runs from a mirror:
copy `tools/serve.py` and `rsync` the project into the session scratchpad as `serve.py` + `site/`, then start the `epk` launch config (port 4520). The mirror must be re-synced after every edit.

## Deploy

GitHub Pages, same pattern as the Yum Yum pitch. The `likewaterH20` GitHub account is signed in with `gh`.

```bash
gh repo create rafael-de-agua-epk --public --source=. --push
gh api -X POST repos/likewaterH20/rafael-de-agua-epk/pages -f build_type=legacy -f source[branch]=main -f source[path]=/
```

Then verify the live URL serves `style.css` with `text/css` and the PDF with `application/pdf` (a 200 with the wrong type means a SPA fallback). A custom domain comes after.

## How the moving parts work

**DJ sets (SoundCloud, in-page).** A hidden 1px SoundCloud widget iframe (playlist `1967703216`, WATER DJ SETS) is driven by the Widget API from `site.js`. The list is rebuilt from the live playlist on load (top 5 by his playlist order; `data-count`), so renames and reorders on SoundCloud flow through. Three rows show, the "···" reveals the other two (`data-show="3"`). Gotchas: `getSounds()` fills lazily (the code polls until all titles exist), `getDuration()` is stale on PLAY (re-read on progress).

**Originals player.** Two 45 s previews (`assets/blue-light-preview.mp3`, `assets/como-el-agua-preview.mp3`) with a Web Audio analyser. He asked to remove it on Sep 22, then asked for the previous version back. Ask before touching it.

**Watch.** Two swipe rows, one carousel each (`.watch-block`): Sounds Sessions live streams first (002, 001, 004), then It's Almost Lunch Time (Ep. 01, 02). YouTube iframes are created only on click. Each live stream figure has `data-sets="start-end,start-end"` in seconds; the YouTube IFrame API polls and jumps from one window to the next, then pauses. **End times are missing** (`1080-,4290-` etc.), so a set currently plays on until stopped. Fill them when he sends the six timestamps.

**In the room.** A 21 s muted 16:9 loop cut from his phone clip (5.9 MB) beside an 11-slide 16:9 slideshow of him in the white 93 jersey (real photos plus three renders), dots, arrows, 4.5 s autoplay that stops on touch, click opens a lightbox.

**Reveal animation** uses a scroll rect check, not IntersectionObserver (unreliable in hidden tabs). `?shot=1` on any page reveals everything and caps the hero at 900px for full-page captures.

## Content: real vs owed

Real: portraits, LIKEWTER lockups, palette, rooms (Taverna Veranda, Jersey City Fourth of July Festival, Jersey City Public Library, Aruba, NJ festival stages), base (New York & New Jersey), formats (CDJ · Laptop · Vinyl), the mixes, the two episodes, the three streams, the one-sheet, press photos, logo pack, contact (supergoodwav@gmail.com, @likewter, soundcloud.com/likewter, YouTube "W a t e r. tv").

Owed by Rafael:
- Six set end times for the live streams (002: 18:00 to ?, 1:11:30 to ?; 001: 25:44 to ?, 1:13:10 to ?; 004: 20:00 to ?, 1:23:44 to ?)
- "Go" or "skip" on the crowd edits for six slides (quoted $0.72 on fal Nano Banana 2; Photoshop Generative Fill is not scriptable on his install)
- Years active, a press line or quote
- Set length range (the facts row says 2 – 6 hrs, that is an assumption)
- Tech rider + stage plot (the site says "sent with every confirmed booking, request by email")
- Give 'Em Flowers link when released
- A domain

## Decisions he made (do not undo)

- Not booked for: one struck line, "Sweet sixteens, weddings, karaoke, artist shows."
- Hero eyebrow: "DJ / Producer". Nav: DJ Sets · Watch · Position · Live · Press Kit · Producer · Book.
- Sound list: World Music first (Signature), no Melodic Techno.
- Booked-for is a wrapping row, not a list. Selected rooms is a row of two over a row of three at every width.
- Mixes: top three, "···" for more, no wording.
- Slideshow: only white-jersey images. He removed 9296 and 9298 (the other guy in white at left).
- Live streams row above the Lunch Time row.
- Body text Jost 400 at 18px; secondary text in Jost, Bodoni only for hero, section titles, quote, genre list, covers.
- Nav is a solid black banner, logo never moves.

## Working rules learned on this project

- Commit before every visual change, one change per turn. "Looks off, revert" means the whole last round.
- When he pastes an image, find the file on disk (newest in Downloads, Desktop, `Rafael DeAgua Website Images/`, `RaveEvent 2026/`). A look-alike already in the project is not it.
- Never test YouTube playback in the pane: it plays out loud before mute lands. SoundCloud: `setVolume(0)` first. Audio elements: hook `HTMLMediaElement.prototype.play` to mute.
- He reviews in a narrow pane (~590px). Never collapse a layout to one column at 600px.
- YouTube "Sign in to confirm you're not a bot" inside the embed = this machine is rate-limited after yt-dlp calls, not the site.
