import React, { useState } from 'react';
import { X, MessageCircle, Clock, RotateCcw, Check, BellRing } from 'lucide-react';
import { Agendamento } from '../types';
import { storageService } from '../services/storageService';
import * as retornos from '../services/retornos';
import * as reminders from '../services/reminders';

interface RetornosModalProps {
  isOpen: boolean;
  onClose: () => void;
  agendamentos: Agendamento[];
  onChanged?: () => void;
}

const fmtData = (iso: string) => new Date(iso).toLocaleDateString('pt-BR');

export const RetornosModal: React.FC<RetornosModalProps> = ({ isOpen, onClose, agendamentos, onChanged }) => {
  const [versao, setVersao] = useState(0);
  const [mensagem, setMensagemState] = useState<string>(() => retornos.getMensagem());
  const [aviso, setAviso] = useState<string | null>(null);

  if (!isOpen) return null;

  // versao só serve para forçar o recálculo depois de cada ação
  void versao;
  const lista = retornos.listarRetornos(agendamentos);

  const depoisDeAcao = () => {
    setVersao((v) => v + 1);
    try {
      reminders.scheduleReminders(storageService.getAgendamentos());
    } catch {
      /* ignore */
    }
    onChanged?.();
  };

  const handleEnviar = (r: retornos.Retorno) => {
    if (!r.telefone) {
      setAviso(`${r.clienteNome} não tem um celular válido cadastrado. Edite o cliente e informe o número com DDD.`);
      return;
    }
    setAviso(null);
    retornos.marcarEnviado(r.id);
    depoisDeAcao();
    retornos.abrirWhatsApp(r.telefone, retornos.montarMensagem(r, mensagem));
  };

  const handleSalvarMensagem = (texto: string) => {
    setMensagemState(texto);
    retornos.setMensagem(texto);
  };

  const exemplo = lista.paraEnviar[0] || lista.proximos[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#121214] border border-[#27272A] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between p-4 border-b border-[#27272A] bg-[#18181B]">
          <div className="flex items-center gap-2.5">
            <BellRing className="w-5 h-5 text-[#E50914]" />
            <h2 className="text-base font-bold text-white">Lembretes de retorno</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-5 overflow-y-auto">
          {aviso && (
            <div className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">{aviso}</div>
          )}

          {/* Para enviar agora */}
          <section>
            <h3 className="text-sm font-bold text-white mb-2">Para enviar agora ({lista.paraEnviar.length})</h3>
            {lista.paraEnviar.length === 0 ? (
              <p className="text-xs text-zinc-500">
                Nenhum lembrete pendente. Defina "Lembrar o cliente após (dias)" nos seus serviços e conclua atendimentos
                para os lembretes aparecerem aqui.
              </p>
            ) : (
              <div className="space-y-2.5">
                {lista.paraEnviar.map((r) => (
                  <div key={r.id} className="bg-[#18181B] border border-[#27272A] rounded-xl p-3">
                    <div className="text-sm font-bold text-white">{r.clienteNome}</div>
                    <div className="text-xs text-zinc-400 mt-0.5">
                      {r.servico}
                      {r.veiculo ? ` • ${r.veiculo}` : ''}
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">
                      Serviço em {fmtData(r.dataServico)} • há {r.diasDesdeServico} dias (lembrete de {r.dias} dias)
                    </div>
                    {!r.telefone && (
                      <div className="text-[11px] text-amber-400 mt-1">Sem celular válido cadastrado.</div>
                    )}
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      <button
                        onClick={() => handleEnviar(r)}
                        className="col-span-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:brightness-110 transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Enviar no WhatsApp
                      </button>
                      <button
                        onClick={() => {
                          retornos.adiar(r.id, 7);
                          depoisDeAcao();
                        }}
                        className="col-span-2 py-2 rounded-xl text-xs font-bold bg-[#1C1C22] text-zinc-300 hover:bg-[#25252e] transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        Adiar 7 dias
                      </button>
                      <button
                        onClick={() => {
                          retornos.dispensar(r.id);
                          depoisDeAcao();
                        }}
                        className="py-2 rounded-xl text-xs font-bold bg-[#1C1C22] text-zinc-400 hover:bg-[#25252e] transition cursor-pointer"
                      >
                        Dispensar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Próximos */}
          {lista.proximos.length > 0 && (
            <section>
              <h3 className="text-sm font-bold text-white mb-2">Próximos ({lista.proximos.length})</h3>
              <div className="space-y-1.5">
                {lista.proximos.slice(0, 15).map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between bg-[#18181B] border border-[#27272A] rounded-xl px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white truncate">{r.clienteNome}</div>
                      <div className="text-[11px] text-zinc-500 truncate">{r.servico}</div>
                    </div>
                    <div className="text-[11px] text-zinc-400 shrink-0 ml-3">{fmtData(r.dataLembrete)}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Enviados */}
          {lista.enviados.length > 0 && (
            <section>
              <h3 className="text-sm font-bold text-white mb-2">Enviados recentemente</h3>
              <div className="space-y-1.5">
                {lista.enviados.map(({ retorno: r, em }) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between bg-[#18181B] border border-[#27272A] rounded-xl px-3 py-2"
                  >
                    <div className="min-w-0 flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white truncate">{r.clienteNome}</div>
                        <div className="text-[11px] text-zinc-500 truncate">
                          {r.servico} • enviado em {fmtData(em)}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        retornos.desfazer(r.id);
                        depoisDeAcao();
                      }}
                      className="text-[11px] font-bold text-[#E50914] hover:brightness-125 shrink-0 ml-3 cursor-pointer"
                    >
                      Desfazer
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Mensagem */}
          <section>
            <h3 className="text-sm font-bold text-white mb-1">Mensagem do WhatsApp</h3>
            <p className="text-[11px] text-zinc-500 mb-2">
              Campos automáticos: {'{nome}'}, {'{servico}'}, {'{veiculo}'} e {'{dias}'}.
            </p>
            <textarea
              rows={4}
              value={mensagem}
              onChange={(e) => handleSalvarMensagem(e.target.value)}
              className="w-full bg-[#1C1C1F] border border-[#2E2E33] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#E50914] transition"
            />
            <button
              onClick={() => handleSalvarMensagem(retornos.MENSAGEM_PADRAO)}
              className="mt-1.5 text-[11px] font-bold text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Restaurar mensagem padrão
            </button>
            {exemplo && (
              <div className="mt-3 text-xs text-zinc-300 bg-[#18181B] border border-[#27272A] rounded-xl p-3 whitespace-pre-wrap">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Prévia</div>
                {retornos.montarMensagem(exemplo, mensagem)}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
