const { execSync } = require('child_process');

try {
  const stdout = execSync('netstat -ano | findstr :5000').toString();
  const lines = stdout.trim().split('\n');
  const pids = new Set();
  
  lines.forEach(line => {
    const parts = line.trim().split(/\s+/);
    if (parts.length >= 5) {
      pids.add(parts[parts.length - 1]);
    }
  });

  pids.forEach(pid => {
    if (pid !== '0') {
      console.log('Killing PID', pid);
      try {
        execSync(`taskkill /F /PID ${pid}`);
      } catch (e) {
        console.error('Failed to kill PID', pid);
      }
    }
  });
} catch (e) {
  console.log('No process found on port 5000 or error occurred.');
}
