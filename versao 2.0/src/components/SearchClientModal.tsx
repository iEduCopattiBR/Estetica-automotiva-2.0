import React, { useState } from 'react';
import { X, Search, Phone, Car, ArrowRight, UserPlus } from 'lucide-react';
import { storageService } from '../services/storageService';
import { Cliente } from '../types';

interface SearchClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectClient?: (client: Cliente) => void;
  onOpenNewClient: () => void;
}

export const SearchClientModal: React.FC<SearchClientModalProps> = ({
  isOpen,
  onClose,
  onSelectClient,
  onOpenNewClient,
}) => {
  const [query, setQuery] = useState('');
  const allClients = storageService.getClientes();

  if (!isOpen) return null;

  const filtered = allClients.filter(
    (c) =>
      c.nome.toLowerCase().includes(query.toLowerCase()) ||
      c.veiculo.toLowerCase().includes(query.toLowerCase()) ||
      c.placa.toLowerCase().includes(query.toLowerCase()) ||
      c.telefone.includes(query)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#161619] border border-[#282830] rounded-2xl p-6 shadow-2xl text-white max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center text-white">
              <Search size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Buscar Cliente</h2>
              <p className="text-xs text-zinc-400">Localize por nome, veículo ou placa</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Input */}
        <div className="mt-4 relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Digite nome, modelo (BMW, Porsche) ou placa..."
            className="w-full bg-[#111113] border border-[#2c2c34] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#E50914]"
          />
        </div>

        {/* Results */}
        <div className="mt-4 overflow-y-auto flex-1 space-y-2 pr-1">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 text-sm">
              <p>Nenhum cliente encontrado com &quot;{query}&quot;.</p>
              <button
                onClick={() => {
                  onClose();
                  onOpenNewClient();
                }}
                className="mt-3 inline-flex items-center gap-1.5 text-xs text-[#E50914] hover:underline"
              >
                <UserPlus size={14} /> Cadastrar Novo Cliente Agora
              </button>
            </div>
          ) : (
            filtered.map((cli) => (
              <div
                key={cli.id}
                onClick={() => {
                  if (onSelectClient) {
                    onSelectClient(cli);
                    onClose();
                  }
                }}
                className="p-3.5 bg-[#1C1C22] hover:bg-[#22222a] border border-[#26262e] rounded-xl transition flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <h4 className="font-bold text-white text-sm group-hover:text-[#E50914] transition">
                    {cli.nome}
                  </h4>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Car size={12} className="text-[#E50914]" /> {cli.veiculo} ({cli.placa})
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone size={12} className="text-zinc-500" /> {cli.telefone}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                    {cli.servicosRealizados} serviços
                  </span>
                  <ArrowRight size={16} className="text-zinc-500 group-hover:text-white transition" />
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-4 border-t border-zinc-800 mt-4 flex items-center justify-between text-xs text-zinc-400">
          <span>{filtered.length} de {allClients.length} cadastrados</span>
          <button
            onClick={() => {
              onClose();
              onOpenNewClient();
            }}
            className="text-[#E50914] font-semibold hover:underline flex items-center gap-1"
          >
            + Cadastrar Novo
          </button>
        </div>
      </div>
    </div>
  );
};
