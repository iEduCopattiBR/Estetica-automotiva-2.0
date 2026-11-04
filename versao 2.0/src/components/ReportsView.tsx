import React from 'react';
import { BarChart3, TrendingUp, Award, ShieldCheck, CheckCircle2, Clock, Calendar, PieChart } from 'lucide-react';
import { Agendamento, Cliente } from '../types';

interface ReportsViewProps {
  agendamentos: Agendamento[];
  clientes: Cliente[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  agendamentos,
  clientes,
}) => {
  const concluidos = agendamentos.filter((a) => a.status === 'concluido');
  const totalRevenue = concluidos.reduce((acc, cur) => acc + (cur.preco || 0), 0);
  const totalRealizados = concluidos.length;
  const totalCadastrados = clientes.length;
  const ticketMedio = totalRealizados > 0 ? totalRevenue / totalRealizados : 0;

  // Dynamic breakdown of actual registered services
  const serviceCounts: Record<string, number> = {};
  agendamentos.forEach((a) => {
    serviceCounts[a.servicoTipo] = (serviceCounts[a.servicoTipo] || 0) + 1;
  });

  const totalServices = agendamentos.length;
  const colors = ['#E50914', '#FFA726', '#42A5F5', '#AB47BC', '#26A69A', '#EC407A'];

  const servicesBreakdown = Object.entries(serviceCounts).map(([nome, count], idx) => ({
    nome,
    count,
    percent: totalServices > 0 ? Math.round((count / totalServices) * 100) : 0,
    cor: colors[idx % colors.length],
  })).sort((a, b) => b.count - a.count);

  return (
    <div className="w-full text-white pb-6 select-none">
      {/* Header */}
      <div className="flex items-center justify-between pt-1 pb-4 px-1">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 size={20} className="text-[#E50914]" />
            Relatórios & Indicadores
          </h2>
          <p className="text-xs text-zinc-400">Métricas em tempo real da oficina (Dados Reais)</p>
        </div>
      </div>

      {/* Top 2 KPI Cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-4 rounded-2xl bg-[#141417] border border-[#24242C] shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
          <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold mb-1">
            <TrendingUp size={14} className="text-emerald-400" />
            Faturamento Real
          </div>
          <div className="font-['Chakra_Petch',sans-serif] text-2xl font-black text-white">
            R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-zinc-400 font-medium">Serviços concluídos</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#141417] border border-[#24242C] shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
          <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold mb-1">
            <Award size={14} className="text-[#E50914]" />
            Ticket Médio
          </div>
          <div className="font-['Chakra_Petch',sans-serif] text-2xl font-black text-[#E50914]">
            R$ {ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-zinc-400">Por serviço finalizado</span>
        </div>
      </div>

      {/* Services breakdown */}
      <div className="p-4 rounded-2xl bg-[#141417] border border-[#24242C] shadow-[0_4px_16px_rgba(0,0,0,0.3)] mb-4">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center justify-between">
          <span>Serviços Mais Realizados</span>
          <span className="text-xs text-zinc-400 font-normal">Volume Real</span>
        </h3>

        {servicesBreakdown.length === 0 ? (
          <div className="py-6 text-center text-zinc-500 text-xs flex flex-col items-center justify-center">
            <PieChart size={28} className="text-zinc-600 mb-2 stroke-[1.5]" />
            <p>Nenhum serviço registrado ainda.</p>
            <p className="text-[11px] text-zinc-600 mt-0.5">
              Conforme novos atendimentos forem cadastrados, o gráfico será calculado automaticamente.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {servicesBreakdown.map((s) => (
              <div key={s.nome}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-zinc-200">{s.nome}</span>
                  <span className="text-zinc-400">{s.count} serviços ({s.percent}%)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${s.percent}%`, backgroundColor: s.cor }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Operational Highlights Card */}
      <div className="p-4 rounded-2xl bg-[#141417] border border-[#24242C] shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck size={18} className="text-[#E50914]" />
          <h3 className="text-sm font-bold text-white">Resumo Operacional da Oficina</h3>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-[#0F0F12] border border-zinc-800/80">
            <div className="flex items-center gap-1.5 text-zinc-400 mb-1">
              <CheckCircle2 size={13} className="text-emerald-400" />
              <span>Serviços Concluídos</span>
            </div>
            <span className="font-['Chakra_Petch',sans-serif] text-lg font-bold text-white">
              {totalRealizados}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#0F0F12] border border-zinc-800/80">
            <div className="flex items-center gap-1.5 text-zinc-400 mb-1">
              <Calendar size={13} className="text-[#E50914]" />
              <span>Clientes na Base</span>
            </div>
            <span className="font-['Chakra_Petch',sans-serif] text-lg font-bold text-white">
              {totalCadastrados}
            </span>
          </div>
        </div>

        <div className="mt-3 p-2.5 rounded-xl bg-[#0F0F12] border border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
          <span className="flex items-center gap-1.5">
            <Clock size={12} className="text-zinc-500" />
            Estado da Base:
          </span>
          <span className="font-semibold text-emerald-400">
            {totalCadastrados === 0 && totalRealizados === 0 ? 'Limpa (Pronta para Iniciar)' : 'Em Operação'}
          </span>
        </div>
      </div>
    </div>
  );
};
