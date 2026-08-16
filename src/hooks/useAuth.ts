import { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { AppUser, UserRole } from '../types';
import { DEFAULT_ROLE_PERMISSIONS } from '../utils/permissions';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Safety timeout to ensure loading spinner never blocks indefinitely if Firebase network is delayed
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        setLoading((prev) => {
          if (prev) {
            console.warn('[useAuth] Auth state check timed out, falling back to ready state');
            return false;
          }
          return prev;
        });
      }
    }, 4000);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!isMounted) return;
      setUser(currentUser);
      
      if (currentUser) {
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (!isMounted) return;

          if (userSnap.exists()) {
            const data = userSnap.data() as AppUser;
            
            // Check if user is the store owner / designated admin email
            const isAdminOwner = currentUser.email?.toLowerCase() === 'b.b.thodsawat@gmail.com';
            const role: UserRole = isAdminOwner ? 'admin' : (data.role || 'staff');
            const perms = isAdminOwner ? DEFAULT_ROLE_PERMISSIONS.admin : (data.permissions || DEFAULT_ROLE_PERMISSIONS[role]);
            const userStatus = isAdminOwner ? 'active' : (data.status || 'active');

            const updatedUser: AppUser = {
              ...data,
              role,
              permissions: perms,
              status: userStatus,
              lastLoginAt: new Date().toISOString(),
            };

            // Update user record in Firestore
            updateDoc(userRef, { 
              role,
              permissions: perms,
              status: userStatus,
              lastLoginAt: updatedUser.lastLoginAt,
            }).catch(console.warn);

            if (isMounted) setAppUser(updatedUser);
          } else {
            // Check if user is owner or if there are any users in DB
            const isAdminOwner = currentUser.email?.toLowerCase() === 'b.b.thodsawat@gmail.com';
            let assignedRole: UserRole = isAdminOwner ? 'admin' : 'staff';
            
            if (!isAdminOwner) {
              try {
                const allUsersSnap = await getDocs(collection(db, 'users'));
                if (allUsersSnap.empty) {
                  assignedRole = 'admin';
                }
              } catch (err) {
                console.warn("Could not check existing users count:", err);
              }
            }

            const newUser: AppUser = {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
              role: assignedRole,
              permissions: DEFAULT_ROLE_PERMISSIONS[assignedRole],
              status: 'active',
              createdAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
            };

            await setDoc(userRef, newUser).catch(console.warn);
            if (isMounted) setAppUser(newUser);
          }
        } catch (error) {
          console.warn("Could not fetch user profile from Firestore:", error);
          const isAdminOwner = currentUser.email?.toLowerCase() === 'b.b.thodsawat@gmail.com';
          const assignedRole: UserRole = isAdminOwner ? 'admin' : 'staff';

          if (isMounted) {
            setAppUser({
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
              role: assignedRole,
              permissions: DEFAULT_ROLE_PERMISSIONS[assignedRole],
              status: 'active',
              createdAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
            });
          }
        }
      } else {
        if (isMounted) setAppUser(null);
      }
      
      if (isMounted) {
        clearTimeout(timeoutId);
        setLoading(false);
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

