import React, { useState, useMemo, useEffect } from 'react';
import { Wallet, TrendingUp, TrendingDown, Target, Plus, Trash2, Save, Calculator, DollarSign, ArrowUpRight, Users, Settings, User, CreditCard, RefreshCcw, Bitcoin, Activity, Layers, PieChart, BarChart2, LineChart, AlertTriangle, RotateCcw, WifiOff, Cloud, Moon, Sun, Sparkles, Minus, Cpu } from 'lucide-react';

// --- 1. IMPORTACIONES DE FIREBASE ---
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, addDoc, deleteDoc, doc, onSnapshot, updateDoc, setDoc, query, orderBy } from "firebase/firestore";

// --- 2. TUS CREDENCIALES ---
const firebaseConfig = {
  apiKey: "AIzaSyCXC88aLiIlPSvafB4-_gWYJyLwigCUuUY",
  authDomain: "finanzas-lucas-ayelen.firebaseapp.com",
  projectId: "finanzas-lucas-ayelen",
  storageBucket: "finanzas-lucas-ayelen.firebasestorage.app",
  messagingSenderId: "520167199746",
  appId: "1:520167199746:web:3b2f05e0b05cd0c833431b"
};

// --- 3. INICIALIZAR LA NUBE ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const APP_ID = 'familia-lucas-ayelen'; 

const DashboardFinanciero = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState(null);

  // --- AUTO-INSTALADOR DE DISEÑO ---
  useEffect(() => {
    const existingScript = document.getElementById('tailwind-cdn');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'tailwind-cdn';
      script.src = "https://cdn.tailwindcss.com";
      script.onload = () => {
          if (window.tailwind) {
            window.tailwind.config = {
              darkMode: 'class', 
            }
          }
      };
      document.head.appendChild(script);
    }
  }, []);

  // --- CARGA ESTADO LOCAL ---
  const loadState = (key, defaultValue) => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  };

  const [darkMode, setDarkMode] = useState(() => loadState('darkMode', false));

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  // --- CONEXIÓN FIREBASE ---
  useEffect(() => {
    signInAnonymously(auth)
      .then(() => setAuthError(null))
      .catch((error) => {
        console.error("Error Firebase:", error);
        if (error.code === 'auth/admin-restricted-operation' || error.code === 'auth/configuration-not-found') {
          setAuthError("⚠️ ERROR: Habilita 'Anónimo' en Firebase.");
        } else if (error.code === 'permission-denied') {
           setAuthError("⚠️ ERROR: Configura reglas en Firestore.");
        } else {
          setAuthError(`Error: ${error.message}`);
        }
      });
    return onAuthStateChanged(auth, setUser);
  }, []);

  // --- ESTADOS ---
  const [viewCurrency, setViewCurrency] = useState('ARS');
  const [savingsGoal, setSavingsGoal] = useState(1000000);
  const [exchangeRate, setExchangeRate] = useState(1050);
  const [transactions, setTransactions] = useState([]);
  const [cryptoHoldings, setCryptoHoldings] = useState([]);
  
  const [simInitial, setSimInitial] = useState(100000);
  const [simMonthly, setSimMonthly] = useState(20000);
  const [simRate, setSimRate] = useState(35);
  const [simYears, setSimYears] = useState(5);

  // --- SYNC ---
  useEffect(() => {
    if (!user) return;
    const settingsRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'app_settings', 'general_config');
    const unsub = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.viewCurrency) setViewCurrency(data.viewCurrency);
        if (data.savingsGoal) setSavingsGoal(data.savingsGoal);
        if (data.exchangeRate) setExchangeRate(data.exchangeRate);
      } else {
        setDoc(settingsRef, { viewCurrency: 'ARS', savingsGoal: 1000000, exchangeRate: 1050 });
      }
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = collection(db, 'artifacts', APP_ID, 'public', 'data', 'transactions');
    const unsub = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTransactions(items);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = collection(db, 'artifacts', APP_ID, 'public', 'data', 'crypto_holdings');
    const unsub = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCryptoHoldings(items);
    });
    return () => unsub();
  }, [user]);

  // --- GUARDADO ---
  const updateSettings = async (field, value) => {
    if(field === 'viewCurrency') setViewCurrency(value);
    if(field === 'savingsGoal') setSavingsGoal(value);
    if(field === 'exchangeRate') setExchangeRate(value);

    if (!user) return;
    const settingsRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'app_settings', 'general_config');
    await setDoc(settingsRef, { [field]: value }, { merge: true });
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!newAmount || !user) return;
    
    // Lógica para retiros (negativo)
    const finalAmount = newTransactionType === 'withdrawal' ? -Math.abs(parseFloat(newAmount)) : Math.abs(parseFloat(newAmount));

    await addDoc(collection(db, 'artifacts', APP_ID, 'public', 'data', 'transactions'), {
      date: newDate,
      amount: finalAmount,
      currency: newCurrency,
      contributor: newContributor,
      account: newAccount || 'General',
      type: newTransactionType, // 'deposit' or 'withdrawal'
      note: newNote || (newTransactionType === 'withdrawal' ? 'Retiro' : 'Ingreso'),
      createdAt: new Date().toISOString()
    });
    setNewAmount(''); setNewNote(''); setNewAccount('');
  };

  // MODIFICADO: Confirmación antes de borrar
  const deleteTransaction = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este registro de la Caja?")) {
      if (!user) return;
      await deleteDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'transactions', id));
    }
  };

  const handleAddCrypto = async (e) => {
    e.preventDefault();
    if (!newCryptoAmount || !newCryptoPrice || !user) return;

    // Lógica para ventas (cantidad negativa)
    const finalAmount = newCryptoType === 'sell' ? -Math.abs(parseFloat(newCryptoAmount)) : Math.abs(parseFloat(newCryptoAmount));

    await addDoc(collection(db, 'artifacts', APP_ID, 'public', 'data', 'crypto_holdings'), {
      date: new Date().toISOString().split('T')[0],
      coin: newCryptoCoin,
      amount: finalAmount,
      priceUsd: parseFloat(newCryptoPrice),
      contributor: newCryptoContributor,
      account: newCryptoAccount || 'Exchange',
      type: newCryptoType, // 'buy' or 'sell'
      note: newCryptoNote || (newCryptoType === 'sell' ? 'Venta' : 'Compra spot'),
      createdAt: new Date().toISOString()
    });
    setNewCryptoAmount(''); setNewCryptoPrice(''); setNewCryptoNote(''); setNewCryptoAccount('');
  };

  // MODIFICADO: Confirmación antes de borrar
  const deleteCrypto = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este registro de Crypto?")) {
      if (!user) return;
      await deleteDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'crypto_holdings', id));
    }
  };

  // --- API PRECIOS (Added RENDER) ---
  const [cryptoPrices, setCryptoPrices] = useState({ bitcoin: { usd: 0 }, ethereum: { usd: 0 }, solana: { usd: 0 }, tether: { usd: 1.00 }, 'render-token': { usd: 0 } });
  const [loadingPrices, setLoadingPrices] = useState(false);

  const fetchPrices = async () => {
    setLoadingPrices(true);
    try {
      // Added render-token to IDs
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,tether,render-token&vs_currencies=usd');
      if (!response.ok) throw new Error("API Limit");
      const data = await response.json();
      if (data) {
        setCryptoPrices(prev => ({ 
            ...prev, 
            bitcoin: data.bitcoin || prev.bitcoin, 
            ethereum: data.ethereum || prev.ethereum, 
            solana: data.solana || prev.solana, 
            tether: data.tether || prev.tether,
            'render-token': data['render-token'] || prev['render-token']
        }));
      }
    } catch (error) { console.warn("Precios offline"); } finally { setLoadingPrices(false); }
  };
  useEffect(() => { fetchPrices(); const i = setInterval(fetchPrices, 60000); return () => clearInterval(i); }, []);

  // --- INPUTS ---
  const [newTransactionType, setNewTransactionType] = useState('deposit'); // 'deposit' | 'withdrawal'
  const [newAmount, setNewAmount] = useState('');
  const [newCurrency, setNewCurrency] = useState('ARS');
  const [newContributor, setNewContributor] = useState('LUCAS');
  const [newAccount, setNewAccount] = useState(''); 
  const [newNote, setNewNote] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);

  const [newCryptoType, setNewCryptoType] = useState('buy'); // 'buy' | 'sell'
  const [newCryptoCoin, setNewCryptoCoin] = useState('BTC');
  const [newCryptoAmount, setNewCryptoAmount] = useState('');
  const [newCryptoPrice, setNewCryptoPrice] = useState(''); 
  const [newCryptoContributor, setNewCryptoContributor] = useState('LUCAS');
  const [newCryptoAccount, setNewCryptoAccount] = useState(''); 
  const [newCryptoNote, setNewCryptoNote] = useState('');

  // --- CALCULOS ---
  const convertToViewCurrency = (amount, originalCurrency) => {
    const val = parseFloat(amount || 0);
    if (isNaN(val)) return 0;
    if (originalCurrency === viewCurrency) return val;
    if (viewCurrency === 'ARS') return val * exchangeRate; 
    return val / exchangeRate; 
  };

  const getCoinPrice = (coinSymbol) => {
    const map = { 'BTC': 'bitcoin', 'ETH': 'ethereum', 'SOL': 'solana', 'USDT': 'tether', 'RENDER': 'render-token' };
    const id = map[coinSymbol] || 'bitcoin';
    return cryptoPrices[id]?.usd || 0;
  };

  const totalCashSaved = useMemo(() => transactions.reduce((acc, curr) => acc + convertToViewCurrency(curr.amount, curr.currency), 0), [transactions, viewCurrency, exchangeRate]);
  const totalCryptoValueUSD = useMemo(() => cryptoHoldings.reduce((acc, curr) => acc + (parseFloat(curr.amount || 0) * getCoinPrice(curr.coin)), 0), [cryptoHoldings, cryptoPrices]);
  const totalCryptoValueView = useMemo(() => viewCurrency === 'ARS' ? totalCryptoValueUSD * exchangeRate : totalCryptoValueUSD, [totalCryptoValueUSD, viewCurrency, exchangeRate]);
  const netWorth = totalCashSaved + totalCryptoValueView;

  const getPersonTotal = (person) => {
    const cash = transactions.filter(t => t.contributor === person).reduce((acc, curr) => acc + convertToViewCurrency(curr.amount, curr.currency), 0);
    const crypto = cryptoHoldings.filter(t => t.contributor === person).reduce((acc, curr) => {
       const valUSD = parseFloat(curr.amount || 0) * getCoinPrice(curr.coin);
       return acc + (viewCurrency === 'ARS' ? valUSD * exchangeRate : valUSD);
    }, 0);
    return cash + crypto;
  };

  const totalLucas = useMemo(() => getPersonTotal('LUCAS'), [transactions, cryptoHoldings, viewCurrency, exchangeRate, cryptoPrices]);
  const totalAyelen = useMemo(() => getPersonTotal('AYELEN'), [transactions, cryptoHoldings, viewCurrency, exchangeRate, cryptoPrices]);
  const progress = savingsGoal > 0 ? Math.min((totalCashSaved / savingsGoal) * 100, 100) : 0;

  const handleGoalChange = (e) => {
    const rawValue = e.target.value.replace(/\./g, '');
    const val = rawValue === '' ? 0 : parseFloat(rawValue);
    if (!isNaN(val)) updateSettings('savingsGoal', val);
  };

  const formatMoney = (val, code = viewCurrency) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: code, minimumFractionDigits: 2 }).format(val || 0);
  const formatCrypto = (val) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 }).format(val || 0);

  // --- DATA VISUAL ---
  const compoundData = useMemo(() => {
    let data = [];
    let current = parseFloat(simInitial || 0);
    let contributed = parseFloat(simInitial || 0);
    const rate = (parseFloat(simRate || 0) / 100) / 12;
    const months = parseInt(simYears || 1) * 12;
    data.push({ year: 0, balance: current, contributed: contributed }); 

    for (let i = 1; i <= months; i++) {
      current = current * (1 + rate) + parseFloat(simMonthly || 0);
      contributed += parseFloat(simMonthly || 0);
      if (i % 12 === 0) data.push({ year: i / 12, balance: current, contributed });
    }
    return { finalBalance: current, totalContributed: contributed, chartData: data };
  }, [simInitial, simMonthly, simRate, simYears]);

  const chartsData = useMemo(() => {
    const cryptoMix = ['BTC', 'ETH', 'SOL', 'USDT', 'RENDER'].map(coin => {
      // Filtrar transacciones para esta moneda
      const coinTxs = cryptoHoldings.filter(h => h.coin === coin);
      
      // 1. Cantidad Total Actual
      const totalAmount = coinTxs.reduce((acc, h) => acc + parseFloat(h.amount || 0), 0);
      
      // 2. Valor Actual
      const currentMarketPrice = getCoinPrice(coin);
      const currentValue = totalAmount * currentMarketPrice;

      // 3. Calculo de Promedio de Compra (Weighted Average)
      // Solo consideramos las COMPRAS (monto positivo) para el promedio
      const buys = coinTxs.filter(h => parseFloat(h.amount) > 0);
      const totalBoughtAmount = buys.reduce((acc, h) => acc + parseFloat(h.amount), 0);
      const totalCost = buys.reduce((acc, h) => acc + (parseFloat(h.amount) * parseFloat(h.priceUsd)), 0);
      
      const avgBuyPrice = totalBoughtAmount > 0 ? totalCost / totalBoughtAmount : 0;
      
      // P&L % (Precio Actual vs Promedio Compra)
      const pnlPercent = avgBuyPrice > 0 ? ((currentMarketPrice - avgBuyPrice) / avgBuyPrice) * 100 : 0;

      return { 
        name: coin, 
        amount: totalAmount,
        value: viewCurrency === 'ARS' ? currentValue * exchangeRate : currentValue,
        avgBuyPrice: avgBuyPrice,
        pnl: pnlPercent,
        color: coin === 'BTC' ? 'bg-yellow-500' : coin === 'ETH' ? 'bg-purple-600' : coin === 'SOL' ? 'bg-cyan-500' : coin === 'RENDER' ? 'bg-red-500' : 'bg-green-500',
        textColor: coin === 'BTC' ? 'text-yellow-600 dark:text-yellow-400' : coin === 'ETH' ? 'text-purple-600 dark:text-purple-400' : coin === 'SOL' ? 'text-cyan-600 dark:text-cyan-400' : coin === 'RENDER' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
      };
    }).filter(i => i.value > 0 || i.amount > 0);

    return { 
      distribution: [{ name: 'Caja', value: totalCashSaved, color: 'bg-emerald-500' }, { name: 'Crypto', value: totalCryptoValueView, color: 'bg-indigo-600' }],
      cryptoMix, 
      contributors: [{ name: 'LUCAS', value: totalLucas, color: 'bg-blue-500' }, { name: 'AYELEN', value: totalAyelen, color: 'bg-pink-500' }]
    };
  }, [totalCashSaved, totalCryptoValueView, cryptoHoldings, cryptoPrices, viewCurrency, exchangeRate]);

  // --- HELPER GRÁFICO SVG MEJORADO (CURVAS SUAVES) ---
  const generatePolyline = (data, key, width, height) => {
    if (data.length === 0) return "";
    const maxVal = Math.max(...data.map(d => d.balance));
    const stepX = width / (data.length - 1);
    
    return data.map((d, i) => {
      const x = i * stepX;
      const y = height - ((d[key] / maxVal) * height); 
      return `${x},${y}`;
    }).join(' ');
  };

  // --- RENDERIZADO RESPONSIVO ---
  return (
    <div className={`min-h-screen font-sans selection:bg-emerald-200 transition-colors duration-300 ${darkMode ? 'dark bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      
      <div className={`px-4 py-2 text-xs font-bold text-center flex justify-center items-center gap-2 ${authError ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'}`}>
        {authError ? (
          <span className="flex items-center gap-2 animate-pulse"><AlertTriangle size={14}/> {authError}</span>
        ) : (
          <span className="flex items-center gap-2"><Cloud size={14}/> Nube Conectada</span>
        )}
      </div>

      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-30 transition-colors duration-300">
        <div className="bg-slate-900 dark:bg-black text-slate-300 text-xs py-2 px-4 overflow-hidden">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
             <div className="flex gap-4 md:gap-6 animate-pulse-slow overflow-x-auto whitespace-nowrap scrollbar-hide w-full md:w-auto">
               <span className="flex items-center gap-1 font-mono"><Bitcoin size={14} className="text-yellow-500"/> <span className="hidden sm:inline">BTC:</span><span className="text-white">${cryptoPrices.bitcoin?.usd.toLocaleString()}</span></span>
               <span className="flex items-center gap-1 font-mono"><Activity size={14} className="text-purple-500"/> <span className="hidden sm:inline">ETH:</span><span className="text-white">${cryptoPrices.ethereum?.usd.toLocaleString()}</span></span>
               <span className="flex items-center gap-1 font-mono"><Activity size={14} className="text-cyan-500"/> <span className="hidden sm:inline">SOL:</span><span className="text-white">${cryptoPrices.solana?.usd.toLocaleString()}</span></span>
               <span className="flex items-center gap-1 font-mono"><Cpu size={14} className="text-red-500"/> <span className="hidden sm:inline">RNDR:</span><span className="text-white">${cryptoPrices['render-token']?.usd.toLocaleString()}</span></span>
               <span className="flex items-center gap-1 font-mono"><DollarSign size={14} className="text-green-500"/> <span className="hidden sm:inline">USDT:</span><span className="text-white">${cryptoPrices.tether?.usd.toLocaleString()}</span></span>
             </div>
             <div className="flex gap-2 items-center ml-2">
                <button onClick={() => setDarkMode(!darkMode)} className={`p-1.5 rounded-full border ${darkMode ? 'bg-slate-700 border-slate-600 text-yellow-400' : 'bg-white border-slate-200 text-slate-600'}`}>{darkMode ? <Sun size={12} /> : <Moon size={12} />}</button>
                <button onClick={fetchPrices} className="hover:text-white transition-colors"><RefreshCcw size={12} className={loadingPrices ? "animate-spin" : ""} /></button>
             </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-2 rounded-lg text-white shadow-lg"><Users size={24} /></div>
                <div><h1 className="text-xl font-bold leading-none text-slate-900 dark:text-white">Patrimonio</h1><span className="text-xs font-medium tracking-wide uppercase text-slate-500 dark:text-slate-400">LUCAS & AYELEN</span></div>
              </div>
              <div className="md:hidden px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-full border border-slate-200 dark:border-slate-600"><span className="text-sm font-bold text-slate-800 dark:text-white">{formatMoney(netWorth)}</span></div>
            </div>
            
            <div className="hidden md:block ml-4 px-4 py-1 bg-slate-100 dark:bg-slate-700 rounded-full border border-slate-200 dark:border-slate-600"><span className="text-xs font-bold uppercase mr-2 text-slate-400 dark:text-slate-300">TOTAL:</span><span className="text-lg font-bold text-slate-800 dark:text-white">{formatMoney(netWorth)}</span></div>

            <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg w-full md:w-auto overflow-x-auto transition-colors duration-300 no-scrollbar">
              {['dashboard', 'crypto', 'simulator', 'charts'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 whitespace-nowrap px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-all uppercase ${activeTab === tab ? 'bg-white dark:bg-slate-600 shadow text-emerald-700 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-300 hover:text-slate-700 dark:hover:text-white'}`}>
                  {tab === 'dashboard' ? 'CAJA' : tab === 'crypto' ? 'CRYPTO' : tab === 'charts' ? 'GRÁFICOS' : 'SIMULADOR'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap justify-between items-center gap-2 text-sm bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors duration-300">
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1 rounded border border-slate-200 dark:border-slate-700 shadow-sm transition-colors duration-300">
               <Settings size={14} className="text-slate-400"/><span className="font-medium text-slate-600 dark:text-slate-300 text-xs md:text-sm">Dólar:</span><span className="font-mono text-slate-400">$</span><input type="number" value={exchangeRate} onChange={(e) => updateSettings('exchangeRate', Number(e.target.value))} className="w-16 md:w-20 font-bold outline-none border-b border-dotted border-slate-300 dark:border-slate-600 focus:border-emerald-500 bg-transparent text-slate-700 dark:text-white" step="0.01"/>
            </div>
            <div className="flex items-center gap-1">
                {['ARS', 'USD'].map(curr => (<button key={curr} onClick={() => updateSettings('viewCurrency', curr)} className={`px-2 py-1 rounded text-xs font-bold transition-colors border ${viewCurrency === curr ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}>{curr}</button>))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 pb-20">
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden transition-colors duration-300">
                <div className="flex justify-between items-start z-10"><span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">CAJA DE AHORRO</span><Wallet className="text-emerald-500" size={20} /></div>
                <div className="z-10">
                  <span className="text-2xl md:text-3xl font-bold block tracking-tight truncate text-slate-900 dark:text-white">{formatMoney(totalCashSaved)}</span>
                  <span className="text-xs font-medium mt-1 block text-slate-400 dark:text-slate-500">
                    {viewCurrency === 'ARS' ? `≈ ${formatMoney(totalCashSaved / exchangeRate, 'USD')}` : `≈ ${formatMoney(totalCashSaved * exchangeRate, 'ARS')}`}
                  </span>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between h-32 transition-colors duration-300">
                <div className="flex justify-between items-start"><span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">OBJETIVO</span><Target className="text-blue-500" size={20} /></div>
                <div className="w-full">
                  <div className="flex justify-between items-end mb-2"><input type="text" value={new Intl.NumberFormat('es-AR').format(savingsGoal)} onChange={handleGoalChange} className="text-xl md:text-2xl font-bold bg-transparent outline-none border-b border-transparent hover:border-slate-300 focus:border-blue-500 transition-colors w-2/3 text-slate-900 dark:text-white" /><span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{progress.toFixed(1)}%</span></div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden relative mb-1"><div className="bg-emerald-500 h-3 rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div></div>
                  <span className="text-xs font-medium block text-slate-400 dark:text-slate-500 text-right">
                    {viewCurrency === 'ARS' ? `≈ ${formatMoney(savingsGoal / exchangeRate, 'USD')}` : `≈ ${formatMoney(savingsGoal * exchangeRate, 'ARS')}`}
                  </span>
                </div>
              </div>
              <div className="bg-slate-900 dark:bg-black p-6 rounded-xl shadow-sm text-white flex flex-col justify-between h-32 relative overflow-hidden transition-colors duration-300">
                <div className="z-10 relative h-full flex flex-col justify-center gap-3">
                  <div className="flex justify-between items-center border-b border-slate-700 pb-2"><span className="flex items-center gap-2 text-xs font-bold uppercase"><User size={14} className="text-blue-400"/> LUCAS</span><span className="font-mono text-sm">{formatMoney(totalLucas)}</span></div>
                  <div className="flex justify-between items-center"><span className="flex items-center gap-2 text-xs font-bold uppercase"><User size={14} className="text-pink-400"/> AYELEN</span><span className="font-mono text-sm">{formatMoney(totalAyelen)}</span></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden sticky top-32 transition-colors duration-300">
                  <div className="bg-slate-50 dark:bg-slate-900 px-6 py-4 border-b border-slate-100 dark:border-slate-700"><h3 className="font-bold flex items-center gap-2 text-slate-800 dark:text-white"><Plus size={18} /> {newTransactionType === 'deposit' ? 'Ingreso' : 'Retiro'} a Caja</h3></div>
                  <form onSubmit={handleAddTransaction} className="p-6 space-y-4">
                    {/* Selector TIPO DE MOVIMIENTO */}
                    <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-700 rounded-lg">
                      <button type="button" onClick={() => setNewTransactionType('deposit')} className={`py-2 text-xs font-bold rounded-md transition-all uppercase ${newTransactionType === 'deposit' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>Ingreso</button>
                      <button type="button" onClick={() => setNewTransactionType('withdrawal')} className={`py-2 text-xs font-bold rounded-md transition-all uppercase ${newTransactionType === 'withdrawal' ? 'bg-red-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>Retiro</button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-700 rounded-lg">
                      <button type="button" onClick={() => setNewContributor('LUCAS')} className={`py-3 text-sm font-bold rounded-md transition-all uppercase ${newContributor === 'LUCAS' ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-300 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>LUCAS</button>
                      <button type="button" onClick={() => setNewContributor('AYELEN')} className={`py-3 text-sm font-bold rounded-md transition-all uppercase ${newContributor === 'AYELEN' ? 'bg-white dark:bg-slate-600 text-pink-600 dark:text-pink-300 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>AYELEN</button>
                    </div>
                    <div><label className="block text-xs font-bold uppercase mb-1 text-slate-500 dark:text-slate-400">Monto</label><div className="relative"><input type="number" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} className="w-full pl-3 pr-20 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-mono text-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white" placeholder="0.00" min="0" step="0.01"/><select value={newCurrency} onChange={(e) => setNewCurrency(e.target.value)} className="absolute right-1 top-1 bottom-1 w-18 border-none rounded text-xs font-bold cursor-pointer outline-none hover:bg-slate-200 dark:hover:bg-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"><option value="ARS">ARS</option><option value="USD">USD</option></select></div></div>
                    <div><label className="block text-xs font-bold uppercase mb-1 text-slate-500 dark:text-slate-400">Cuenta</label><div className="relative"><input type="text" value={newAccount} onChange={(e) => setNewAccount(e.target.value)} className="w-full pl-10 p-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200" placeholder="Ej: Mercado Pago..." /><CreditCard className="absolute left-3 top-3.5 text-slate-400" size={16} /></div></div>
                    <div><label className="block text-xs font-bold uppercase mb-1 text-slate-500 dark:text-slate-400">Fecha</label><input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"/></div>
                    <div><label className="block text-xs font-bold uppercase mb-1 text-slate-500 dark:text-slate-400">Nota</label><input type="text" value={newNote} onChange={(e) => setNewNote(e.target.value)} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200" placeholder="Ej: Aguinaldo..."/></div>
                    <button type="submit" className={`w-full text-white font-bold py-3.5 rounded-lg shadow-md hover:shadow-lg transition-all flex justify-center items-center gap-2 mt-4 active:scale-95 ${newTransactionType === 'deposit' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}><Save size={18} /> {newTransactionType === 'deposit' ? 'Guardar Ingreso' : 'Guardar Retiro'}</button>
                  </form>
                </div>
              </div>
              <div className="lg:col-span-2">
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col h-full min-h-[400px] transition-colors duration-300">
                  <div className="bg-slate-50 dark:bg-slate-900 px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center"><h3 className="font-bold text-slate-800 dark:text-white">Historial de Caja</h3><div className="text-xs font-bold px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300">{transactions.length} registros</div></div>
                  <div className="flex-1 overflow-auto max-h-[600px] p-2">
                    <table className="w-full text-sm text-left border-collapse min-w-[500px]">
                      <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 sticky top-0 z-10"><tr><th className="px-3 py-3 rounded-l-lg">Quién</th><th className="px-3 py-3">Fecha</th><th className="px-3 py-3">Concepto</th><th className="px-3 py-3">Cuenta</th><th className="px-3 py-3 text-right">Monto</th><th className="px-3 py-3 rounded-r-lg"></th></tr></thead>
                      <tbody>
                        {[...transactions].sort((a,b) => new Date(b.date) - new Date(a.date)).map((t) => (
                          <tr key={t.id} className="border-b border-slate-50 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors group">
                            <td className="px-3 py-3"><span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${t.contributor === 'LUCAS' ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200 border border-blue-100 dark:border-blue-800' : 'bg-pink-50 dark:bg-pink-900 text-pink-700 dark:text-pink-200 border border-pink-100 dark:border-pink-800'}`}>{t.contributor === 'LUCAS' ? 'L' : 'A'}</span></td>
                            <td className="px-3 py-3 font-medium text-xs text-slate-500 dark:text-slate-400">{new Date(t.date).toLocaleDateString('es-AR', {timeZone: 'UTC', day: '2-digit', month: '2-digit'})}</td>
                            <td className="px-3 py-3 font-medium truncate max-w-[100px] text-slate-800 dark:text-slate-200">{t.note}</td>
                            <td className="px-3 py-3 text-xs truncate max-w-[80px] text-slate-500 dark:text-slate-400"><div className="flex items-center gap-1"><CreditCard size={12} className="text-slate-400" />{t.account}</div></td>
                            <td className="px-3 py-3 text-right"><span className={`font-bold ${t.amount < 0 ? 'text-red-600 dark:text-red-400' : (t.currency === 'USD' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300')}`}>{t.currency === 'USD' ? 'u$s' : '$'} {new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2 }).format(t.amount)}</span></td>
                            <td className="px-3 py-3 text-center"><button onClick={() => deleteTransaction(t.id)} className="p-1 rounded transition-all md:opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"><Trash2 size={16} /></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'crypto' && (
          <div className="space-y-6 animate-in fade-in duration-300">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-indigo-900 text-white p-6 rounded-xl relative overflow-hidden flex flex-col justify-between h-36">
                  <div className="absolute right-0 top-0 p-16 bg-indigo-500 rounded-full blur-3xl opacity-20"></div>
                  <div className="relative z-10"><span className="text-indigo-200 text-xs font-bold uppercase tracking-wider">MERCADO ACTUAL</span><div className="flex items-baseline gap-2 mt-2"><span className="text-3xl font-bold">{formatMoney(totalCryptoValueView)}</span></div></div>
                  <div className="relative z-10 flex gap-4 text-xs text-indigo-200 mt-4"><span className="bg-indigo-800/50 px-2 py-1 rounded">{viewCurrency === 'ARS' ? `≈ ${formatMoney(totalCryptoValueView / exchangeRate, 'USD')}` : `≈ ${formatMoney(totalCryptoValueView * exchangeRate, 'ARS')}`}</span></div>
                </div>
                
                {/* COMPOSICIÓN REDISEÑADA CON P&L PROMEDIO */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm h-auto flex flex-col transition-colors duration-300">
                  <h3 className="font-bold mb-4 text-slate-700 dark:text-white text-sm uppercase flex items-center gap-2"><PieChart size={16} /> Composición & Rendimiento</h3>
                  <div className="space-y-4">
                     {chartsData.cryptoMix.map((coin, idx) => {
                        const pct = totalCryptoValueUSD > 0 ? (coin.value / (viewCurrency === 'ARS' ? totalCryptoValueUSD * exchangeRate : totalCryptoValueUSD)) * 100 : 0;
                        return (
                          <div key={idx} className="group">
                             <div className="flex justify-between items-center mb-1 text-xs">
                                <div className="flex flex-col">
                                  <span className={`font-bold flex items-center gap-1 ${coin.textColor}`}>
                                     {coin.name === 'BTC' ? <Bitcoin size={12}/> : coin.name === 'ETH' ? <Activity size={12}/> : coin.name === 'SOL' ? <Activity size={12}/> : coin.name === 'RENDER' ? <Cpu size={12}/> : <DollarSign size={12}/>}
                                     {coin.name}
                                  </span>
                                  <div className="text-[10px] text-slate-400 mt-0.5">
                                    PPP: ${coin.avgBuyPrice.toLocaleString(undefined, {maximumFractionDigits: 2})}
                                  </div>
                                </div>
                                <div className="text-right">
                                   <div className="flex items-center justify-end gap-2">
                                      <span className="font-medium text-slate-700 dark:text-slate-300">{formatMoney(coin.value)}</span>
                                      <span className={`font-bold text-[10px] px-1.5 py-0.5 rounded ${coin.pnl >= 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                        {coin.pnl >= 0 ? '+' : ''}{coin.pnl.toFixed(1)}%
                                      </span>
                                   </div>
                                   <span className="text-slate-400 font-mono text-[10px]">{pct.toFixed(1)}% del portfolio</span>
                                </div>
                             </div>
                             <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                <div className={`h-full rounded-full ${coin.color} transition-all duration-1000 ease-out`} style={{ width: `${pct}%` }}></div>
                             </div>
                          </div>
                        )
                     })}
                     {chartsData.cryptoMix.length === 0 && <p className="text-xs text-slate-400 text-center py-4">No hay activos crypto aún.</p>}
                  </div>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  <div className="bg-white dark:bg-slate-800 rounded-xl border border-indigo-100 dark:border-indigo-900 shadow-sm overflow-hidden sticky top-32 transition-colors duration-300">
                    <div className="bg-indigo-50 dark:bg-indigo-900/30 px-6 py-4 border-b border-indigo-100 dark:border-indigo-900"><h3 className="font-bold flex items-center gap-2 text-indigo-900 dark:text-indigo-200"><Bitcoin size={18} /> Operación Crypto</h3></div>
                    <form onSubmit={handleAddCrypto} className="p-6 space-y-4">
                      
                      {/* Selector COMPRA / VENTA */}
                      <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-700 rounded-lg">
                        <button type="button" onClick={() => setNewCryptoType('buy')} className={`py-2 text-xs font-bold rounded-md transition-all uppercase ${newCryptoType === 'buy' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>Compra</button>
                        <button type="button" onClick={() => setNewCryptoType('sell')} className={`py-2 text-xs font-bold rounded-md transition-all uppercase ${newCryptoType === 'sell' ? 'bg-red-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>Venta</button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-700 rounded-lg">
                        <button type="button" onClick={() => setNewCryptoContributor('LUCAS')} className={`py-3 text-sm font-bold rounded-md transition-all uppercase ${newCryptoContributor === 'LUCAS' ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-300 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>LUCAS</button>
                        <button type="button" onClick={() => setNewCryptoContributor('AYELEN')} className={`py-3 text-sm font-bold rounded-md transition-all uppercase ${newCryptoContributor === 'AYELEN' ? 'bg-white dark:bg-slate-600 text-pink-600 dark:text-pink-300 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>AYELEN</button>
                      </div>
                      <div className="grid grid-cols-5 gap-1">
                         {['BTC', 'ETH', 'SOL', 'RENDER', 'USDT'].map(c => (
                           <button key={c} type="button" onClick={() => setNewCryptoCoin(c)} className={`py-2 text-[9px] sm:text-[10px] font-bold border rounded-lg transition-colors ${newCryptoCoin === c ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:border-indigo-300'}`}>{c}</button>
                         ))}
                      </div>
                      <div><label className="block text-xs font-bold uppercase mb-1 text-slate-500 dark:text-slate-400">Cantidad</label><input type="number" value={newCryptoAmount} onChange={(e) => setNewCryptoAmount(e.target.value)} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white" placeholder="0.0000" step="0.000001"/></div>
                      <div><label className="block text-xs font-bold uppercase mb-1 text-slate-500 dark:text-slate-400">Precio {newCryptoType === 'buy' ? 'Compra' : 'Venta'} (USD)</label><div className="relative"><span className="absolute left-3 top-3.5 text-sm text-slate-400">$</span><input type="number" value={newCryptoPrice} onChange={(e) => setNewCryptoPrice(e.target.value)} className="w-full pl-6 p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white" placeholder="Ej: 64000" step="0.01"/></div></div>
                      <div><label className="block text-xs font-bold uppercase mb-1 text-slate-500 dark:text-slate-400">Plataforma</label><div className="relative"><input type="text" value={newCryptoAccount} onChange={(e) => setNewCryptoAccount(e.target.value)} className="w-full pl-10 p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200" placeholder="Ej: Binance..." /><Layers className="absolute left-3 top-3.5 text-slate-400" size={16} /></div></div>
                      <div><label className="block text-xs font-bold uppercase mb-1 text-slate-500 dark:text-slate-400">Nota</label><input type="text" value={newCryptoNote} onChange={(e) => setNewCryptoNote(e.target.value)} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200" placeholder="Ej: DCA Semanal"/></div>
                      <button type="submit" className={`w-full text-white font-bold py-3.5 rounded-lg shadow-md hover:shadow-lg transition-all flex justify-center items-center gap-2 mt-4 active:scale-95 ${newCryptoType === 'buy' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-red-500 hover:bg-red-600'}`}><Save size={18} /> {newCryptoType === 'buy' ? 'Registrar Compra' : 'Registrar Venta'}</button>
                    </form>
                  </div>
                </div>
                <div className="lg:col-span-2">
                  <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col h-full min-h-[400px] transition-colors duration-300">
                    <div className="bg-slate-50 dark:bg-slate-900 px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center"><h3 className="font-bold text-slate-800 dark:text-white">Mis Tenencias (Lotes)</h3></div>
                    <div className="flex-1 overflow-auto max-h-[600px] p-2">
                      <table className="w-full text-sm text-left border-collapse min-w-[600px]">
                        <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 sticky top-0 z-10">
                          <tr><th className="px-3 py-3 rounded-l-lg">Moneda</th><th className="px-3 py-3 text-right">Cantidad</th><th className="px-3 py-3 text-right hidden sm:table-cell">Plataforma</th><th className="px-3 py-3 text-right">Valor Hoy</th><th className="px-3 py-3 text-center">P&L</th><th className="px-3 py-3 rounded-r-lg"></th></tr>
                        </thead>
                        <tbody>
                          {[...cryptoHoldings].sort((a,b) => new Date(b.date) - new Date(a.date)).map((t) => {
                            const currentPrice = getCoinPrice(t.coin);
                            const amountVal = parseFloat(t.amount);
                            const currentValue = Math.abs(amountVal) * currentPrice;
                            const costBasis = Math.abs(amountVal) * parseFloat(t.priceUsd);
                            // Simple P&L per lot (not ideal for negative lots but functional for tracking)
                            const profit = currentValue - costBasis;
                            const profitPercent = costBasis > 0 ? (profit / costBasis) * 100 : 0;
                            const isProfit = profit >= 0;
                            const isSell = amountVal < 0;

                            return (
                              <tr key={t.id} className="border-b border-slate-50 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors group">
                                <td className="px-3 py-3">
                                  <div className="flex items-center gap-2">
                                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${t.coin === 'BTC' ? 'bg-yellow-500' : t.coin === 'ETH' ? 'bg-purple-600' : t.coin === 'SOL' ? 'bg-cyan-500' : 'bg-green-500'}`}>{t.coin.substring(0,1)}</span>
                                    <div className="flex flex-col">
                                      <span className="font-bold text-slate-700 dark:text-slate-200">{t.coin} <span className={`text-[9px] px-1 rounded ${isSell ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>{isSell ? 'VENTA' : 'COMPRA'}</span></span>
                                      <span className="text-[10px] text-slate-400">{t.contributor} • {t.note}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className={`px-3 py-3 text-right font-mono ${amountVal < 0 ? 'text-red-500' : 'text-slate-600 dark:text-slate-300'}`}>{formatCrypto(amountVal)}</td>
                                <td className="px-3 py-3 text-right text-xs hidden sm:table-cell text-slate-500 dark:text-slate-400">{t.account}</td>
                                <td className="px-3 py-3 text-right font-bold text-indigo-900 dark:text-indigo-300">{viewCurrency === 'ARS' ? formatMoney(currentValue * exchangeRate) : `$${currentValue.toLocaleString(undefined, {maximumFractionDigits: 2})}`}</td>
                                <td className="px-3 py-3 text-center">
                                  {!isSell && (
                                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold ${isProfit ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>{isProfit ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}{profitPercent.toFixed(2)}%</div>
                                  )}
                                </td>
                                <td className="px-3 py-3 text-center"><button onClick={() => deleteCrypto(t.id)} className="p-1 rounded transition-all md:opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"><Trash2 size={16} /></button></td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
             </div>
          </div>
        )}

        {/* SIMULADOR REDISEÑADO (Gráfico de Área + Vida) */}
        {activeTab === 'simulator' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-slate-900 dark:bg-black text-white p-8 rounded-2xl shadow-lg relative overflow-hidden transition-colors duration-300">
               <div className="absolute top-0 right-0 p-32 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
               
               {/* Titulo */}
               <div className="relative z-10 flex items-center justify-between mb-8">
                 <div>
                   <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-2"><Calculator className="text-emerald-400" /> Proyección de Futuro</h2>
                   <p className="text-slate-400 text-xs md:text-sm">Visualiza el poder del interés compuesto en tus inversiones.</p>
                 </div>
                 <div className="text-right">
                    <div className="text-xs text-slate-400 uppercase font-bold">Total Proyectado</div>
                    <div className="text-3xl md:text-5xl font-bold text-emerald-400">{new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(compoundData.finalBalance)}</div>
                 </div>
               </div>

               <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
                 {/* Inputs */}
                 <div className="space-y-4 lg:col-span-1 bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-white/10">
                    <div className="space-y-1">
                      <label className="text-xs text-slate-300 uppercase font-bold">Capital Inicial</label>
                      <input type="number" value={simInitial} onChange={(e) => setSimInitial(Number(e.target.value))} className="w-full bg-slate-800/50 text-xl font-bold text-white p-3 rounded-lg border border-slate-700 focus:border-emerald-500 outline-none transition-colors"/>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-300 uppercase font-bold">Aporte Mensual</label>
                      <input type="number" value={simMonthly} onChange={(e) => setSimMonthly(Number(e.target.value))} className="w-full bg-slate-800/50 text-xl font-bold text-white p-3 rounded-lg border border-slate-700 focus:border-emerald-500 outline-none transition-colors"/>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs text-slate-300 uppercase font-bold">Tasa Anual %</label>
                        <input type="number" value={simRate} onChange={(e) => setSimRate(Number(e.target.value))} className="w-full bg-slate-800/50 text-xl font-bold text-emerald-400 p-3 rounded-lg border border-slate-700 focus:border-emerald-500 outline-none transition-colors"/>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-slate-300 uppercase font-bold">Años</label>
                        <input type="number" value={simYears} onChange={(e) => setSimYears(Number(e.target.value))} className="w-full bg-slate-800/50 text-xl font-bold text-white p-3 rounded-lg border border-slate-700 focus:border-emerald-500 outline-none transition-colors"/>
                      </div>
                    </div>
                 </div>

                 {/* Gráfico SVG Personalizado (Area Chart) */}
                 <div className="lg:col-span-2 bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-white/10 flex flex-col justify-between relative min-h-[300px]">
                    
                    {/* Leyenda */}
                    <div className="flex gap-6 justify-end text-xs font-bold mb-4">
                       <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-500"></div> TU ESFUERZO</div>
                       <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> INTERÉS GANADO</div>
                    </div>

                    {/* El Gráfico SVG */}
                    <div className="flex-1 w-full relative">
                        <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox={`0 0 ${compoundData.chartData.length * 10} 100`}>
                           {/* Gradientes */}
                           <defs>
                              <linearGradient id="gradientTotal" x1="0" x2="0" y1="0" y2="1">
                                 <stop offset="0%" stopColor="#10b981" stopOpacity="0.5"/>
                                 <stop offset="100%" stopColor="#10b981" stopOpacity="0"/>
                              </linearGradient>
                           </defs>

                           {/* Linea Capital (Aportado) */}
                           <polyline
                              fill="none"
                              stroke="#64748b"
                              strokeWidth="2"
                              strokeDasharray="4"
                              points={generatePolyline(compoundData.chartData, 'contributed', compoundData.chartData.length * 10, 100)}
                           />

                           {/* Area Total (Interés) */}
                           <polygon
                              fill="url(#gradientTotal)"
                              points={`0,100 ${generatePolyline(compoundData.chartData, 'balance', compoundData.chartData.length * 10, 100).replace(/ /g, ',')} ${compoundData.chartData.length * 10},100`}
                           />
                           <polyline
                              fill="none"
                              stroke="#10b981"
                              strokeWidth="3"
                              points={generatePolyline(compoundData.chartData, 'balance', compoundData.chartData.length * 10, 100)}
                           />
                        </svg>
                        
                        {/* Etiquetas Eje X (Años) */}
                        <div className="absolute bottom-0 w-full flex justify-between text-[10px] text-slate-500 pt-2">
                           <span>Hoy</span>
                           <span>{simYears / 2} Años</span>
                           <span>{simYears} Años</span>
                        </div>
                    </div>

                    <div className="mt-4 flex justify-between items-end border-t border-slate-700 pt-4">
                        <div>
                           <div className="text-xs text-slate-400">Total Aportado</div>
                           <div className="text-xl font-bold text-slate-300">{new Intl.NumberFormat('es-AR', { notation: "compact", compactDisplay: "short" }).format(compoundData.totalContributed)}</div>
                        </div>
                        <div className="text-right">
                           <div className="text-xs text-emerald-400 font-bold mb-1 flex items-center justify-end gap-1"><Sparkles size={12}/> Ganancia Pura</div>
                           <div className="text-2xl font-bold text-emerald-400">+{new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(compoundData.finalBalance - compoundData.totalContributed)}</div>
                        </div>
                    </div>
                 </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'charts' && (
          <div className="space-y-6 animate-in fade-in duration-300">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center transition-colors duration-300">
                   <h3 className="font-bold mb-6 flex items-center gap-2 text-slate-800 dark:text-white"><PieChart size={18} className="text-emerald-600"/> Distribución de Riqueza</h3>
                   <div className="relative w-48 h-48 rounded-full border-8 border-slate-100 dark:border-slate-700 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full" style={{ background: netWorth > 0 ? `conic-gradient(#10b981 0% ${(isNaN(totalCashSaved) ? 0 : totalCashSaved / netWorth) * 100}%, #4f46e5 ${(isNaN(totalCashSaved) ? 0 : totalCashSaved / netWorth) * 100}% 100%)` : '#e2e8f0' }}></div>
                      <div className="absolute inset-2 bg-white dark:bg-slate-800 rounded-full flex flex-col items-center justify-center z-10"><span className="text-xs font-bold uppercase text-slate-400">Total</span><span className="text-lg font-bold text-slate-800 dark:text-white">{new Intl.NumberFormat('es-AR', { notation: "compact", compactDisplay: "short" }).format(netWorth)}</span></div>
                   </div>
                   <div className="mt-6 w-full space-y-2">
                      {chartsData.distribution.map((d, i) => (
                         <div key={i} className="flex justify-between items-center text-sm"><div className="flex items-center gap-2"><div className={`w-3 h-3 rounded-full ${d.color}`}></div><span className="text-slate-600 dark:text-slate-300">{d.name}</span></div><span className="font-bold text-slate-800 dark:text-white">{netWorth > 0 ? ((d.value / netWorth) * 100).toFixed(1) : 0}%</span></div>
                      ))}
                   </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col transition-colors duration-300">
                   <h3 className="font-bold mb-6 flex items-center gap-2 text-slate-800 dark:text-white"><Users size={18} className="text-blue-600"/> Batalla de Ahorristas</h3>
                   <div className="flex-1 flex flex-col justify-center gap-6">
                      {chartsData.contributors.map((c, i) => (
                         <div key={i}>
                            <div className="flex justify-between mb-1 text-sm font-bold"><span className={c.name === 'LUCAS' ? 'text-blue-700 dark:text-blue-400' : 'text-pink-700 dark:text-pink-400'}>{c.name}</span><span className="text-slate-500 dark:text-slate-400">{formatMoney(c.value)}</span></div>
                            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-6 overflow-hidden relative"><div className={`h-full ${c.color} transition-all duration-1000`} style={{ width: `${netWorth > 0 ? (c.value / netWorth) * 100 : 0}%` }}></div></div>
                         </div>
                      ))}
                   </div>
                   <p className="text-xs text-center mt-4 italic text-slate-400">¿Quién invita la cena este mes?</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col transition-colors duration-300">
                   <h3 className="font-bold mb-6 flex items-center gap-2 text-slate-800 dark:text-white"><Layers size={18} className="text-indigo-600"/> Crypto Mix</h3>
                   <div className="flex-1 flex items-end gap-3 px-2 pb-2 min-h-[150px]">
                      {chartsData.cryptoMix.map((c, i) => {
                         const pct = totalCryptoValueUSD > 0 ? (c.value / totalCryptoValueView) * 100 : 0;
                         return (
                            <div key={i} className="flex-1 flex flex-col justify-end group cursor-pointer"><div className="text-xs text-center font-bold mb-1 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 dark:text-slate-300">{pct.toFixed(0)}%</div><div className={`w-full ${c.color} rounded-t-lg transition-all hover:opacity-80`} style={{ height: `${pct}%`, minHeight: '10px' }}></div><div className="text-[10px] text-center font-bold mt-2 text-slate-400">{c.name}</div></div>
                         )
                      })}
                   </div>
                </div>
             </div>
             <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors duration-300">
                 <h3 className="font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-white"><LineChart size={18} className="text-slate-600 dark:text-slate-400"/> Historia Financiera</h3>
                 <div className="h-48 flex items-end justify-between gap-1 border-b border-l border-slate-200 dark:border-slate-700 p-4 relative">
                    {[...transactions, ...cryptoHoldings].sort((a,b) => new Date(a.date) - new Date(b.date)).slice(-10).map((t, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-2 group"><div className="w-1 md:w-2 bg-slate-300 dark:bg-slate-600 rounded-full h-1/2 group-hover:bg-indigo-500 transition-colors"></div><span className="text-[8px] md:text-[10px] -rotate-45 origin-top-left translate-y-4 text-slate-400">{new Date(t.date).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</span></div>
                    ))}
                 </div>
                 <p className="text-xs mt-8 text-center text-slate-400">Visualización simplificada de la actividad reciente.</p>
             </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardFinanciero;