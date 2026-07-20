import type { CommandHandler } from './types';
import { parseArgs } from '../commandParser';

export const ping: CommandHandler = async (args, env, streams) => {
  const { options, positional } = parseArgs(args, ['c']);
  
  if (positional.length === 0) {
    streams.stderr.writeLine('ping: usage error: Destination address required');
    return 1;
  }
  
  const host = positional[0];
  const count = parseInt(options.c || '4', 10);
  
  if (isNaN(count) || count <= 0) {
    streams.stderr.writeLine(`ping: bad number of packets to transmit.`);
    return 1;
  }
  
  // Fake IP for host
  const ip = `142.250.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
  
  streams.stdout.writeLine(`PING ${host} (${ip}) 56(84) bytes of data.`);
  
  let packetsSent = 0;
  let packetsReceived = 0;
  let minTime = Infinity;
  let maxTime = -Infinity;
  let sumTime = 0;
  const startTime = Date.now();
  
  for (let i = 1; i <= count; i++) {
    // Simulate delay
    await new Promise(r => setTimeout(r, 1000));
    
    if (env.abortSignal?.aborted) {
      break;
    }

    const latency = 10 + Math.random() * 70; // 10-80ms
    const timeStr = latency.toFixed(1);
    
    streams.stdout.writeLine(`64 bytes from ${ip}: icmp_seq=${i} ttl=117 time=${timeStr} ms`);
    packetsSent++;
    packetsReceived++;
    minTime = Math.min(minTime, latency);
    maxTime = Math.max(maxTime, latency);
    sumTime += latency;
  }
  
  const totalTime = Date.now() - startTime;
  
  streams.stdout.writeLine(`--- ${host} ping statistics ---`);
  streams.stdout.writeLine(`${packetsSent} packets transmitted, ${packetsReceived} received, 0% packet loss, time ${totalTime}ms`);
  
  if (packetsReceived > 0) {
    const avg = sumTime / packetsReceived;
    const mdev = Math.random() * 2;
    streams.stdout.writeLine(`rtt min/avg/max/mdev = ${minTime.toFixed(3)}/${avg.toFixed(3)}/${maxTime.toFixed(3)}/${mdev.toFixed(3)} ms`);
  }
  
  return 0;
};

export const curl: CommandHandler = async (args, env, streams) => {
  const { flags, options, positional } = parseArgs(args, ['o']);
  
  if (positional.length === 0) {
    streams.stderr.writeLine('curl: try \'curl --help\' for more information');
    return 1;
  }
  
  const url = positional[0];
  const isSilent = flags.s;
  const isHead = flags.I;
  const outputFile = options.o;
  
  let content = '';
  let contentType = 'text/html';
  let status = '200 OK';
  
  if (url.startsWith('file://')) {
    try {
      const { getAbsolutePathAsync, resolveRelativePathAsync } = await import('../../../fs/pathResolver');
      const { readFile } = await import('../../../fs/operations');
      const cwdPath = await getAbsolutePathAsync(env.cwdId);
      
      const targetPathStr = url.replace('file://', '');
      const node = await resolveRelativePathAsync(cwdPath, targetPathStr);
      if (!node) throw new Error();
      
      const absPath = await getAbsolutePathAsync(node.id);
      const blob = await readFile(absPath);
      content = await blob.text();
      contentType = 'text/plain'; // Approximation
    } catch {
      if (!isSilent) streams.stderr.writeLine(`curl: (37) Couldn't open file ${url}`);
      return 37;
    }
  } else {
    // Mock web fetch
    try {
      if (url.includes('google.com')) {
        content = '<!doctype html><html itemscope="" itemtype="http://schema.org/WebPage" lang="en"><head><meta content="text/html; charset=UTF-8" http-equiv="Content-Type"><title>Google</title></head><body>...</body></html>';
      } else {
        content = `<html><head><title>Mock Response for ${url}</title></head><body><h1>Welcome to ${url}</h1><p>This is a simulated response.</p></body></html>`;
      }
    } catch (e: any) {
      if (!isSilent) streams.stderr.writeLine(`curl: (6) Could not resolve host: ${url}`);
      return 6;
    }
  }
  
  if (isHead) {
    const headers = [
      `HTTP/1.1 ${status}`,
      `Content-Type: ${contentType}`,
      `Content-Length: ${content.length}`,
      `Date: ${new Date().toUTCString()}`,
      `Server: mock-server`,
      ``
    ];
    headers.forEach(h => streams.stdout.writeLine(h));
    return 0;
  }
  
  if (outputFile) {
    try {
      const { getAbsolutePathAsync, resolveRelativePathAsync } = await import('../../../fs/pathResolver');
      const { writeFile } = await import('../../../fs/operations');
      const cwdPath = await getAbsolutePathAsync(env.cwdId);
      
      let targetPath = '';
      const node = await resolveRelativePathAsync(cwdPath, outputFile);
      if (node) {
        targetPath = await getAbsolutePathAsync(node.id);
      } else {
        const parts = outputFile.split('/');
        const destName = parts.pop()!;
        const parentPath = parts.join('/') || '.';
        const parentNode = await resolveRelativePathAsync(cwdPath, parentPath);
        if (!parentNode) throw new Error();
        const parentAbs = await getAbsolutePathAsync(parentNode.id);
        targetPath = parentAbs === '/' ? '/' + destName : parentAbs + '/' + destName;
      }
      
      await writeFile(targetPath, content);
      
      if (!isSilent) {
        streams.stderr.writeLine(`  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current`);
        streams.stderr.writeLine(`                                 Dload  Upload   Total   Spent    Left  Speed`);
        streams.stderr.writeLine(`100  ${content.length}  100  ${content.length}    0     0   ${content.length}      0 --:--:-- --:--:-- --:--:--  ${content.length}`);
      }
    } catch {
      if (!isSilent) streams.stderr.writeLine(`curl: (23) Failed writing body`);
      return 23;
    }
  } else {
    streams.stdout.writeLine(content);
  }
  
  return 0;
};

export const wget: CommandHandler = async (args, env, streams) => {
  const { flags, options, positional } = parseArgs(args, ['O']);
  
  if (positional.length === 0) {
    streams.stderr.writeLine('wget: missing URL');
    streams.stderr.writeLine('Usage: wget [OPTION]... [URL]...');
    return 1;
  }
  
  const url = positional[0];
  const isSilent = flags.q;
  
  let outputFile = options.O;
  if (!outputFile) {
    try {
      const parsedUrl = new URL(url);
      const parts = parsedUrl.pathname.split('/');
      outputFile = parts[parts.length - 1] || 'index.html';
    } catch {
      outputFile = 'index.html';
    }
  }
  
  if (!isSilent) {
    const date = new Date().toISOString().replace('T', ' ').slice(0, 19);
    streams.stderr.writeLine(`--${date}--  ${url}`);
    
    // Fake IP resolution
    const domain = url.replace(/https?:\/\//, '').split('/')[0] || 'example.com';
    const fakeIp = `93.184.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    
    streams.stderr.writeLine(`Resolving ${domain}... ${fakeIp}`);
    streams.stderr.writeLine(`Connecting to ${domain}|${fakeIp}|:443... connected.`);
    streams.stderr.writeLine(`HTTP request sent, awaiting response... 200 OK`);
  }
  
  const content = `Mock downloaded content from ${url}`;
  
  try {
    const { getAbsolutePathAsync, resolveRelativePathAsync } = await import('../../../fs/pathResolver');
    const { writeFile } = await import('../../../fs/operations');
    const cwdPath = await getAbsolutePathAsync(env.cwdId);
    
    let targetPath = '';
    const node = await resolveRelativePathAsync(cwdPath, outputFile);
    if (node) {
      targetPath = await getAbsolutePathAsync(node.id);
    } else {
      const parts = outputFile.split('/');
      const destName = parts.pop()!;
      const parentPath = parts.join('/') || '.';
      const parentNode = await resolveRelativePathAsync(cwdPath, parentPath);
      if (!parentNode) throw new Error();
      const parentAbs = await getAbsolutePathAsync(parentNode.id);
      targetPath = parentAbs === '/' ? '/' + destName : parentAbs + '/' + destName;
    }
    
    await writeFile(targetPath, content);
    
    if (!isSilent) {
      streams.stderr.writeLine(`Length: ${content.length} [text/plain]`);
      streams.stderr.writeLine(`Saving to: '${outputFile}'`);
      streams.stderr.writeLine(`${outputFile.padEnd(16)} 100%[===================>] ${content.length}  --.-KB/s    in 0s`);
    }
    
    return 0;
  } catch (e) {
    streams.stderr.writeLine(`${outputFile}: Permission denied`);
    return 1;
  }
};

export const ifconfig: CommandHandler = (_args, _env, streams) => {
  const output = [
    'eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500',
    '        inet 10.0.2.15  netmask 255.255.255.0  broadcast 10.0.2.255',
    '        inet6 fe80::a00:27ff:fe8c:a3f9  prefixlen 64  scopeid 0x20<link>',
    '        ether 08:00:27:8c:a3:f9  txqueuelen 1000  (Ethernet)',
    '        RX packets 123456  bytes 123456789 (123.4 MB)',
    '        RX errors 0  dropped 0  overruns 0  frame 0',
    '        TX packets 654321  bytes 987654321 (987.6 MB)',
    '        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0',
    '',
    'lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536',
    '        inet 127.0.0.1  netmask 255.0.0.0',
    '        inet6 ::1  prefixlen 128  scopeid 0x10<host>',
    '        loop  txqueuelen 1000  (Local Loopback)',
    '        RX packets 1234  bytes 123456 (123.4 KB)',
    '        RX errors 0  dropped 0  overruns 0  frame 0',
    '        TX packets 1234  bytes 123456 (123.4 KB)',
    '        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0'
  ];
  output.forEach(line => streams.stdout.writeLine(line));
  return 0;
};

export const ip: CommandHandler = (args, _env, streams) => {
  const { positional } = parseArgs(args);
  if (positional[0] === 'addr' || positional[0] === 'a') {
    const output = [
      '1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000',
      '    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00',
      '    inet 127.0.0.1/8 scope host lo',
      '       valid_lft forever preferred_lft forever',
      '    inet6 ::1/128 scope host ',
      '       valid_lft forever preferred_lft forever',
      '2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default qlen 1000',
      '    link/ether 08:00:27:8c:a3:f9 brd ff:ff:ff:ff:ff:ff',
      '    inet 10.0.2.15/24 brd 10.0.2.255 scope global dynamic eth0',
      '       valid_lft 86399sec preferred_lft 86399sec',
      '    inet6 fe80::a00:27ff:fe8c:a3f9/64 scope link ',
      '       valid_lft forever preferred_lft forever'
    ];
    output.forEach(line => streams.stdout.writeLine(line));
    return 0;
  }
  streams.stderr.writeLine(`ip: Command "${positional[0] || ''}" is unknown, try "ip addr".`);
  return 1;
};

export const ss: CommandHandler = (_args, _env, streams) => {
  const output = [
    'Netid  State   Recv-Q  Send-Q    Local Address:Port    Peer Address:Port  Process',
    'tcp    LISTEN  0       128             0.0.0.0:22           0.0.0.0:*      ',
    'tcp    LISTEN  0       511             0.0.0.0:80           0.0.0.0:*      ',
    'tcp    LISTEN  0       511             0.0.0.0:443          0.0.0.0:*      ',
    'tcp    LISTEN  0       128             0.0.0.0:3000         0.0.0.0:*      ',
    'tcp    LISTEN  0       128                [::]:22              [::]:*      '
  ];
  output.forEach(line => streams.stdout.writeLine(line));
  return 0;
};

export const netstat: CommandHandler = ss;

export const nslookup: CommandHandler = (args, _env, streams) => {
  if (args.length === 0) {
    streams.stderr.writeLine('nslookup: missing domain');
    return 1;
  }
  
  const domain = args[0];
  const ip = `93.184.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
  
  const output = [
    'Server:         127.0.0.53',
    'Address:        127.0.0.53#53',
    '',
    'Non-authoritative answer:',
    `Name:   ${domain}`,
    `Address: ${ip}`
  ];
  
  output.forEach(line => streams.stdout.writeLine(line));
  return 0;
};

export const dig: CommandHandler = (args, _env, streams) => {
  if (args.length === 0) {
    streams.stderr.writeLine('dig: missing domain');
    return 1;
  }
  
  const domain = args[0];
  const ip = `93.184.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
  
  const output = [
    '',
    `; <<>> DiG 9.16.1-Ubuntu <<>> ${domain}`,
    `;; global options: +cmd`,
    `;; Got answer:`,
    `;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: ${Math.floor(Math.random() * 65535)}`,
    `;; flags: qr rd ra; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 1`,
    '',
    `;; OPT PSEUDOSECTION:`,
    `; EDNS: version: 0, flags:; udp: 65494`,
    `;; QUESTION SECTION:`,
    `;${domain}.                   IN      A`,
    '',
    `;; ANSWER SECTION:`,
    `${domain}.            300     IN      A       ${ip}`,
    '',
    `;; Query time: ${Math.floor(Math.random() * 50)} msec`,
    `;; SERVER: 127.0.0.53#53(127.0.0.53)`,
    `;; WHEN: ${new Date().toString()}`,
    `;; MSG SIZE  rcvd: 56`,
    ''
  ];
  
  output.forEach(line => streams.stdout.writeLine(line));
  return 0;
};

export const ssh: CommandHandler = (args, _env, streams) => {
  if (args.length === 0) {
    streams.stderr.writeLine('usage: ssh [-46AaCfGgKkMNnqsTtVvXxYy] [-B bind_interface]');
    streams.stderr.writeLine('           [-b bind_address] [-c cipher_spec] [-D [bind_address:]port]');
    streams.stderr.writeLine('           [-E log_file] [-e escape_char] [-F configfile] [-I pkcs11]');
    streams.stderr.writeLine('           [-i identity_file] [-J [user@]host[:port]] [-L address]');
    streams.stderr.writeLine('           [-l login_name] [-m mac_spec] [-O ctl_cmd] [-o option] [-p port]');
    streams.stderr.writeLine('           [-Q query_option] [-R address] [-S ctl_path] [-W host:port]');
    streams.stderr.writeLine('           [-w local_tun[:remote_tun]] destination [command]');
    return 1;
  }
  
  // Extract host (could be user@host)
  const dest = args.find(a => !a.startsWith('-')) || 'unknown';
  const host = dest.includes('@') ? dest.split('@')[1] : dest;
  
  streams.stderr.writeLine(`ssh: connect to host ${host} port 22: Connection refused`);
  return 255;
};
