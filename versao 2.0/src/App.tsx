/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { PhoneFrame } from './components/PhoneFrame';
import { DashboardView } from './components/DashboardView';
import { ClientsView } from './components/ClientsView';
import { AgendaView } from './components/AgendaView';
import { ReportsView } from './components/ReportsView';
import { GoogleLoginModal } from './components/GoogleLoginModal';
import { NewAppointmentModal } from './components/NewAppointmentModal';
import { NewClientModal } from './components/NewClientModal';
import { SearchClientModal } from './components/SearchClientModal';
import { AppointmentDetailModal } from './components/AppointmentDetailModal';
import { SettingsModal } from './components/SettingsModal';
import { ServicesView } from './components/ServicesView';
import { ServiceModal } from './components/ServiceModal';
import { ProductModal } from './components/ProductModal';
import { storageService } from './services/storageService';
import { Agendamento, Cliente, GoogleAuthUser, TipoServico, Produto } from './types';

export default function App() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>(() =>
    storageService.getAgendamentos()
  );
  const [clientes, setClientes] = useState<Cliente[]>(() => storageService.getClientes());
  const [servicos, setServicos] = useState<TipoServico[]>(() => storageService.getTiposServico());
  const [produtos, setProdutos] = useState<Produto[]>(() => storageService.getProdutos());
  const [authUser, setAuthUser] = useState<GoogleAuthUser | null>(() =>
    storageService.getGoogleAuth()
  );
  const [isOnline, setIsOnline] = useState<boolean>(() => storageService.isOnline());
  const [activeTab, setActiveTab] = useState<
    'inicio' | 'clientes' | 'agenda' | 'servicos' | 'relatorios'
  >('inicio');

  // Modals state
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
  const [isNewClientOpen, setIsNewClientOpen] = useState(false);
  const [isSearchClientOpen, setIsSearchClientOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedAgendamento, setSelectedAgendamento] = useState<Agendamento | null>(null);

  // Servicos & Produtos modals
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<TipoServico | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Produto | null>(null);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Fluxo de inicialização e checagem de rede nativa
  useEffect(() => {
    const checkNetworkAndAuth = () => {
      const online = typeof navigator !== 'undefined' ? navigator.onLine : storageService.isOnline();
      setIsOnline(online);
      storageService.setOnlineStatus(online);

      if (online) {
        const savedAuth = storageService.getGoogleAuth();
        if (savedAuth) {
          const res = storageService.syncPendingToGoogleCalendar();
          if (res.syncedCount > 0) {
            showToast(`${res.syncedCount} agendamento(s) sincronizado(s) com a Google Agenda.`);
          }
          setAgendamentos(storageService.getAgendamentos());
        }
      }
    };

    checkNetworkAndAuth();

    const handleOnline = () => {
      setIsOnline(true);
      storageService.setOnlineStatus(true);
      const res = storageService.syncPendingToGoogleCalendar();
      setAgendamentos(storageService.getAgendamentos());
      if (res.syncedCount > 0) {
        showToast(`Conexão restabelecida! ${res.syncedCount} agendamento(s) sincronizado(s).`);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      storageService.setOnlineStatus(false);
      showToast('Modo Offline: Operando no banco de dados local.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const refreshData = () => {
    setAgendamentos([...storageService.getAgendamentos()]);
    setClientes([...storageService.getClientes()]);
    setServicos([...storageService.getTiposServico()]);
    setProdutos([...storageService.getProdutos()]);
  };

  const handleSaveServico = (servicoData: Omit<TipoServico, 'id'> | TipoServico) => {
    if ('id' in servicoData) {
      storageService.updateTipoServico(servicoData);
      showToast(`Serviço "${servicoData.nome}" atualizado com sucesso!`);
    } else {
      storageService.addTipoServico(servicoData);
      showToast(`Novo serviço "${servicoData.nome}" criado com sucesso!`);
    }
    refreshData();
  };

  const handleDeleteServico = (servicoId: string) => {
    storageService.deleteTipoServico(servicoId);
    refreshData();
    showToast('Serviço excluído com sucesso.');
  };

  const handleSaveProduto = (produtoData: Omit<Produto, 'id' | 'custoUnitario'> | Produto) => {
    if ('id' in produtoData) {
      storageService.updateProduto(produtoData);
      showToast(`Insumo "${produtoData.nome}" atualizado!`);
    } else {
      storageService.addProduto(produtoData);
      showToast(`Novo insumo "${produtoData.nome}" cadastrado no estoque!`);
    }
    refreshData();
  };

  const handleDeleteProduto = (produtoId: string) => {
    storageService.deleteProduto(produtoId);
    refreshData();
    showToast('Insumo removido do estoque.');
  };

  const handleToggleOnline = (newStatus?: boolean) => {
    const next = typeof newStatus === 'boolean' ? newStatus : !isOnline;
    setIsOnline(next);
    storageService.setOnlineStatus(next);
    refreshData();
    showToast(
      next
        ? 'Conexão Restaurada: Sincronização Google Agenda ativada.'
        : 'Modo Offline: Alterações salvas localmente no Isar DB.'
    );
  };

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      const res = storageService.syncPendingToGoogleCalendar();
      refreshData();
      setIsSyncing(false);
      showToast(res.message);
    }, 600);
  };

  const handleLogoutGoogle = () => {
    storageService.setGoogleAuth(null);
    setAuthUser(null);
    showToast('Desconectado do Google. O app continuará funcionando no modo local.');
  };

  return (
    <>
      <PhoneFrame
        activeTab={activeTab}
        onTabChange={setActiveTab}
      >
        {activeTab === 'inicio' && (
          <DashboardView
            agendamentos={agendamentos}
            clientes={clientes}
            onOpenCadastrarCliente={() => setIsNewClientOpen(true)}
            onOpenBuscarCliente={() => setIsSearchClientOpen(true)}
            onOpenAgendarServico={() => setIsNewAppointmentOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenVerTodosAgendamentos={() => setActiveTab('agenda')}
            onSelectAgendamento={(item) => setSelectedAgendamento(item)}
            onOpenServicos={() => setActiveTab('servicos')}
            isOnline={isOnline}
            hasGoogleAuth={!!authUser}
          />
        )}

        {activeTab === 'clientes' && (
          <ClientsView
            clientes={clientes}
            onOpenCadastrarCliente={() => setIsNewClientOpen(true)}
            onSelectCliente={() => {}}
          />
        )}

        {activeTab === 'agenda' && (
          <AgendaView
            agendamentos={agendamentos}
            onOpenAgendarServico={() => setIsNewAppointmentOpen(true)}
            onSelectAgendamento={(item) => setSelectedAgendamento(item)}
            onManualSync={handleManualSync}
            isSyncing={isSyncing}
            isOnline={isOnline}
            hasGoogleAuth={!!authUser}
          />
        )}

        {activeTab === 'servicos' && (
          <ServicesView
            servicos={servicos}
            produtos={produtos}
            onOpenNovoServico={() => {
              setEditingService(null);
              setIsServiceModalOpen(true);
            }}
            onEditarServico={(s) => {
              setEditingService(s);
              setIsServiceModalOpen(true);
            }}
            onExcluirServico={handleDeleteServico}
            onOpenNovoProduto={() => {
              setEditingProduct(null);
              setIsProductModalOpen(true);
            }}
            onEditarProduto={(p) => {
              setEditingProduct(p);
              setIsProductModalOpen(true);
            }}
            onExcluirProduto={handleDeleteProduto}
            calcularCustoServico={(s) => storageService.calcularCustoServico(s, produtos)}
          />
        )}

        {activeTab === 'relatorios' && (
          <ReportsView
            agendamentos={agendamentos}
            clientes={clientes}
          />
        )}
      </PhoneFrame>

      {/* Floating Automotive Toast */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-[#161619] border border-[#E50914] text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-[#E50914]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Real Application Modals */}
      <GoogleLoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSuccess={(user) => {
          setAuthUser(user);
          setIsLoginOpen(false);
          refreshData();
          showToast(`Conectado como ${user.displayName}. Google Agenda sincronizada!`);
        }}
      />

      <NewAppointmentModal
        isOpen={isNewAppointmentOpen}
        onClose={() => setIsNewAppointmentOpen(false)}
        onSuccess={(item) => {
          refreshData();
          showToast(
            isOnline
              ? `Agendamento criado e sincronizado: ${item.clienteNome}`
              : `Agendamento salvo localmente no Isar: ${item.clienteNome} (Offline)`
          );
        }}
      />

      <NewClientModal
        isOpen={isNewClientOpen}
        onClose={() => setIsNewClientOpen(false)}
        onSuccess={(client) => {
          refreshData();
          showToast(`Cliente ${client.nome} cadastrado com sucesso!`);
        }}
      />

      <SearchClientModal
        isOpen={isSearchClientOpen}
        onClose={() => setIsSearchClientOpen(false)}
        onOpenNewClient={() => setIsNewClientOpen(true)}
        onSelectClient={(client) => {
          showToast(`Cliente selecionado: ${client.nome} (${client.veiculo})`);
        }}
      />

      <AppointmentDetailModal
        agendamento={selectedAgendamento}
        isOpen={!!selectedAgendamento}
        onClose={() => setSelectedAgendamento(null)}
        onUpdated={() => {
          refreshData();
          setSelectedAgendamento(null);
          showToast('Status do agendamento atualizado com sucesso!');
        }}
        onDeleted={() => {
          refreshData();
          setSelectedAgendamento(null);
          showToast('Agendamento excluído do banco Isar local.');
        }}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        authUser={authUser}
        onOpenLogin={() => {
          setIsSettingsOpen(false);
          setIsLoginOpen(true);
        }}
        onLogout={handleLogoutGoogle}
        onDataReset={() => {
          refreshData();
          showToast('Todos os dados foram zerados! Sistema pronto para começar do zero.');
        }}
        isOnline={isOnline}
        onToggleOnline={handleToggleOnline}
      />

      <ServiceModal
        isOpen={isServiceModalOpen}
        onClose={() => {
          setIsServiceModalOpen(false);
          setEditingService(null);
        }}
        servicoParaEditar={editingService}
        produtosDisponiveis={produtos}
        onSave={handleSaveServico}
        onDelete={handleDeleteServico}
        onOpenNovoProduto={() => {
          setIsServiceModalOpen(false);
          setEditingProduct(null);
          setIsProductModalOpen(true);
        }}
      />

      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setEditingProduct(null);
        }}
        produtoParaEditar={editingProduct}
        onSave={handleSaveProduto}
      />
    </>
  );
}
