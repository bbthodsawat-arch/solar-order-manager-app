import { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { AppUser } from '../types';
import { DEFAULT_ROLE_PERMISSIONS } from '../utils/permissions';

/**
 * Authentication is backed by Firebase Auth and the users/{uid} Firestore
 * document. The client never elevates a user to admin based on email or on
 * collection order. New users are provisioned as staff; an administrator must
 * explicitly promote them through the protected users rules.
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const timeoutId = setTimeout(() => {
      if (isMounted) {
        console.warn('[useAuth] Auth state check timed out');
        setLoading(false);
      }
    }, 10000);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!isMounted) return;
      setUser(currentUser);
      setAppUser(null);

      if (!currentUser) {
        clearTimeout(timeoutId);
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (!isMounted) return;

        if (userSnap.exists()) {
          const data = userSnap.data() as AppUser;
          const role = data.role || 'staff';
          const permissions = data.permissions || DEFAULT_ROLE_PERMISSIONS[role];
          const status = data.status || 'active';

          const updatedUser: AppUser = {
            ...data,
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
            role,
            permissions,
            status,
            lastLoginAt: new Date().toISOString(),
          };

          // Keep login metadata current. This does not change authorization
          // fields such as role, permissions, or status.
          await setDoc(userRef, { lastLoginAt: updatedUser.lastLoginAt }, { merge: true });
          setAppUser(updatedUser);
        } else {
          // Safe bootstrap: every first-time client starts as staff.
          // Admin promotion must happen through an existing admin or an
          // explicitly provisioned Firestore record.
          const now = new Date().toISOString();
          const newUser: AppUser = {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
            role: 'staff',
            permissions: DEFAULT_ROLE_PERMISSIONS.staff,
            status: 'active',
            createdAt: now,
            lastLoginAt: now,
          };

          await setDoc(userRef, newUser);
          setAppUser(newUser);
        }
      } catch (error) {
        // Fail closed: do not fabricate an elevated local user when Firestore
        // cannot be read or written.
        console.error('[useAuth] Failed to load Firebase user profile:', error);
        setAppUser(null);
      } finally {
        if (isMounted) {
          clearTimeout(timeoutId);
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  return { user, appUser, loading };
}
