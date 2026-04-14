// Wrapper to ensure node is in PATH for child processes
const nodeBinDir = '/Users/Alexander/.local/share/fnm/node-versions/v20.20.2/installation/bin';
process.env.PATH = nodeBinDir + ':' + (process.env.PATH || '');

const { spawn } = require('child_process');
const path = require('path');

const nextBin = path.join(__dirname, 'node_modules', '.bin', 'next');
const child = spawn(process.execPath, [nextBin, 'dev', '--webpack', '--port', '3001'], {
  cwd: __dirname,
  stdio: 'inherit',
  env: {
    ...process.env,
    PATH: nodeBinDir + ':' + (process.env.PATH || ''),
  },
});

child.on('exit', (code) => process.exit(code));
