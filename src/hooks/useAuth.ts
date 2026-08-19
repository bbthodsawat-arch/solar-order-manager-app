import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, signOut } from '../lib/firebase';
import { AppUser, UserRole } from '../types';
import { DEFAULT_ROLE_PERMISSIONS } from '../utils/permissions';
import { doc, getDoc, setDoc, serverTimestamp } from '../lib/firestore-compat';

const OWNER_EMAIL = 'b.b.thodsawat@gmail.com';
const AUTH_BOOT_TIMEOUT_MS = 5000;

const buildFallbackProfile = (currentUser: User): AppUser => {
  const now = new Date().toISOString();
  const isOwner = currentUser.email?.toLowerCase() === OWNER_EMAIL;
  const role: UserRole = isOwner ? 'admin' : 'staff';
  return {
    uid: currentUser.uid,
    email: currentUser.email ?? null,
    displayName: currentUser.displayName ?? null,
    photoURL: currentUser.photoURL ?? null,
    role,
    permissions: isOwner ? DEFAULT_ROLE_PERMISSIONS.admin : DEFAULT_ROLE_PERMISSIONS.staff,
    status: 'active',
    createdAt: now,
    lastLoginAt: now,
  };
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) { setLoading(false); return; }
    let mounted = true;
    let settled = false;
    let currentAuthUser: User | null = null;

    const finishLoading = () => {
      if (!mounted || settled) return;
      settled = true;
      setLoading(false);
    };

    // Never sign out a valid Firebase session merely because Firestore/profile
    // hydration is slow. Mobile networks can legitimately take longer than 5s.
    const bootTimeout = window.setTimeout(() => {
      if (!mounted || settled || !currentAuthUser) return;
      console.warn('[Firebase auth] profile bootstrap timeout; continuing with least-privilege profile');
      setAppUser(buildFallbackProfile(currentAuthUser));
      finishLoading();
    }, AUTH_BOOT_TIMEOUT_MS);

    const loadProfile = async (currentUser: User) => {
      const isOwner = currentUser.email?.toLowerCase() === OWNER_EMAIL;
      const now = new Date().toISOString();
      const profileRef = doc(null, 'users', currentUser.uid);

      try {
        const snapshot = await getDoc(profileRef);
        const existing = snapshot.exists() ? snapshot.data() : undefined;
        const role: UserRole = isOwner ? 'admin' : ((existing?.role as UserRole) || 'staff');
        const status: 'active' | 'suspended' = isOwner ? 'active' : ((existing?.status as 'active' | 'suspended') || 'active');
        const permissions = isOwner ? DEFAULT_ROLE_PERMISSIONS.admin : (existing?.permissions || DEFAULT_ROLE_PERMISSIONS[role]);

        if (status === 'suspended') {
          setAppUser(null);
          await signOut();
          if (mounted) finishLoading();
          return;
        }

        const profile: AppUser = {
          uid: currentUser.uid,
          email: currentUser.email ?? null,
          displayName: currentUser.displayName ?? null,
          photoURL: currentUser.photoURL ?? null,
          role,
          permissions,
          status,
          createdAt: existing?.createdAt || now,
          lastLoginAt: now,
        };
        if (!mounted) return;
        setAppUser(profile);
        finishLoading();
        void setDoc(profileRef, {
          ...profile,
          updatedAt: serverTimestamp(),
          createdAt: existing?.createdAt || serverTimestamp(),
          lastLoginAt: serverTimestamp(),
        }, { merge: true }).catch((error) => console.warn('[Firebase profile sync]', error));
      } catch (error) {
        console.warn('[Firebase profile]', error);
        if (!mounted) return;
        // A profile read failure must not eject a valid authenticated user.
        // Keep a least-privilege session and allow the app to remain usable.
        const fallback = buildFallbackProfile(currentUser);
        setAppUser(fallback);
        finishLoading();
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!mounted) return;
      currentAuthUser = currentUser;
      setUser(currentUser);
      setAppUser(null);
      if (!currentUser) {
        finishLoading();
        return;
      }
      void loadProfile(currentUser);
    });

    return () => {
      mounted = false;
      window.clearTimeout(bootTimeout);
      unsubscribe();
    };
  }, []);

  return { user, appUser, loading };
}
