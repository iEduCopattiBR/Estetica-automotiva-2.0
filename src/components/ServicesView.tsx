import React, { useState } from 'react';
import {
  Wrench,
  Package,
  Plus,
  Search,
  Clock,
  DollarSign,
  TrendingUp,
  Edit2,
  Trash2,
  Percent,
  Layers,
  Sparkles,
} from 'lucide-react';
import { TipoServico, Produto } from '../types';

interface ServicesViewProps {
  servicos: TipoServico[];
  produtos: Produto[];
  onOpenNovoServico: () => void;
  onEditarServico: (servico: TipoServico) => void;
  onExcluirServico: (servicoId: string) => void;
  onOpenNovoProduto: () => void;
  onEditarProduto: (produto: Produto) => void;
  onExcluirProduto: (produtoId: string) => void;
  calcularCustoServico: (servico: TipoServico) => {
    custoTotal: number;
    margemLucro: number;
    margemLucroPct: number;
    produtosDetalhados: Array<{ produto: Produto; quantidade: number; custoItem: number }>;
  };
}

export const ServicesView: React.FC<ServicesViewProps> = ({
  servicos,
  produtos,
  onOpenNovoServico,
  onEditarServico,
  onExcluirServico,
  onOpenNovoProduto,
  onEditarProduto,
  onExcluirProduto,
  calcularCustoServico,
}) => {
  const [subTab, setSubTab] = useState<'servicos' | 'produtos'>('servicos');
  const [searchQuery, setSearchQuery] = useState('');
  const [produtoExcluirId, setProdutoExcluirId] = useState<string | null>(null);
  const [servicoExcluirId, setServicoExcluirId] = useState<string | null>(null);

  // Filtros
  const filteredServicos = servicos.filter(
    (s) =>
      s.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.descricao && s.descricao.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredProdutos = produtos.filter((p) =>
    p.nome.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Métricas
  const totalServicos = servicos.length;
  const ticketMedio =
    totalServicos > 0 ? servicos.reduce((acc, s) => acc + s.precoPadrao, 0) / totalServicos : 0;

  const totalProdutos = produtos.length;

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
            <span>Catálogo & Combos</span>
            <span className="w-2 h-2 rounded-full bg-[#E50914] shadow-[0_0_8px_#E50914]" />
          </h1>
          <p className="text-xs text-zinc-400">
            Gerencie serviços, doses de produtos e margem de lucro
          </p>
        </div>

        {/* Action Button */}
        {subTab === 'servicos' ? (
          <button
            onClick={onOpenNovoServico}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#E50914] hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-red-950/40 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Serviço</span>
          </button>
        ) : (
          <button
            onClick={onOpenNovoProduto}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#E50914] hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-red-950/40 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Insumo</span>
          </button>
        )}
      </div>

      {/* Segmented Control Subtabs */}
      <div className="bg-[#121214] border border-[#27272A] p-1 rounded-xl flex items-center">
        <button
          onClick={() => setSubTab('servicos')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
            subTab === 'servicos'
              ? 'bg-[#E50914] text-white shadow-md'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Serviços & Combos ({servicos.length})</span>
        </button>
        <button
          onClick={() => setSubTab('produtos')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
            subTab === 'produtos'
              ? 'bg-[#E50914] text-white shadow-md'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Insumos & Estoque ({produtos.length})</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder={
            subTab === 'servicos'
              ? 'Buscar serviço (ex: Polimento, Vitrificação, Lavagem)...'
              : 'Buscar insumo (ex: V-Floc, Blend, Sintra)...'
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#121214] border border-[#27272A] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#E50914] transition"
        />
      </div>

      {/* SUBTAB 1: SERVIÇOS & COMBOS */}
      {subTab === 'servicos' && (
        <div className="space-y-3">
          {/* Métricas Rápidas */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-[#121214] border border-[#27272A] p-3 rounded-xl flex items-center gap-2.5">
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">
                  Ticket Médio
                </span>
                <span className="text-sm font-bold text-white font-mono">
                  R$ {ticketMedio.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="bg-[#121214] border border-[#27272A] p-3 rounded-xl flex items-center gap-2.5">
              <div className="p-2 bg-[#E50914]/10 rounded-lg text-[#E50914]">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">
                  Total de Combos
                </span>
                <span className="text-sm font-bold text-white font-mono">
                  {totalServicos} serviços
                </span>
              </div>
            </div>
          </div>

          {filteredServicos.length === 0 ? (
            <div className="bg-[#121214] border border-[#27272A] rounded-2xl p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-zinc-800 text-zinc-500 flex items-center justify-center mx-auto">
                <Wrench className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Nenhum serviço encontrado</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  {searchQuery
                    ? 'Tente outro termo na busca.'
                    : 'Cadastre seus serviços com os insumos utilizados para controlar custos.'}
                </p>
              </div>
              <button
                onClick={onOpenNovoServico}
                className="px-4 py-2 bg-[#E50914] text-white rounded-xl text-xs font-bold hover:bg-red-700 transition"
              >
                + Criar Primeiro Serviço
              </button>
            </div>
          ) : (
            filteredServicos.map((servico) => {
              const { custoTotal, margemLucro, margemLucroPct, produtosDetalhados } =
                calcularCustoServico(servico);

              return (
                <div
                  key={servico.id}
                  className="bg-[#121214] border border-[#27272A] hover:border-zinc-700 rounded-2xl p-4 transition shadow-sm space-y-3"
                >
                  {/* Header: Nome + Preço */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white truncate">{servico.nome}</h3>
                        {!servico.ativo && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-400">
                            Inativo
                          </span>
                        )}
                      </div>
                      {servico.descricao && (
                        <p className="text-xs text-zinc-400 line-clamp-2 mt-0.5">
                          {servico.descricao}
                        </p>
                      )}
                      {servico.duracaoMinutos && (
                        <div className="flex items-center gap-1 text-[11px] text-zinc-500 mt-1">
                          <Clock className="w-3 h-3 text-zinc-400" />
                          <span>
                            Duração média: {Math.floor(servico.duracaoMinutos / 60)}h{' '}
                            {servico.duracaoMinutos % 60 > 0 ? `${servico.duracaoMinutos % 60}m` : ''}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-base font-black text-white font-mono block">
                        R$ {servico.precoPadrao.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-zinc-400">Preço Cobrado</span>
                    </div>
                  </div>

                  {/* Produtos Utilizados (Combo Breakdown) */}
                  <div className="p-2.5 bg-[#18181C] border border-[#27272A] rounded-xl space-y-1.5">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#E50914]" />
                      Insumos Utilizados ({produtosDetalhados.length})
                    </span>

                    {produtosDetalhados.length === 0 ? (
                      <p className="text-[11px] text-zinc-500 italic">
                        Nenhum insumo vinculado a este serviço.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {produtosDetalhados.map((item, idx) => (
                          <div
                            key={idx}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-[#121214] border border-[#2E2E33] rounded-lg text-[11px]"
                          >
                            <span className="text-zinc-300 font-medium">{item.produto.nome}:</span>
                            <span className="text-zinc-400 font-mono">
                              {item.quantidade} {item.produto.unidade}
                            </span>
                            <span className="text-red-400/90 font-mono text-[10px]">
                              (R$ {item.custoItem.toFixed(2)})
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Financial Footer: Custo, Lucro e Margem */}
                  <div className="pt-2 border-t border-[#27272A] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div>
                        <span className="text-[10px] text-zinc-400 block">Custo Insumos</span>
                        <span className="font-semibold text-red-400 font-mono">
                          R$ {custoTotal.toFixed(2)}
                        </span>
                      </div>
                      <div className="w-px h-6 bg-zinc-800" />
                      <div>
                        <span className="text-[10px] text-zinc-400 block">Lucro Bruto</span>
                        <span className="font-bold text-emerald-400 font-mono">
                          R$ {margemLucro.toFixed(2)}
                        </span>
                      </div>
                      <div className="w-px h-6 bg-zinc-800" />
                      <div>
                        <span className="text-[10px] text-zinc-400 block">Margem</span>
                        <span
                          className={`font-bold text-[11px] px-1.5 py-0.5 rounded ${
                            margemLucroPct >= 70
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : margemLucroPct >= 40
                              ? 'bg-amber-500/15 text-amber-400'
                              : 'bg-red-500/15 text-red-400'
                          }`}
                        >
                          {margemLucroPct.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditarServico(servico)}
                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition"
                        title="Editar Serviço e Produtos"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setServicoExcluirId(servico.id)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition"
                        title="Excluir Serviço"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Confirmação de exclusão inline */}
                  {servicoExcluirId === servico.id && (
                    <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl space-y-2 mt-2">
                      <p className="text-xs text-red-300">
                        Confirmar exclusão de <strong>{servico.nome}</strong>?
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setServicoExcluirId(null)}
                          className="flex-1 py-1 bg-zinc-800 text-zinc-300 rounded text-xs hover:bg-zinc-700"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => {
                            onExcluirServico(servico.id);
                            setServicoExcluirId(null);
                          }}
                          className="flex-1 py-1 bg-red-600 text-white rounded text-xs font-bold hover:bg-red-700"
                        >
                          Sim, Excluir
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* SUBTAB 2: INSUMOS & ESTOQUE */}
      {subTab === 'produtos' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
            <span>{totalProdutos} insumos cadastrados no estoque</span>
            <span>Cálculo automático de custo por dose</span>
          </div>

          {filteredProdutos.length === 0 ? (
            <div className="bg-[#121214] border border-[#27272A] rounded-2xl p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-zinc-800 text-zinc-500 flex items-center justify-center mx-auto">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Nenhum insumo encontrado</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Cadastre ceras, shampoos, compostos e panos para calcular os custos dos serviços.
                </p>
              </div>
              <button
                onClick={onOpenNovoProduto}
                className="px-4 py-2 bg-[#E50914] text-white rounded-xl text-xs font-bold hover:bg-red-700 transition"
              >
                + Cadastrar Insumo
              </button>
            </div>
          ) : (
            filteredProdutos.map((produto) => (
              <div
                key={produto.id}
                className="bg-[#121214] border border-[#27272A] hover:border-zinc-700 rounded-xl p-3.5 transition flex items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-white truncate">{produto.nome}</h4>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-400 font-mono">
                      {produto.unidade}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-1">
                    <span>
                      Embalagem: R$ {produto.precoPago.toFixed(2)} por {produto.quantidadeEmbalagem}{' '}
                      {produto.unidade}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-emerald-400 font-mono block">
                    R$ {produto.custoUnitario.toFixed(4)}
                  </span>
                  <span className="text-[10px] text-zinc-500">por {produto.unidade}</span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => onEditarProduto(produto)}
                    className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition"
                    title="Editar produto"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setProdutoExcluirId(produto.id)}
                    className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition"
                    title="Excluir produto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Confirmação de exclusão do produto */}
                {produtoExcluirId === produto.id && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#121214] border border-red-500/40 p-4 rounded-2xl max-w-sm w-full space-y-3">
                      <h4 className="text-sm font-bold text-white">Excluir Insumo?</h4>
                      <p className="text-xs text-zinc-300">
                        Deseja realmente excluir <strong>{produto.nome}</strong>? Ele também será
                        removido dos serviços onde foi configurado.
                      </p>
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => setProdutoExcluirId(null)}
                          className="flex-1 py-2 bg-zinc-800 text-zinc-300 rounded-xl text-xs font-semibold"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => {
                            onExcluirProduto(produto.id);
                            setProdutoExcluirId(null);
                          }}
                          className="flex-1 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
