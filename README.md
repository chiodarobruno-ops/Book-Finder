rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /reading_lists/{docId} {
      allow read, write: if request.auth != null
                         && request.auth.uid == resource.data.userId;
    }
  }
}# Book-Finder
A web app that lets anyone search for a book or author and save results to a personal reading list.
