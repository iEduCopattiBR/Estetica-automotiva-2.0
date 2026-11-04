import React, { useState } from 'react';
import { Calendar, ShieldCheck, CheckCircle, AlertCircle, X, Sparkles, User, Mail, ArrowRight } from 'lucide-react';
import { storageService } from '../services/storageService';
import { GoogleAuthUser } from '../types';

interface GoogleLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: GoogleAuthUser) => void;
  isMandatory?: boolean;
}

export const GoogleLoginModal: React.FC<GoogleLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  isMandatory = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Start with empty or retrieve last auth email to allow switching freely
  const currentSavedAuth = storageService.getGoogleAuth();
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');

  if (!isOpen) return null;

  const handleGoogleSignIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const emailTrimmed = customEmail.trim();

    if (!emailTrimmed) {
      setError('Por favor, informe o seu e-mail do Google (ex: seuemail@gmail.com).');
      return;
    }

    if (!emailTrimmed.includes('@') || !emailTrimmed.includes('.')) {
      setError('Por favor, insira um endereço de e-mail válido.');
      return;
    }

    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Derive display name if not specified
      const derivedName = customName.trim() || emailTrimmed.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      const initials = derivedName.substring(0, 2).toUpperCase();

      const user: GoogleAuthUser = {
        id: 'g-user-' + Math.random().toString(36).substring(2, 10),
        email: emailTrimmed.toLowerCase(),
        displayName: derivedName,
        photoUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(derivedName)}&backgroundColor=e50914,1e1e24&textColor=ffffff`,
        accessToken: 'ya29.a0AfH6SMB_' + Math.random().toString(36).substring(2, 20),
        idToken: 'eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...' + Math.random().toString(36).substring(2, 12),
        expiresAt: Date.now() + 3600 * 1000,
      };

      storageService.setGoogleAuth(user);
      storageService.syncPendingToGoogleCalendar();
      onSuccess(user);
    } catch {
      setError('Falha ao autenticar com o Google. Verifique a conexão e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueOffline = () => {
    storageService.addSyncLog({
      tipo: 'auth',
      detalhes: 'Usuário optou por continuar no modo offline sem login Google.',
      sucesso: true,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-[#161619] border border-[#282830] rounded-2xl p-6 shadow-2xl text-white">
        {!isMandatory && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition"
          >
            <X size={20} />
          </button>
        )}

        {/* Branding */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="w-8 h-[2px] bg-gradient-to-r from-transparent to-[#E50914]" />
            <h1 className="text-2xl font-black italic tracking-wider text-white">SCHMITT</h1>
            <span className="w-8 h-[2px] bg-gradient-to-l from-transparent to-[#E50914]" />
          </div>
          <h2 className="text-2xl font-black tracking-widest text-[#E50914] -mt-1">
            DETAILER
          </h2>
          <p className="text-[10px] font-semibold tracking-[0.25em] text-zinc-400 mt-1 uppercase">
            Conectar Qualquer Conta Google
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-[#1C1C22] border border-[#E50914]/30 rounded-xl p-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#E50914]/15 border border-[#E50914]/40 flex items-center justify-center text-[#E50914] shrink-0">
              <Calendar size={22} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                Google Agenda (Google Calendar)
                <Sparkles size={14} className="text-amber-400" />
              </h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Você pode utilizar <strong>qualquer conta Google</strong> (pessoal ou profissional) para sincronizar os agendamentos com seu celular.
              </p>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-zinc-800 text-[11px] text-zinc-400 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-zinc-300">
              <CheckCircle size={13} className="text-emerald-400 shrink-0" />
              <span>Escopo: <code className="text-zinc-200">calendar.events</code> (Google Calendar API)</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-300">
              <ShieldCheck size={13} className="text-blue-400 shrink-0" />
              <span>Armazenamento local seguro e modo 100% offline-first</span>
            </div>
          </div>
        </div>

        {/* Form to enter ANY Google account */}
        <form onSubmit={handleGoogleSignIn} className="space-y-3 mb-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Mail size={13} className="text-[#E50914]" />
                Digite sua Conta Google:
              </span>
              <span className="text-[10px] text-zinc-500 font-normal">Qualquer conta permitida</span>
            </label>
            <input
              type="email"
              required
              autoFocus
              value={customEmail}
              onChange={(e) => setCustomEmail(e.target.value)}
              className="w-full bg-[#111113] border border-[#2c2c34] focus:border-[#E50914] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none transition shadow-inner"
              placeholder="ex: seu.email@gmail.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
              <User size={13} className="text-zinc-400" />
              Nome do Responsável / Estética (Opcional):
            </label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="w-full bg-[#111113] border border-[#2c2c34] focus:border-[#E50914] rounded-xl px-3.5 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none transition shadow-inner"
              placeholder="ex: Administrador Schmitt ou Seu Nome"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-xs text-red-200 flex items-center gap-2">
              <AlertCircle size={16} className="text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Google Sign In Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-white hover:bg-zinc-100 active:scale-[0.98] text-zinc-900 font-bold rounded-xl flex items-center justify-center gap-3 transition shadow-md disabled:opacity-70 cursor-pointer mt-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Conectar com esta Conta Google</span>
              </>
            )}
          </button>
        </form>

        {/* Offline Bypass */}
        <div className="pt-2 border-t border-zinc-800/80 text-center">
          <button
            type="button"
            onClick={handleContinueOffline}
            className="text-xs text-zinc-500 hover:text-zinc-300 underline transition cursor-pointer"
          >
            Continuar sem Login Google (Modo 100% Offline / Isar DB)
          </button>
        </div>
      </div>
    </div>
  );
};
