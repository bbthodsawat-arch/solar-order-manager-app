import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { AppUser, UserRole } from '../types';
import { DEFAULT_ROLE_PERMISSIONS } from '../utils/permissions';
import { doc, getDoc, setDoc, serverTimestamp } from '../lib/firestore-compat';

const OWNER_EMAIL = 'b.b.thodsawat@gmail.com';

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

        // Keep the profile synchronized, but never block the first paint on this write.
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
        setLoading(false);
        return;
      }

      // Firebase Auth is the critical path. Render immediately and hydrate the
      // Firestore profile in the background instead of blocking the first screen.
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
      setLoading(false);
      void loadProfileInBackground(currentUser);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return { user, appUser, loading };
}
