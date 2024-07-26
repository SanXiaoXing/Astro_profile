import fs from 'fs/promises';
import path from 'path';

export async function getVersion() {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = await fs.readFile(packageJsonPath, 'utf-8');
  const { version } = JSON.parse(packageJson);
  return version;
}
