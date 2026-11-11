import React, { useMemo, useRef, useState } from 'react';
import { X, FileText, Search, Plus, Trash2, UserRound } from 'lucide-react';
import { Cliente, TipoServico } from '../types';
import {
  OrcamentoItem,
  calcularTotais,
  entregarPdf,
  formatarMoeda,
  gerarNumeroOrcamento,
  gerarOrcamentoPdf,
  nomeArquivo,
} from '../services/orcamentoPdf';

interface OrcamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientes: Cliente[];
  servicos: TipoServico[];
}

interface ItemRascunho {
  key: number;
  nome: string;
  descricao: string;
  valor: string;
}

const CONTATO_KEY = 'schmitt_detailer_orcamento_contato';

function lerContato(): string {
  try {
    return window.localStorage.getItem(CONTATO_KEY) || '';
  } catch {
    return '';
  }
}

function hojeISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const inputCls =
  'w-full bg-[#1C1C1F] border border-[#2E2E33] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#E50914] transition';
const labelCls = 'block text-xs font-semibold text-zinc-300 mb-1.5';

export const OrcamentoModal: React.FC<OrcamentoModalProps> = ({ isOpen, onClose, clientes, servicos }) => {
  const [busca, setBusca] = useState('');
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [manual, setManual] = useState(false);
  const [manualNome, setManualNome] = useState('');
  const [manualTelefone, setManualTelefone] = useState('');
  const [manualVeiculo, setManualVeiculo] = useState('');
  const [itens, setItens] = useState<ItemRascunho[]>([]);
  const [servicoSelecionado, setServicoSelecionado] = useState('');
  const [dataServico, setDataServico] = useState('');
  const [validade, setValidade] = useState('7');
  const [desconto, setDesconto] = useState('');
  const [pagamento, setPagamento] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [contato, setContato] = useState<string>(() => lerContato());
  const [mensagem, setMensagem] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);
  const proximaKey = useRef(1);

  const resultados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return [];
    return clientes
      .filter((c) => c.nome.toLowerCase().includes(q) || (c.telefone || '').replace(/\D/g, '').includes(q.replace(/\D/g, '') || '§'))
      .slice(0, 5);
  }, [busca, clientes]);

  if (!isOpen) return null;

  const servicosAtivos = servicos.filter((s) => s.ativo !== false);
  const numeros = (v: string) => {
    const n = parseFloat(v.replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  };
  const itensCalc: OrcamentoItem[] = itens.map((i) => ({
    nome: i.nome.trim(),
    descricao: i.descricao.trim() || undefined,
    valor: numeros(i.valor),
  }));
  const totais = calcularTotais({ itens: itensCalc, desconto: numeros(desconto) });

  const adicionarServico = (id: string) => {
    const s = servicosAtivos.find((x) => x.id === id);
    if (!s) return;
    setItens((prev) => [
      ...prev,
      { key: proximaKey.current++, nome: s.nome, descricao: s.descricao || '', valor: s.precoPadrao ? String(s.precoPadrao) : '' },
    ]);
    setServicoSelecionado('');
  };

  const adicionarAvulso = () => {
    setItens((prev) => [...prev, { key: proximaKey.current++, nome: '', descricao: '', valor: '' }]);
  };

  const atualizarItem = (key: number, campo: 'nome' | 'descricao' | 'valor', valor: string) => {
    setItens((prev) => prev.map((i) => (i.key === key ? { ...i, [campo]: valor } : i)));
  };

  const limpar = () => {
    setBusca('');
    setCliente(null);
    setManual(false);
    setManualNome('');
    setManualTelefone('');
    setManualVeiculo('');
    setItens([]);
    setDataServico('');
    setValidade('7');
    setDesconto('');
    setPagamento('');
    setObservacoes('');
    setMensagem(null);
  };

  const gerar = () => {
    const nomeCliente = manual ? manualNome.trim() : cliente?.nome || '';
    if (!nomeCliente) {
      setMensagem({ tipo: 'erro', texto: 'Escolha um cliente cadastrado (ou informe o nome de um cliente novo).' });
      return;
    }
    const validos = itensCalc.filter((i) => i.nome && i.valor > 0);
    if (validos.length === 0) {
      setMensagem({ tipo: 'erro', texto: 'Adicione pelo menos um serviço com nome e valor maior que zero.' });
      return;
    }
    if (validos.length !== itensCalc.length) {
      setMensagem({ tipo: 'erro', texto: 'Há itens sem nome ou sem valor. Preencha ou remova antes de gerar o PDF.' });
      return;
    }
    try {
      const dados = {
        numero: gerarNumeroOrcamento(),
        emissao: new Date(),
        validadeDias: Math.max(1, Math.round(numeros(validade)) || 7),
        cliente: manual
          ? { nome: nomeCliente, telefone: manualTelefone.trim(), veiculo: manualVeiculo.trim() }
          : {
              nome: cliente!.nome,
              telefone: cliente!.telefone,
              endereco: cliente!.endereco,
              veiculo: cliente!.veiculo,
              placa: cliente!.placa,
            },
        dataServico: dataServico || undefined,
        itens: validos,
        desconto: numeros(desconto),
        formaPagamento: pagamento,
        observacoes,
        contatoEmpresa: contato,
      };
      try {
        window.localStorage.setItem(CONTATO_KEY, contato);
      } catch {
        /* ignore */
      }
      const bytes = gerarOrcamentoPdf(dados);
      const resultado = entregarPdf(bytes, nomeArquivo(dados));
      if (resultado === 'android') {
        setMensagem({
          tipo: 'ok',
          texto: 'PDF salvo na pasta Downloads/Schmitt Detailer. Escolha o app para enviar (WhatsApp, Drive...).',
        });
      } else if (resultado === 'download') {
        setMensagem({ tipo: 'ok', texto: 'PDF gerado e baixado.' });
      } else {
        setMensagem({ tipo: 'erro', texto: 'Não foi possível salvar o PDF neste aparelho. Tente novamente.' });
      }
    } catch {
      setMensagem({ tipo: 'erro', texto: 'Erro ao montar o PDF. Confira os dados e tente novamente.' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#121214] border border-[#27272A] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between p-4 border-b border-[#27272A] bg-[#18181B]">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-[#E50914]" />
            <h2 className="text-base font-bold text-white">Novo orçamento</h2>
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
          {/* Cliente */}
          <section>
            <label className={labelCls}>Cliente *</label>
            {cliente && !manual ? (
              <div className="flex items-center justify-between bg-[#18181B] border border-[#27272A] rounded-xl p-3">
                <div className="min-w-0">
                  <div className="text-sm font-bold text-white truncate">{cliente.nome}</div>
                  <div className="text-[11px] text-zinc-500 truncate">
                    {cliente.telefone}
                    {cliente.veiculo ? ` • ${cliente.veiculo}` : ''}
                  </div>
                </div>
                <button
                  onClick={() => setCliente(null)}
                  className="text-[11px] font-bold text-[#E50914] hover:brightness-125 shrink-0 ml-3 cursor-pointer"
                >
                  Trocar
                </button>
              </div>
            ) : manual ? (
              <div className="space-y-2">
                <input className={inputCls} placeholder="Nome do cliente" value={manualNome} onChange={(e) => setManualNome(e.target.value)} />
                <div className="grid grid-cols-2 gap-2">
                  <input className={inputCls} placeholder="Celular" value={manualTelefone} onChange={(e) => setManualTelefone(e.target.value)} />
                  <input className={inputCls} placeholder="Veículo" value={manualVeiculo} onChange={(e) => setManualVeiculo(e.target.value)} />
                </div>
                <button onClick={() => setManual(false)} className="text-[11px] font-bold text-zinc-400 hover:text-white cursor-pointer">
                  Voltar para clientes cadastrados
                </button>
              </div>
            ) : (
              <div>
                <div className="relative">
                  <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    className={inputCls + ' pl-9'}
                    placeholder="Buscar por nome ou telefone"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                  />
                </div>
                {resultados.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {resultados.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setCliente(c);
                          setBusca('');
                        }}
                        className="w-full flex items-center gap-2.5 text-left bg-[#18181B] border border-[#27272A] hover:border-zinc-500 rounded-xl px-3 py-2 transition cursor-pointer"
                      >
                        <UserRound className="w-4 h-4 text-zinc-400 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-white truncate">{c.nome}</div>
                          <div className="text-[11px] text-zinc-500 truncate">
                            {c.telefone}
                            {c.veiculo ? ` • ${c.veiculo}` : ''}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {busca.trim() && resultados.length === 0 && (
                  <p className="text-[11px] text-zinc-500 mt-2">Nenhum cliente encontrado.</p>
                )}
                <button onClick={() => setManual(true)} className="mt-2 text-[11px] font-bold text-zinc-400 hover:text-white cursor-pointer">
                  Cliente ainda não cadastrado? Digitar o nome
                </button>
              </div>
            )}
          </section>

          {/* Serviços */}
          <section>
            <label className={labelCls}>Serviços e valores *</label>
            <div className="space-y-2.5">
              {itens.map((i) => (
                <div key={i.key} className="bg-[#18181B] border border-[#27272A] rounded-xl p-3 space-y-2">
                  <div className="flex gap-2">
                    <input
                      className={inputCls}
                      placeholder="Serviço"
                      value={i.nome}
                      onChange={(e) => atualizarItem(i.key, 'nome', e.target.value)}
                    />
                    <button
                      onClick={() => setItens((prev) => prev.filter((x) => x.key !== i.key))}
                      className="p-2.5 rounded-xl text-zinc-400 hover:text-[#E50914] hover:bg-zinc-800 transition shrink-0 cursor-pointer"
                      aria-label="Remover serviço"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      className={inputCls + ' col-span-1'}
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Valor (R$)"
                      value={i.valor}
                      onChange={(e) => atualizarItem(i.key, 'valor', e.target.value)}
                    />
                    <input
                      className={inputCls + ' col-span-2'}
                      placeholder="Descrição (opcional)"
                      value={i.descricao}
                      onChange={(e) => atualizarItem(i.key, 'descricao', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-5 gap-2 mt-2.5">
              <select
                value={servicoSelecionado}
                onChange={(e) => adicionarServico(e.target.value)}
                className={inputCls + ' col-span-3'}
              >
                <option value="">Adicionar serviço cadastrado...</option>
                {servicosAtivos.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome} — {formatarMoeda(s.precoPadrao || 0)}
                  </option>
                ))}
              </select>
              <button
                onClick={adicionarAvulso}
                className="col-span-2 py-2.5 rounded-xl text-xs font-bold bg-[#1C1C22] text-zinc-200 hover:bg-[#25252e] transition flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Item avulso
              </button>
            </div>
          </section>

          {/* Datas e condições */}
          <section className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Data prevista do serviço</label>
              <input type="date" min={hojeISO()} className={inputCls} value={dataServico} onChange={(e) => setDataServico(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Validade (dias)</label>
              <input type="number" min="1" className={inputCls} value={validade} onChange={(e) => setValidade(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Desconto (R$)</label>
              <input type="number" step="0.01" min="0" placeholder="0,00" className={inputCls} value={desconto} onChange={(e) => setDesconto(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Forma de pagamento</label>
              <input className={inputCls} placeholder="Ex: Pix ou cartão" value={pagamento} onChange={(e) => setPagamento(e.target.value)} />
            </div>
          </section>

          <section>
            <label className={labelCls}>Observações</label>
            <textarea rows={3} className={inputCls} placeholder="Ex: condições do veículo, prazo de entrega..." value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
          </section>

          <section>
            <label className={labelCls}>Contato da empresa (aparece no rodapé do PDF)</label>
            <input className={inputCls} placeholder="Ex: WhatsApp (54) 99999-0000 • @suaempresa" value={contato} onChange={(e) => setContato(e.target.value)} />
          </section>

          {/* Total */}
          <section className="bg-[#18181B] border border-[#27272A] rounded-xl p-3">
            {totais.desconto > 0 && (
              <div className="flex justify-between text-xs text-zinc-400 mb-1">
                <span>Subtotal</span>
                <span>{formatarMoeda(totais.subtotal)}</span>
              </div>
            )}
            {totais.desconto > 0 && (
              <div className="flex justify-between text-xs text-zinc-400 mb-2">
                <span>Desconto</span>
                <span>- {formatarMoeda(totais.desconto)}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-white">Total</span>
              <span className="text-lg font-black text-[#E50914]">{formatarMoeda(totais.total)}</span>
            </div>
          </section>

          {mensagem && (
            <div
              className={
                'text-xs rounded-xl p-3 border ' +
                (mensagem.tipo === 'ok'
                  ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30'
                  : 'text-amber-300 bg-amber-500/10 border-amber-500/30')
              }
            >
              {mensagem.texto}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 pb-1">
            <button
              onClick={limpar}
              className="py-3 rounded-xl text-xs font-bold bg-[#1C1C22] text-zinc-300 hover:bg-[#25252e] transition cursor-pointer"
            >
              Limpar
            </button>
            <button
              onClick={gerar}
              className="col-span-2 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-[#E50914] to-[#B3060F] text-white hover:brightness-110 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              Gerar PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
