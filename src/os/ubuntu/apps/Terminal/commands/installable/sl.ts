import type { CommandHandler } from '../types';

export const sl: CommandHandler = async (args, env, streams) => {
  const train = [
    `      ====        ________                ___________ `,
    `  _D _|  |_______/        \\__I_I_____===__|_________| `,
    `   |(_)---  |   H\\________/ |   |        =|___ ___|   `,
    `   /     |  |   H  |  |     |   |         ||_| |_||   `,
    `  |      |  |   H  |__--------------------| [___] |   `,
    `  | ________|___H__/__|_____/[][]~\\_______|       |   `,
    `  |/ |   |-----------I_____I [][] []  D   |=======|___`,
    `__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__|`,
    ` |/-=|___|=    ||    ||    ||    |_____/~\\___/        `,
    `  \\_/      \\O=====O=====O=====O_/      \\_/            `
  ];

  const cols = Number(env.envVars['COLUMNS'] || 80);
  
  // Clear screen and hide cursor
  streams.stdout.write('\\x1b[2J\\x1b[?25l');

  try {
    for (let pos = cols; pos > -60; pos--) {
      if (env.abortSignal?.aborted) break;
      
      // Move cursor to home
      streams.stdout.write('\\x1b[H');
      
      for (const line of train) {
        if (pos >= 0) {
          const padding = ' '.repeat(pos);
          streams.stdout.writeLine((padding + line).substring(0, cols));
        } else {
          streams.stdout.writeLine(line.substring(-pos).substring(0, cols));
        }
      }
      
      await new Promise(r => setTimeout(r, 40));
    }
  } finally {
    // Show cursor again
    streams.stdout.write('\\x1b[?25h');
  }

  return 0;
};
