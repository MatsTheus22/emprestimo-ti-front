// npm run api:sync — traz o openapi.json publicado pela API e regenera o
// cliente com o orval (ADR-001 §4). Fonte:
//   - OPENAPI_SOURCE (caminho ou URL), se definida;
//   - senão ../back/openapi.json (os dois repositórios lado a lado).
// O CI do front aponta OPENAPI_SOURCE para o raw do GitHub da API.
import { readFile, writeFile } from 'node:fs/promises';

const source = process.env.OPENAPI_SOURCE ?? '../back/openapi.json';

const text = /^https?:\/\//.test(source)
  ? await fetch(source).then((res) => {
      if (!res.ok) throw new Error(`GET ${source} → ${res.status}`);
      return res.text();
    })
  : await readFile(source, 'utf8');

JSON.parse(text); // falha cedo se não for JSON
await writeFile('openapi.json', text);
console.log(`openapi.json atualizado a partir de ${source}`);
