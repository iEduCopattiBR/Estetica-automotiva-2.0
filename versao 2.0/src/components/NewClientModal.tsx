import React, { useState } from 'react';
import { X, UserPlus, Car, Phone, Shield } from 'lucide-react';
import { storageService } from '../services/storageService';
import { Cliente } from '../types';

interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (client: Cliente) => void;
}

export const NewClientModal: React.FC<NewClientModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [veiculo, setVeiculo] = useState('');
  const [placa, setPlaca] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    const newClient = storageService.addCliente({
      nome: nome.trim(),
      telefone: telefone.trim() || '(11) 90000-0000',
      veiculo: veiculo.trim() || 'Veículo não informado',
      placa: placa.trim().toUpperCase() || 'SEM PLACA',
    });

    onSuccess(newClient);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#161619] border border-[#282830] rounded-2xl p-6 shadow-2xl text-white">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#E50914]/20 border border-[#E50914]/40 flex items-center justify-center text-[#E50914]">
              <UserPlus size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Cadastrar Cliente</h2>
              <p className="text-xs text-zinc-400">Banco de Clientes Schmitt Detailer</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Nome Completo *
            </label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Roberto Alencar"
              className="w-full bg-[#111113] border border-[#2b2b34] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#E50914]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
              <Phone size={13} className="text-[#E50914]" />
              Telefone / WhatsApp
            </label>
            <input
              type="text"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="(11) 98765-4321"
              className="w-full bg-[#111113] border border-[#2b2b34] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#E50914]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
              <Car size={13} className="text-[#E50914]" />
              Modelo do Veículo
            </label>
            <input
              type="text"
              value={veiculo}
              onChange={(e) => setVeiculo(e.target.value)}
              placeholder="Ex: Porsche 911 Carrera GTS"
              className="w-full bg-[#111113] border border-[#2b2b34] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#E50914]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
              <Shield size={13} className="text-[#E50914]" />
              Placa do Veículo
            </label>
            <input
              type="text"
              value={placa}
              onChange={(e) => setPlaca(e.target.value)}
              placeholder="Ex: ABC1D23"
              className="w-full bg-[#111113] border border-[#2b2b34] rounded-xl px-3.5 py-2.5 text-sm text-white uppercase focus:outline-none focus:border-[#E50914]"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full h-11 bg-[#E50914] hover:bg-[#c20811] active:scale-[0.99] font-bold text-white rounded-xl shadow-lg shadow-[#E50914]/25 flex items-center justify-center gap-2 cursor-pointer transition"
            >
              Salvar Cliente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
