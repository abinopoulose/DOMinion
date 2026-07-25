const fs = require('fs');

fetch('https://raw.githubusercontent.com/Gogh-Co/Gogh/master/data/themes.json')
  .then(r => r.json())
  .then(themes => {
    let tsContent = `export interface TerminalTheme {
  name: string;
  background: string;
  foreground: string;
  chrome: string;
  chromeForeground: string;
  cursor: string;
  selectionBackground: string;
  black: string;
  red: string;
  green: string;
  yellow: string;
  blue: string;
  magenta: string;
  cyan: string;
  white: string;
  brightBlack: string;
  brightRed: string;
  brightGreen: string;
  brightYellow: string;
  brightBlue: string;
  brightMagenta: string;
  brightCyan: string;
  brightWhite: string;
}

export const themes: Record<string, TerminalTheme> = {
`;
    // We want to keep the original ones? Actually, if Gogh has a lot, we can just use Gogh + our original ones.
    // Let's just generate the top 200 Gogh themes to avoid making the file too insanely large, or we can add all ~300.
    // Let's add all of them!
    
    // Convert name to camelCase key
    const toCamel = (str) => {
      return str.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase()).replace(/[^a-zA-Z0-9]/g, '');
    };

    const generateChrome = (bgStr, isLight) => {
       // Just a simple approximation. In real UI, window backgrounds might be slightly darker/lighter.
       return bgStr;
    }

    const uniqueKeys = new Set();

    themes.forEach(t => {
      let key = toCamel(t.name);
      // fallback if key is empty
      if (!key) return;
      if (key.match(/^[0-9]/)) key = 'theme' + key;
      if (uniqueKeys.has(key)) return;
      uniqueKeys.add(key);

      tsContent += `  '${key}': {
    name: ${JSON.stringify(t.name)},
    background: '${t.background}',
    foreground: '${t.foreground}',
    chrome: '${t.background}',
    chromeForeground: '${t.foreground}',
    cursor: '${t.cursor}',
    selectionBackground: 'rgba(255, 255, 255, 0.3)',
    black: '${t.color_01}',
    red: '${t.color_02}',
    green: '${t.color_03}',
    yellow: '${t.color_04}',
    blue: '${t.color_05}',
    magenta: '${t.color_06}',
    cyan: '${t.color_07}',
    white: '${t.color_08}',
    brightBlack: '${t.color_09}',
    brightRed: '${t.color_10}',
    brightGreen: '${t.color_11}',
    brightYellow: '${t.color_12}',
    brightBlue: '${t.color_13}',
    brightMagenta: '${t.color_14}',
    brightCyan: '${t.color_15}',
    brightWhite: '${t.color_16}',
  },
`;
    });

    tsContent += `};\n`;
    fs.writeFileSync('src/os/ubuntu/apps/Terminal/themes.ts', tsContent);
    console.log('Themes generated!');
  });
