import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const version = packageJson.version;
const tag = `v${version}`;
const repo = 'socalschi/FunnelPeek-Next';

// Retrieve credentials via git credential fill
const gitCredOutput = execSync('git credential fill', {
  input: 'protocol=https\nhost=github.com\n',
  encoding: 'utf-8'
});

const tokenMatch = gitCredOutput.match(/^password=(.+)$/m);
if (!tokenMatch) {
  console.error('GitHub token not found');
  process.exit(1);
}
const token = tokenMatch[1].trim();

const headers = {
  'Authorization': `Bearer ${token}`,
  'User-Agent': 'FunnelPeek-Release-Agent',
  'Accept': 'application/vnd.github+json'
};

const releaseName = `FunnelPeek Next v${version}`;

const releaseBody = `## 🚀 FunnelPeek Next v${version}

Notas de atualização para a versão ${version}.

### 📦 Downloads Disponíveis
* **FunnelPeek Next Setup ${version}.exe**: Instalador oficial para Windows (64-bit).
* **FunnelPeek Next ${version}.exe**: Versão portátil standalone (basta baixar e executar).`;

async function main() {
  console.log(`Verificando release no GitHub para a tag ${tag}...`);
  let release;

  const getRes = await fetch(`https://api.github.com/repos/${repo}/releases/tags/${tag}`, { headers });
  if (getRes.ok) {
    release = await getRes.json();
    console.log(`Release existente encontrada: ID ${release.id}`);
  } else if (getRes.status === 404) {
    console.log(`Criando release ${tag}...`);
    const createRes = await fetch(`https://api.github.com/repos/${repo}/releases`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify({
        tag_name: tag,
        target_commitish: 'main',
        name: releaseName,
        body: releaseBody,
        draft: false,
        prerelease: false
      })
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      console.error('Falha ao criar release:', err);
      process.exit(1);
    }
    release = await createRes.json();
    console.log(`Release criada com sucesso: ID ${release.id}`);
  } else {
    console.error('Erro na API do GitHub:', await getRes.text());
    process.exit(1);
  }

  const assets = [
    `release/FunnelPeek Next Setup ${version}.exe`,
    `release/FunnelPeek Next ${version}.exe`
  ];

  for (const assetPath of assets) {
    if (!fs.existsSync(assetPath)) {
      console.warn(`Arquivo não encontrado: ${assetPath}`);
      continue;
    }

    const fileName = path.basename(assetPath);
    const encodedName = encodeURIComponent(fileName);
    const existingAsset = release.assets?.find(a => a.name === fileName);

    if (existingAsset) {
      console.log(`Asset ${fileName} já existe no release (ID: ${existingAsset.id}). Pulando...`);
      continue;
    }

    const fileSizeMB = (fs.statSync(assetPath).size / (1024 * 1024)).toFixed(2);
    console.log(`Enviando ${fileName} (${fileSizeMB} MB)...`);

    const uploadUrl = `https://uploads.github.com/repos/${repo}/releases/${release.id}/assets?name=${encodedName}`;
    
    execSync(`curl.exe -s -S -X POST -H "Authorization: Bearer ${token}" -H "User-Agent: FunnelPeek-Release-Agent" -H "Accept: application/vnd.github+json" -H "Content-Type: application/octet-stream" --data-binary "@${assetPath}" "${uploadUrl}"`, {
      stdio: 'inherit'
    });

    console.log(`Upload de ${fileName} concluído!`);
  }

  console.log(`\nRelease disponível em: ${release.html_url}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
