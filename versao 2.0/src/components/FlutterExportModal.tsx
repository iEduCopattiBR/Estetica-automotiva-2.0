import React, { useState } from 'react';
import { X, Download, Copy, Check, FileCode, Terminal, Smartphone, Sparkles, FolderTree } from 'lucide-react';
import JSZip from 'jszip';
import { FLUTTER_PROJECT_FILES, FlutterFile } from '../flutterSource';

interface FlutterExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FlutterExportModal: React.FC<FlutterExportModalProps> = ({ isOpen, onClose }) => {
  const [selectedFile, setSelectedFile] = useState<FlutterFile>(FLUTTER_PROJECT_FILES[1]); // Isar model by default
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [activeTab, setActiveTab] = useState<'code' | 'commands' | 'pocof5'>('code');

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();

      // Readme instructions
      const readmeContent = `# Schmitt Detailer - Aplicativo Android (Flutter / SQLite sqflite)

Aplicativo Android funcional de estética automotiva 100% Offline-First.
Pacote: \`com.schmitt.agenda_clientes\`

## Arquitetura Implementada (Etapa 1: Estrutura e Banco de Dados):
1. **SQLite Nativo (\`sqflite\`):**
   - \`PRAGMA foreign_keys = ON;\` ativado para integridade referencial estrita.
   - 9 tabelas criadas:
     - \`clientes\` (exclusão lógica)
     - \`veiculos\` (FK -> clientes)
     - \`produtos\` (custo por unidade calculado)
     - \`tipos_servico\` (combos com margem estimada)
     - \`tipo_servico_produtos\` (relação N:N)
     - \`historico_servicos\` (cópia estática e imutável dos custos no momento da gravação)
     - \`agendamentos\` (validação de datas/término e status de sincronização)
     - \`sync_queue\` (fila de sincronização idempotente)
     - \`sync_metadata\` (syncToken e metadados Google Calendar)
2. **Modelos:**
   - Com UUID v4, \`toMap()\`, \`fromMap()\` e \`copyWith()\`.
3. **Repositórios:**
   - \`ClienteRepository\` com busca por nome/telefone e detecção de duplicidade.
4. **Design System:**
   - Material 3 Dark Automotivo (#0D0D11, vermelho #E50914).

## Como compilar e executar o APK Release no Android Studio / Terminal:

\`\`\`bash
# 1. Instalar dependências
flutter pub get

# 2. Executar em modo Debug no celular ou emulador
flutter run

# 3. Gerar APK Release oficial assinado
flutter build apk --release
\`\`\`

O APK compilado estará em:
\`build/app/outputs/flutter-apk/app-release.apk\`
`;
      zip.file('README.md', readmeContent);

      // Add all project files into zip structure
      FLUTTER_PROJECT_FILES.forEach((f) => {
        zip.file(f.path, f.code);
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'schmitt_detailer_flutter_etapa1.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Error generating zip:', e);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-5xl h-[88vh] bg-[#141418] border border-[#2b2b34] rounded-2xl shadow-2xl flex flex-col text-white overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-[#24242e] flex flex-wrap items-center justify-between gap-3 bg-[#111114]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E50914]/20 border border-[#E50914]/40 flex items-center justify-center text-[#E50914]">
              <Smartphone size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Projeto Flutter Schmitt Detailer</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#E50914]/20 text-[#E50914] border border-[#E50914]/30">
                  ETAPA 1 • SQLITE OFFLINE
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                com.schmitt.agenda_clientes • SQLite sqflite • 9 Tabelas • Foreign Keys • UUID
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadZip}
              disabled={isZipping}
              className="px-4 py-2 bg-gradient-to-r from-[#E50914] to-[#B80710] hover:brightness-110 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg shadow-[#E50914]/25 flex items-center gap-2 cursor-pointer transition disabled:opacity-60"
            >
              {isZipping ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download size={15} />
              )}
              <span>Baixar Projeto Completo (.ZIP)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="px-6 border-b border-[#24242e] flex items-center gap-6 text-xs font-semibold bg-[#16161a]">
          <button
            onClick={() => setActiveTab('code')}
            className={`py-3 flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'code'
                ? 'border-[#E50914] text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileCode size={15} /> Arquivos & Código Fonte ({FLUTTER_PROJECT_FILES.length})
          </button>
          <button
            onClick={() => setActiveTab('commands')}
            className={`py-3 flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'commands'
                ? 'border-[#E50914] text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Terminal size={15} /> Comandos de Build APK
          </button>
          <button
            onClick={() => setActiveTab('pocof5')}
            className={`py-3 flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'pocof5'
                ? 'border-[#E50914] text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles size={15} className="text-amber-400" /> Otimizações Poco F5 & Google Cloud
          </button>
        </div>

        {/* Tab Body */}
        {activeTab === 'code' && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* File List Sidebar */}
            <div className="w-full md:w-72 bg-[#121215] border-r border-[#24242e] p-3 overflow-y-auto space-y-1 shrink-0">
              <div className="px-2 py-1.5 text-[11px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                <FolderTree size={13} /> Árvore de Arquivos
              </div>
              {FLUTTER_PROJECT_FILES.map((file) => {
                const isSelected = selectedFile.path === file.path;
                return (
                  <button
                    key={file.path}
                    onClick={() => setSelectedFile(file)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs transition flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-[#E50914]/20 border border-[#E50914]/50 text-white font-semibold'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                    }`}
                  >
                    <div className="truncate">
                      <span className="block truncate">{file.name}</span>
                      <span className="text-[10px] text-zinc-500 block truncate">{file.path}</span>
                    </div>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold shrink-0 ${
                        file.category === 'database'
                          ? 'bg-amber-950 text-amber-300'
                          : file.category === 'model'
                          ? 'bg-blue-950 text-blue-300'
                          : file.category === 'repository'
                          ? 'bg-indigo-950 text-indigo-300'
                          : file.category === 'service'
                          ? 'bg-emerald-950 text-emerald-300'
                          : file.category === 'app'
                          ? 'bg-rose-950 text-rose-300'
                          : file.category === 'android'
                          ? 'bg-purple-950 text-purple-300'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {file.category}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Code Content View */}
            <div className="flex-1 flex flex-col bg-[#0d0d10] overflow-hidden">
              <div className="px-4 py-2.5 bg-[#141418] border-b border-[#24242e] flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs text-zinc-300 font-bold">
                    {selectedFile.path}
                  </span>
                  <p className="text-[11px] text-zinc-400">{selectedFile.description}</p>
                </div>
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                >
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>

              <div className="flex-1 overflow-auto p-4 font-mono text-xs text-zinc-300 leading-relaxed selection:bg-[#E50914]/40">
                <pre className="whitespace-pre">
                  <code>{selectedFile.code}</code>
                </pre>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'commands' && (
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Terminal size={18} className="text-[#E50914]" />
                Comandos para Gerar o APK Pronto no Android Studio / Terminal
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Execute estes passos na raiz do projeto Flutter baixado:
              </p>
            </div>

            {/* Step 1 */}
            <div className="bg-[#18181e] border border-[#2b2b34] rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#E50914]">PASSO 1: Obter dependências</span>
                <span className="text-[10px] text-zinc-500">Terminal</span>
              </div>
              <div className="mt-2 bg-[#0d0d10] p-3 rounded-lg font-mono text-xs text-emerald-400 border border-zinc-800">
                flutter pub get
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-[#18181e] border border-[#2b2b34] rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#E50914]">
                  PASSO 2: Instalar Dependências do Projeto
                </span>
                <span className="text-[10px] text-zinc-500">Flutter CLI</span>
              </div>
              <div className="mt-2 bg-[#0d0d10] p-3 rounded-lg font-mono text-xs text-emerald-400 border border-zinc-800">
                flutter pub get
              </div>
              <p className="text-[11px] text-zinc-400 mt-2">
                Baixa os pacotes <code className="text-zinc-200">sqflite</code>, <code className="text-zinc-200">provider</code>, <code className="text-zinc-200">uuid</code> e dependências. O SQLite utiliza a biblioteca nativa do Android C.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-[#18181e] border border-[#2b2b34] rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#E50914]">
                  PASSO 3: Compilar o APK Release Oficial
                </span>
                <span className="text-[10px] text-emerald-400 font-bold">RELEASE</span>
              </div>
              <div className="mt-2 space-y-2">
                <div>
                  <span className="text-[11px] text-zinc-400">
                    Comando direto para gerar o APK Release do pacote com.schmitt.agenda_clientes:
                  </span>
                  <div className="mt-1 bg-[#0d0d10] p-3 rounded-lg font-mono text-xs text-emerald-400 border border-zinc-800">
                    flutter build apk --release
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-[#18181e] border border-[#2b2b34] rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">
                  Localização do arquivo APK gerado:
                </span>
              </div>
              <div className="mt-2 bg-[#0d0d10] p-3 rounded-lg font-mono text-xs text-amber-300 border border-zinc-800">
                build/app/outputs/flutter-apk/app-release.apk
              </div>
              <p className="text-[11px] text-zinc-400 mt-2">
                O arquivo APK release gerado pode ser instalado no Android via cabo USB (<code className="text-zinc-200 font-mono">adb install -r app-release.apk</code>) ou enviado direto pelo WhatsApp/Drive.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'pocof5' && (
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Smartphone size={18} className="text-[#E50914]" />
                Arquitetura do Banco de Dados SQLite (Etapa 1)
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                9 Tabelas relacionais com Foreign Keys, UUID v4 e consultas parametrizadas
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-[#18181e] border border-[#2b2b34] rounded-xl">
                <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  PRAGMA foreign_keys = ON
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Configurado no <code className="text-zinc-200">DatabaseHelper._onConfigure</code>. Assegura que nenhum veículo, agendamento ou histórico fique órfão sem um cliente válido.
                </p>
              </div>

              <div className="p-4 bg-[#18181e] border border-[#2b2b34] rounded-xl">
                <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  Cópia Estática dos Custos
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Na tabela <code className="text-zinc-200">historico_servicos</code>, o custo dos produtos e o JSON dos insumos são gravados como cópia imutável naquele instante exato, protegendo relatórios financeiros passados.
                </p>
              </div>
            </div>

            {/* SHA-1 Fingerprint configuration for Google Sign-In */}
            <div className="bg-[#18181e] border border-[#2b2b34] rounded-xl p-5">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                Configuração do Google Sign-In no Google Cloud Console
              </h4>
              <p className="text-xs text-zinc-400 mt-1">
                Para o Google Sign-In funcionar no seu Poco F5 físico sem erros de autenticação, adicione a chave SHA-1 da sua máquina:
              </p>

              <div className="mt-3 bg-[#0d0d10] p-3 rounded-lg font-mono text-xs text-zinc-300 border border-zinc-800">
                keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
              </div>

              <div className="mt-3 text-xs text-zinc-400 space-y-1">
                <p>1. Copie o valor do <strong>SHA-1</strong> impresso no terminal.</p>
                <p>2. Acesse o <strong>Google Cloud Console</strong> &gt; APIs &amp; Services &gt; Credentials.</p>
                <p>3. Crie um <strong>OAuth 2.0 Client ID</strong> do tipo <strong>Android</strong> com o pacote <code className="text-white">com.schmitt.detailer</code> e cole seu SHA-1.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
