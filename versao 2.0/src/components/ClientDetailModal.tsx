import React, { useState } from 'react';
import { X, User, Car, Phone, Shield, MapPin, Trash2 } from 'lucide-react';
import { storageService } from '../services/storageService';
import { Cliente } from '../types';

interface ClientDetailModalProps {
  cliente: Cliente | null;
  onClose: () => void;
  onSaved: (client: Cliente) => void;
  onDeleted: (client: Cliente) => void;
}

const inputClass =
  'w-full bg-[#111113] border border-[#2b2b34] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#E50914]';

export const ClientDetailModal: React.FC<ClientDetailModalProps> = ({
  cliente,
  onClose,
  onSaved,
  onDeleted,
}) => {
  if (!cliente) return null;
  // key={cliente.id} reinicia o formulário ao abrir outro cliente
  return (
    <ClientForm
      key={cliente.id}
      cliente={cliente}
      onClose={onClose}
      onSaved={onSaved}
      onDeleted={onDeleted}
    />
  );
};

const ClientForm: React.FC<{
  cliente: Cliente;
  onClose: () => void;
  onSaved: (client: Cliente) => void;
  onDeleted: (client: Cliente) => void;
}> = ({ cliente, onClose, onSaved, onDeleted }) => {
  const [nome, setNome] = useState(cliente.nome);
  const [telefone, setTelefone] = useState(cliente.telefone || '');
  const [veiculo, setVeiculo] = useState(cliente.veiculo || '');
  const [placa, setPlaca] = useState(cliente.placa || '');
  const [endereco, setEndereco] = useState(cliente.endereco || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;
    const updated = storageService.updateCliente(cliente.id, {
      nome: nome.trim(),
      telefone: telefone.trim(),
      veiculo: veiculo.trim() || 'Veículo não informado',
      placa: placa.trim().toUpperCase() || 'SEM PLACA',
      endereco: endereco.trim() || undefined,
    });
    if (updated) onSaved(updated);
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm(`Excluir o cliente ${cliente.nome}? Os agendamentos já feitos continuam na agenda.`)) {
      storageService.deleteCliente(cliente.id);
      onDeleted(cliente);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#161619] border border-[#282830] rounded-2xl p-6 shadow-2xl text-white max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div>
            <h2 className="text-lg font-bold text-white">Editar Cliente</h2>
            <p className="text-xs text-zinc-400">
              {cliente.servicosRealizados} serviços • R$ {cliente.totalGasto.toFixed(2)} no total
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
              <User size={13} className="text-[#E50914]" />
              Nome Completo *
            </label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
              <Car size={13} className="text-[#E50914]" />
              Veículo
            </label>
            <input
              type="text"
              value={veiculo}
              onChange={(e) => setVeiculo(e.target.value)}
              placeholder="Ex: Porsche 911 Carrera GTS"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
              <MapPin size={13} className="text-[#E50914]" />
              Endereço
            </label>
            <input
              type="text"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              placeholder="Rua, número, bairro"
              className={inputClass}
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
              className={inputClass}
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
              className={inputClass + ' uppercase'}
            />
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={handleDelete}
              className="h-11 px-4 bg-zinc-900 hover:bg-red-950 border border-zinc-800 hover:border-red-800 text-red-400 rounded-xl flex items-center justify-center cursor-pointer transition"
              title="Excluir cliente"
            >
              <Trash2 size={18} />
            </button>
            <button
              type="submit"
              className="flex-1 h-11 bg-[#E50914] hover:bg-[#c20811] active:scale-[0.99] font-bold text-white rounded-xl shadow-lg shadow-[#E50914]/25 flex items-center justify-center gap-2 cursor-pointer transition"
            >
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
