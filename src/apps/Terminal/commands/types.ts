import { CommandResult } from '../../../core/commandParser/types';

export type CommandHandler = (
  args: string[],
  cwdId: string,
  updateCwd: (newCwdId: string) => void,
  clearHistory: () => void
) => CommandResult;
