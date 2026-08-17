import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { getSupabase } from '../lib/supabase';
import { AppUser, UserRole } from '../types';
import { DEFAULT_ROLE_PERMISSIONS } from '../utils/permissions';

const OWNER_EMAIL = 'b.b.thodsawat@gmail.com';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const client = getSupabase();
    if (!client) { setLoading(false); return; }

    const loadProfile = async (currentUser: User | null) => {
      if (!mounted) return;
      setUser(currentUser);
      if (!currentUser) { setAppUser(null); setLoading(false); return; }

      const isOwner = currentUser.email?.toLowerCase() === OWNER_EMAIL;
      try {
        const { data } = await client.from('users').select('*').eq('uid', currentUser.id).maybeSingle();
        const role: UserRole = isOwner ? 'admin' : ((data?.role as UserRole) || 'staff');
        const permissions = isOwner ? DEFAULT_ROLE_PERMISSIONS.admin : (data?.permissions || DEFAULT_ROLE_PERMISSIONS[role]);
        const now = new Date().toISOString();
        const profile: AppUser = {
          uid: currentUser.id,
          email: currentUser.email ?? null,
          displayName: currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || null,
          photoURL: currentUser.user_metadata?.avatar_url || currentUser.user_metadata?.picture || null,
          role,
          permissions,
          status: isOwner ? 'active' : (data?.status || 'active'),
          createdAt: data?.created_at || now,
          lastLoginAt: now,
        };

        const { error } = await client.from('users').upsert({
          uid: profile.uid,
          email: profile.email,
          display_name: profile.displayName,
          photo_url: profile.photoURL,
          role: profile.role,
          permissions: profile.permissions,
          status: profile.status,
          created_at: data?.created_at || now,
          last_login_at: now,
        }, { onConflict: 'uid' });
        if (error) console.warn('[Supabase profile upsert]', error.message);
        if (mounted) setAppUser(profile);
      } catch (error) {
        console.warn('[Supabase profile]', error);
        if (mounted) setAppUser({
          uid: currentUser.id,
          email: currentUser.email ?? null,
          displayName: currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || null,
          photoURL: currentUser.user_metadata?.avatar_url || currentUser.user_metadata?.picture || null,
          role: isOwner ? 'admin' : 'staff',
          permissions: DEFAULT_ROLE_PERMISSIONS[isOwner ? 'admin' : 'staff'],
          status: 'active',
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        });
      } finally {
        if (mounted) setLoading(false);
      }
    };

    client.auth.getSession().then(({ data }) => loadProfile(data.session?.user ?? null));
    const { data: subscription } = client.auth.onAuthStateChange((_event, session) => {
      void loadProfile(session?.user ?? null);
    });

    return () => { mounted = false; subscription.subscription.unsubscribe(); };
  }, []);

  return { user, appUser, loading };
}
