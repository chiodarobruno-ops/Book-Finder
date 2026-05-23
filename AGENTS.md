# AGENTS.md

Guidelines for AI agents and coding assistants working on this codebase.

---

## Project Overview

A client-side web app that lets users search for books and authors, view results with cover images and metadata, and save items to a personal reading list. No framework, no build step — plain HTML, CSS, and JavaScript only.

---

## File Structure

```
index.html        # Main entry point and app shell
style.css         # All styles and design tokens
app.js            # All application logic
README.md
AGENTS.md
```

Keep logic out of `index.html`. HTML is structure only — no inline `<script>` blocks with business logic, no inline styles beyond layout utilities.

---

## Architecture

The app is structured in three distinct layers:

**HTML (`index.html`)** — static shell only. Defines the topbar, search input, results container, reading list container, and any modals. All dynamic content is injected by JavaScript.

**CSS (`style.css`)** — design tokens as CSS custom properties in `:root`, followed by component styles. No CSS frameworks. No utility class systems. Styles are written per-component, not per-property.

**JavaScript (`app.js`)** — all state, API calls, rendering, and event handling. No modules unless the project explicitly adopts them. State lives in plain objects at the top of the file. DOM writes go through dedicated render functions, not scattered throughout the codebase.

---

## State Management

All mutable state lives in clearly named variables at the top of `app.js`:

```js
let searchResults = [];   // Current API results
let savedBooks    = {};   // Persisted reading list, keyed by book ID
let activeView    = 'search'; // 'search' | 'list'
```

Do not introduce additional global state without documenting it here. Do not store derived state — compute it from the above at render time.

---

## Rendering Pattern

Dynamic UI is written by setting `element.innerHTML`. Render functions are named `render*` and always replace the full contents of their target container. Do not manipulate child elements individually outside of targeted state-patch functions (e.g. updating a single button after a save action).

All user-facing strings from external sources must be HTML-escaped before injection. Use a shared `esc(str)` utility — do not inline `.replace()` chains at call sites.

```js
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
```

---

## Book Search API

The app uses the [Open Library Search API](https://openlibrary.org/dev/docs/api/search) — free, no authentication required.

**Search endpoint:**
```
GET https://openlibrary.org/search.json?q={query}&fields=key,title,author_name,first_publish_year,cover_i,edition_count&limit=12
```

Always specify the `fields` parameter explicitly. Do not use `fields=*` — it causes server-side performance issues.

**Cover images:**
```
https://covers.openlibrary.org/b/id/{cover_i}-M.jpg
```

Not all books have covers — always handle the `null` / missing `cover_i` case with a placeholder.

The API has no published rate limit but is unreliable under load. Always wrap fetch calls in `try/catch` and show a user-facing error on failure.

---

## Persistence

Reading list data is saved to `localStorage` under the key `shelf_books`. The stored value is a JSON-serialised object matching the `savedBooks` shape.

Load on app init:
```js
const stored = localStorage.getItem('shelf_books');
if (stored) savedBooks = JSON.parse(stored);
```

Save after every mutation:
```js
localStorage.setItem('shelf_books', JSON.stringify(savedBooks));
```

Do not write to `localStorage` from anywhere except the dedicated `persist()` function.

---

## Reading List Schema

Each entry in `savedBooks` is keyed by the Open Library work ID (e.g. `OL45883W`) and has this shape:

| Field | Type | Notes |
|---|---|---|
| `workKey` | string | Open Library work ID, `/works/` prefix stripped |
| `title` | string | |
| `author` | string | Comma-joined from `author_name` array |
| `year` | number or null | `first_publish_year` from API |
| `coverId` | number or null | `cover_i` from API |
| `status` | `"want"` or `"read"` | |
| `savedAt` | number | `Date.now()` at time of save |

Do not add fields without updating both the write path and any render paths that consume them.

---

## CSS Guidelines

- All colors, radii, and spacing scales are defined as CSS variables in `:root`. Do not hardcode values outside of `:root`.
- Do not add new font families without removing an existing one. Keep the typeface count at one or two.
- Status indicators use semantic naming: `--color-want` and `--color-read` for the two reading states, `--color-danger` for destructive actions and errors only.
- Avoid `!important`. If specificity is a problem, fix the selector.
- Do not add CSS animations beyond simple `transition` on hover and focus states.

---

## What Not to Do

- Do not introduce a JavaScript framework (React, Vue, Svelte, etc.) or a bundler.
- Do not add external CSS frameworks (Tailwind, Bootstrap, etc.).
- Do not split `app.js` into multiple files unless the file exceeds ~600 lines and the split is along clear feature boundaries.
- Do not store book data anywhere other than `localStorage` via the `persist()` function.
- Do not fetch data to re-populate the reading list view — read from `savedBooks` in memory, which is always in sync with `localStorage`.
- Do not use `eval()`, `innerHTML` without escaping, or dynamic `<script>` injection.
