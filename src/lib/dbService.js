import { db } from './firebase';
import { addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore';

const EVENTS_COLLECTION = 'activeEvents';
const OPERATIONS_COLLECTION = 'operations';
const USERS_COLLECTION = 'users';

// Listen to all events in real-time
export const subscribeToEvents = (callback) => {
    if (!db) {
        callback([]);
        return () => {};
    }
    const q = query(collection(db, EVENTS_COLLECTION), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const events = [];
        snapshot.forEach((doc) => {
            events.push({ id: doc.id, ...doc.data() });
        });
        callback(events);
    }, (error) => {
        console.error("Error subscribing to events: ", error);
        callback([]); // Fallback
    });
};

// Add a new active event
export const addEvent = async (eventData) => {
    if (!db) {
        console.warn("Database not initialized, event not added.");
        return null;
    }
    try {
        const docRef = await addDoc(collection(db, EVENTS_COLLECTION), {
            ...eventData,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    } catch (e) {
        console.error("Error adding document: ", e);
        throw e;
    }
};

export const addOperationRecord = async (operationData) => {
    if (!db) {
        console.warn("Database not initialized, operation not added.");
        return null;
    }
    try {
        const docRef = await addDoc(collection(db, OPERATIONS_COLLECTION), {
            ...operationData,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    } catch (e) {
        console.error("Error adding operation: ", e);
        throw e;
    }
};

export const upsertUserProfile = async (user) => {
    if (!db || !user) {
        return;
    }

    try {
        await setDoc(doc(db, USERS_COLLECTION, user.uid), {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || '',
            photoURL: user.photoURL || '',
            providerId: user.providerData?.[0]?.providerId || 'password',
            updatedAt: serverTimestamp(),
        }, { merge: true });
    } catch (e) {
        console.error("Error saving user profile: ", e);
        throw e;
    }
};
