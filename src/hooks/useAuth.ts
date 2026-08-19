import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, signOut } from '../lib/firebase';
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
    if (!auth) { setLoading(false); return; }
    let mounted = true;
    let settled = false;
    const finishLoading = () => { if (!mounted || settled) return; settled = true; setLoading(false); };
    const bootTimeout = window.setTimeout(() => {
      if (!settled && mounted) {
        console.warn('[Firebase auth] bootstrap timeout; signing out to fail closed');
        setAppUser(null);
        void signOut().finally(finishLoading);
      }
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
        setAppUser(null);
        if (!isOwner) {
          await signOut();
          finishLoading();
          return;
        }
        setAppUser({
          uid: currentUser.uid,
          email: currentUser.email ?? null,
          displayName: currentUser.displayName ?? null,
          photoURL: currentUser.photoURL ?? null,
          role: 'admin',
          permissions: DEFAULT_ROLE_PERMISSIONS.admin,
          status: 'active',
          createdAt: now,
          lastLoginAt: now,
        });
        finishLoading();
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!mounted) return;
      setUser(currentUser);
      setAppUser(null);
      if (!currentUser) { finishLoading(); return; }
      void loadProfile(currentUser);
    });

    return () => { mounted = false; window.clearTimeout(bootTimeout); unsubscribe(); };
  }, []);

  return { user, appUser, loading };
}
