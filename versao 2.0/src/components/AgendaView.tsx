import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronRight,
  Plus,
  RefreshCw,
  Cloud,
  CloudOff,
  Clock,
  Play,
  CheckCircle2,
} from 'lucide-react';
import { Agendamento, StatusAgendamento } from '../types';

interface AgendaViewProps {
  agendamentos: Agendamento[];
  onOpenAgendarServico: () => void;
  onSelectAgendamento: (item: Agendamento) => void;
  onManualSync: () => void;
  isSyncing: boolean;
  isOnline: boolean;
  hasGoogleAuth: boolean;
}

export const AgendaView: React.FC<AgendaViewProps> = ({
  agendamentos,
  onOpenAgendarServico,
  onSelectAgendamento,
  onManualSync,
  isSyncing,
  isOnline,
  hasGoogleAuth,
}) => {
  const [statusFilter, setStatusFilter] = useState<'todos' | StatusAgendamento>('todos');
  const [periodoFilter, setPeriodoFilter] = useState<'todos' | 'hoje' | 'proximos' | 'passados'>('todos');

  // Data local do aparelho (ano-mês-dia)
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const filtered = agendamentos
    .filter((a) => {
      const itemDate = a.horario.split('T')[0];

      // Filtro de status
      if (statusFilter !== 'todos' && a.status !== statusFilter) {
        return false;
      }

      // Filtro de período
      if (periodoFilter === 'hoje') {
        return itemDate === todayStr;
      }
      if (periodoFilter === 'proximos') {
        return itemDate > todayStr;
      }
      if (periodoFilter === 'passados') {
        return itemDate < todayStr;
      }

      return true;
    })
    .sort((a, b) => {
      // Se for passado, ordena do mais recente para o mais antigo; se futuro, do mais próximo para o mais distante
      return periodoFilter === 'passados'
        ? b.horario.localeCompare(a.horario)
        : a.horario.localeCompare(b.horario);
    });

  const unsyncedCount = agendamentos.filter((a) => !a.isSynced).length;

  return (
    <div className="w-full text-white pb-6 select-none">
      {/* Header */}
      <div className="flex items-center justify-between pt-1 pb-3 px-1">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CalendarIcon size={20} className="text-[#E50914]" />
            Agenda Geral
          </h2>
          <p className="text-xs text-zinc-400">
            {agendamentos.length} agendamentos registrados no total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onManualSync}
            disabled={isSyncing || !isOnline || !hasGoogleAuth}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition cursor-pointer disabled:opacity-40"
            title="Sincronizar com Google Agenda"
          >
            <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={onOpenAgendarServico}
            className="px-3 py-2 bg-[#E50914] hover:bg-[#c20811] text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-md shadow-[#E50914]/30 cursor-pointer transition active:scale-95"
          >
            <Plus size={15} />
            <span>Novo</span>
          </button>
        </div>
      </div>

      {/* Sync Banner if any items pending */}
      {unsyncedCount > 0 && (
        <div className="mb-4 p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 flex items-center justify-between text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <CloudOff size={15} className="text-amber-400 shrink-0" />
            <span>
              <strong>{unsyncedCount}</strong> {unsyncedCount === 1 ? 'item salvo' : 'itens salvos'} localmente no Isar.
            </span>
          </div>
          {isOnline && hasGoogleAuth ? (
            <button
              onClick={onManualSync}
              className="font-bold underline text-amber-300 hover:text-white cursor-pointer"
            >
              Sincronizar
            </button>
          ) : (
            <span className="text-[10px] text-zinc-400">Aguardando internet/login</span>
          )}
        </div>
      )}

      {/* Period Filter Tabs (Hoje / Próximos / Passados / Todos) */}
      <div className="flex items-center gap-1.5 p-1 bg-[#141418] border border-[#24242C] rounded-xl mb-3 text-xs font-bold">
        <button
          onClick={() => setPeriodoFilter('hoje')}
          className={`flex-1 py-1.5 rounded-lg transition cursor-pointer text-center ${
            periodoFilter === 'hoje'
              ? 'bg-[#E50914] text-white shadow-sm'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Hoje
        </button>
        <button
          onClick={() => setPeriodoFilter('proximos')}
          className={`flex-1 py-1.5 rounded-lg transition cursor-pointer text-center ${
            periodoFilter === 'proximos'
              ? 'bg-[#E50914] text-white shadow-sm'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Próximos
        </button>
        <button
          onClick={() => setPeriodoFilter('passados')}
          className={`flex-1 py-1.5 rounded-lg transition cursor-pointer text-center ${
            periodoFilter === 'passados'
              ? 'bg-[#E50914] text-white shadow-sm'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Passados
        </button>
        <button
          onClick={() => setPeriodoFilter('todos')}
          className={`flex-1 py-1.5 rounded-lg transition cursor-pointer text-center ${
            periodoFilter === 'todos'
              ? 'bg-zinc-800 text-white'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Todos
        </button>
      </div>

      {/* Status Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2.5 mb-2 no-scrollbar text-[11px]">
        <button
          onClick={() => setStatusFilter('todos')}
          className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition cursor-pointer ${
            statusFilter === 'todos'
              ? 'bg-zinc-200 text-black'
              : 'bg-[#18181E] text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          Todos ({filtered.length})
        </button>
        <button
          onClick={() => setStatusFilter('em_andamento')}
          className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition cursor-pointer ${
            statusFilter === 'em_andamento'
              ? 'bg-[#E50914] text-white'
              : 'bg-[#18181E] text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          ▶ Em andamento
        </button>
        <button
          onClick={() => setStatusFilter('agendado')}
          className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition cursor-pointer ${
            statusFilter === 'agendado'
              ? 'bg-amber-500 text-black'
              : 'bg-[#18181E] text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          🕒 Agendados
        </button>
        <button
          onClick={() => setStatusFilter('concluido')}
          className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition cursor-pointer ${
            statusFilter === 'concluido'
              ? 'bg-emerald-600 text-white'
              : 'bg-[#18181E] text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          ✓ Concluídos
        </button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#141418] border border-dashed border-[#24242C] text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-[#1C1C22] border border-zinc-800 flex items-center justify-center text-zinc-500 mb-3">
              <CalendarIcon size={24} className="text-[#E50914]/70" />
            </div>
            <h4 className="text-sm font-bold text-white">
              {agendamentos.length === 0 ? 'Nenhum agendamento cadastrado' : 'Nenhum agendamento neste filtro'}
            </h4>
            <p className="text-xs text-zinc-400 mt-1 max-w-[260px] leading-relaxed">
              {agendamentos.length === 0
                ? 'A agenda da estética está limpa para novos atendimentos reais. Crie um agendamento para começar.'
                : 'Não há compromissos correspondentes ao filtro selecionado.'}
            </p>
            {agendamentos.length === 0 && (
              <button
                onClick={onOpenAgendarServico}
                className="mt-4 px-4 py-2 bg-[#E50914] hover:bg-[#c20811] text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md shadow-[#E50914]/20 active:scale-95"
              >
                + Criar Primeiro Agendamento
              </button>
            )}
          </div>
        ) : (
          filtered.map((item) => {
            const dateObj = new Date(item.horario);
            const dateFormatted = dateObj.toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short',
            });
            const timeStr = item.horario.includes('T')
              ? item.horario.split('T')[1].substring(0, 5)
              : '09:00';

            return (
              <div
                key={item.id}
                onClick={() => onSelectAgendamento(item)}
                className="p-3.5 rounded-2xl bg-[#141418] hover:bg-[#18181E] border border-[#24242C] hover:border-zinc-700 transition flex items-center justify-between cursor-pointer shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
              >
                <div className="flex items-center">
                  <div className="text-center w-14 shrink-0">
                    <div className="font-['Chakra_Petch',sans-serif] text-[18px] font-bold text-white leading-tight">
                      {timeStr}
                    </div>
                    <div className="text-[10px] text-zinc-400 uppercase font-semibold">
                      {dateFormatted}
                    </div>
                  </div>

                  <div className="w-[3px] h-10 bg-[#E50914] rounded-full mx-3 shrink-0" />

                  <div>
                    <h4 className="font-bold text-sm text-white leading-tight">
                      {item.clienteNome}
                    </h4>
                    <p className="text-xs text-zinc-400 mt-0.5">{item.servicoTipo}</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      {item.status === 'em_andamento' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E50914] text-white">
                          <Play size={9} className="fill-white" /> Em andamento
                        </span>
                      ) : item.status === 'concluido' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-700 text-white">
                          <CheckCircle2 size={10} /> Concluído
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-black">
                          <Clock size={10} /> Agendado
                        </span>
                      )}

                      {item.isSynced ? (
                        <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                          <Cloud size={10} /> Sync
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-400 flex items-center gap-0.5">
                          <CloudOff size={10} /> Local
                        </span>
                      )}
                      {item.horario.split('T')[0] === todayStr ? (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                          Hoje
                        </span>
                      ) : item.horario.split('T')[0] < todayStr ? (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 font-medium">
                          Passado
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-300 font-medium">
                          Próximo
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right flex items-center gap-2">
                  <div className="text-xs font-bold text-[#E50914]">
                    R$ {item.preco.toFixed(0)}
                  </div>
                  <ChevronRight size={18} className="text-zinc-500" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
