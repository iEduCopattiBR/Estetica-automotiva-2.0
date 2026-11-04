import React, { useState } from 'react';
import { X, Calendar, Clock, DollarSign, Car, Phone, Trash2, Cloud, CloudOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { storageService } from '../services/storageService';
import { Agendamento, StatusAgendamento } from '../types';

interface AppointmentDetailModalProps {
  agendamento: Agendamento | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
  onDeleted: () => void;
}

export const AppointmentDetailModal: React.FC<AppointmentDetailModalProps> = ({
  agendamento,
  isOpen,
  onClose,
  onUpdated,
  onDeleted,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  if (!isOpen || !agendamento) return null;

  const dateObj = new Date(agendamento.horario);
  const dateFormatted = dateObj.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const timeFormatted = dateObj.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleStatusChange = (newStatus: StatusAgendamento) => {
    storageService.updateAgendamento(agendamento.id, { status: newStatus });
    onUpdated();
  };

  const handleDelete = () => {
    if (window.confirm(`Tem certeza que deseja excluir o agendamento de ${agendamento.clienteNome}?`)) {
      setIsDeleting(true);
      storageService.deleteAgendamento(agendamento.id);
      setIsDeleting(false);
      onDeleted();
      onClose();
    }
  };

  const handleManualSync = () => {
    setIsSyncing(true);
    storageService.syncPendingToGoogleCalendar();
    setTimeout(() => {
      setIsSyncing(false);
      onUpdated();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#161619] border border-[#282830] rounded-2xl p-6 shadow-2xl text-white">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div>
            <span className="text-xs font-bold text-[#E50914] uppercase tracking-wider">
              {agendamento.servicoTipo}
            </span>
            <h2 className="text-xl font-bold text-white mt-0.5">{agendamento.clienteNome}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Sync Status Banner */}
        <div className="mt-4 p-3 rounded-xl bg-[#1C1C22] border border-[#282830] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            {agendamento.isSynced ? (
              <>
                <Cloud size={16} className="text-emerald-400" />
                <span className="text-emerald-300 font-medium">Sincronizado na Google Agenda</span>
              </>
            ) : (
              <>
                <CloudOff size={16} className="text-amber-400" />
                <span className="text-amber-300 font-medium">Salvo Localmente (Pendente de Sync)</span>
              </>
            )}
          </div>
          {!agendamento.isSynced && (
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="text-[#E50914] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
            >
              <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
              Sincronizar
            </button>
          )}
        </div>

        {/* Main Details */}
        <div className="mt-4 space-y-3 text-sm">
          <div className="flex items-center justify-between py-2 border-b border-zinc-800/80">
            <span className="text-zinc-400 flex items-center gap-2">
              <Calendar size={15} className="text-[#E50914]" /> Data e Horário:
            </span>
            <span className="font-bold text-white">
              {dateFormatted} às {timeFormatted}
            </span>
          </div>

          {agendamento.clienteVeiculo && (
            <div className="flex items-center justify-between py-2 border-b border-zinc-800/80">
              <span className="text-zinc-400 flex items-center gap-2">
                <Car size={15} className="text-[#E50914]" /> Veículo:
              </span>
              <span className="font-semibold text-white">{agendamento.clienteVeiculo}</span>
            </div>
          )}

          {agendamento.clienteTelefone && (
            <div className="flex items-center justify-between py-2 border-b border-zinc-800/80">
              <span className="text-zinc-400 flex items-center gap-2">
                <Phone size={15} className="text-[#E50914]" /> Contato:
              </span>
              <span className="font-semibold text-white">{agendamento.clienteTelefone}</span>
            </div>
          )}

          <div className="flex items-center justify-between py-2 border-b border-zinc-800/80">
            <span className="text-zinc-400 flex items-center gap-2">
              <DollarSign size={15} className="text-[#E50914]" /> Valor do Serviço:
            </span>
            <span className="font-bold text-[#E50914] text-base">
              R$ {agendamento.preco.toFixed(2)}
            </span>
          </div>

          {agendamento.googleEventId && (
            <div className="py-2 border-b border-zinc-800/80 text-xs text-zinc-400 flex items-center justify-between">
              <span>ID Google Calendar:</span>
              <code className="text-zinc-300 font-mono text-[11px]">
                {agendamento.googleEventId}
              </code>
            </div>
          )}

          {agendamento.observacoes && (
            <div className="py-2 text-xs">
              <span className="text-zinc-400 block mb-1">Observações Técnicas:</span>
              <p className="p-2.5 rounded-lg bg-[#111113] text-zinc-300 border border-zinc-800">
                {agendamento.observacoes}
              </p>
            </div>
          )}
        </div>

        {/* Change Status Buttons */}
        <div className="mt-5">
          <label className="block text-xs font-semibold text-zinc-400 mb-2">
            Alterar Status do Serviço:
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleStatusChange('em_andamento')}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                agendamento.status === 'em_andamento'
                  ? 'bg-[#E50914] text-white shadow-lg shadow-[#E50914]/30'
                  : 'bg-[#1C1C22] text-zinc-300 hover:bg-[#25252e]'
              }`}
            >
              ▶ Em andamento
            </button>
            <button
              onClick={() => handleStatusChange('agendado')}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                agendamento.status === 'agendado'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30'
                  : 'bg-[#1C1C22] text-zinc-300 hover:bg-[#25252e]'
              }`}
            >
              🕒 Agendado
            </button>
            <button
              onClick={() => handleStatusChange('concluido')}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                agendamento.status === 'concluido'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'bg-[#1C1C22] text-zinc-300 hover:bg-[#25252e]'
              }`}
            >
              ✓ Concluído
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center justify-between">
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1.5 p-2 rounded-lg hover:bg-red-950/40 transition cursor-pointer"
          >
            <Trash2 size={15} />
            Excluir Agendamento
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
