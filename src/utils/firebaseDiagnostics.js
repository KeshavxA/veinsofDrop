// Firebase Configuration Diagnostics
// This utility helps diagnose Firebase configuration issues

export const checkFirebaseConfig = async () => {
  const diagnostics = {
    isConfigured: false,
    issues: [],
    recommendations: []
  }

  try {
    // Try to import auth to check if it's configured
    // Using dynamic import for ES modules
    const firebaseModule = await import('../../firebase')
    const { auth } = firebaseModule
    
    if (!auth) {
      diagnostics.issues.push('Firebase auth is not initialized')
      diagnostics.recommendations.push(
        'Update firebase.js with your Firebase credentials from Firebase Console'
      )
      return diagnostics
    }

    // If we get here, Firebase is at least partially configured
    diagnostics.isConfigured = true
    
    // Additional checks could be added here
    // For example, checking if auth methods are available
    
  } catch (error) {
    diagnostics.issues.push(`Firebase initialization error: ${error.message}`)
    diagnostics.recommendations.push(
      'Check your Firebase configuration in firebase.js',
      'Verify all credentials are correct from Firebase Console',
      'Make sure Email/Password authentication is enabled'
    )
  }

  return diagnostics
}

export const getFirebaseSetupSteps = () => {
  return [
    {
      step: 1,
      title: 'Get Firebase Credentials',
      description: 'Go to Firebase Console → Project Settings → Your apps → Copy config values'
    },
    {
      step: 2,
      title: 'Update firebase.js',
      description: 'Replace placeholder values in firebase.js with your actual credentials'
    },
    {
      step: 3,
      title: 'Enable Authentication',
      description: 'Firebase Console → Authentication → Sign-in method → Enable Email/Password'
    },
    {
      step: 4,
      title: 'Enable Firestore',
      description: 'Firebase Console → Firestore Database → Create database (test mode)'
    }
  ]
}

