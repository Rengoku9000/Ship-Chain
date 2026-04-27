import {
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import { upsertUserProfile } from './dbService';

const ensureAuth = () => {
    if (!auth) {
        throw new Error('Firebase authentication is not configured.');
    }
};

export const subscribeToAuthState = (callback) => {
    if (!auth) {
        callback(null);
        return () => {};
    }

    return onAuthStateChanged(auth, (user) => {
        if (user) {
            upsertUserProfile(user).catch((error) => {
                console.error('User profile sync failed:', error);
            });
        }
        callback(user);
    });
};

export const signInWithGoogle = async () => {
    ensureAuth();
    googleProvider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, googleProvider);
    upsertUserProfile(result.user).catch((error) => {
        console.error('User profile sync failed:', error);
    });
    return result.user;
};

export const signInWithEmail = async (email, password) => {
    ensureAuth();
    const result = await signInWithEmailAndPassword(auth, email, password);
    upsertUserProfile(result.user).catch((error) => {
        console.error('User profile sync failed:', error);
    });
    return result.user;
};

export const signUpWithEmail = async (name, email, password) => {
    ensureAuth();
    const result = await createUserWithEmailAndPassword(auth, email, password);
    if (name) {
        await updateProfile(result.user, { displayName: name });
    }
    upsertUserProfile(result.user).catch((error) => {
        console.error('User profile sync failed:', error);
    });
    return result.user;
};

export const logoutUser = async () => {
    if (!auth) return;
    await signOut(auth);
};
