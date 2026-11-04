import React from 'react';
import {
  Settings,
  UserPlus,
  Search,
  Calendar as CalendarIcon,
  Clock,
  ChevronRight,
  Users,
  CheckCircle2,
  Play,
  Cloud,
  CloudOff,
  Wrench,
} from 'lucide-react';
import { Agendamento, Cliente } from '../types';

interface DashboardViewProps {
  agendamentos: Agendamento[];
  clientes: Cliente[];
  onOpenCadastrarCliente: () => void;
  onOpenBuscarCliente: () => void;
  onOpenAgendarServico: () => void;
  onOpenSettings: () => void;
  onOpenVerTodosAgendamentos: () => void;
  onSelectAgendamento: (item: Agendamento) => void;
  onOpenServicos?: () => void;
  isOnline: boolean;
  hasGoogleAuth: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  agendamentos,
  clientes,
  onOpenCadastrarCliente,
  onOpenBuscarCliente,
  onOpenAgendarServico,
  onOpenSettings,
  onOpenVerTodosAgendamentos,
  onSelectAgendamento,
  onOpenServicos,
  isOnline,
  hasGoogleAuth,
}) => {
  // Data local do aparelho (ano-mês-dia) para evitar desvios de fuso horário UTC
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  const todayFormatted = now.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  });

  // Agendamentos ESTRITAMENTE do dia de HOJE:
  // Quando o dia passa (data < todayStr), o agendamento desaparece da tela inicial e fica arquivado na Agenda/Histórico.
  const todayAgendamentos = agendamentos
    .filter((a) => {
      const itemDate = a.horario.split('T')[0];
      return itemDate === todayStr;
    })
    .sort((a, b) => a.horario.localeCompare(b.horario));

  // Próximos agendamentos futuros (após hoje)
  const upcomingAgendamentos = agendamentos
    .filter((a) => {
      const itemDate = a.horario.split('T')[0];
      return itemDate > todayStr && a.status !== 'cancelado';
    })
    .sort((a, b) => a.horario.localeCompare(b.horario));

  const displayAgendamentos = todayAgendamentos;

  // Count real operational metrics
  const totalClientes = clientes.length;
  const totalRealizados = agendamentos.filter((a) => a.status === 'concluido').length;

  return (
    <div className="w-full text-white pb-6 select-none">
      {/* Top Bar with Time & Settings Gear */}
      <div className="flex items-center justify-between pt-1 pb-3 px-2">
        <div className="flex items-center gap-2">
          {/* Offline/Online subtle indicator badge */}
          {!isOnline ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              <CloudOff size={12} />
              OFFLINE (ISAR DB)
            </span>
          ) : hasGoogleAuth ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              <Cloud size={12} />
              Google Agenda Sync
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-zinc-800 text-zinc-300">
              Modo Local
            </span>
          )}
        </div>

        <button
          onClick={onOpenSettings}
          className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800/80 transition cursor-pointer"
          title="Configurações e Rede"
        >
          <Settings size={22} className="stroke-[1.75]" />
        </button>
      </div>

      {/* 1. Header: SCHMITT DETAILER ESTÉTICA AUTOMOTIVA */}
      <div className="text-center my-3 relative">
        {/* Glowing ambient light background behind logo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-16 bg-[#E50914]/15 blur-2xl pointer-events-none rounded-full" />

        <div className="relative inline-flex items-center justify-center gap-3 w-full">
          {/* Left Racing Line */}
          <div className="w-9 h-[2px] bg-gradient-to-r from-transparent via-[#E50914]/70 to-[#E50914]" />

          {/* SCHMITT wordmark */}
          <h1 className="font-['Chakra_Petch',sans-serif] text-[34px] sm:text-[38px] font-black italic tracking-wider text-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.2)]">
            SCHMITT
          </h1>

          {/* Right Racing Line */}
          <div className="w-9 h-[2px] bg-gradient-to-l from-transparent via-[#E50914]/70 to-[#E50914]" />
        </div>

        {/* DETAILER wordmark in Red */}
        <div className="font-['Chakra_Petch',sans-serif] text-[34px] sm:text-[38px] font-black tracking-[0.14em] text-[#E50914] -mt-2 drop-shadow-[0_0_12px_rgba(229,9,20,0.5)]">
          DETAILER
        </div>

        {/* Subtitle */}
        <p className="text-[10px] font-bold tracking-[0.38em] text-[#A1A1AA] uppercase mt-1">
          ESTÉTICA AUTOMOTIVA
        </p>
      </div>

      {/* 2. Quick Actions: Cadastrar Cliente & Buscar Cliente */}
      <div className="grid grid-cols-2 gap-3 mt-7">
        {/* Cadastrar Cliente Card */}
        <button
          onClick={onOpenCadastrarCliente}
          className="group relative p-4 rounded-2xl bg-[#141417] border border-[#E50914]/40 hover:border-[#E50914] transition-all flex items-center justify-between text-left cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.4)] active:scale-[0.98]"
        >
          {/* Subtle red corner glow */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#E50914]/10 to-transparent pointer-events-none" />

          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E50914]/20 to-[#E50914]/5 border border-[#E50914]/50 flex items-center justify-center text-[#E50914] shrink-0">
              <UserPlus size={22} className="stroke-[2.2]" />
            </div>
            <span className="text-sm font-bold text-white leading-tight">
              Cadastrar<br />Cliente
            </span>
          </div>
          <ChevronRight size={18} className="text-zinc-500 group-hover:text-white transition relative z-10" />
        </button>

        {/* Buscar Cliente Card */}
        <button
          onClick={onOpenBuscarCliente}
          className="group relative p-4 rounded-2xl bg-[#141417] border border-[#26262E] hover:border-zinc-500 transition-all flex items-center justify-between text-left cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.4)] active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-200 shrink-0">
              <Search size={22} className="stroke-[2.2]" />
            </div>
            <span className="text-sm font-bold text-white leading-tight">
              Buscar<br />Cliente
            </span>
          </div>
          <ChevronRight size={18} className="text-zinc-500 group-hover:text-white transition" />
        </button>
      </div>

      {/* Serviços & Insumos Fast Access Banner */}
      {onOpenServicos && (
        <button
          onClick={onOpenServicos}
          className="w-full mt-3 p-3.5 rounded-2xl bg-[#141418] border border-[#26262E] hover:border-[#E50914]/50 transition-all flex items-center justify-between text-left cursor-pointer group shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#E50914]/10 border border-[#E50914]/20 flex items-center justify-center text-[#E50914]">
              <Wrench size={18} />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">
                Catálogo de Serviços & Insumos
              </span>
              <span className="text-[11px] text-zinc-400">
                Personalizar valores cobrados, doses e margem de lucro
              </span>
            </div>
          </div>
          <ChevronRight size={16} className="text-zinc-500 group-hover:text-[#E50914] transition" />
        </button>
      )}

      {/* 3. Section: Agendamentos */}
      <div className="mt-7">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <CalendarIcon size={20} className="text-[#E50914]" />
            <h3 className="text-[17px] font-bold text-white tracking-wide">Agendamentos</h3>
          </div>
          <button
            onClick={onOpenVerTodosAgendamentos}
            className="flex items-center gap-0.5 text-xs font-bold text-[#E50914] hover:brightness-125 transition cursor-pointer"
          >
            Ver todos
            <ChevronRight size={15} />
          </button>
        </div>

        {/* Big Highlight Red Button: Agendar um Novo Serviço */}
        <button
          onClick={onOpenAgendarServico}
          className="group w-full h-[54px] rounded-2xl bg-gradient-to-r from-[#E50914] via-[#E50914] to-[#B3060F] hover:brightness-110 active:scale-[0.99] transition-all px-4 flex items-center shadow-[0_6px_22px_rgba(229,9,20,0.38)] cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center text-white">
              <CalendarIcon size={18} className="stroke-[2.5]" />
            </div>
            <span className="text-[15px] font-extrabold text-white tracking-wide">
              Agendar um Novo Serviço
            </span>
          </div>
          <ChevronRight size={20} className="text-white/80 ml-auto group-hover:translate-x-0.5 transition" />
        </button>
      </div>

      {/* 4. Subtitle: Agendamentos do Dia with horizontal separator */}
      <div className="mt-7">
        <div className="flex items-center gap-2.5 mb-3 px-1">
          <Clock size={18} className="text-[#E50914] shrink-0" />
          <h4 className="text-[15px] font-bold text-white whitespace-nowrap tracking-wide">
            Agendamentos de Hoje ({todayFormatted})
          </h4>
          <div className="flex-1 h-[1.5px] bg-gradient-to-r from-[#E50914] via-[#E50914]/40 to-transparent ml-2" />
        </div>

        {/* Cards List or Empty State */}
        {displayAgendamentos.length === 0 ? (
          <div className="p-6 rounded-2xl bg-[#141418] border border-dashed border-[#24242C] text-center flex flex-col items-center justify-center shadow-inner">
            <div className="w-12 h-12 rounded-2xl bg-[#1C1C22] border border-zinc-800 flex items-center justify-center text-zinc-500 mb-3">
              <CalendarIcon size={24} className="text-[#E50914]/70" />
            </div>
            <h5 className="text-sm font-bold text-white">Nenhum agendamento para hoje</h5>
            <p className="text-xs text-zinc-400 mt-1 max-w-[280px] leading-relaxed">
              Os agendamentos de dias anteriores já foram arquivados no histórico da Agenda. A lista do dia está limpa.
            </p>
            <button
              onClick={onOpenAgendarServico}
              className="mt-4 px-4 py-2 bg-[#E50914] hover:bg-[#c20811] text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md shadow-[#E50914]/20 active:scale-95"
            >
              + Agendar Serviço para Hoje
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {displayAgendamentos.map((item) => {
              const timeStr = item.horario.includes('T')
                ? item.horario.split('T')[1].substring(0, 5)
                : '09:00';

              return (
                <div
                  key={item.id}
                  onClick={() => onSelectAgendamento(item)}
                  className="group relative p-3.5 sm:p-4 rounded-2xl bg-[#141418] hover:bg-[#18181E] border border-[#24242C] hover:border-zinc-700 transition-all flex items-center justify-between cursor-pointer shadow-[0_4px_16px_rgba(0,0,0,0.35)] active:scale-[0.99]"
                >
                  {/* Left side: Time */}
                  <div className="flex items-center">
                    <div className="font-['Chakra_Petch',sans-serif] text-[20px] font-bold text-white tracking-tight w-14 shrink-0">
                      {timeStr}
                    </div>

                    {/* Vertical red bar divider */}
                    <div className="w-[3px] h-10 bg-[#E50914] rounded-full mx-3 shrink-0 shadow-[0_0_8px_rgba(229,9,20,0.6)]" />

                    {/* Center: Client Name, Service, Status Tag */}
                    <div className="flex flex-col justify-center min-w-0 pr-2">
                      <span className="text-[15px] font-bold text-white truncate leading-tight">
                        {item.clienteNome}
                      </span>
                      <span className="text-xs text-[#9CA3AF] truncate mt-0.5">
                        {item.servicoTipo}
                      </span>

                      {/* Status Pill Tag */}
                      <div className="mt-2 flex items-center">
                        {item.status === 'em_andamento' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E50914] text-white shadow-[0_0_10px_rgba(229,9,20,0.4)]">
                            <Play size={10} className="fill-white" />
                            Em andamento
                          </span>
                        ) : item.status === 'concluido' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#2E7D32] text-white">
                            <CheckCircle2 size={11} />
                            Concluído
                          </span>
                        ) : item.status === 'cancelado' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-zinc-800 text-zinc-400">
                            Cancelado
                          </span>
                        ) : (
                          /* Agendado */
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FFA726] text-black shadow-sm">
                            <Clock size={11} className="stroke-[2.5]" />
                            Agendado
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right chevron */}
                  <ChevronRight
                    size={20}
                    className="text-zinc-500 group-hover:text-white transition shrink-0 ml-1"
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Próximos compromissos futuros (para os próximos dias) */}
        {upcomingAgendamentos.length > 0 && (
          <div className="mt-4 p-3.5 rounded-2xl bg-[#141418] border border-[#24242C] space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-zinc-400">
              <span className="flex items-center gap-1.5 text-zinc-300">
                <CalendarIcon size={14} className="text-[#E50914]" />
                Próximos Dias ({upcomingAgendamentos.length} agendado{upcomingAgendamentos.length > 1 ? 's' : ''})
              </span>
              <button
                onClick={onOpenVerTodosAgendamentos}
                className="text-[#E50914] hover:underline cursor-pointer flex items-center gap-0.5"
              >
                Ver todos <ChevronRight size={13} />
              </button>
            </div>
            <div className="space-y-1.5 pt-0.5">
              {upcomingAgendamentos.slice(0, 2).map((item) => {
                const dateParts = item.horario.split('T')[0].split('-');
                const formattedDate = `${dateParts[2]}/${dateParts[1]}`;
                const timeStr = item.horario.includes('T')
                  ? item.horario.split('T')[1].substring(0, 5)
                  : '09:00';
                return (
                  <div
                    key={item.id}
                    onClick={() => onSelectAgendamento(item)}
                    className="p-2.5 rounded-xl bg-[#0F0F12] border border-zinc-800/80 hover:border-zinc-700 flex items-center justify-between cursor-pointer transition text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[11px] shrink-0">
                        {formattedDate} às {timeStr}
                      </span>
                      <span className="font-bold text-white truncate">{item.clienteNome}</span>
                      <span className="text-zinc-400 text-[11px] truncate hidden sm:inline">
                        • {item.servicoTipo}
                      </span>
                    </div>
                    <ChevronRight size={14} className="text-zinc-500 shrink-0" />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 5. Metrics Counters Row: Clientes Cadastrados & Serviços Realizados */}
      <div className="grid grid-cols-2 gap-3 mt-7">
        {/* Clientes Cadastrados */}
        <div className="p-4 rounded-2xl bg-[#141417] border border-[#24242C] flex items-center gap-3.5 shadow-[0_4px_16px_rgba(0,0,0,0.35)]">
          <div className="w-11 h-11 rounded-xl bg-[#E50914]/15 border border-[#E50914]/30 flex items-center justify-center text-[#E50914] shrink-0">
            <Users size={22} className="stroke-[2.3]" />
          </div>
          <div>
            <div className="font-['Chakra_Petch',sans-serif] text-[22px] font-extrabold text-white leading-none">
              {totalClientes}
            </div>
            <div className="text-[11px] text-[#9CA3AF] mt-1 leading-tight font-medium">
              Clientes Cadastrados
            </div>
          </div>
        </div>

        {/* Serviços Realizados */}
        <div className="p-4 rounded-2xl bg-[#141417] border border-[#24242C] flex items-center gap-3.5 shadow-[0_4px_16px_rgba(0,0,0,0.35)]">
          <div className="w-11 h-11 rounded-xl bg-[#E50914]/15 border border-[#E50914]/30 flex items-center justify-center text-[#E50914] shrink-0">
            <CheckCircle2 size={22} className="stroke-[2.3]" />
          </div>
          <div>
            <div className="font-['Chakra_Petch',sans-serif] text-[22px] font-extrabold text-white leading-none">
              {totalRealizados}
            </div>
            <div className="text-[11px] text-[#9CA3AF] mt-1 leading-tight font-medium">
              Serviços Realizados
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
