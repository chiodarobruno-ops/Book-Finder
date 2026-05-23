const SEARCH_API_URL = 'https://openlibrary.org/search.json';
const FIRESTORE_COLLECTION = 'reading_list';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBOfrJfOi5kFpFVwOdQJ1CxhhELT8j2wi0",
  authDomain: "book-finder-b478b.firebaseapp.com",
  projectId: "book-finder-b478b",
  storageBucket: "book-finder-b478b.firebasestorage.app",
  messagingSenderId: "756246404635",
  appId: "1:756246404635:web:fbdd47a7bf3a7a9bc8e2be",
  measurementId: "G-812RPPCZFC"
};

// Initialize Firebase
const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js');
const { getFirestore, collection, getDocs, setDoc, deleteDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let searchResults = [];
let savedBooks = {};
let activeView = 'search';
let isLoadingBooks = false;

const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const searchFeedback = document.getElementById('search-feedback');
const searchResultsContainer = document.getElementById('search-results');
const suggestionChips = document.getElementById('suggestion-chips');
const listFeedback = document.getElementById('list-feedback');
const readingListContainer = document.getElementById('reading-list');
const viewButtons = document.querySelectorAll('[data-view]');
const searchView = document.getElementById('search-view');
const listView = document.getElementById('list-view');

const homepageSuggestions = [
  'The Hobbit',
  'Pride and Prejudice',
  'The Great Gatsby',
  'Educated',
  'The Midnight Library',
  'Atomic Habits',
];

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function loadSavedBooks() {
  try {
    isLoadingBooks = true;
    const querySnapshot = await getDocs(collection(db, FIRESTORE_COLLECTION));
    savedBooks = {};
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      savedBooks[data.workKey] = data;
    });
  } catch (error) {
    console.error('Error loading books from Firestore:', error);
    savedBooks = {};
  } finally {
    isLoadingBooks = false;
  }
}

async function persist() {
  try {
    for (const workKey of Object.keys(savedBooks)) {
      const docRef = doc(db, FIRESTORE_COLLECTION, workKey);
      await setDoc(docRef, savedBooks[workKey]);
    }
  } catch (error) {
    console.error('Error saving to Firestore:', error);
  }
}

function setActiveView(view) {
  activeView = view;
  viewButtons.forEach((button) => {
    const isActive = button.dataset.view === view;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  searchView.classList.toggle('hidden', view !== 'search');
  listView.classList.toggle('hidden', view !== 'list');
}

function showSearchFeedback(message) {
  searchFeedback.textContent = message;
}

function showListFeedback(message) {
  listFeedback.textContent = message;
}

function buildCoverMarkup(coverId, title) {
  if (!coverId) {
    return `<div class="cover-placeholder">No cover available</div>`;
  }

  const src = `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`;
  return `<img src="${esc(src)}" alt="Cover of ${esc(title)}">`;
}

function renderSuggestions() {
  if (!suggestionChips) {
    return;
  }

  suggestionChips.innerHTML = homepageSuggestions
    .map((query) => `<button type="button" class="suggestion-chip" data-query="${esc(query)}">${esc(query)}</button>`)
    .join('');
}

function renderSearchResults() {
  if (searchResults.length === 0) {
    searchResultsContainer.innerHTML = '';
    return;
  }

  searchResultsContainer.innerHTML = searchResults
    .map((book) => {
      const isSaved = Boolean(savedBooks[book.workKey]);
      return `
        <article class="card">
          <div class="card-header">
            ${buildCoverMarkup(book.coverId, book.title)}
          </div>
          <div class="card-body">
            <h2 class="card-title">${esc(book.title)}</h2>
            <p class="card-meta">
              ${esc(book.author)}<br>
              ${book.year ? `${esc(book.year)}` : 'Year unknown'} · ${esc(book.editionCount)} edition${book.editionCount === 1 ? '' : 's'}
            </p>
            <div class="card-actions">
              <button type="button" data-action="save" data-key="${esc(book.workKey)}" ${isSaved ? 'disabled' : ''}>
                ${isSaved ? 'Saved' : 'Save to list'}
              </button>
            </div>
          </div>
        </article>
      `;
    })
    .join('');
}

function renderReadingList() {
  const keys = Object.keys(savedBooks);
  if (keys.length === 0) {
    readingListContainer.innerHTML = '';
    showListFeedback('Your reading list is empty. Save books from the search tab.');
    return;
  }

  showListFeedback('');

  const items = keys
    .map((key) => savedBooks[key])
    .sort((a, b) => b.savedAt - a.savedAt);

  readingListContainer.innerHTML = items
    .map((book) => {
      return `
        <article class="card">
          <div class="card-header">
            ${buildCoverMarkup(book.coverId, book.title)}
          </div>
          <div class="card-body">
            <div class="card-actions">
              <span class="chip ${book.status === 'read' ? 'chip--read' : 'chip--want'}">
                ${book.status === 'read' ? 'Read' : 'Want to Read'}
              </span>
            </div>
            <h2 class="card-title">${esc(book.title)}</h2>
            <p class="card-meta">
              ${esc(book.author)}<br>
              ${book.year ? `${esc(book.year)}` : 'Year unknown'}
            </p>
            <div class="card-actions">
              <button type="button" class="secondary" data-action="toggle" data-key="${esc(book.workKey)}">
                Mark as ${book.status === 'read' ? 'Want to Read' : 'Read'}
              </button>
              <button type="button" class="danger" data-action="remove" data-key="${esc(book.workKey)}">
                Remove
              </button>
            </div>
          </div>
        </article>
      `;
    })
    .join('');
}

function render() {
  setActiveView(activeView);
  renderSuggestions();
  renderSearchResults();
  renderReadingList();
}

function normalizeResult(doc) {
  return {
    workKey: String(doc.key || '').replace('/works/', ''),
    title: doc.title || 'Untitled',
    author: Array.isArray(doc.author_name) && doc.author_name.length > 0 ? doc.author_name.join(', ') : 'Unknown author',
    year: doc.first_publish_year || null,
    coverId: doc.cover_i || null,
    editionCount: Number.isFinite(doc.edition_count) ? doc.edition_count : 0,
  };
}

async function searchBooks(query) {
  const params = new URLSearchParams({
    q: query,
    fields: 'key,title,author_name,first_publish_year,cover_i,edition_count',
    limit: '12',
  });

  try {
    showSearchFeedback('Searching...');
    searchResultsContainer.innerHTML = '';

    const response = await fetch(`${SEARCH_API_URL}?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`Search failed with status ${response.status}`);
    }

    const data = await response.json();
    searchResults = Array.isArray(data.docs) ? data.docs.map(normalizeResult) : [];

    if (searchResults.length === 0) {
      showSearchFeedback('No results found for that query.');
    } else {
      showSearchFeedback('');
    }

    renderSearchResults();
  } catch (error) {
    showSearchFeedback('Unable to load search results. Please try again.');
    searchResults = [];
    searchResultsContainer.innerHTML = '';
  }
}

function saveBook(workKey) {
  if (!workKey || savedBooks[workKey]) {
    return;
  }

  const book = searchResults.find((item) => item.workKey === workKey);
  if (!book) {
    return;
  }

  savedBooks[workKey] = {
    workKey,
    title: book.title,
    author: book.author,
    year: book.year,
    coverId: book.coverId,
    status: 'want',
    savedAt: Date.now(),
  };

  persist();
  render();
}

function toggleBookStatus(workKey) {
  const saved = savedBooks[workKey];
  if (!saved) {
    return;
  }

  saved.status = saved.status === 'read' ? 'want' : 'read';
  persist();
  render();
}

function removeBook(workKey) {
  if (!savedBooks[workKey]) {
    return;
  }

  delete savedBooks[workKey];
  
  // Delete from Firestore
  const docRef = doc(db, FIRESTORE_COLLECTION, workKey);
  deleteDoc(docRef).catch((error) => {
    console.error('Error removing book from Firestore:', error);
  });
  
  render();
}

searchForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const query = searchInput.value.trim();
  if (!query) {
    showSearchFeedback('Please enter a search term.');
    return;
  }

  searchBooks(query);
});

viewButtons.forEach((button) => {
  button.addEventListener('click', () => {
    activeView = button.dataset.view;
    render();
  });
});

searchResultsContainer.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button || button.dataset.action !== 'save') {
    return;
  }

  saveBook(button.dataset.key);
});

suggestionChips.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) {
    return;
  }

  const query = button.dataset.query;
  if (!query) {
    return;
  }

  searchInput.value = query;
  searchBooks(query);
});

readingListContainer.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) {
    return;
  }

  const action = button.dataset.action;
  const workKey = button.dataset.key;
  if (action === 'toggle') {
    toggleBookStatus(workKey);
  } else if (action === 'remove') {
    removeBook(workKey);
  }
});

// Initialize and load saved books on page load
(async () => {
  await loadSavedBooks();
  render();
})();
