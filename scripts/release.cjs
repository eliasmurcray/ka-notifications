const { execSync } = require("child_process");

function colorMessage(message, color, isBold = true) {
  let formattedMessage = message;
  if (isBold) {
    formattedMessage = `\x1b[1m${message}\x1b[0m`;
  }
  console.log(`${color}${formattedMessage}`);
}

function runCommand(command, message, color) {
  try {
    colorMessage(`\n${message}...`, color);
    execSync(command, { stdio: "inherit" });
  } catch (error) {
    colorMessage(`${message} failed`, "\x1b[31m");
    process.exit(1);
  }
}

runCommand("npm run lint", "Linting", "\x1b[32m");
runCommand("npm run format", "Formatting", "\x1b[32m");
runCommand("npm run build", "Building Chrome package", "\x1b[32m");
runCommand("node scripts/firefox-build.cjs", "Building Firefox package", "\x1b[32m");
runCommand("node scripts/zip-extension.cjs", "Zipping packages", "\x1b[32m");
