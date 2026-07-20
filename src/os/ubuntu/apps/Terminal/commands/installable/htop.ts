import { CommandHandler } from '../types';

export const htop: CommandHandler = async (args, env, streams) => {
  const output = [
    \`\\x1b[36m  1  \x1b[0m[\x1b[32m|||||\x1b[31m|||\x1b[0m                                     15.2%]\`,
    \`\\x1b[36m  2  \x1b[0m[\x1b[32m|||\x1b[31m|\x1b[0m                                         8.4%]\`,
    \`\\x1b[36m  3  \x1b[0m[\x1b[32m||||||||\x1b[31m||\x1b[0m                                  22.1%]\`,
    \`\\x1b[36m  4  \x1b[0m[\x1b[32m|\x1b[0m                                            1.1%]\`,
    \`\\x1b[36m Mem \x1b[0m[\x1b[32m||||||||||||||||||||||||||\x1b[33m||||||\x1b[31m|||\x1b[0m  1.84G/15.5G]\`,
    \`\\x1b[36m Swp \x1b[0m[\x1b[0m                                          0K/2.00G]\`,
    '',
    \`  Tasks: \x1b[32m124\x1b[0m, \x1b[33m380\x1b[0m thr; \x1b[32m2\x1b[0m running\`,
    \`  Load average: \x1b[32m1.04 1.15 1.09\x1b[0m\`,
    \`  Uptime: \x1b[32m03:14:15\x1b[0m\`,
    '',
    \`\\x1b[7m    PID USER      PRI  NI  VIRT   RES   SHR S CPU% MEM%   TIME+  Command                            \x1b[0m\`,
    \`   1823 root       20   0 1383M  146M 87244 S  2.6  0.9  0:11.23 /usr/bin/gnome-shell               \`,
    \`   1955 root       20   0 3244M  212M  102M S  1.3  1.3  0:05.41 /usr/lib/xorg/Xorg -core :0 -seat  \`,
    \`    834 systemd    20   0  125M 11216  8332 S  0.0  0.1  0:00.32 /lib/systemd/systemd-journald      \`,
    \`      1 root       20   0  166M 11400  8400 S  0.0  0.1  0:02.14 /sbin/init splah                   \`,
    \`   1200 root       20   0  204K  124K   80K R  0.0  0.0  0:00.01 htop                               \`
  ];

  streams.stdout.write('\\x1b[2J\\x1b[H'); // Clear and home
  output.forEach(line => streams.stdout.writeLine(line));
  
  // Wait for user to press Q or Ctrl+C
  await new Promise<void>((resolve) => {
    const handleAbort = () => resolve();
    if (env.abortSignal) {
      env.abortSignal.addEventListener('abort', handleAbort);
    }
    
    // Check if we can intercept interactive input.
    // If we can't easily wait for a keypress via streams, we just wait a bit or wait for abort.
    // PTY currently doesn't send raw keystrokes to commands unless interactiveRead is called.
    // Since htop is interactive, we will mock it by just waiting for abort.
  });

  return 0;
};
