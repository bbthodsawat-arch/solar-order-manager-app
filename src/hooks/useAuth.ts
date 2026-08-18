import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { AppUser, UserRole } from '../types';
import { DEFAULT_ROLE_PERMISSIONS } from '../utils/permissions';
import { doc, getDoc, setDoc, serverTimestamp } from '../lib/firestore-compat';

const OWNER_EMAIL = 'b.b.thodsawat@gmail.com';
const AUTH_BOOT_TIMEOUT_MS = 5000;

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    let mounted = true;
    let settled = false;

    const finishLoading = () => {
      if (!mounted || settled) return;
      settled = true;
      setLoading(false);
    };

    // Firebase Auth can occasionally wait on browser persistence/network state
    // indefinitely in mobile/custom-tab environments. Never leave the whole SPA
    // behind the auth splash forever: after a short bootstrap window, fall back to
    // the normal logged-out screen while Firebase continues its own initialization.
    const bootTimeout = window.setTimeout(() => {
      if (!settled && mounted) {
        console.warn('[Firebase auth] bootstrap timeout; continuing to Login screen');
        finishLoading();
      }
    }, AUTH_BOOT_TIMEOUT_MS);

    const loadProfileInBackground = async (currentUser: User) => {
      const isOwner = currentUser.email?.toLowerCase() === OWNER_EMAIL;
      const now = new Date().toISOString();
      const profileRef = doc(null, 'users', currentUser.uid);

      try {
        const snapshot = await getDoc(profileRef);
        const existing = snapshot.exists() ? snapshot.data() : undefined;
        const role: UserRole = isOwner ? 'admin' : ((existing?.role as UserRole) || 'staff');
        const permissions = isOwner
          ? DEFAULT_ROLE_PERMISSIONS.admin
          : (existing?.permissions || DEFAULT_ROLE_PERMISSIONS[role]);

        const profile: AppUser = {
          uid: currentUser.uid,
          email: currentUser.email ?? null,
          displayName: currentUser.displayName ?? null,
          photoURL: currentUser.photoURL ?? null,
          role,
          permissions,
          status: isOwner ? 'active' : (existing?.status || 'active'),
          createdAt: existing?.createdAt || now,
          lastLoginAt: now,
        };

        if (!mounted) return;
        setAppUser(profile);

        void setDoc(profileRef, {
          ...profile,
          updatedAt: serverTimestamp(),
          createdAt: existing?.createdAt || serverTimestamp(),
          lastLoginAt: serverTimestamp(),
        }, { merge: true }).catch((error) => {
          console.warn('[Firebase profile sync]', error);
        });
      } catch (error) {
        console.warn('[Firebase profile]', error);
        if (!mounted) return;
        setAppUser({
          uid: currentUser.uid,
          email: currentUser.email ?? null,
          displayName: currentUser.displayName ?? null,
          photoURL: currentUser.photoURL ?? null,
          role: isOwner ? 'admin' : 'staff',
          permissions: DEFAULT_ROLE_PERMISSIONS[isOwner ? 'admin' : 'staff'],
          status: 'active',
          createdAt: now,
          lastLoginAt: now,
        });
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!mounted) return;

      setUser(currentUser);

      if (!currentUser) {
        setAppUser(null);
        finishLoading();
        return;
      }

      const isOwner = currentUser.email?.toLowerCase() === OWNER_EMAIL;
      const now = new Date().toISOString();
      setAppUser({
        uid: currentUser.uid,
        email: currentUser.email ?? null,
        displayName: currentUser.displayName ?? null,
        photoURL: currentUser.photoURL ?? null,
        role: isOwner ? 'admin' : 'staff',
        permissions: DEFAULT_ROLE_PERMISSIONS[isOwner ? 'admin' : 'staff'],
        status: 'active',
        createdAt: now,
        lastLoginAt: now,
      });
      finishLoading();
      void loadProfileInBackground(currentUser);
    });

    return () => {
      mounted = false;
      window.clearTimeout(bootTimeout);
      unsubscribe();
    };
  }, []);

  return { user, appUser, loading };
}
