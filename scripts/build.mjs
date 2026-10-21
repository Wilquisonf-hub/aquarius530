import fs from 'node:fs/promises';
import path from 'node:path';
import {validate} from './validate.mjs';
const m=await validate();await fs.rm('dist',{recursive:true,force:true});
for(const p of m.files){const dest=path.join('dist',p);await fs.mkdir(path.dirname(dest),{recursive:true});await fs.copyFile(p,dest);}
console.log(`Public build: ${m.files.length} allowlisted files. No directory-wide asset copy.`);
