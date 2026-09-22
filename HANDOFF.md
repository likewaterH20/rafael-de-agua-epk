# Rafael De Agua EPK — Handoff

Luxury DJ / Producer electronic press kit for Rafael De Agua (LIKEWTER). Static site, no build step, no framework.
**LIVE: https://rafaeldeagua.com** — his own domain, HTTPS enforced. GitHub Pages, repo `likewaterH20/rafael-de-agua-epk`, domain at Porkbun (account `deagua`, renews ~$11.08/yr, expires 2027-09-22). `http://`, `www.` and the old `likewaterh20.github.io/rafael-de-agua-epk` all redirect to the apex. Deployed Sep 22 2026 so he could send it to a CEO.

## Folder

```
rafael-de-agua-epk/
  index.html          DJ page (hero, position, sound + DJ sets + watch, in the room, press kit, bookings)
  producer.html       Producer page — a "Coming soon" holding card since Sep 22 (old full page: git e6e26d5)
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

Already done — this is how it was set up, kept for reference. GitHub Pages, same pattern as the Yum Yum pitch. The `likewaterH20` GitHub account is signed in with `gh`.

```bash
gh repo create rafael-de-agua-epk --public --source=. --push
gh api -X POST repos/likewaterH20/rafael-de-agua-epk/pages -f build_type=legacy -f 'source[branch]=main' -f 'source[path]=/'
```

Quote the `source[...]` args or zsh eats the brackets. Pages 404s for about 70 seconds after you enable it, so poll until 200.

**Updating it now is just `git push`** — Pages rebuilds in a minute or two.

🚨 **Never unset/re-set the custom domain to hurry a certificate.** GitHub commits `Delete CNAME` + `Create CNAME` to the repo itself, which rejects your next push and errored three builds in a row here. If it has happened: `git pull --rebase origin main`, push, then `gh api -X POST repos/likewaterH20/rafael-de-agua-epk/pages/builds` and poll `pages/builds/latest`.

Verify by Content-Type, never by status alone (a 200 with the wrong type means a fallback):

```bash
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" https://rafaeldeagua.com/style.css
```

OG and Twitter tags on both pages carry **absolute** `https://rafaeldeagua.com/...` URLs and point at `assets/og-card.jpg` (1200×630, generated from `gallery-02.jpg`). If the site ever moves again, those absolute URLs and `og:url` must ALL be updated or the link preview breaks.

## How the moving parts work

**DJ sets (SoundCloud, in-page).** A hidden 1px SoundCloud widget iframe (playlist `1967703216`, WATER DJ SETS) is driven by the Widget API from `site.js`. The list is rebuilt from the live playlist on load (top 5 by his playlist order; `data-count`), so renames and reorders on SoundCloud flow through. Three rows show, the "···" reveals the other two (`data-show="3"`). The scrub bar is a 2px line inside a 32px grab zone: click or drag (pointer capture, `seekTo` on pointerup), and ← → = ±30 s, PageUp/Down = ±5 min, Home = 0 once focused. Gotchas: `getSounds()` fills lazily (the code polls until all titles exist), `getDuration()` is stale on PLAY (re-read on progress), and the bar's `height` must include its padding — `box-sizing:border-box` is global, so `height:2px;padding:15px 0` gives a zero-height content box that paints nothing.

**Originals player — removed Sep 22** (`4f4d25f`). It was two 45 s previews (`assets/blue-light-preview.mp3`, `assets/como-el-agua-preview.mp3`) with a Web Audio analyser, sitting in the right column of `.sound`. An earlier removal also rewrote the producer cards to "Coming" and he reverted the lot; the second pass touched only the `.player` block and the `.sound` grid rule and stood. The MP3s, the `.player` CSS and the `site.js` player code are all still in the repo, so it can come back with one commit.

**Watch.** Two swipe rows, one carousel each (`.watch-block`): Sounds Sessions live streams first (002, 001, 004), then It's Almost Lunch Time (Ep. 01, 02). YouTube iframes are created only on click. Each live stream figure has `data-sets="start-end,start-end"` in seconds; the YouTube IFrame API polls every 500 ms and jumps from one window to the next, then pauses and clears the poll. The poll advances an **explicit window index** (`ytWin`), not a clock lookup, and re-syncs if the viewer drags YouTube's own bar out of the window. A cue chip on the already-loaded figure **seeks in place** — never rebuild the iframe, that was the "super buggy" jump. **End times are missing** (`1080-,4290-` etc.), so a set plays on into the next DJ. Fill them when he sends the six timestamps; nothing else fixes it.

**No YouTube chrome, on purpose.** `controls:0` + `disablekb` + `fs:0` + `iv_load_policy:3` on `youtube-nocookie.com`, a transparent `.yt-shield` over the iframe swallowing pointer events (its click is play/pause), and the poster `<img>` promoted to an overlay that only lifts while `.playing`. The poster is what hides YouTube's title card at startup and the "More videos" end screen on pause — don't go back to `display:none` on it. Because `controls:0` removes YouTube's own scrubber, each loaded figure gets a `.yt-bar` of ours: gold 2px line in a 32px hit area, drag or click, ← → ±15 s, PageUp/Down ±60 s, repainted by a 250 ms `ytTick` that `ytUnload` clears. **It spans the CURRENT SET, not the whole stream** — `[start, end ?? duration]`, clamped at both ends, readout counted within the window, re-spanning when a cue chip switches sets. That is deliberate: a full-length bar would drag a viewer into another DJ's hour. Once the six end times land, the right edge gets tight too.

Test this with a stubbed `window.YT`, never a real embed — it sounds on his speakers before any mute lands. To eyeball the frame, inject a throwaway iframe with the same params **plus `&mute=1` in the URL**, screenshot, remove.

🚨 `ytUnload` must only tear down `ytPoll` / `ytPlayer` when `ytFig === f`. It used to clear the interval unconditionally, so unloading any off-screen carousel slide silently stopped the set-to-set hand-off of the video that was playing.

**Reveal, and the room loop, both use a rect-on-scroll check on purpose.** IntersectionObserver does not fire in a hidden or backgrounded tab, and the browser pauses an off-screen muted video — the loop was getting stuck on its poster frame. Don't "modernise" either one back to IO.

**Press kit.** Bio, long-bio toggle and the facts row only. The Downloads column (one-sheet, press photos, logo pack, rider mailto) was removed Sep 22 at his request; the files still exist in `downloads/` and still serve, so restoring the links is a small edit.

**In the room.** A 21 s muted 16:9 loop cut from his phone clip (5.9 MB) on top, with the 11 white-93-jersey photos (real shots plus three renders) **underneath as a free-scrolling strip** of `clamp(150px,19vw,210px)` thumbs (84px was his "too small"). Whole block is capped at 760px, the same column as the mixes and venues. No dots, counter, arrows, paging or autoplay — he asked to "just scroll through". Drag, wheel, arrow keys and touch all move it; the wheel handler releases the page at either end so it never traps the scroll. Click opens the lightbox.

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

- Nav: Book is a filled gold button, Art Designs beside it links to **`https://www.wavsd.com`**. Never link the bare `wavsd.com` — the apex still serves his old Smart Productions build.
- On phones the nav shows DJ Sets · Watch · Art Designs · Book. Producer is desktop-only because five items collided with the logo at 375px.
- Producer page is a Coming soon card, his call on Sep 22. Do not restore the works/services/process page without him asking.
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
