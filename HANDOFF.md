# Rafael De Agua EPK — Handoff

Luxury DJ / Producer electronic press kit. Static site, no build step, no framework.
Last updated Sep 22 2026.

---

## 🚨 Read this first: 26 commits are NOT pushed

**The live site is running the version from `f873c7f`. Everything after that is local only.**

He said: *"dont make anything live yet until we get a style and aesthetics down"* — the whole aesthetic pass (fonts, palette, spacing, section order, the new gallery images) is committed locally and deliberately unpushed.

```bash
git log --oneline origin/main..HEAD   # the queue
git push origin main                  # ships the whole batch — ONLY on his word
```

Do not push without him saying so. Deploy cadence follows the phase of work: **fixing → push each change, exploring → hold.**

---

## Live

**https://rafaeldeagua.com** — GitHub Pages, repo `likewaterH20/rafael-de-agua-epk`, HTTPS enforced.
`http://`, `www.` and the old `likewaterh20.github.io/rafael-de-agua-epk` all redirect to the apex.

Domain at **Porkbun**, account `deagua`, $11.08/yr, expires **2027-09-22**.
🚨 Registered under **jmgoodlife@gmail.com** while the whole site's contact is **supergoodwav@gmail.com** — renewal notices go to the former.

Updating the live site is just `git push`; Pages rebuilds in a minute or two. Verify by **Content-Type, not status**:

```bash
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" https://rafaeldeagua.com/style.css
```

🚨 **His browser caches hard.** After a push, check with `?fresh=1` and tell him **Cmd+Shift+R** — he has concluded a good deploy failed because of this.
🚨 **Never unset/re-set the Pages custom domain to hurry a certificate.** GitHub commits `Delete CNAME` / `Create CNAME` into the repo, which rejects your next push and errored three builds in a row. Just wait.

---

## Folder

```
index.html          the site
producer.html       "Coming soon" holding card
style.css           all styling, tokens at the top
site.js             all behaviour
assets/             web-sized images, audio previews, the room loop, YouTube thumbs
assets/real/        66 graded photos from the Jersey City Library party (live-92xx.jpg)
downloads/          one-sheet PDF, press-photos zip, logo-pack zip (no longer linked from the site)
tools/onesheet.py   regenerates the one-sheet PDF, fonts in tools/fonts/
tools/serve.py      preview server
CONTENT_TODO.md     what is real, what is owed
```

## Run it

```bash
python3 -m http.server 4520
```

Opening `index.html` from Finder does NOT work — the SoundCloud and YouTube players need an http origin.

In the Claude desktop app the Browser pane can't read this folder, so the preview runs from a mirror: copy `tools/serve.py` and `rsync` the project into the session scratchpad as `serve.py` + `site/`, then start the `epk` launch config. **Re-sync after every edit.**
🚨 `preview_start` servers are **killed when the turn ends**. Run the mirror server as a background Bash process instead, or he'll hit `ERR_CONNECTION_REFUSED` the moment you say it's ready.
🚨 The launch entry hardcodes an old session's scratchpad path — repoint it each session. A port reported "in use by another chat" is usually a dead registration with nothing listening; just bump the port.

---

## The design system

Everything is tokens at the top of `style.css`. Change the token, not the instance.

| Token | Value | Job |
|---|---|---|
| `--accent` | `#e6b24d` gold | the accent, everywhere |
| `--teal` | `#00a8a2` | **minimal** — hairlines + the nav underline only |
| `--line` | `rgba(0,168,162,.2)` | every hairline |
| `--stack` | `clamp(26px,3.4vw,48px)` | **the one vertical gap**, via `.sec>*+*` |
| `--gutter` | `clamp(20px,5vw,72px)` | page margin |
| `--name` | Bodoni Moda | **the hero name only** |
| `--display` | Instrument Serif | section titles |
| `--body` | Space Grotesk | everything read |

**Type rules that are easy to break again:**

- `button,input,select,textarea{font-family:inherit}` — 🚨 buttons do NOT inherit the page font. Without this, **Arial renders** on the play glyphs.
- **One label style:** 12px / `.2em` uppercase. `.3em` only for the wordmark and marquee.
- **Line-height ladder, four steps only:** `0.85` hero name · `1.1` display · `1.4` titles + labels · `1.6` body. Audit by RATIO (lineHeight ÷ fontSize), never by px value.
- **Three text colours:** `--paper`, `--gold`, `--paper-2`. A fourth is an accident.
- Buttons that are really text (`.bio-toggle`, `.yt-cue`) need `text-align:left` — buttons default to centre.

**Locked decisions — do not undo without him asking:**

- **Gold is the accent, teal stays a whisper.** He tried a full teal accent and pulled it back: *"lets keep it how it was with the yellow accent and keep the blue accent very minimal"*.
- **Bodoni is for the hero name only.** Its hairlines vanish at label sizes on black; at 190px they're the point.
- **No two-tone headings.** Section titles are one colour; emphasis is the italic, not a second colour.
- **One label style:** 12px / `.2em` uppercase. `.3em` only for the wordmark and marquee.
- **Every section: same padding, same `--stack` gaps, same 760px column, same 42px left edge.**
- **The LIKEWTER brush logo is OUT of the nav** (typographic RDA wordmark, expands to the full name above 1180px). This reverses his earlier "keep this static right there in its spot" — don't put it back.
- **Not booked for:** one struck line, "Sweet sixteens, weddings, karaoke, artist shows."
- **Nav:** DJ Sets · Watch · Press Kit · Producer · **Book** (filled gold) · Art Designs. Producer is desktop-only; five items collided with the wordmark at 375px.
- **Art Designs → `https://www.wavsd.com`.** 🚨 Never the bare `wavsd.com` — the apex still serves his old Smart Productions build.

## Page order

`01 position · 02 DJ sets (+ Watch + Booked for) · 03 sound · 04 in the room · 05 artist image · 06 press kit · 07 bookings`

---

## How the moving parts work

**DJ sets (SoundCloud, in-page).** A hidden 1px widget iframe (playlist `1967703216`, WATER DJ SETS) driven by the Widget API. The list rebuilds from the live playlist on load (top 5, `data-count`), so renames and reorders on SoundCloud flow through. Three rows show, "···" reveals the other two. Gotchas: `getSounds()` fills lazily (the code polls), `getDuration()` is stale on PLAY (re-read on progress).

**The play button** is a hairline ring with no fill, and **the ring itself is the progress indicator** — a conic gradient driven by a single `--p` number written per progress tick, masked to a 1px ring. `select()` resets it to 0. There is no "Press play" label; `.mx-title` ships empty with `:empty{display:none}` and only fills once something plays.

**The scrub bar** is a 2px line inside a 32px grab zone: click, drag (pointer capture, `seekTo` on release), ← → ±30s, PageUp/Down ±5min.
🚨 Its height MUST include its padding — `box-sizing:border-box` is global, so `height:2px;padding:15px 0` gives a **zero-height content box that paints nothing**.

**Watch (YouTube).** Two swipe rows: Sounds Sessions (002, 001, 004) then It's Almost Lunch Time. iframes are created only on click.

- **No YouTube chrome, on purpose:** `controls:0` + `disablekb` + `fs:0` + `iv_load_policy:3` on `youtube-nocookie.com`, a transparent `.yt-shield` over the iframe swallowing pointer events (its click is play/pause), and the poster `<img>` promoted to an overlay that only lifts while `.playing`. **The poster is what hides YouTube's title card at startup and the "More videos" end screen on pause — don't revert it to `display:none`.**
- **Our own scrubber** (`.yt-bar`) because `controls:0` removes theirs. **It spans the CURRENT SET, not the whole stream** — `[start, end ?? duration]`, clamped both ends — so dragging can never land a viewer in another DJ's hour.
- Each figure has `data-sets="start-end,…"` in seconds. A poll advances an **explicit window index**; 🚨 `ytUnload` must only tear down `ytPoll`/`ytPlayer` when `ytFig === f`, or unloading an off-screen carousel slide kills the hand-off of the video that's actually playing.
- **End times are still missing** (`1080-,4290-`), so a set plays on into the next DJ and the scrubber can only tighten its left edge. Six timestamps from him fixes it.
- 🚨 **Test with a stubbed `window.YT`, never a real embed** — it sounds on his speakers before any mute lands. To eyeball the frame, inject a throwaway iframe with the same params **plus `&mute=1`**, screenshot, remove. Reload the page before re-stubbing, or the live player is still the old stub.

**Artist image (05).** A *cinema frame*: one shot at a time in a 420px 4:5 stage, slowly drifting/zooming, auto-crossfading every 5.6s, with a six-thumb rail beneath. **Permanently black and white** — an earlier click-for-colour toggle was removed at his request, don't reinstate it. The timer pauses on `visibilitychange`; drift is off under reduced-motion. Adding a shot = another `<img>` in `#cine-stage`; the rail builds itself.
🚨 **The six `artist-0N.jpg` files are 768–1024px** — they were pasted, not on his Mac (hash-matched against 1,386 local images, nothing closer than distance 21). Fine at 420px, soft on retina. **Ask him for the originals.** `artist-decks.jpg` / `artist-portrait.jpg` are still in `assets/` but unused.

**In the room.** A 21s muted 16:9 loop on top, with 13 photos underneath as a free-scrolling strip (`clamp(150px,19vw,210px)` thumbs). No dots, counter, arrows, paging or autoplay. Drag, wheel, arrow keys and touch all move it; the wheel handler releases the page at either end. Click opens the lightbox.

**The hero name is water.** `splitChars()` wraps each letter in `.ch` **in JS, never innerHTML**; a rAF loop displaces each letter by its distance from the pointer with a wave travelling outward, then parks itself completely when everything settles. Skipped under `prefers-reduced-motion`. Works on touch.

**Reveal, and the room loop, both use a rect-on-scroll check on purpose.** IntersectionObserver doesn't fire in a hidden/background tab and the browser pauses off-screen muted video — the loop was sticking on its poster. Don't "modernise" either back to IO.

`?shot=1` on any page reveals everything for full-page captures.

---

## Photography

All of it is graded, and the grade is deliberate. Measure before changing any image:

```python
from PIL import Image, ImageStat
s=ImageStat.Stat(Image.open(p).convert('RGB'))
mean=sum(s.mean)/3; sd=sum(s.stddev)/3     # exposure, contrast
```

Current targets: **club frames ~61 mean / ~58 sd**, **studio frames ~112 / ~70**, **hero portrait 34.9 / 40.8** (dark on purpose, but with contrast so his face has shape).

🚨 **Never force every image to the same mean.** A dark subject on a white cyc cannot average the same as one in a black club — the mean is dominated by background. I tried it and turned the studio backdrop to grey mud. Grade for punch, then **render a greyscale thumbnail and LOOK at it** before shipping.

## Gotchas that cost time

- 🚨 **Parse the HTML after any structural edit.** A stray `</div>` is silently repaired by browsers — it survived rendering, console, screenshots and a full four-width QC pass. `html.parser` found it in a second.
- 🚨 **A background pane tab screenshots ALL BLACK with no error**, and sets `document.hidden`, which pauses muted autoplay and blocks IntersectionObserver. `tabs_select` first, and measure rects before believing an image.
- 🚨 **Synthetic `PointerEvent`s don't drive pointer logic in the pane** — they fire your own test listener and nothing else. Use the real `computer` hover twice.
- 🚨 **A higher-specificity rule that re-declares `transform` can silently fail.** Put the varying value in a custom property (`--rot`) and let states set the variable.
- He reviews in a narrow pane (~590–850px). Never collapse a layout to one column at 600px.

---

## Content: real vs owed

**Real:** portraits, LIKEWTER lockups, palette, rooms (Taverna Veranda, Jersey City Fourth of July Festival, Jersey City Public Library, Aruba, NJ festival stages), base (New York & New Jersey), formats (CDJ · Laptop · Vinyl), the mixes, the two episodes, the three streams, the one-sheet, press photos, logo pack, contact.

**Owed by him:**

- **Six set end times** for the live streams (002: 18:00→?, 1:11:30→?; 001: 25:44→?, 1:13:10→?; 004: 20:00→?, 1:23:44→?)
- A decision on **first-load weight** (~4.5 MB — the strip thumbs are full-size photos)
- **Update the website link** on Instagram, SoundCloud, YouTube, LinkedIn
- The **one-sheet PDF carries no website URL** — add `rafaeldeagua.com` to `tools/onesheet.py` and regenerate
- Years active, a press line or quote; set length range (2–6 hrs is an assumption)
- Tech rider + stage plot; Give 'Em Flowers link when released
- His Porkbun cart has a stray **$9.99** item sitting in it

---

## Working rules learned here

- **Commit before every visual change, one change per turn.** "Looks off, revert" means the whole last round.
- **Never ride an unrequested change along with a requested one.** He rejected a whole commit because I bundled a producer-page rewrite into a player removal — then asked for that same rewrite himself days later.
- **Expect three passes on any creative element**, each one subtracting. Build the strong version; he cuts it back.
- **He deletes instructions and keeps information.** "Press play" → the track name. Show what a thing IS.
- **"Make this cooler" means make the FAMILIAR control special**, not replace it with a cleverer metaphor.
- **When he pastes an image, find the real file by perceptual hash** — average-hash the scratchpad copy against `~/Desktop` and `~/Downloads`, distance 0 is the file. Filenames and mtimes lie; a look-alike already in the project is never it.


---

## Where we left off

**Deploys are paused** and 26 commits are queued. The aesthetic pass is what's unpushed.

**His open request, not yet done:** he pointed at a section title (`02 / 07  DJ sets`, set in Instrument Serif) and said:

> *"whats the deal with this font lets get something nicer and we need the site to look super modern and clean sleek and luxury"*

Read that the way you'd read his "whats the deal with this R?" — it means **he doesn't like it, change it**, not "explain it to me". Instrument Serif is editorial and classical; he is asking for modern-luxury, which in practice means a neutral sans, tight tracking, contrast carried by size and weight rather than by a second colour or an italic.

The direction I was about to take, for what it's worth: **drop Instrument Serif entirely and set section titles in Space Grotesk** at 500 weight with slightly negative tracking, keeping Bodoni for the hero name only. That leaves two typefaces on the whole site and is the single-sans playbook most modern luxury houses use. Build it, show him, expect him to cut it back — [[three passes]] is the pattern.

**Also still open, needs him:** the six Sounds Sessions end times; the high-res originals of the six artist photos; updating the website link on Instagram / SoundCloud / YouTube / LinkedIn; the one-sheet PDF has no URL on it; ~4.5 MB first load.
