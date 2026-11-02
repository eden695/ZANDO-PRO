import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AssistantMessage } from '../../types';
import { processCommercialQuery } from '../../services/aiAssistantEngine';
import {
  Sparkles,
  Send,
  RotateCcw,
  Bot,
  User as UserIcon,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Package,
  Receipt,
  HelpCircle,
} from 'lucide-react';

export const AssistantView: React.FC = () => {
  const {
    sales,
    expenses,
    debts,
    orders,
    products,
    customers,
    settings,
    setActiveTab,
  } = useApp();

  const [inputQuery, setInputQuery] = useState('');
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Bonjour ! Je suis votre Assistant Commercial ZANDO Pro.\n\nJe suis directement connecté à votre base de données locale. Vous pouvez me poser toutes vos questions en français sur votre caisse, votre chiffre d'affaires, vos stocks, vos dettes ou vos dépenses. Je calculerai toujours les chiffres réels exacts sans inventer de données.`,
      timestamp: new Date().toISOString(),
      actionSuggested: {
        label: 'Voir le tableau de bord',
        tab: 'dashboard',
      },
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendQuery = (queryText: string) => {
    if (!queryText.trim()) return;

    const userMsg: AssistantMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: queryText.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');

    // Process through deterministic commercial engine
    setTimeout(() => {
      const response = processCommercialQuery(queryText, {
        sales,
        expenses,
        debts,
        orders,
        products,
        customers,
        currency: settings.currency,
      });
      setMessages((prev) => [...prev, response]);
    }, 250);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `welcome_${Date.now()}`,
        sender: 'assistant',
        text: 'Historique de conversation réinitialisé. Comment puis-je vous aider ?',
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const suggestedQueries = [
    'J\'ai combien dans la caisse ?',
    'Combien ai-je encaissé aujourd\'hui ?',
    'Quel est mon chiffre d\'affaires ?',
    'Combien les clients me doivent ?',
    'Quel client me doit le plus d\'argent ?',
    'Quels produits sont presque épuisés ?',
    'Quel est mon produit le plus vendu ?',
    'Combien ai-je dépensé ce mois-ci ?',
    'Quelle est ma marge estimée ?',
    'Combien vaut mon stock ?',
    'Montre-moi les commandes en attente.',
    'Quelles sont mes ventes aujourd\'hui ?',
  ];

  return (
    <div className="space-y-4 max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 border border-cyan-500/20">
            <Sparkles className="w-5 h-5 text-cyan-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              Assistant Commercial ZANDO Pro
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                Calculateur temps réel actif
              </span>
            </h1>
            <p className="text-xs text-slate-500">
              Posez vos questions en français. Données extraites directement de votre boutique.
            </p>
          </div>
        </div>

        <button
          onClick={handleResetChat}
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          title="Effacer la conversation"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Suggested Quick Questions Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 shrink-0 scrollbar-none">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
          <HelpCircle className="w-3 h-3" /> Questions :
        </span>
        {suggestedQueries.map((sq, idx) => (
          <button
            key={idx}
            onClick={() => handleSendQuery(sq)}
            className="px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 hover:bg-cyan-50 hover:text-cyan-800 hover:border-cyan-200 border border-slate-200 text-slate-600 transition-colors whitespace-nowrap shrink-0"
          >
            {sq}
          </button>
        ))}
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 overflow-y-auto space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.sender === 'user' ? 'flex-row-reverse' : ''
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.sender === 'user'
                  ? 'bg-slate-900 text-white'
                  : 'bg-cyan-600 text-white shadow-xs'
              }`}
            >
              {msg.sender === 'user' ? (
                <UserIcon className="w-4 h-4" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
            </div>

            {/* Bubble */}
            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-slate-900 text-white rounded-tr-none'
                  : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none shadow-xs space-y-2.5'
              }`}
            >
              <div className="whitespace-pre-line font-sans font-normal">
                {msg.text}
              </div>

              {/* Metrics highlights cards */}
              {msg.metrics && msg.metrics.length > 0 && (
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60">
                  {msg.metrics.map((m, mIdx) => (
                    <div key={mIdx} className="p-2 bg-white rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-400 block font-medium truncate">
                        {m.label}
                      </span>
                      <span className="text-xs font-bold font-mono text-slate-900 block truncate">
                        {m.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Action button suggestion */}
              {msg.actionSuggested && (
                <div className="pt-1">
                  <button
                    onClick={() => setActiveTab(msg.actionSuggested!.tab)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] rounded-lg transition-colors shadow-xs"
                  >
                    <span>{msg.actionSuggested.label}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendQuery(inputQuery);
        }}
        className="shrink-0 flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="Posez une question commerciale (ex. J'ai combien dans la caisse ?)..."
          className="flex-1 px-3 py-2 text-xs focus:outline-hidden text-slate-800 placeholder:text-slate-400"
        />
        <button
          type="submit"
          disabled={!inputQuery.trim()}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
        >
          <span>Envoyer</span>
          <Send className="w-3.5 h-3.5 text-cyan-400" />
        </button>
      </form>
    </div>
  );
};
