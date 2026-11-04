import React, { useState } from 'react';
import { X, Wifi, WifiOff, RefreshCw, LogOut, Shield, Trash2, CheckCircle2, Smartphone, Download } from 'lucide-react';
import { storageService } from '../services/storageService';
import { GoogleAuthUser } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  authUser: GoogleAuthUser | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  onDataReset: () => void;
  isOnline: boolean;
  onToggleOnline?: (status: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  authUser,
  onOpenLogin,
  onLogout,
  onDataReset,
  isOnline,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleManualSync = () => {
    setIsSyncing(true);
    setSyncMessage(null);
    setTimeout(() => {
      const res = storageService.syncPendingToGoogleCalendar();
      setSyncMessage(res.message);
      setIsSyncing(false);
    }, 700);
  };

  const handleReset = () => {
    if (window.confirm('Atenção: Deseja apagar todos os clientes, agendamentos e históricos para começar o app 100% do zero com seus dados reais?')) {
      storageService.clearAllData(true);
      onDataReset();
      setSyncMessage('Todos os dados foram apagados com sucesso! O sistema está pronto para uso a partir do zero.');
    }
  };

  const handleSwitchGoogleAccount = () => {
    onLogout();
    onOpenLogin();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#161619] border border-[#282830] rounded-2xl p-6 shadow-2xl text-white max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div>
            <h2 className="text-xl font-bold text-white">Configurações do Sistema</h2>
            <p className="text-xs text-zinc-400">Offline-First • Google Agenda • Schmitt Detailer</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mt-5 space-y-5">
          {/* 1. Status de Conexão Automático */}
          <div className="p-4 rounded-xl bg-[#1C1C22] border border-[#282830]">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isOnline
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                }`}
              >
                {isOnline ? <Wifi size={20} /> : <WifiOff size={20} />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-white">Status da Conexão</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {isOnline ? (
                    <span className="text-emerald-400 font-semibold">
                      Online • Sincronização em nuvem ativa
                    </span>
                  ) : (
                    <span className="text-amber-400 font-semibold">
                      Offline • Operando localmente (sem bloqueios)
                    </span>
                  )}
                </p>
              </div>
              {isOnline && (
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10B981]" />
              )}
            </div>
            <p className="text-[11px] text-zinc-400 mt-2.5 leading-relaxed">
              O aplicativo é 100% autônomo e funciona perfeitamente sem internet. Quando reconectado, todos os novos agendamentos e alterações são sincronizados automaticamente.
            </p>
          </div>

          {/* 2. Google Account status */}
          <div className="p-4 rounded-xl bg-[#1C1C22] border border-[#282830]">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Shield size={16} className="text-[#E50914]" />
              Conta Google & Agenda
            </h3>

            {authUser ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#111113] border border-zinc-800">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={authUser.photoUrl}
                      alt={authUser.displayName}
                      className="w-8 h-8 rounded-full border border-zinc-700"
                    />
                    <div>
                      <p className="text-xs font-bold text-white">{authUser.displayName}</p>
                      <p className="text-[11px] text-zinc-400">{authUser.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={onLogout}
                    className="p-1.5 text-zinc-400 hover:text-red-400 rounded-lg hover:bg-zinc-800 transition cursor-pointer"
                    title="Desconectar Conta Google"
                  >
                    <LogOut size={16} />
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                  <button
                    onClick={handleManualSync}
                    disabled={isSyncing || !isOnline}
                    className="flex-1 w-full py-2 bg-[#E50914] hover:bg-[#c20811] active:scale-95 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50"
                  >
                    <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
                    <span>Sincronizar Google Agenda</span>
                  </button>
                  <button
                    onClick={handleSwitchGoogleAccount}
                    className="w-full sm:w-auto px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition border border-zinc-700/60"
                    title="Entrar com outro e-mail Google"
                  >
                    <span>Trocar Conta</span>
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-xs text-zinc-400 mb-3">
                  Nenhuma conta Google conectada. Os dados funcionam localmente no banco do app.
                </p>
                <button
                  onClick={onOpenLogin}
                  className="w-full py-2.5 bg-white hover:bg-zinc-100 text-zinc-900 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition shadow-md"
                >
                  <span>Conectar Qualquer Conta Google (Sign-In)</span>
                </button>
              </div>
            )}

            {syncMessage && (
              <div className="mt-3 p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 size={14} className="shrink-0" />
                <span>{syncMessage}</span>
              </div>
            )}
          </div>

          {/* 3. Instalar Aplicativo no Telefone (APK & PWA) */}
          <div className="p-4 rounded-xl bg-[#1C1C22] border border-[#282830]">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#E50914]/15 border border-[#E50914]/30 flex items-center justify-center text-[#E50914] shrink-0">
                <Smartphone size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  Instalar App no Telefone
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    APK PRONTO
                  </span>
                </h3>
                <p className="text-xs text-zinc-400">Poco F5 / Poco F7 / Xiaomi e Android</p>
              </div>
            </div>

            <a
              href="/SchmittDetailer.apk"
              download="SchmittDetailer.apk"
              className="w-full py-3 px-4 bg-gradient-to-r from-[#E50914] to-[#B3060F] hover:brightness-110 active:scale-[0.99] text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-[#E50914]/30 flex items-center justify-center gap-2.5 transition text-center cursor-pointer"
            >
              <Download size={18} />
              <span>BAIXAR ARQUIVO APK ATUALIZADO (6.1 MB)</span>
            </a>

            <div className="mt-3 p-3 bg-[#111114] rounded-xl border border-zinc-800 text-[11px] text-zinc-300 space-y-1.5">
              <p className="font-semibold text-white">Como instalar no seu Poco/Xiaomi:</p>
              <p>1️⃣ Toque no botão vermelho acima para baixar o <code className="text-[#E50914]">SchmittDetailer.apk</code>.</p>
              <p>2️⃣ Abra o app <strong>Gerenciador de Arquivos &gt; Downloads</strong> do seu telefone e toque no arquivo para instalar.</p>
              <p className="text-zinc-400 pt-0.5">
                💡 <em>Dica:</em> Você também pode tocar nos <strong>3 pontinhos do Chrome &gt; &quot;Instalar aplicativo&quot;</strong> para instalar instantaneamente sem precisar autorizar APK externo.
              </p>
            </div>
          </div>

          {/* 4. Reset & Clean local DB */}
          <div className="p-4 rounded-xl bg-red-950/20 border border-red-900/40">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-red-300 flex items-center gap-1.5">
                  <Trash2 size={14} className="text-red-400" />
                  Zerar Todos os Dados (Começar do Zero)
                </h4>
                <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                  Apaga todos os clientes pré-cadastrados, agendamentos e históricos para que a estética comece a registrar apenas dados reais.
                </p>
              </div>
              <button
                onClick={handleReset}
                className="px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white font-bold text-xs rounded-xl cursor-pointer transition shrink-0 active:scale-95 shadow-sm"
              >
                Limpar Banco
              </button>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-zinc-800 text-[11px] text-zinc-500">
            <span>Schmitt Detailer • Modo Operação Real</span>
            <span>v1.1.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};
