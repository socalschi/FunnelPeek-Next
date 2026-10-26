$ErrorActionPreference = "Stop"

Write-Host "Obtendo credenciais do GitHub..."
$cred = ("protocol=https`nhost=github.com" | git credential fill)
$token = ($cred | Where-Object { $_ -match "^password=" }) -replace "^password=",""

if (-not $token) {
    Write-Error "Não foi possível obter o token do GitHub pelo Git Credential Manager."
    exit 1
}

$repo = "socalschi/FunnelPeek-Next"
$tag = "v2.0.5"
$releaseName = "FunnelPeek Next v2.0.5 - Melhorias no Flow, Navegação e Layout"

$releaseBody = @"
## 🚀 FunnelPeek Next v2.0.5

Versão 2.0.5 trazendo melhorias essenciais no **Funnel Flow**, nova navegação no modal de inspeção com atalhos de teclado, persistência completa da árvore XML ao carregar fluxos salvos e otimizações de layout.

---

### ✨ O que há de novo na v2.0.5

#### 🔍 Navegação Rápida no Modal de Detalhes
* **Setas Laterais:** Botões flutuantes para avançar ou retroceder diretamente entre elementos da hierarquia.
* **Atalhos de Teclado:** Use as setas ``Esquerda`` / ``Direita`` do teclado para ciclar pelos elementos e ``ESC`` para fechar.
* **Contador de Posição:** Badge ``[X / Total]`` no cabeçalho indicando a posição do elemento selecionado.

#### 🗂️ Funnel Flow & Storyboard
* **Restauração Completa da Estrutura:** Ao carregar um arquivo ``.zip`` salvo, toda a hierarquia XML e a árvore de nós são carregadas e restauradas junto ao preview.
* **Envio para o Funnel Board:** Botão *"Abrir esta tela no funnel board"* transfere a tela do histórico com screenshot e nós para a prancheta de inspeção.
* **Ordenação Cronológica (Crescente / Decrescente):** Novo botão com ícone de setas opostas no canto superior direito para alternar a ordem do histórico (com salvamento da preferência no navegador).
* **Exclusão Individual de Etapas:** Botão individual de lixeira em cada miniatura do carrossel e no painel de detalhes para apagar telas indesejadas.

#### 📐 Layout & Visualização
* **Painel Otimizado:** Detalhes da estrutura e anotações da etapa posicionados lado a lado (50% / 50%).
* **Preview do Dump XML com Rolagem:** Código XML estruturado e indentado com barras de rolagem interna vertical e horizontal independentes.
* **100% Ajustado à Janela:** Eliminação completa da barra de rolagem vertical externa em tela cheia/maximizada.

---

### 📦 Downloads Disponíveis
* **FunnelPeek Next Setup 2.0.5.exe**: Instalador oficial para Windows (64-bit) com atalhos e assistente de instalação.
* **FunnelPeek Next 2.0.5.exe**: Versão portátil standalone (basta baixar e executar).
"@

$headers = @{
    "Authorization" = "Bearer $token"
    "User-Agent" = "FunnelPeek-Release-Agent"
    "Accept" = "application/vnd.github+json"
}

Write-Host "Criando release no GitHub ($tag)..."
$payload = @{
    tag_name = $tag
    target_commitish = "main"
    name = $releaseName
    body = $releaseBody
    draft = $false
    prerelease = $false
} | ConvertTo-Json -Depth 5

$release = Invoke-RestMethod -Uri "https://api.github.com/repos/$repo/releases" -Method Post -Headers $headers -Body $payload -ContentType "application/json; charset=utf-8"
Write-Host "Release criado com sucesso! ID: $($release.id), URL: $($release.html_url)"

$assets = @(
    "release/FunnelPeek Next Setup 2.0.5.exe",
    "release/FunnelPeek Next 2.0.5.exe"
)

foreach ($assetPath in $assets) {
    if (-not (Test-Path $assetPath)) {
        Write-Error "Arquivo $assetPath não encontrado!"
        exit 1
    }
    
    $fileName = [System.IO.Path]::GetFileName($assetPath)
    $fileSize = (Get-Item $assetPath).Length
    $fileSizeMB = [math]::Round($fileSize / 1MB, 2)
    Write-Host "Enviando $fileName ($fileSizeMB MB)..."
    
    $encodedName = [System.Uri]::EscapeDataString($fileName)
    $uploadUri = "https://uploads.github.com/repos/$repo/releases/$($release.id)/assets?name=$encodedName"
    
    # Usar curl.exe para upload binário com barra de progresso estável
    & curl.exe -s -S -X POST `
        -H "Authorization: Bearer $token" `
        -H "User-Agent: FunnelPeek-Release-Agent" `
        -H "Accept: application/vnd.github+json" `
        -H "Content-Type: application/octet-stream" `
        --data-binary "@$assetPath" `
        $uploadUri | Out-Null

    Write-Host "Upload de $fileName concluído!"
}

Write-Host "Processo finalizado com sucesso! Release disponível em: $($release.html_url)"
