# Shelf

A minimal reading list app. Search any book or author, save results to a personal list, and toggle between **Want to Read** and **Read**. Data persists in Firestore — refresh the page and your list is still there.

---

## Features

- Full-text book and author search via the [Open Library API](https://openlibrary.org/dev/docs/api)
- Cover images, author names, publication year, and edition count for each result
- Save books to Firestore with one click
- Toggle books between *Want to Read* and *Read*
- Remove books from your list
- Firebase config persists in `localStorage` — connect once, stays connected

---

## Setup

### 1. Create a Firebase project

1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project
2. In **Project Settings → Your apps**, register a Web app
3. Copy the `firebaseConfig` object from the SDK setup screen

### 2. Enable Firestore

In your Firebase project, go to **Build → Firestore Database** and click **Create database**. Start in test mode for personal use, or set up security rules for production.

### 3. Run the app

Open `reading-list.html` in any browser — no build step, no server required.

On first load a setup modal will appear. Paste your Firebase config JSON and click **Connect**. The app will connect to Firestore and start syncing immediately.

---

## Firestore Structure

All books are stored in a single `reading_lists` collection. Each document is keyed as `{userId}_{workKey}`.

```
reading_lists/
  user_default_OL45883W/
    userId:    "user_default"
    workKey:   "OL45883W"
    title:     "The Left Hand of Darkness"
    author:    "Ursula K. Le Guin"
    year:      1969
    coverId:   12345678        # Open Library cover ID, or null
    status:    "want" | "read"
    savedAt:   1716000000000   # Unix timestamp
```

---

## Adding Auth

The app uses a hardcoded `USER_ID = 'user_default'`, which means all visitors share the same list. To give each user their own list:

1. Enable **Firebase Authentication** in your project (Email/Password or Google Sign-In)
2. Import `getAuth` and `onAuthStateChanged` from the Firebase Auth SDK
3. Replace the `USER_ID` constant with the authenticated user's `uid`
4. Update your Firestore security rules to scope reads/writes to `request.auth.uid`

---

## Firestore Security Rules

The default test mode rules allow open read/write access. Before making the app public, replace them with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /reading_lists/{docId} {
      allow read, write: if request.auth != null
                         && request.auth.uid == resource.data.userId;
    }
  }
}
```

---

## Tech Stack

| Layer | What's used |
|---|---|
| UI | Vanilla HTML, CSS, JavaScript (no framework) |
| Font | [Syne](https://fonts.google.com/specimen/Syne) via Google Fonts |
| Book data | [Open Library Search API](https://openlibrary.org/dev/docs/api/search) |
| Cover images | [Open Library Covers API](https://openlibrary.org/dev/docs/api/covers) |
| Database | [Firebase Firestore](https://firebase.google.com/docs/firestore) |
| Firebase SDK | Loaded via ESM from `gstatic.com` — no npm required |

---

## Limitations

- Single-user by default (see [Adding Auth](#adding-auth) above)
- Open Library search averages ~2s response time and occasionally returns 500 errors
- Cover images are not available for all books
- No offline support
