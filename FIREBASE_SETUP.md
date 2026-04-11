# Firebase Setup Guide

## Quick Setup Steps

### Step 1: Get Your Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Click the **gear icon ⚙️** next to "Project Overview"
4. Select **"Project settings"**
5. Scroll down to **"Your apps"** section
6. If you don't have a web app, click the **"</>" (Web)** icon to add one
7. You'll see a `firebaseConfig` object - copy these values

### Step 2: Update firebase.js

Open `firebase.js` and replace the placeholder values:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...", // ← Replace with your actual API key
  authDomain: "your-project-id.firebaseapp.com", // ← Replace
  projectId: "your-project-id", // ← Replace
  storageBucket: "your-project-id.appspot.com", // ← Replace
  messagingSenderId: "123456789012", // ← Replace
  appId: "1:123456789012:web:abcdef..." // ← Replace
};
```

### Step 3: Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click **"Get started"**
3. Go to **"Sign-in method"** tab
4. Click on **"Email/Password"**
5. Enable it and click **"Save"**

### Step 4: Enable Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click **"Create database"**
3. Start in **test mode** (for development)
4. Choose a location
5. Click **"Enable"**

## Example Configuration

Your `firebase.js` should look like this (with YOUR actual values):

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC1234567890abcdefghijklmnopqrstuvw",
  authDomain: "my-blood-donation-app.firebaseapp.com",
  projectId: "my-blood-donation-app",
  storageBucket: "my-blood-donation-app.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

## Troubleshooting

- **"Invalid API key" error**: Make sure you copied the complete API key (starts with "AIzaSy")
- **"Project not found"**: Verify your projectId matches your Firebase project
- **Authentication not working**: Make sure Email/Password is enabled in Firebase Console

