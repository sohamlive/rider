import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from './config';

/**
 * Initiates 1-Click Google Sign-In
 * Tries popup first; on mobile or if blocked, falls back to redirect
 */
export async function signInWithGoogle() {
  if (!isFirebaseConfigured || !auth || !googleProvider) {
    throw new Error('Firebase is not yet configured. Please add your credentials to .env.local');
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    // If popup was explicitly blocked by the browser, attempt redirect fallback
    if (error.code === 'auth/popup-blocked') {
      try {
        await signInWithRedirect(auth, googleProvider);
        return null;
      } catch (redirectError) {
        console.error('Google Redirect Sign-In Error:', redirectError);
        throw redirectError;
      }
    }
    console.error('Google Sign-In Error:', error);
    throw error;
  }
}

/**
 * Handle redirect result on page load (for mobile redirect flow)
 */
export async function checkRedirectAuth() {
  if (!isFirebaseConfigured || !auth) return null;
  try {
    const result = await getRedirectResult(auth);
    return result ? result.user : null;
  } catch (error) {
    console.error('Redirect auth check error:', error);
    return null;
  }
}

/**
 * Sign out current user
 */
export async function signOutUser() {
  if (!isFirebaseConfigured || !auth) return;
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
}

/**
 * Listen to authentication state changes
 */
export function subscribeToAuth(callback) {
  if (!isFirebaseConfigured || !auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}
