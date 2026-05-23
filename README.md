# Shelf

A client-side book finder and reading list app built with vanilla HTML, CSS, and JavaScript.

---

## Features

- Search books and authors with the Open Library Search API
- View cover images, author names, publication year, and edition count
- Save books to a personal reading list
- Toggle saved books between **Want to Read** and **Read**
- Remove books from the reading list
- Persist saved books in `localStorage`

---

## Run the app

Open `index.html` in any browser. There is no build step required.

---

## Storage

Saved books are stored in `localStorage` under the key `shelf_books`. The app keeps the reading list in memory and rehydrates it from storage on load.

---

## Project files

- `index.html` — static HTML shell
- `style.css` — styling and layout
- `app.js` — application state, API calls, rendering, and event handling
