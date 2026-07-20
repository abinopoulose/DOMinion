import type { CommandHandler } from './types';
import { commandRegistry } from './index';
import { parseArgs } from '../commandParser';
import {
  checkSudoAuthorization,
  isSudoCached,
  withElevation,
} from '../../../services/sudoService';
import { useUbuntuAuthStore } from '../../../store/useUbuntuAuthStore';

export const sudo: CommandHandler = async (args, env, streams) => {
  const { flags, options, positional } = parseArgs(args, ['u']);
  const targetUser = options.u || 'root';
  const currentUser = env.effectiveUser;

  if (flags.k) {
    useUbuntuAuthStore.getState().revokeSudoAccess('global-window');
    if (positional.length === 0) return 0;
  }

  if (flags.K) {
    useUbuntuAuthStore.getState().revokeSudoAccess('global-window');
    return 0;
  }

  if (flags.l) {
    return await handleSudoList(currentUser, streams);
  }

  if (positional.length === 0 && !flags.i) {
    streams.stderr.writeLine('usage: sudo [-u user] [-k] [-l] command [args...]');
    return 1;
  }

  if (flags.i) {
    return await handleSudoShell(currentUser, targetUser, env, streams);
  }

  const commandName = positional[0];
  const authResult = await checkSudoAuthorization({
    requestingUser: currentUser,
    targetUser,
    command: commandName,
  });

  if (!authResult.authorized) {
    const errStr = authResult.error || `${currentUser} is not in the sudoers file. This incident will be reported.`;
    streams.stderr.writeLine(errStr);
    return 1;
  }

  if (authResult.requiresPassword && !isSudoCached('global-window')) {
    streams.stdout.writeLine(`[sudo] password for ${currentUser}: `);
  }

  return await executeSudoCommand(positional, env, streams);
};

export async function executeSudoCommand(
  commandParts: string[],
  env: any,
  streams: any
): Promise<number> {
  const commandName = commandParts[0];
  const commandArgs = commandParts.slice(1);

  const builtIns = ['cd', 'pwd', 'history', 'help', 'exit'];
  if (builtIns.includes(commandName)) {
    const lines = [
      `sudo: ${commandName}: command not found`,
      `sudo: "${commandName}" is a shell built-in command, it cannot be run directly.`,
    ];
    lines.forEach(l => streams.stderr.writeLine(l));
    return 1;
  }

  const handler = commandRegistry[commandName];
  if (!handler) {
    streams.stderr.writeLine(`sudo: ${commandName}: command not found`);
    return 1;
  }

  return await withElevation(async () => await handler(commandArgs, env, streams)) ?? 0;
}

async function handleSudoList(username: string, streams: any): Promise<number> {
  const authResult = await checkSudoAuthorization({ requestingUser: username });
  if (!authResult.authorized) {
    streams.stderr.writeLine(`Sorry, user ${username} may not run sudo on ubuntu-web.`);
    return 1;
  }

  streams.stdout.writeLine(`Matching Defaults entries for ${username} on ubuntu-web:`);
  streams.stdout.writeLine('    env_reset, mail_badpass,');
  streams.stdout.writeLine('    secure_path=/usr/local/sbin\\:/usr/local/bin\\:/usr/sbin\\:/usr/bin\\:/sbin\\:/bin');
  streams.stdout.writeLine('');
  streams.stdout.writeLine(`User ${username} may run the following commands on ubuntu-web:`);
  streams.stdout.writeLine('    (ALL : ALL) ALL');
  return 0;
}

async function handleSudoShell(currentUser: string, targetUser: string, env: any, streams: any): Promise<number> {
  const authResult = await checkSudoAuthorization({ requestingUser: currentUser, targetUser });
  if (!authResult.authorized) {
    streams.stderr.writeLine(authResult.error || `${currentUser} is not in the sudoers file.`);
    return 1;
  }
  
  env.pushUser(targetUser);
  return 0;
}
