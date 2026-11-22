// Ember Pact — the make.fun entrypoint: copy the game and its screenshots
// into the output directory and write the dossier the judges read.
// Node 22 standard library only; no build step, no network.

import { cp, mkdir, readdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoDir = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

/** The entries of a directory, sorted, so two runs write identical bytes. */
async function sortedEntries(dir) {
  const names = await readdir(dir);
  return names.sort();
}

async function main() {
  // Fail fast when the screenshots are missing: a dossier without them
  // would be rejected, and the error should say so before any copying.
  const shotNames = await sortedEntries(join(repoDir, 'screenshots'));
  if (shotNames.length < 3 || shotNames.length > 4) {
    throw new Error(
      `expected 3-4 screenshots in screenshots/, found ${shotNames.length}`,
    );
  }
  const gameNames = await sortedEntries(join(repoDir, 'game'));

  await mkdir(join(outDir, 'game'), { recursive: true });
  await mkdir(join(outDir, 'screenshots'), { recursive: true });

  // The game, file for file, in sorted order for a deterministic dossier.
  for (const name of gameNames) {
    await cp(join(repoDir, 'game', name), join(outDir, 'game', name), {
      recursive: true,
      dereference: true,
    });
  }
  for (const name of shotNames) {
    await cp(join(repoDir, 'screenshots', name), join(outDir, 'screenshots', name));
  }

  const dossier = buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
  });
  await writeFile(join(outDir, 'dossier.json'), dossier);
  console.log(
    `Ember Pact: ${gameNames.length} game entries + ${shotNames.length} screenshots -> ${outDir}/dossier.json (${dossier.length} bytes)`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
