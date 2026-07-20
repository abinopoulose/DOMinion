import { getHomeId } from '../../../fs/seed';
import { useUbuntuAuthStore } from '../../../store/useUbuntuAuthStore';

export class ShellEnvironment {
  cwdId: string;
  cwdPath: string;
  effectiveUser: string;
  userStack: string[];
  commandHistory: string[];
  envVars: Record<string, string>;
  aliases: Record<string, string>;
  lastExitCode: number = 0;
  windowId?: string;
  abortSignal?: AbortSignal;
  interactiveRead?: (prompt?: string, silent?: boolean) => Promise<string>;
  positionalArgs: string[] = [];
  functions: Record<string, any> = {};

  constructor(initialCwdId?: string, initialCwdPath?: string, initialUser?: string, windowId?: string) {
    const authStoreUser = useUbuntuAuthStore.getState().currentUser || 'peasant';
    this.effectiveUser = initialUser || authStoreUser;
    this.cwdId = initialCwdId || getHomeId(this.effectiveUser);
    this.cwdPath = initialCwdPath || (this.effectiveUser === 'root' ? '/root' : `/home/${this.effectiveUser}`);
    this.windowId = windowId;
    this.userStack = [];
    this.commandHistory = [];
    
    this.envVars = {
      'USER': this.effectiveUser,
      'HOME': this.effectiveUser === 'root' ? '/root' : `/home/${this.effectiveUser}`,
      'PATH': '/usr/bin:/bin',
      'TERM': 'xterm',
    };
    
    this.aliases = {
      'll': 'ls -la',
      'la': 'ls -a',
      'l': 'ls -CF'
    };
  }

  setEffectiveUser(user: string) {
    this.effectiveUser = user;
    this.envVars['USER'] = user;
    this.envVars['HOME'] = user === 'root' ? '/root' : `/home/${user}`;
  }

  pushUser(user: string) {
    this.userStack.push(this.effectiveUser);
    this.setEffectiveUser(user);
  }

  popUser() {
    if (this.userStack.length > 0) {
      const prevUser = this.userStack.pop()!;
      this.setEffectiveUser(prevUser);
      return true;
    }
    return false;
  }

  updateEnv(key: string, value: string) {
    this.envVars[key] = value;
  }

  getEnv(key: string) {
    return this.envVars[key];
  }

  setAlias(name: string, value: string) {
    this.aliases[name] = value;
  }

  removeAlias(name: string) {
    delete this.aliases[name];
  }
}
