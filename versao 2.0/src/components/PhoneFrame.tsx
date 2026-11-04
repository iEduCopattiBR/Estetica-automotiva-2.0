import React from 'react';

interface PhoneFrameProps {
  children: React.ReactNode;
  activeTab: 'inicio' | 'clientes' | 'agenda' | 'servicos' | 'relatorios';
  onTabChange: (tab: 'inicio' | 'clientes' | 'agenda' | 'servicos' | 'relatorios') => void;
}

export const PhoneFrame: React.FC<PhoneFrameProps> = ({
  children,
  activeTab,
  onTabChange,
}) => {
  return (
    <div className="min-h-screen bg-[#070709] text-white flex flex-col relative overflow-x-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Background carbon pattern with subtle crimson automotive lighting */}
      <div className="fixed inset-0 pointer-events-none opacity-40 bg-[radial-gradient(#200003_1px,transparent_1px)] [background-size:16px_16px]" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#E50914]/10 blur-[140px] pointer-events-none rounded-full" />

      {/* Main Responsive App Container (Sem frame artificial de telefone) */}
      <div className="w-full max-w-3xl mx-auto flex-1 flex flex-col relative z-10 min-h-screen">
        {/* Scrollable Content Viewport */}
        <main className="flex-1 overflow-y-auto px-3 sm:px-6 pt-3 pb-24">
          {children}
        </main>

        {/* Native Automotive Bottom Navigation Bar */}
        <nav
          aria-label="Navegação Principal"
          className="fixed bottom-0 left-0 right-0 max-w-3xl mx-auto bg-[#0C0C0E]/95 backdrop-blur-md border-t border-[#1C1C22] px-3 sm:px-6 py-2 flex items-center justify-around select-none z-40 shadow-[0_-8px_24px_rgba(0,0,0,0.6)]"
        >
          {/* Tab 1: Início */}
          <button
            onClick={() => onTabChange('inicio')}
            className="flex-1 flex flex-col items-center justify-center relative py-1 cursor-pointer group"
          >
            {activeTab === 'inicio' && (
              <span className="absolute -top-[10px] w-8 h-[3px] bg-[#E50914] rounded-full shadow-[0_0_8px_#E50914]" />
            )}
            <svg
              className={`w-6 h-6 transition ${
                activeTab === 'inicio' ? 'text-[#E50914]' : 'text-zinc-500 group-hover:text-zinc-300'
              }`}
              viewBox="0 0 24 24"
              fill={activeTab === 'inicio' ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span
              className={`text-[11px] mt-1 transition ${
                activeTab === 'inicio'
                  ? 'font-bold text-[#E50914]'
                  : 'font-normal text-zinc-500 group-hover:text-zinc-300'
              }`}
            >
              Início
            </span>
          </button>

          {/* Tab 2: Clientes */}
          <button
            onClick={() => onTabChange('clientes')}
            className="flex-1 flex flex-col items-center justify-center relative py-1 cursor-pointer group"
          >
            {activeTab === 'clientes' && (
              <span className="absolute -top-[10px] w-8 h-[3px] bg-[#E50914] rounded-full shadow-[0_0_8px_#E50914]" />
            )}
            <svg
              className={`w-6 h-6 transition ${
                activeTab === 'clientes' ? 'text-[#E50914]' : 'text-zinc-500 group-hover:text-zinc-300'
              }`}
              viewBox="0 0 24 24"
              fill={activeTab === 'clientes' ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span
              className={`text-[11px] mt-1 transition ${
                activeTab === 'clientes'
                  ? 'font-bold text-[#E50914]'
                  : 'font-normal text-zinc-500 group-hover:text-zinc-300'
              }`}
            >
              Clientes
            </span>
          </button>

          {/* Tab 3: Agenda */}
          <button
            onClick={() => onTabChange('agenda')}
            className="flex-1 flex flex-col items-center justify-center relative py-1 cursor-pointer group"
          >
            {activeTab === 'agenda' && (
              <span className="absolute -top-[10px] w-8 h-[3px] bg-[#E50914] rounded-full shadow-[0_0_8px_#E50914]" />
            )}
            <svg
              className={`w-6 h-6 transition ${
                activeTab === 'agenda' ? 'text-[#E50914]' : 'text-zinc-500 group-hover:text-zinc-300'
              }`}
              viewBox="0 0 24 24"
              fill={activeTab === 'agenda' ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
              <line x1="16" x2="16" y1="2" y2="6" />
              <line x1="8" x2="8" y1="2" y2="6" />
              <line x1="3" x2="21" y1="10" y2="10" />
            </svg>
            <span
              className={`text-[11px] mt-1 transition ${
                activeTab === 'agenda'
                  ? 'font-bold text-[#E50914]'
                  : 'font-normal text-zinc-500 group-hover:text-zinc-300'
              }`}
            >
              Agenda
            </span>
          </button>

          {/* Tab 4: Serviços & Combos */}
          <button
            onClick={() => onTabChange('servicos')}
            className="flex-1 flex flex-col items-center justify-center relative py-1 cursor-pointer group"
          >
            {activeTab === 'servicos' && (
              <span className="absolute -top-[10px] w-8 h-[3px] bg-[#E50914] rounded-full shadow-[0_0_8px_#E50914]" />
            )}
            <svg
              className={`w-6 h-6 transition ${
                activeTab === 'servicos' ? 'text-[#E50914]' : 'text-zinc-500 group-hover:text-zinc-300'
              }`}
              viewBox="0 0 24 24"
              fill={activeTab === 'servicos' ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
            <span
              className={`text-[11px] mt-1 transition ${
                activeTab === 'servicos'
                  ? 'font-bold text-[#E50914]'
                  : 'font-normal text-zinc-500 group-hover:text-zinc-300'
              }`}
            >
              Serviços
            </span>
          </button>

          {/* Tab 5: Relatórios */}
          <button
            onClick={() => onTabChange('relatorios')}
            className="flex-1 flex flex-col items-center justify-center relative py-1 cursor-pointer group"
          >
            {activeTab === 'relatorios' && (
              <span className="absolute -top-[10px] w-8 h-[3px] bg-[#E50914] rounded-full shadow-[0_0_8px_#E50914]" />
            )}
            <svg
              className={`w-6 h-6 transition ${
                activeTab === 'relatorios' ? 'text-[#E50914]' : 'text-zinc-500 group-hover:text-zinc-300'
              }`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" x2="18" y1="20" y2="10" />
              <line x1="12" x2="12" y1="20" y2="4" />
              <line x1="6" x2="6" y1="20" y2="14" />
            </svg>
            <span
              className={`text-[11px] mt-1 transition ${
                activeTab === 'relatorios'
                  ? 'font-bold text-[#E50914]'
                  : 'font-normal text-zinc-500 group-hover:text-zinc-300'
              }`}
            >
              Relatórios
            </span>
          </button>
        </nav>
      </div>
    </div>
  );
};
