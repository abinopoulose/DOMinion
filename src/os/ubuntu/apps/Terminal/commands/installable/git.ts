import type { CommandHandler } from '../types';

export const git: CommandHandler = async (args, _env, streams) => {
  if (args.length === 0 || args[0] === 'help' || args[0] === '--help') {
    streams.stdout.writeLine('usage: git [--version] [--help] [-C <path>] [-c <name>=<value>]');
    streams.stdout.writeLine('           [--exec-path[=<path>]] [--html-path] [--man-path] [--info-path]');
    streams.stdout.writeLine('           [-p | --paginate | -P | --no-pager] [--no-replace-objects] [--bare]');
    streams.stdout.writeLine('           [--git-dir=<path>] [--work-tree=<path>] [--namespace=<name>]');
    streams.stdout.writeLine('           [--super-prefix=<path>] [--config-env=<name>=<envvar>]');
    streams.stdout.writeLine('           <command> [<args>]');
    streams.stdout.writeLine('');
    streams.stdout.writeLine('These are common Git commands used in various situations:');
    streams.stdout.writeLine('');
    streams.stdout.writeLine('start a working area (see also: git help tutorial)');
    streams.stdout.writeLine('   clone     Clone a repository into a new directory');
    streams.stdout.writeLine('   init      Create an empty Git repository or reinitialize an existing one');
    streams.stdout.writeLine('');
    streams.stdout.writeLine('work on the current change (see also: git help everyday)');
    streams.stdout.writeLine('   add       Add file contents to the index');
    streams.stdout.writeLine('   mv        Move or rename a file, a directory, or a symlink');
    streams.stdout.writeLine('   restore   Restore working tree files');
    streams.stdout.writeLine('   rm        Remove files from the working tree and from the index');
    streams.stdout.writeLine('');
    streams.stdout.writeLine('examine the history and state (see also: git help revisions)');
    streams.stdout.writeLine('   bisect    Use binary search to find the commit that introduced a bug');
    streams.stdout.writeLine('   diff      Show changes between commits, commit and working tree, etc');
    streams.stdout.writeLine('   grep      Print lines matching a pattern');
    streams.stdout.writeLine('   log       Show commit logs');
    streams.stdout.writeLine('   show      Show various types of objects');
    streams.stdout.writeLine('   status    Show the working tree status');
    return 0;
  }

  const sub = args[0];

  if (sub === 'status') {
    streams.stdout.writeLine('On branch main');
    streams.stdout.writeLine('Your branch is up to date with \'origin/main\'.');
    streams.stdout.writeLine('');
    streams.stdout.writeLine('nothing to commit, working tree clean');
    return 0;
  }

  if (sub === 'init') {
    streams.stdout.writeLine('Initialized empty Git repository in /home/abino/project/.git/');
    return 0;
  }

  if (sub === 'clone') {
    if (args.length < 2) {
      streams.stderr.writeLine('fatal: You must specify a repository to clone.');
      return 128;
    }
    streams.stdout.writeLine(`Cloning into '${args[1].split('/').pop()?.replace('.git', '') || 'repo'}'...`);
    streams.stdout.writeLine('remote: Enumerating objects: 42, done.');
    streams.stdout.writeLine('remote: Counting objects: 100% (42/42), done.');
    streams.stdout.writeLine('remote: Compressing objects: 100% (28/28), done.');
    streams.stdout.writeLine('remote: Total 42 (delta 12), reused 39 (delta 9), pack-reused 0');
    streams.stdout.writeLine('Receiving objects: 100% (42/42), 8.45 KiB | 8.45 MiB/s, done.');
    streams.stdout.writeLine('Resolving deltas: 100% (12/12), done.');
    return 0;
  }

  if (sub === 'add') {
    return 0;
  }

  if (sub === 'commit') {
    streams.stdout.writeLine('[main 4a1b2c3] ' + (args.includes('-m') ? args[args.indexOf('-m') + 1] : 'Update'));
    streams.stdout.writeLine(' 1 file changed, 1 insertion(+), 1 deletion(-)');
    return 0;
  }

  if (sub === 'push') {
    streams.stdout.writeLine('Enumerating objects: 5, done.');
    streams.stdout.writeLine('Counting objects: 100% (5/5), done.');
    streams.stdout.writeLine('Delta compression using up to 16 threads');
    streams.stdout.writeLine('Compressing objects: 100% (2/2), done.');
    streams.stdout.writeLine('Writing objects: 100% (3/3), 284 bytes | 284.00 KiB/s, done.');
    streams.stdout.writeLine('Total 3 (delta 1), reused 0 (delta 0)');
    streams.stdout.writeLine('To https://github.com/mock/repo.git');
    streams.stdout.writeLine('   a1b2c3d..4a1b2c3  main -> main');
    return 0;
  }

  if (sub === '--version' || sub === 'version') {
    streams.stdout.writeLine('git version 2.43.0-1ubuntu7.1');
    return 0;
  }

  streams.stderr.writeLine(`git: '${sub}' is not a git command. See 'git --help'.`);
  return 1;
};
