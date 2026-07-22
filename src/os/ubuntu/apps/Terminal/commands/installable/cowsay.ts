import type { CommandHandler } from '../types';

export const cowsay: CommandHandler = async (args, _env, streams) => {
  let text = args.join(' ');
  if (!text) {
    text = streams.stdin.readAll().trim();
  }
  if (!text) {
    text = "Moo";
  }

  const lines = text.split('\\n');
  let maxLength = 0;
  lines.forEach(l => { if (l.length > maxLength) maxLength = l.length; });
  
  const borderLength = maxLength + 2;
  const topBorder = ' ' + '_'.repeat(borderLength);
  const bottomBorder = ' ' + '-'.repeat(borderLength);
  
  streams.stdout.writeLine(topBorder);
  if (lines.length === 1) {
    streams.stdout.writeLine(`< \${lines[0].padEnd(maxLength, ' ')} >`);
  } else {
    for (let i = 0; i < lines.length; i++) {
      if (i === 0) streams.stdout.writeLine(`/ \${lines[i].padEnd(maxLength, ' ')} \\`);
      else if (i === lines.length - 1) streams.stdout.writeLine(`\\ \${lines[i].padEnd(maxLength, ' ')} /`);
      else streams.stdout.writeLine(`| \${lines[i].padEnd(maxLength, ' ')} |`);
    }
  }
  streams.stdout.writeLine(bottomBorder);
  
  const cow = [
    `        \\   ^__^`,
    `         \\  (oo)\\_______`,
    `            (__)\\       )\\/\\`,
    `                ||----w |`,
    `                ||     ||`
  ];
  
  cow.forEach(line => streams.stdout.writeLine(line));
  return 0;
};
