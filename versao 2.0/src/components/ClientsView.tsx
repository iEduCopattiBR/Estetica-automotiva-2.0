import React, { useState } from 'react';
import { UserPlus, Search, Phone, Car, ChevronRight, DollarSign, Wrench } from 'lucide-react';
import { Cliente } from '../types';

interface ClientsViewProps {
  clientes: Cliente[];
  onOpenCadastrarCliente: () => void;
  onSelectCliente?: (c: Cliente) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  clientes,
  onOpenCadastrarCliente,
}) => {
  const [search, setSearch] = useState('');

  const filtered = clientes.filter(
    (c) =>
      c.nome.toLowerCase().includes(search.toLowerCase()) ||
      c.veiculo.toLowerCase().includes(search.toLowerCase()) ||
      c.placa.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full text-white pb-6 select-none">
      <div className="flex items-center justify-between pt-1 pb-4 px-1">
        <div>
          <h2 className="text-xl font-bold text-white">Clientes Cadastrados</h2>
          <p className="text-xs text-zinc-400">Total de {clientes.length} clientes na base Isar</p>
        </div>
        <button
          onClick={onOpenCadastrarCliente}
          className="px-3.5 py-2 bg-[#E50914] hover:bg-[#c20811] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-[#E50914]/30 cursor-pointer transition active:scale-95"
        >
          <UserPlus size={14} />
          <span>Novo Cliente</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, modelo ou placa..."
          className="w-full bg-[#141418] border border-[#26262E] rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#E50914]"
        />
      </div>

      {/* List or Empty State */}
      {filtered.length === 0 ? (
        <div className="p-8 rounded-2xl bg-[#141418] border border-dashed border-[#24242C] text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-[#1C1C22] border border-zinc-800 flex items-center justify-center text-zinc-500 mb-3">
            <Car size={24} className="text-[#E50914]/70" />
          </div>
          <h4 className="text-sm font-bold text-white">
            {search ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
          </h4>
          <p className="text-xs text-zinc-400 mt-1 max-w-[260px] leading-relaxed">
            {search
              ? `Não foram encontrados resultados para "${search}".`
              : 'O sistema está zerado para uso real. Cadastre os clientes da sua oficina com modelo e placa do veículo.'}
          </p>
          {!search && (
            <button
              onClick={onOpenCadastrarCliente}
              className="mt-4 px-4 py-2 bg-[#E50914] hover:bg-[#c20811] text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md shadow-[#E50914]/20 active:scale-95"
            >
              + Cadastrar Primeiro Cliente
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((cli) => (
            <div
              key={cli.id}
              className="p-4 rounded-2xl bg-[#141418] border border-[#24242C] hover:border-zinc-700 transition flex items-center justify-between group shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-white group-hover:text-[#E50914] transition">
                    {cli.nome}
                  </h4>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                    {cli.placa}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-zinc-400">
                  <span className="flex items-center gap-1 text-zinc-300">
                    <Car size={13} className="text-[#E50914]" /> {cli.veiculo}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone size={12} className="text-zinc-500" /> {cli.telefone}
                  </span>
                </div>

                <div className="flex items-center gap-3 mt-2 text-[11px] text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Wrench size={11} className="text-zinc-500" /> {cli.servicosRealizados} serviços
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-emerald-400">
                    <DollarSign size={11} /> Total: R$ {cli.totalGasto.toFixed(2)}
                  </span>
                </div>
              </div>

              <ChevronRight size={18} className="text-zinc-500 group-hover:text-white transition shrink-0" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
