import React, { useState } from 'react';
import { X, Calendar as CalendarIcon, Clock, DollarSign, Car, User, Phone, CheckCircle2 } from 'lucide-react';
import { storageService } from '../services/storageService';
import { Agendamento, StatusAgendamento } from '../types';

interface NewAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (item: Agendamento) => void;
}

export const NewAppointmentModal: React.FC<NewAppointmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const existingClients = storageService.getClientes();
  const servicosCadastrados = storageService.getTiposServico();

  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [clienteNome, setClienteNome] = useState('');
  const [clienteTelefone, setClienteTelefone] = useState('');
  const [clienteVeiculo, setClienteVeiculo] = useState('');
  const [servicoTipo, setServicoTipo] = useState(() =>
    servicosCadastrados.length > 0 ? servicosCadastrados[0].nome : 'Lavagem Detalhada'
  );
  const [preco, setPreco] = useState(() =>
    servicosCadastrados.length > 0 ? servicosCadastrados[0].precoPadrao : 180
  );
  const [data, setData] = useState(() => new Date().toISOString().split('T')[0]);
  const [hora, setHora] = useState('14:00');
  const [observacoes, setObservacoes] = useState('');
  const [status, setStatus] = useState<StatusAgendamento>('agendado');

  if (!isOpen) return null;

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    const cli = existingClients.find((c) => c.id === clientId);
    if (cli) {
      setClienteNome(cli.nome);
      setClienteTelefone(cli.telefone);
      setClienteVeiculo(`${cli.veiculo} (${cli.placa})`);
    } else {
      setSelectedClientId('');
    }
  };

  const handleServicoChange = (servicoNome: string) => {
    setServicoTipo(servicoNome);
    const found = servicosCadastrados.find((s) => s.nome === servicoNome);
    if (found) {
      setPreco(found.precoPadrao);
    }
  };

  const servicoObj = servicosCadastrados.find((s) => s.nome === servicoTipo);
  const infoCusto = servicoObj ? storageService.calcularCustoServico(servicoObj) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteNome.trim()) return;

    const fullDateTime = `${data}T${hora}:00`;

    const created = storageService.addAgendamento({
      clienteNome: clienteNome.trim(),
      clienteTelefone: clienteTelefone.trim() || undefined,
      clienteVeiculo: clienteVeiculo.trim() || undefined,
      servicoTipo,
      horario: fullDateTime,
      status,
      preco: Number(preco) || 0,
      observacoes: observacoes.trim() || undefined,
    });

    onSuccess(created);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#161619] border border-[#282830] rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl text-white max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <CalendarIcon size={20} className="text-[#E50914]" />
              Agendar Novo Serviço
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Salvo localmente no Isar e espelhado na Google Agenda
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Quick client picker */}
          {existingClients.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Selecionar Cliente Já Cadastrado:
              </label>
              <select
                value={selectedClientId}
                onChange={(e) => handleClientSelect(e.target.value)}
                className="w-full bg-[#111113] border border-[#2b2b34] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#E50914]"
              >
                <option value="">-- Ou preencha os dados abaixo --</option>
                {existingClients.map((cli) => (
                  <option key={cli.id} value={cli.id}>
                    {cli.nome} - {cli.veiculo} ({cli.placa})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Nome */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <User size={14} className="text-[#E50914]" />
              Nome do Cliente *
            </label>
            <input
              type="text"
              required
              value={clienteNome}
              onChange={(e) => setClienteNome(e.target.value)}
              placeholder="Ex: João da Silva"
              className="w-full bg-[#111113] border border-[#2b2b34] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#E50914]"
            />
          </div>

          {/* Veículo & Telefone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Car size={14} className="text-[#E50914]" />
                Veículo / Placa
              </label>
              <input
                type="text"
                value={clienteVeiculo}
                onChange={(e) => setClienteVeiculo(e.target.value)}
                placeholder="Ex: BMW 320i M Sport"
                className="w-full bg-[#111113] border border-[#2b2b34] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#E50914]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Phone size={14} className="text-[#E50914]" />
                Telefone / WhatsApp
              </label>
              <input
                type="text"
                value={clienteTelefone}
                onChange={(e) => setClienteTelefone(e.target.value)}
                placeholder="(11) 98765-4321"
                className="w-full bg-[#111113] border border-[#2b2b34] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#E50914]"
              />
            </div>
          </div>

          {/* Tipo de Serviço & Valor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Tipo de Serviço Automotivo
              </label>
              <select
                value={servicoTipo}
                onChange={(e) => handleServicoChange(e.target.value)}
                className="w-full bg-[#111113] border border-[#2b2b34] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#E50914]"
              >
                {servicosCadastrados.map((s) => (
                  <option key={s.id} value={s.nome}>
                    {s.nome} (R$ {s.precoPadrao.toFixed(2)})
                  </option>
                ))}
                {/* Opção livre caso não esteja na lista */}
                {!servicosCadastrados.some((s) => s.nome === servicoTipo) && (
                  <option value={servicoTipo}>{servicoTipo}</option>
                )}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <DollarSign size={14} className="text-[#E50914]" />
                Valor do Serviço (R$)
              </label>
              <input
                type="number"
                value={preco}
                onChange={(e) => setPreco(Number(e.target.value))}
                className="w-full bg-[#111113] border border-[#2b2b34] rounded-xl px-3.5 py-2.5 text-sm text-white font-bold focus:outline-none focus:border-[#E50914]"
              />
            </div>
          </div>

          {/* Destaque de Custo dos Insumos e Margem Prevista */}
          {infoCusto && (
            <div className="p-2.5 bg-[#1C1C20] border border-[#2E2E36] rounded-xl flex items-center justify-between text-xs">
              <span className="text-zinc-400">
                Insumos: <strong className="text-red-400 font-mono">R$ {infoCusto.custoTotal.toFixed(2)}</strong>
              </span>
              <span className="text-zinc-400">
                Lucro Estimado: <strong className="text-emerald-400 font-mono">R$ {(Number(preco) - infoCusto.custoTotal).toFixed(2)}</strong>
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                {preco > 0 ? (((Number(preco) - infoCusto.custoTotal) / Number(preco)) * 100).toFixed(0) : 0}% margem
              </span>
            </div>
          )}

          {/* Data & Horário */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <CalendarIcon size={14} className="text-[#E50914]" />
                Data
              </label>
              <input
                type="date"
                required
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full bg-[#111113] border border-[#2b2b34] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#E50914]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Clock size={14} className="text-[#E50914]" />
                Horário
              </label>
              <input
                type="time"
                required
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                className="w-full bg-[#111113] border border-[#2b2b34] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#E50914]"
              />
            </div>
          </div>

          {/* Status Inicial */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Status Inicial
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStatus('agendado')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
                  status === 'agendado'
                    ? 'bg-amber-500 text-black shadow-md'
                    : 'bg-[#1e1e24] text-zinc-400 hover:text-white'
                }`}
              >
                🕒 Agendado
              </button>
              <button
                type="button"
                onClick={() => setStatus('em_andamento')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
                  status === 'em_andamento'
                    ? 'bg-[#E50914] text-white shadow-md'
                    : 'bg-[#1e1e24] text-zinc-400 hover:text-white'
                }`}
              >
                ▶ Em andamento
              </button>
              <button
                type="button"
                onClick={() => setStatus('concluido')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
                  status === 'concluido'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-[#1e1e24] text-zinc-400 hover:text-white'
                }`}
              >
                ✓ Concluído
              </button>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Observações Técnicas do Veículo
            </label>
            <textarea
              rows={2}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: Riscos médios no capô, cliente solicitou vitrificação nas pinças de freio..."
              className="w-full bg-[#111113] border border-[#2b2b34] rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#E50914]"
            />
          </div>

          {/* Actions */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-[#E50914] to-[#c20811] hover:brightness-110 active:scale-[0.99] font-bold text-white rounded-xl shadow-lg shadow-[#E50914]/25 flex items-center justify-center gap-2 cursor-pointer transition"
            >
              <CheckCircle2 size={18} />
              Confirmar Agendamento (Isar DB)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
