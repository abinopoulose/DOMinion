import { UBUNTU_ACCOUNTS } from '../../../../../../config/accounts';
import { useUbuntuAuthStore } from '../../../../store/useUbuntuAuthStore';

export function UsersPage() {
  const currentUser = useUbuntuAuthStore((s) => s.currentUser);
  const account = UBUNTU_ACCOUNTS.find(a => a.username === currentUser);
  const displayName = account?.displayName || currentUser || 'User';
  const role = account?.role || 'standard';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="ubuntu-settings-list-group" style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div className="ubuntu-settings-list-item" style={{ padding: '16px', gap: '16px' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '24px' }}>
          {initial}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontWeight: '500', fontSize: '18px' }}>{displayName}</span>
          <span style={{ color: 'var(--color-text-secondary)' }}>{role === 'admin' ? 'Administrator' : 'Standard User'}</span>
        </div>
      </div>
    </div>
  );
}
