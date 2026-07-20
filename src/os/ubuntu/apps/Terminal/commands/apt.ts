import { CommandHandler } from './types';
import { PACKAGE_DB, isPackageInstalled, installPackage, removePackage, getInstalledPackages } from '../packageDb';
import { parseArgs } from './utils';

export const apt: CommandHandler = async (args, env, streams) => {
  if (args.length === 0) {
    streams.stderr.writeLine('apt: no command provided');
    return 1;
  }

  const subCommand = args[0];
  const pkgArgs = args.slice(1);
  const isRoot = env.effectiveUser === 'root';

  if (subCommand === 'update') {
    if (!isRoot) {
      streams.stderr.writeLine('E: Could not open lock file /var/lib/apt/lists/lock - open (13: Permission denied)');
      streams.stderr.writeLine('E: Unable to lock directory /var/lib/apt/lists/');
      return 100;
    }

    const lines = [
      'Hit:1 http://archive.ubuntu.com/ubuntu noble InRelease',
      'Hit:2 http://archive.ubuntu.com/ubuntu noble-updates InRelease',
      'Hit:3 http://archive.ubuntu.com/ubuntu noble-security InRelease',
      'Hit:4 http://ppa.launchpadcontent.net/deadsnakes/ppa/ubuntu noble InRelease',
      'Reading package lists... Done',
      'Building dependency tree... Done',
      'Reading state information... Done',
      '4 packages can be upgraded. Run \\'apt list --upgradable\\' to see them.'
    ];

    for (const line of lines) {
      if (env.abortSignal?.aborted) return 130;
      streams.stdout.writeLine(line);
      await new Promise(r => setTimeout(r, 200 + Math.random() * 300));
    }
    return 0;
  }

  if (subCommand === 'install') {
    if (!isRoot) {
      streams.stderr.writeLine('E: Could not open lock file /var/lib/dpkg/lock-frontend - open (13: Permission denied)');
      streams.stderr.writeLine('E: Unable to acquire the dpkg frontend lock (/var/lib/dpkg/lock-frontend), are you root?');
      return 100;
    }

    if (pkgArgs.length === 0) {
      streams.stderr.writeLine('E: No packages found');
      return 100;
    }

    const toInstall = pkgArgs.filter(p => !p.startsWith('-'));
    let found = [];
    let notFound = [];

    for (const p of toInstall) {
      const pkg = PACKAGE_DB.find(dbPkg => dbPkg.name === p);
      if (pkg) found.push(pkg);
      else notFound.push(p);
    }

    if (notFound.length > 0) {
      streams.stderr.writeLine(\`E: Unable to locate package \${notFound[0]}\`);
      return 100;
    }

    const actuallyInstalling = found.filter(p => !isPackageInstalled(p.name));

    streams.stdout.writeLine('Reading package lists... Done');
    streams.stdout.writeLine('Building dependency tree... Done');
    streams.stdout.writeLine('Reading state information... Done');

    if (actuallyInstalling.length === 0) {
      streams.stdout.writeLine(\`\${found[0].name} is already the newest version (\${found[0].version}).\`);
      streams.stdout.writeLine('0 upgraded, 0 newly installed, 0 to remove and 4 not upgraded.');
      return 0;
    }

    streams.stdout.writeLine('The following NEW packages will be installed:');
    streams.stdout.writeLine('  ' + actuallyInstalling.map(p => p.name).join(' '));
    streams.stdout.writeLine(\`0 upgraded, \${actuallyInstalling.length} newly installed, 0 to remove and 4 not upgraded.\`);
    streams.stdout.writeLine('Need to get 36.4 kB of archives.');
    streams.stdout.writeLine('After this operation, 152 kB of additional disk space will be used.');

    for (let i = 0; i < actuallyInstalling.length; i++) {
      if (env.abortSignal?.aborted) return 130;
      const pkg = actuallyInstalling[i];
      streams.stdout.writeLine(\`Get:\${i+1} http://archive.ubuntu.com/ubuntu noble/\${pkg.section.split('/')[0]} amd64 \${pkg.name} all \${pkg.version} [36.4 kB]\`);
      await new Promise(r => setTimeout(r, 400));
    }

    streams.stdout.writeLine('Fetched 36.4 kB in 0s (234 kB/s)');
    
    for (const pkg of actuallyInstalling) {
      if (env.abortSignal?.aborted) return 130;
      streams.stdout.writeLine(\`Selecting previously unselected package \${pkg.name}.\`);
      streams.stdout.writeLine('(Reading database ... 245823 files and directories currently installed.)');
      streams.stdout.writeLine(\`Preparing to unpack .../\${pkg.name}_\${pkg.version}_all.deb ...\`);
      await new Promise(r => setTimeout(r, 300));
      streams.stdout.writeLine(\`Unpacking \${pkg.name} (\${pkg.version}) ...\`);
      await new Promise(r => setTimeout(r, 300));
      streams.stdout.writeLine(\`Setting up \${pkg.name} (\${pkg.version}) ...\`);
      
      installPackage(pkg.name);
      
      // We also need to reload dynamic commands in the current session.
      // Easiest is to emit an event or just do it in index.ts via a global mechanism.
      // In a real scenario, the command registry would be reloaded. We'll handle this in index.ts
    }
    
    streams.stdout.writeLine('Processing triggers for man-db (2.12.0-4build2) ...');
    
    // Quick hack to force dynamic load
    const { loadDynamicCommands } = await import('./index');
    await loadDynamicCommands();

    return 0;
  }

  if (subCommand === 'remove') {
    if (!isRoot) {
      streams.stderr.writeLine('E: Could not open lock file /var/lib/dpkg/lock-frontend - open (13: Permission denied)');
      return 100;
    }

    const toRemove = pkgArgs.filter(p => !p.startsWith('-'));
    if (toRemove.length === 0) return 0;
    
    const target = toRemove[0];
    if (!isPackageInstalled(target)) {
      streams.stderr.writeLine(\`Package '\${target}' is not installed, so not removed\`);
      return 0;
    }

    streams.stdout.writeLine('Reading package lists... Done');
    streams.stdout.writeLine('Building dependency tree... Done');
    streams.stdout.writeLine('Reading state information... Done');
    streams.stdout.writeLine('The following packages will be REMOVED:');
    streams.stdout.writeLine('  ' + target);
    streams.stdout.writeLine('0 upgraded, 0 newly installed, 1 to remove and 4 not upgraded.');
    streams.stdout.writeLine('After this operation, 152 kB disk space will be freed.');
    streams.stdout.writeLine('(Reading database ... 245823 files and directories currently installed.)');
    
    await new Promise(r => setTimeout(r, 500));
    streams.stdout.writeLine(\`Removing \${target} ...\`);
    
    removePackage(target);
    const { loadDynamicCommands } = await import('./index');
    await loadDynamicCommands();

    return 0;
  }

  if (subCommand === 'list') {
    const { flags } = parseArgs(args);
    streams.stdout.writeLine('Listing...');
    
    if (flags.installed) {
      const installed = getInstalledPackages();
      for (const name of installed) {
        const p = PACKAGE_DB.find(db => db.name === name);
        if (p) {
          streams.stdout.writeLine(\`\${p.name}/\${p.section.split('/')[0]} \${p.version} [installed]\`);
        } else {
          streams.stdout.writeLine(\`\${name}/unknown unknown [installed]\`);
        }
      }
    } else if (flags.upgradable) {
      streams.stdout.writeLine('bash/noble-updates 5.2.15-2ubuntu1.1 amd64 [upgradable from: 5.2.15-2ubuntu1]');
      streams.stdout.writeLine('coreutils/noble-updates 9.4-3ubuntu1.1 amd64 [upgradable from: 9.4-3ubuntu1]');
    } else {
      for (const p of PACKAGE_DB) {
        streams.stdout.writeLine(\`\${p.name}/\${p.section.split('/')[0]} \${p.version} \${isPackageInstalled(p.name) ? '[installed]' : ''}\`.trim());
      }
    }
    return 0;
  }
  
  if (subCommand === 'search') {
    const query = pkgArgs[0]?.toLowerCase();
    if (!query) return 0;
    
    for (const p of PACKAGE_DB) {
      if (p.name.includes(query) || p.description.toLowerCase().includes(query)) {
        streams.stdout.writeLine(\`\\x1b[32m\${p.name}\\x1b[0m - \${p.description}\`);
      }
    }
    return 0;
  }

  if (subCommand === 'show') {
    const query = pkgArgs[0];
    if (!query) return 0;
    const p = PACKAGE_DB.find(db => db.name === query);
    if (!p) {
      streams.stderr.writeLine(\`N: Unable to locate package \${query}\`);
      return 100;
    }
    
    streams.stdout.writeLine(\`Package: \${p.name}\`);
    streams.stdout.writeLine(\`Version: \${p.version}\`);
    streams.stdout.writeLine(\`Priority: optional\`);
    streams.stdout.writeLine(\`Section: \${p.section}\`);
    streams.stdout.writeLine(\`Maintainer: Ubuntu Developers\`);
    streams.stdout.writeLine(\`Installed-Size: \${p.installedSize}\`);
    if (p.depends) streams.stdout.writeLine(\`Depends: \${p.depends.join(', ')}\`);
    streams.stdout.writeLine(\`Description: \${p.description.replace('\\n', '\\n ')}\`);
    return 0;
  }
  
  if (subCommand === 'upgrade') {
    streams.stdout.writeLine('Reading package lists... Done');
    streams.stdout.writeLine('Building dependency tree... Done');
    streams.stdout.writeLine('Reading state information... Done');
    streams.stdout.writeLine('Calculating upgrade... Done');
    streams.stdout.writeLine('0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.');
    return 0;
  }

  streams.stderr.writeLine(\`E: Invalid operation \${subCommand}\`);
  return 100;
};

export const dpkg: CommandHandler = (args, env, streams) => {
  const { flags } = parseArgs(args, ['l']);
  
  if (flags.l) {
    streams.stdout.writeLine('Desired=Unknown/Install/Remove/Purge/Hold');
    streams.stdout.writeLine('| Status=Not/Inst/Conf-files/Unpacked/halF-conf/Half-inst/trig-aWait/Trig-pend');
    streams.stdout.writeLine('|/ Err?=(none)/Reinst-required (Status,Err: uppercase=bad)');
    streams.stdout.writeLine('||/ Name           Version      Architecture Description');
    streams.stdout.writeLine('+++-==============-============-============-=================================');
    
    const installed = getInstalledPackages();
    for (const name of installed) {
      const p = PACKAGE_DB.find(db => db.name === name);
      if (p) {
        streams.stdout.writeLine(\`ii  \${p.name.padEnd(14, ' ')} \${p.version.padEnd(12, ' ')} amd64        \${p.description.split('\\n')[0]}\`);
      }
    }
    return 0;
  }
  
  if (args.includes('--configure') && args.includes('-a')) {
    // Silent
    return 0;
  }
  
  streams.stderr.writeLine('dpkg: error: need an action option');
  return 2;
};
