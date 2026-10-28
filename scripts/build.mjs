import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
await fs.rm(path.join(root,'dist'),{recursive:true,force:true});
await fs.cp(path.join(root,'public'),path.join(root,'dist'),{recursive:true});
console.log('Built standalone Fisetin preview into dist. No quiz files changed.');
