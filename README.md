# FunnelPeek Next 🚀

> **FunnelPeek Next** é uma evolução moderna e reconstruída do FunnelPeek original. Um inspetor visual de alta performance para hierarquias de UI Android (`UIAutomator`), sequenciador de funis de telas multi-etapas e gerador de seletores de automação (Appium & Maestro).

---

## ✨ O Que Há de Novo na Versão 2.0 (Modernizada)

* ⚡ **Stack de Alta Performance**: Migrado de *Create React App* legado para **Vite 6 + React 18 + TypeScript + Electron 34**. Inicialização quase instantânea e Hot Module Replacement (HMR).
* 🔍 **Auto-Detecção Inteligente do ADB**: Não é mais necessário procurar manualmente pelo executável toda vez. O app detecta automaticamente instalações em `C:\ADB\adb.exe`, no Android SDK local (`%LOCALAPPDATA%\Android\Sdk\platform-tools`), no `PATH` do sistema e variáveis de ambiente.
* 🤖 **Gerador de Seletores de Automação**:
  * **Appium / Selenium** (`AppiumBy.ID`, `AppiumBy.ACCESSIBILITY_ID`, `AppiumBy.XPATH`)
  * **Maestro YAML** (`- tapOn: id: "..."`)
  * **UIAutomator2 Python** (`d(text="...").click()`)
  * Copie seletores prontos com 1 clique.
* 🔀 **Funnel Flow Storyboard (NOVO)**:
  * Capture sequências completas de telas conectadas (ex: *Login ➔ Catálogo ➔ Checkout ➔ Confirmação*).
  * Adicione anotações e analise fluxos completos de conversão e jornadas de usuário.
* 🎨 **Design Modernizado**:
  * Suporte nativo a **Modo Escuro / Modo Claro**.
  * Ícones modernos com **Lucide React**.
  * Canvas suave com Pan, Zoom centrado no mouse, coordenadas em tempo real, grid overlay e destaque sincronizado com a árvore XML.
* 📱 **Controle Remoto do Aparelho**:
  * Toque no centro de qualquer elemento com 1 clique.
  * Digitação de texto direto no elemento focado.
  * Botões de navegação de hardware (*Voltar*, *Home*, *Enter*, *Backspace*, *Apps Recentes*, *Menu*).
* 📦 **Gerenciador de Aplicativos Aprimorado**:
  * Filtro rápido entre apps de terceiro e apps de sistema.
  * Desinstalação em lote ou individual.
  * Instalação de APKs via seleção de arquivo.

---

## 🛠️ Como Executar

### Pré-requisitos
* **Node.js** v18+ (recomendado v20 ou v24)
* **ADB** (Android Debug Bridge) com a depuração USB ativada no celular Android.

### Modo de Desenvolvimento
```bash
npm install
npm run dev
```

### Build e Execução de Produção
```bash
npm run build
npm start
```

---

## 📂 Estrutura do Projeto

```
h:\Funnel Peek Next\
├── electron/
│   ├── adb-service.ts        # Motor ADB moderno (@devicefarmer/adbkit + CLI fallback)
│   ├── main.ts               # Processo principal do Electron & Handlers IPC
│   └── preload.ts            # Context bridge seguro com TypeScript
├── src/
│   ├── components/
│   │   ├── FunnelBoard.tsx           # Inspetor principal (Canvas + Árvore XML)
│   │   ├── CanvasImageRenderer.tsx   # Renderizador gráfico interativo
│   │   ├── ElementTree.tsx           # Árvore hierárquica rápida com XPath
│   │   ├── ElementDetailsModal.tsx   # Modal de propriedades, seletores e controle remoto
│   │   ├── FunnelFlow.tsx            # Sequenciador visual de jornadas/funis
│   │   ├── ManagePackages.tsx        # Gerenciador e instalador de APKs
│   │   ├── AdbConfigModal.tsx        # Painel de auto-detecção do ADB
│   │   ├── Header.tsx                # Barra de status, tema e conexão
│   │   └── Sidebar.tsx               # Navegação principal
│   ├── utils/
│   │   └── xmlParser.ts      # Parser de hierarquia, avaliador XPath e gerador de seletores
│   ├── types/
│   │   └── index.ts          # Interfaces TypeScript completas
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css             # Tailwind CSS
├── public/                   # Ícones e assets recuperados do binário
├── vite.config.ts            # Configuração Vite com vite-plugin-electron
└── package.json
```

---

## 📄 Créditos e Licença

* Projeto original criado por **Saeed Roshan** (2025).
* Engenharia reversa, recuperação cirúrgica de código-fonte via REA e modernização da arquitetura realizada para **FunnelPeek Next 2.0**.
