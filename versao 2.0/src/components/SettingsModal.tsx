import React, { useState } from 'react';
import { X, Wifi, WifiOff, RefreshCw, LogOut, Shield, CheckCircle2, Bell } from 'lucide-react';
import { storageService } from '../services/storageService';
import * as googleCalendar from '../services/googleCalendar';
import * as reminders from '../services/reminders';
import { GoogleAuthUser } from '../types';
import { BackupSection } from './BackupSection';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  authUser: GoogleAuthUser | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  onDataReset?: () => void;
  isOnline: boolean;
  onToggleOnline?: (status: boolean) => void;
  onSynced?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  authUser,
  onOpenLogin,
  onLogout,
  isOnline,
  onSynced,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [leadMin, setLeadMin] = useState<number>(() => reminders.getLeadMinutes());
  const [dailyOn, setDailyOn] = useState<boolean>(() => reminders.getDailyEnabled());
  const [dailyTime, setDailyTime] = useState<string>(() => reminders.getDailyTime());

  if (!isOpen) return null;

  const handleManualSync = () => {
    setIsSyncing(true);
    setSyncMessage(null);
    storageService.syncPendingToGoogleCalendar().then((res) => {
      setSyncMessage(res.message);
      setIsSyncing(false);
      if (onSynced) onSynced();
    });
  };

  const handleLeadChange = (value: number) => {
    setLeadMin(value);
    reminders.setLeadMinutes(value);
    reminders.scheduleReminders(storageService.getAgendamentos());
  };

  const handleDailyToggle = (on: boolean) => {
    setDailyOn(on);
    reminders.setDailyEnabled(on);
    reminders.scheduleReminders(storageService.getAgendamentos());
  };

  const handleDailyTime = (value: string) => {
    setDailyTime(value);
    if (/^\d{2}:\d{2}$/.test(value)) {
      reminders.setDailyTime(value);
      reminders.scheduleReminders(storageService.getAgendamentos());
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
                    <div className="w-8 h-8 rounded-full border border-zinc-700 bg-[#E50914]/20 text-[#E50914] flex items-center justify-center text-xs font-bold">
                      {(authUser.displayName || authUser.email || '?').charAt(0).toUpperCase()}
                    </div>
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

                <div className="text-[10px] text-zinc-500 space-y-0.5 px-1">
                  <p>
                    Neste celular: {storageService.getClientes().length} cliente(s) •{' '}
                    {storageService.getTiposServico().length} serviço(s) • {storageService.getProdutos().length} insumo(s) •{' '}
                    {storageService.getAgendamentos().length} agendamento(s)
                  </p>
                  {googleCalendar.getLastSync() && (
                    <p>
                      Última sincronização:{' '}
                      {new Date(googleCalendar.getLastSync()!.at).toLocaleString('pt-BR')} —{' '}
                      <span className={googleCalendar.getLastSync()!.ok ? 'text-emerald-400' : 'text-red-400'}>
                        {googleCalendar.getLastSync()!.message}
                      </span>
                    </p>
                  )}
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
                  <span>Conectar Conta Google</span>
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

          {/* Lembretes de atendimento */}
          {reminders.isAvailable() && (
            <div className="p-3.5 rounded-xl bg-[#111113] border border-zinc-800 space-y-3">
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Bell size={13} className="text-[#E50914]" />
                Lembretes de atendimento
              </h3>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1.5">Avisar antes do horário</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {reminders.LEAD_OPTIONS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleLeadChange(m)}
                      className={`py-2 rounded-lg text-xs font-bold border transition cursor-pointer ${
                        leadMin === m
                          ? 'bg-[#E50914] border-[#E50914] text-white'
                          : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-zinc-500'
                      }`}
                    >
                      {m === 0 ? 'Desligado' : `${m} min`}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => reminders.sendTest()}
                className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-bold rounded-xl border border-zinc-700/60 cursor-pointer transition"
              >
                Enviar notificação de teste
              </button>

              <div className="pt-3 border-t border-zinc-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-zinc-200">Resumo do dia, de manhã</p>
                    <p className="text-[10px] text-zinc-500">Lista os atendimentos do dia: horário, cliente e serviço</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDailyToggle(!dailyOn)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                      dailyOn
                        ? 'bg-[#E50914] border-[#E50914] text-white'
                        : 'bg-zinc-900 border-zinc-700 text-zinc-300'
                    }`}
                  >
                    {dailyOn ? 'Ligado' : 'Desligado'}
                  </button>
                </div>

                {dailyOn && (
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-[11px] text-zinc-400">Horário do aviso</label>
                    <input
                      type="time"
                      value={dailyTime}
                      onChange={(e) => handleDailyTime(e.target.value)}
                      className="bg-[#0d0d10] border border-[#2b2b34] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#E50914]"
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => reminders.sendDailyTest(storageService.getAgendamentos())}
                  className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-bold rounded-xl border border-zinc-700/60 cursor-pointer transition"
                >
                  Testar resumo do dia
                </button>
              </div>

              <p className="text-[10px] text-zinc-500 leading-relaxed">
                O aviso antes do horário mostra o cliente, o endereço e o serviço, e só vale para agendamentos
                "Agendado". O resumo do dia não é enviado nos dias sem atendimento. Se um teste não aparecer,
                permita as notificações do app nas configurações do celular.
              </p>
            </div>
          )}

          <BackupSection />

          <div className="pt-2 flex items-center justify-between border-t border-zinc-800 text-[11px] text-zinc-500">
            <span>Schmitt Detailer • Modo Operação Real</span>
            <span>v1.6.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};
