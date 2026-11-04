import React, { useState } from 'react';
import {
  X,
  Smartphone,
  QrCode,
  Copy,
  Check,
  Download,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FolderDown,
} from 'lucide-react';
import JSZip from 'jszip';
import { FLUTTER_PROJECT_FILES } from '../flutterSource';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFlutterCode: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  isOpen,
  onClose,
  onOpenFlutterCode,
}) => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [activeTab, setActiveTab] = useState<'apk_direct' | 'pwa' | 'source'>('apk_direct');

  if (!isOpen) return null;

  const apkUrl = `${window.location.origin}/SchmittDetailer.apk`;

  const handleCopyApkUrl = () => {
    navigator.clipboard.writeText(apkUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();
      FLUTTER_PROJECT_FILES.forEach((f) => {
        zip.file(f.path, f.code);
      });
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'schmitt_detailer_flutter_source.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-[#141418] border border-[#2b2b34] rounded-2xl shadow-2xl flex flex-col text-white overflow-hidden max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#24242e] flex items-center justify-between bg-[#111114]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E50914]/20 border border-[#E50914]/40 flex items-center justify-center text-[#E50914]">
              <Smartphone size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Instalar no seu Poco F7 / Poco F5
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-600 text-white font-bold">
                  APK PRONTO
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Arquivo .apk nativo compilado e assinado para instalação direta
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-6 border-b border-[#24242e] flex items-center gap-6 text-xs font-semibold bg-[#16161a] overflow-x-auto">
          <button
            onClick={() => setActiveTab('apk_direct')}
            className={`py-3 flex items-center gap-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'apk_direct'
                ? 'border-[#E50914] text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Download size={15} className="text-[#E50914]" />
            <span>1. Baixar APK Direto (Recomendado)</span>
          </button>
          <button
            onClick={() => setActiveTab('pwa')}
            className={`py-3 flex items-center gap-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'pwa'
                ? 'border-[#E50914] text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <QrCode size={15} />
            <span>2. Instalar pelo Navegador (Atalho/PWA)</span>
          </button>
          <button
            onClick={() => setActiveTab('source')}
            className={`py-3 flex items-center gap-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'source'
                ? 'border-[#E50914] text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FolderDown size={15} />
            <span>3. Código Flutter (.ZIP)</span>
          </button>
        </div>

        {/* Tab 1: Direct APK Download */}
        {activeTab === 'apk_direct' && (
          <div className="p-6 overflow-y-auto space-y-5">
            {/* Success announcement badge */}
            <div className="p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-2xl flex items-start gap-3">
              <ShieldCheck size={22} className="text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-emerald-200 font-bold block text-sm">
                  APK v1.0.1 Compatível com Poco F7 (Android 14 e 15)!
                </strong>
                <p className="text-xs text-emerald-300/90 mt-1 leading-relaxed">
                  Atualizamos o arquivo com Target SDK 34 e arquitetura compatível com o Poco F7 (Snapdragon / HyperOS). Basta baixar a versão v1.0.1 atualizada abaixo!
                </p>
              </div>
            </div>

            {/* Direct Download Button */}
            <div className="p-5 bg-[#18181e] border border-[#2b2b34] rounded-2xl flex flex-col items-center text-center space-y-3">
              <a
                href="/SchmittDetailer.apk"
                download="SchmittDetailer.apk"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 px-6 bg-gradient-to-r from-[#E50914] via-[#c20811] to-[#990008] hover:brightness-110 active:scale-98 text-white font-extrabold text-sm sm:text-base rounded-xl shadow-xl shadow-[#E50914]/30 flex items-center justify-center gap-3 cursor-pointer transition text-center"
              >
                <Download size={22} className="stroke-[2.5]" />
                <span>BAIXAR SCHMITTDETAILER.APK (v1.0.1)</span>
              </a>

              <div className="w-full flex items-center gap-2 bg-[#0e0e12] p-2 rounded-lg border border-zinc-800 text-xs">
                <span className="text-zinc-400 shrink-0 font-mono text-[11px]">Link direto:</span>
                <input
                  type="text"
                  readOnly
                  value={apkUrl}
                  className="bg-transparent text-[11px] font-mono text-zinc-300 flex-1 outline-none truncate"
                />
                <button
                  onClick={handleCopyApkUrl}
                  className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer transition shrink-0"
                >
                  {copiedUrl ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copiedUrl ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
            </div>

            {/* Crucial Fix for the user's specific screenshot */}
            <div className="p-4 bg-amber-500/15 border-2 border-amber-500/50 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                <AlertTriangle size={18} className="shrink-0 text-amber-400" />
                <span>Apareceu tela preta com códigos (content://media/external...)?</span>
              </div>
              <p className="text-xs text-amber-200/90 leading-relaxed">
                <strong>O arquivo JÁ FOI BAIXADO no seu celular!</strong> O Chrome apenas tentou ler o aplicativo como se fosse uma página de texto em vez de abrir o instalador.
              </p>
              <div className="p-3 bg-[#0d0d10] rounded-xl border border-amber-500/30 text-xs text-zinc-200 space-y-1.5 font-sans">
                <p className="font-bold text-white flex items-center gap-1.5">
                  👉 Como instalar agora mesmo sem precisar baixar de novo:
                </p>
                <p>1️⃣ Feche essa aba do Chrome.</p>
                <p>2️⃣ Abra o aplicativo <strong>&quot;Gerenciador de Arquivos&quot;</strong> (ícone de pasta amarela que já vem no seu Poco).</p>
                <p>3️⃣ Toque na aba <strong>&quot;Downloads&quot;</strong> ou <strong>&quot;APKs&quot;</strong>.</p>
                <p>4️⃣ Toque no arquivo <strong>&quot;SchmittDetailer.apk&quot;</strong>.</p>
                <p>5️⃣ O instalador nativo do Xiaomi (HyperOS) vai abrir e perguntar se deseja <strong>Instalar</strong>!</p>
              </div>
            </div>

            {/* Step-by-Step for Poco / Xiaomi HyperOS / MIUI */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                <Smartphone size={15} className="text-[#E50914]" />
                Passo a Passo para Instalar no Poco F7 / Poco F5 (Xiaomi):
              </h3>

              <div className="space-y-2.5 text-xs text-zinc-300">
                {/* Passo 1 */}
                <div className="p-3 bg-[#18181e] border border-[#2b2b34] rounded-xl flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#E50914] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <strong className="text-white block">Toque no botão vermelho de download acima</strong>
                    <p className="text-zinc-400 mt-0.5">
                      O Chrome iniciará o download de <code className="text-white font-mono">SchmittDetailer.apk</code>.
                    </p>
                  </div>
                </div>

                {/* Passo 2 */}
                <div className="p-3 bg-[#18181e] border border-amber-500/30 rounded-xl flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-black flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <strong className="text-amber-200 block flex items-center gap-1.5">
                      <AlertTriangle size={14} className="text-amber-400" />
                      Se aparecer: &quot;O arquivo pode ser nocivo&quot;
                    </strong>
                    <p className="text-zinc-300 mt-0.5">
                      Toque em <strong>&quot;Fazer o download mesmo assim&quot;</strong>. Esse é o aviso padrão que o Android exibe para qualquer aplicativo baixado fora da Google Play Store.
                    </p>
                  </div>
                </div>

                {/* Passo 3 */}
                <div className="p-3 bg-[#18181e] border border-[#2b2b34] rounded-xl flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#E50914] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <strong className="text-white block">Abra o arquivo baixado</strong>
                    <p className="text-zinc-400 mt-0.5">
                      Toque em <strong>&quot;Abrir&quot;</strong> na notificação do Chrome ou abra pelo app <strong>Gerenciador de Arquivos &gt; Downloads</strong> do seu Poco.
                    </p>
                  </div>
                </div>

                {/* Passo 4 */}
                <div className="p-3 bg-[#18181e] border border-emerald-500/30 rounded-xl flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-500 text-black flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    4
                  </span>
                  <div>
                    <strong className="text-emerald-200 block flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-emerald-400" />
                      Autorize no HyperOS / MIUI e Instale
                    </strong>
                    <p className="text-zinc-300 mt-0.5 leading-relaxed">
                      Se o seu Poco disser <em>&quot;Para sua segurança, seu telefone não tem permissão para instalar apps desconhecidos dessa fonte&quot;</em>:
                      <br />
                      • Toque em <strong>Configurações</strong>
                      <br />
                      • Ative a chave <strong>&quot;Permitir desta fonte&quot;</strong>
                      <br />
                      • Marque a caixinha <em>&quot;Estou ciente dos possíveis riscos&quot;</em> e aguarde os segundos para tocar em <strong>OK</strong>.
                      <br />
                      • Volte e toque em <strong>Instalar</strong>. Pronto! O app Schmitt Detailer aparecerá na tela do seu telefone!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: PWA */}
        {activeTab === 'pwa' && (
          <div className="p-6 overflow-y-auto space-y-4 text-xs text-zinc-300">
            <div className="p-4 bg-[#18181e] border border-[#2b2b34] rounded-xl space-y-2">
              <h4 className="font-bold text-white text-sm">Instalar como Atalho de Aplicativo (WebAPK)</h4>
              <p className="text-zinc-400 leading-relaxed">
                Você mencionou que o Chrome permitiu criar um atalho. Esse atalho funciona como um aplicativo completo com ícone, tela cheia e banco de dados offline!
              </p>
            </div>
            <ol className="space-y-2 list-decimal list-inside bg-[#18181e] border border-[#2b2b34] rounded-xl p-4">
              <li>Abra o link do app no Google Chrome do seu telefone.</li>
              <li>Toque no menu de 3 pontinhos do Chrome (canto superior direito).</li>
              <li>Toque em <strong>&quot;Instalar aplicativo&quot;</strong> ou <strong>&quot;Adicionar à tela inicial&quot;</strong>.</li>
              <li>O ícone estilizado do Schmitt Detailer será adicionado à sua tela inicial.</li>
            </ol>
          </div>
        )}

        {/* Tab 3: Source Code */}
        {activeTab === 'source' && (
          <div className="p-6 overflow-y-auto space-y-4 text-xs text-zinc-300">
            <div className="p-4 bg-[#18181e] border border-[#2b2b34] rounded-xl space-y-2">
              <h4 className="font-bold text-white text-sm">Código Fonte do Flutter</h4>
              <p className="text-zinc-400 leading-relaxed">
                Todos os arquivos Dart com esquema Isar, sincronização Google Calendar e arquitetura Offline-First estão disponíveis para download.
              </p>
              <button
                onClick={handleDownloadZip}
                disabled={isZipping}
                className="mt-2 px-4 py-2 bg-[#E50914] hover:bg-[#c20811] text-white font-bold rounded-xl flex items-center gap-2 cursor-pointer transition disabled:opacity-60"
              >
                <Download size={15} />
                <span>{isZipping ? 'Compactando...' : 'Baixar Código Flutter (.ZIP)'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#24242e] bg-[#111114] flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              onOpenFlutterCode();
            }}
            className="text-xs text-[#E50914] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>Inspecionar Código Flutter Completo</span>
            <ExternalLink size={12} />
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
