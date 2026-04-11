import React from 'react'
import { Link } from 'react-router-dom'

const FirebaseConfigHelper = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-lg border-2 border-red-200">
      <div className="flex items-start gap-4 mb-6">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Firebase Configuration Required</h3>
          <p className="text-gray-600 mb-4">
            To use this application, you need to configure Firebase with your project credentials.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
          <h4 className="font-semibold text-blue-900 mb-2">Quick Setup Steps:</h4>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>
              Go to{' '}
              <a 
                href="https://console.firebase.google.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 underline font-medium"
              >
                Firebase Console
              </a>
            </li>
            <li>Select your project (or create a new one)</li>
            <li>Click the ⚙️ gear icon → "Project settings"</li>
            <li>Scroll to "Your apps" section</li>
            <li>Click the &quot;&lt;/&gt;&quot; (Web) icon to add a web app if you don&apos;t have one</li>
            <li>Copy the <code className="bg-blue-100 px-1 rounded">firebaseConfig</code> values</li>
            <li>Open <code className="bg-blue-100 px-1 rounded">firebase.js</code> in your project</li>
            <li>Replace the placeholder values (lines 33-38) with your actual credentials</li>
          </ol>
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <h4 className="font-semibold text-yellow-900 mb-2">Enable Authentication:</h4>
          <ol className="list-decimal list-inside space-y-2 text-yellow-800">
            <li>In Firebase Console, go to "Authentication"</li>
            <li>Click "Get started" if needed</li>
            <li>Go to "Sign-in method" tab</li>
            <li>Click on "Email/Password"</li>
            <li>Enable it and click "Save"</li>
          </ol>
        </div>

        <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
          <h4 className="font-semibold text-green-900 mb-2">Example Configuration:</h4>
          <pre className="bg-gray-800 text-green-400 p-3 rounded text-xs overflow-x-auto">
{`const firebaseConfig = {
  apiKey: "AIzaSyC1234567890abcdefghijklmnopqrstuvw",
  authDomain: "my-project-12345.firebaseapp.com",
  projectId: "my-project-12345",
  storageBucket: "my-project-12345.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};`}
          </pre>
        </div>

        <div className="flex gap-3 pt-4">
          <a
            href="https://console.firebase.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            Open Firebase Console
          </a>
          <Link
            to="/"
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Back to Home
          </Link>
        </div>

        <div className="mt-4 text-sm text-gray-500">
          <p>
            📖 For detailed instructions, see <code className="bg-gray-100 px-1 rounded">FIREBASE_SETUP.md</code> in your project root.
          </p>
        </div>
      </div>
    </div>
  )
}

export default FirebaseConfigHelper

