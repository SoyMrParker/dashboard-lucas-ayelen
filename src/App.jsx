import React, { useState, useMemo, useEffect } from 'react';
import { Wallet, TrendingUp, TrendingDown, Target, Plus, Trash2, Save, Calculator, DollarSign, ArrowUpRight, Users, Settings, User, CreditCard, RefreshCcw, Bitcoin, Activity, Layers, PieChart, BarChart2, LineChart, AlertTriangle, RotateCcw, WifiOff, Cloud } from 'lucide-react';

// --- 1. IMPORTACIONES DE FIREBASE ---
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, addDoc, deleteDoc, doc, onSnapshot, updateDoc, setDoc, query, orderBy } from "firebase/firestore";

// --- 2. TUS CREDENCIALES NUEVAS (Ya configuradas) ---
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

// CLAVE FAMILIAR: Esto asegura que ambos vean los mismos datos
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
      document.head.appendChild(script);
    }
  }, []);

  // --- CONEXIÓN A FIREBASE (LOGIN SILENCIOSO) ---
  useEffect(() => {
    signInAnonymously(auth)
      .then(() => setAuthError(null))
      .catch((error) => {
        console.error("Error Firebase:", error);
        if (error.code === 'auth/admin-restricted-operation' || error.code === 'auth/configuration-not-found') {
          setAuthError("⚠️ ERROR DE PERMISOS: Debes habilitar 'Anónimo' en Firebase Console (Authentication).");
        } else if (error.code === 'permission-denied') {
           setAuthError("⚠️ ERROR DE REGLAS: Falta configurar reglas en Firestore Database.");
        } else {
          setAuthError(`Error de conexión: ${error.message}`);
        }
      });
    return onAuthStateChanged(auth, setUser);
  }, []);

  // --- ESTADOS DE DATOS ---
  const [viewCurrency, setViewCurrency] = useState('ARS');
  const [savingsGoal, setSavingsGoal] = useState(1000000);
  const [exchangeRate, setExchangeRate] = useState(1050);
  const [transactions, setTransactions] = useState([]);
  const [cryptoHoldings, setCryptoHoldings] = useState([]);
  
  // Simulador (Datos locales temporales)
  const [simInitial, setSimInitial] = useState(100000);
  const [simMonthly, setSimMonthly] = useState(20000);
  const [simRate, setSimRate] = useState(35);
  const [simYears, setSimYears] = useState(5);

  // --- SINCRONIZACIÓN EN TIEMPO REAL ---
  
  // 1. Configuración General (CORREGIDO: Agregado 'config' al path para evitar error de segmentos)
  useEffect(() => {
    if (!user) return;
    // CORRECCIÓN AQUÍ: Se agregó 'general_config' al final para que la ruta sea válida (par)
    const settingsRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'app_settings', 'general_config');
    const unsub = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.viewCurrency) setViewCurrency(data.viewCurrency);
        if (data.savingsGoal) setSavingsGoal(data.savingsGoal);
        if (data.exchangeRate) setExchangeRate(data.exchangeRate);
      } else {
        // Crear configuración inicial si no existe
        setDoc(settingsRef, { viewCurrency: 'ARS', savingsGoal: 1000000, exchangeRate: 1050 });
      }
    }, (error) => {
        // Si hay error de permisos al leer
       if (error.code === 'permission-denied') setAuthError("⚠️ ERROR DE REGLAS: Falta configurar reglas de base de datos en Firestore (Paso 2 de la guía).");
    });
    return () => unsub();
  }, [user]);

  // 2. Transacciones (Caja)
  useEffect(() => {
    if (!user) return;
    const q = collection(db, 'artifacts', APP_ID, 'public', 'data', 'transactions');
    const unsub = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTransactions(items);
    });
    return () => unsub();
  }, [user]);

  // 3. Crypto
  useEffect(() => {
    if (!user) return;
    const q = collection(db, 'artifacts', APP_ID, 'public', 'data', 'crypto_holdings');
    const unsub = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCryptoHoldings(items);
    });
    return () => unsub();
  }, [user]);

  // --- FUNCIONES DE GUARDADO (CLOUD) ---
  const updateSettings = async (field, value) => {
    // Actualizamos visualmente al instante
    if(field === 'viewCurrency') setViewCurrency(value);
    if(field === 'savingsGoal') setSavingsGoal(value);
    if(field === 'exchangeRate') setExchangeRate(value);

    if (!user) return;
    // CORRECCIÓN AQUÍ TAMBIÉN: Usar el mismo path corregido
    const settingsRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'app_settings', 'general_config');
    // Usamos setDoc con merge para crear o actualizar
    await setDoc(settingsRef, { [field]: value }, { merge: true });
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!newAmount || !user) return;
    
    await addDoc(collection(db, 'artifacts', APP_ID, 'public', 'data', 'transactions'), {
      date: newDate,
      amount: parseFloat(newAmount),
      currency: newCurrency,
      contributor: newContributor,
      account: newAccount || 'General',
      type: 'deposit',
      note: newNote || 'Ahorro mensual',
      createdAt: new Date().toISOString()
    });
    setNewAmount(''); setNewNote(''); setNewAccount('');
  };

  const deleteTransaction = async (id) => {
    if (!user) return;
    await deleteDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'transactions', id));
  };

  const handleAddCrypto = async (e) => {
    e.preventDefault();
    if (!newCryptoAmount || !newCryptoPrice || !user) return;

    await addDoc(collection(db, 'artifacts', APP_ID, 'public', 'data', 'crypto_holdings'), {
      date: new Date().toISOString().split('T')[0],
      coin: newCryptoCoin,
      amount: parseFloat(newCryptoAmount),
      priceUsd: parseFloat(newCryptoPrice),
      contributor: newCryptoContributor,
      account: newCryptoAccount || 'Exchange',
      note: newCryptoNote || 'Compra spot',
      createdAt: new Date().toISOString()
    });
    setNewCryptoAmount(''); setNewCryptoPrice(''); setNewCryptoNote(''); setNewCryptoAccount('');
  };

  const deleteCrypto = async (id) => {
    if (!user) return;
    await deleteDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'crypto_holdings', id));
  };

  // --- API PRECIOS ---
  const [cryptoPrices, setCryptoPrices] = useState({ bitcoin: { usd: 95000 }, ethereum: { usd: 3400 }, solana: { usd: 195 }, tether: { usd: 1.00 } });
  const [loadingPrices, setLoadingPrices] = useState(false);

  const fetchPrices = async () => {
    setLoadingPrices(true);
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,tether&vs_currencies=usd');
      if (!response.ok) throw new Error("API Limit");
      const data = await response.json();
      if (data && data.bitcoin) {
        setCryptoPrices(prev => ({ ...prev, bitcoin: data.bitcoin || prev.bitcoin, ethereum: data.ethereum || prev.ethereum, solana: data.solana || prev.solana, tether: data.tether || { usd: 1.00 } }));
      }
    } catch (error) { console.warn("Precios offline"); } finally { setLoadingPrices(false); }
  };
  useEffect(() => { fetchPrices(); const i = setInterval(fetchPrices, 60000); return () => clearInterval(i); }, []);

  // --- INPUTS ---
  const [newAmount, setNewAmount] = useState('');
  const [newCurrency, setNewCurrency] = useState('ARS');
  const [newContributor, setNewContributor] = useState('LUCAS');
  const [newAccount, setNewAccount] = useState(''); 
  const [newNote, setNewNote] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
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
    const map = { 'BTC': 'bitcoin', 'ETH': 'ethereum', 'SOL': 'solana', 'USDT': 'tether' };
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
    for (let i = 1; i <= months; i++) {
      current = current * (1 + rate) + parseFloat(simMonthly || 0);
      contributed += parseFloat(simMonthly || 0);
      if (i % 12 === 0) data.push({ year: i / 12, balance: current, contributed });
    }
    return { finalBalance: current, totalContributed: contributed, chartData: data };
  }, [simInitial, simMonthly, simRate, simYears]);

  const chartsData = useMemo(() => {
    const cryptoMix = ['BTC', 'ETH', 'SOL', 'USDT'].map(coin => {
      const val = cryptoHoldings.filter(h => h.coin === coin).reduce((acc, h) => acc + parseFloat(h.amount || 0) * getCoinPrice(coin), 0);
      return { 
        name: coin, 
        value: viewCurrency === 'ARS' ? val * exchangeRate : val,
        color: coin === 'BTC' ? 'bg-yellow-500' : coin === 'ETH' ? 'bg-purple-600' : coin === 'SOL' ? 'bg-cyan-500' : 'bg-green-500'
      };
    }).filter(i => i.value > 0);
    return { 
      distribution: [{ name: 'Caja', value: totalCashSaved, color: 'bg-emerald-500' }, { name: 'Crypto', value: totalCryptoValueView, color: 'bg-indigo-600' }],
      cryptoMix, 
      contributors: [{ name: 'LUCAS', value: totalLucas, color: 'bg-blue-500' }, { name: 'AYELEN', value: totalAyelen, color: 'bg-pink-500' }]
    };
  }, [totalCashSaved, totalCryptoValueView, cryptoHoldings, cryptoPrices, viewCurrency, exchangeRate]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-emerald-200">
      
      {/* BARRA DE ESTADO DE CONEXIÓN */}
      <div className={`px-4 py-2 text-xs font-bold text-center flex justify-center items-center gap-2 ${authError ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>
        {authError ? (
          <span className="flex items-center gap-2 animate-pulse">
            <AlertTriangle size={14}/> {authError}
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Cloud size={14}/> Conectado a la Nube (Firebase: finanzas-lucas-ayelen)
          </span>
        )}
      </div>

      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 overflow-hidden">
          <div className="max-w-5xl mx-auto flex justify-between items-center">
             <div className="flex gap-4 md:gap-6 animate-pulse-slow overflow-x-auto whitespace-nowrap scrollbar-hide">
               <span className="flex items-center gap-1 font-mono"><Bitcoin size={14} className="text-yellow-500"/> BTC: <span className="text-white">${cryptoPrices.bitcoin?.usd.toLocaleString()}</span></span>
               <span className="flex items-center gap-1 font-mono"><Activity size={14} className="text-purple-500"/> ETH: <span className="text-white">${cryptoPrices.ethereum?.usd.toLocaleString()}</span></span>
               <span className="flex items-center gap-1 font-mono"><Activity size={14} className="text-cyan-500"/> SOL: <span className="text-white">${cryptoPrices.solana?.usd.toLocaleString()}</span></span>
               <span className="flex items-center gap-1 font-mono"><DollarSign size={14} className="text-green-500"/> USDT: <span className="text-white">${cryptoPrices.tether?.usd.toLocaleString()}</span></span>
             </div>
             <div className="flex gap-2">
                <button onClick={fetchPrices} className="hover:text-white transition-colors flex items-center gap-1 ml-2 whitespace-nowrap"><RefreshCcw size={10} className={loadingPrices ? "animate-spin" : ""} /> Actualizar</button>
             </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-2 rounded-lg text-white shadow-lg"><Users size={24} /></div>
              <div><h1 className="text-xl font-bold text-slate-900 leading-none">Patrimonio Total</h1><span className="text-xs text-slate-500 font-medium tracking-wide uppercase">LUCAS & AYELEN</span></div>
              <div className="ml-4 px-4 py-1 bg-slate-100 rounded-full border border-slate-200"><span className="text-xs text-slate-400 uppercase font-bold mr-2">TOTAL ACUMULADO:</span><span className="text-lg font-bold text-slate-800">{formatMoney(netWorth)}</span></div>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-lg w-full md:w-auto overflow-x-auto">
              {['dashboard', 'crypto', 'simulator', 'charts'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 whitespace-nowrap px-4 py-2 rounded-md text-sm font-medium transition-all uppercase ${activeTab === tab ? 'bg-white shadow text-emerald-700' : 'text-slate-500 hover:text-slate-700'}`}>{tab === 'dashboard' ? 'CAJA DE AHORRO' : tab === 'crypto' ? 'PORTFOLIO CRYPTO' : tab === 'charts' ? 'GRÁFICOS' : 'SIMULADOR'}</button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm bg-slate-50 p-2 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 bg-white px-3 py-1 rounded border border-slate-200 shadow-sm"><Settings size={14} className="text-slate-400"/><span className="text-slate-600 font-medium">Cotización Dólar:</span><span className="text-slate-400 font-mono">$</span><input type="number" value={exchangeRate} onChange={(e) => updateSettings('exchangeRate', Number(e.target.value))} className="w-20 font-bold text-slate-700 outline-none border-b border-dotted border-slate-300 focus:border-emerald-500" step="0.01"/></div>
            <div className="flex items-center gap-2 ml-auto"><span className="text-slate-500 hidden sm:inline">Ver todo en:</span><div className="flex gap-1">{['ARS', 'USD'].map(curr => (<button key={curr} onClick={() => updateSettings('viewCurrency', curr)} className={`px-3 py-1 rounded text-xs font-bold transition-colors border ${viewCurrency === curr ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'}`}>{curr}</button>))}</div></div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-36 relative overflow-hidden">
                <div className="flex justify-between items-start z-10"><span className="text-slate-500 text-sm font-medium uppercase tracking-wider">CAJA DE AHORRO</span><Wallet className="text-emerald-500" size={20} /></div>
                <div className="z-10"><span className="text-3xl font-bold text-slate-900 block tracking-tight truncate">{formatMoney(totalCashSaved)}</span><span className="text-xs text-slate-400 font-medium mt-1 block">{viewCurrency === 'ARS' ? `≈ ${formatMoney(totalCashSaved / exchangeRate, 'USD')}` : `≈ ${formatMoney(totalCashSaved * exchangeRate, 'ARS')}`}</span></div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-36">
                <div className="flex justify-between items-start"><span className="text-slate-500 text-sm font-medium uppercase tracking-wider">OBJETIVO ({viewCurrency})</span><Target className="text-blue-500" size={20} /></div>
                <div className="w-full">
                  <div className="flex justify-between items-end mb-2"><input type="text" value={new Intl.NumberFormat('es-AR').format(savingsGoal)} onChange={handleGoalChange} className="text-2xl font-bold text-slate-900 bg-transparent outline-none border-b border-transparent hover:border-slate-300 focus:border-blue-500 transition-colors w-2/3" /><span className="text-sm font-bold text-emerald-600">{progress.toFixed(1)}%</span></div>
                  <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden relative"><div className="bg-emerald-500 h-4 rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div></div>
                </div>
              </div>
              <div className="bg-slate-900 p-6 rounded-xl shadow-sm text-white flex flex-col justify-between h-36 relative overflow-hidden">
                <div className="z-10 relative h-full flex flex-col justify-center gap-3">
                  <div className="flex justify-between items-center border-b border-slate-700 pb-2"><span className="flex items-center gap-2 text-sm font-medium text-slate-300 uppercase"><User size={14} className="text-blue-400"/> LUCAS</span><span className="font-bold font-mono text-sm">{formatMoney(totalLucas)}</span></div>
                  <div className="flex justify-between items-center"><span className="flex items-center gap-2 text-sm font-medium text-slate-300 uppercase"><User size={14} className="text-pink-400"/> AYELEN</span><span className="font-bold font-mono text-sm">{formatMoney(totalAyelen)}</span></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden sticky top-32">
                  <div className="bg-slate-50 px-6 py-4 border-b border-slate-100"><h3 className="font-bold text-slate-800 flex items-center gap-2"><Plus size={18} /> Ingreso a Caja</h3></div>
                  <form onSubmit={handleAddTransaction} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
                      <button type="button" onClick={() => setNewContributor('LUCAS')} className={`py-2 text-sm font-bold rounded-md transition-all uppercase ${newContributor === 'LUCAS' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>LUCAS</button>
                      <button type="button" onClick={() => setNewContributor('AYELEN')} className={`py-2 text-sm font-bold rounded-md transition-all uppercase ${newContributor === 'AYELEN' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>AYELEN</button>
                    </div>
                    <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Monto</label><div className="relative"><input type="number" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} className="w-full pl-3 pr-20 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-mono text-lg" placeholder="0.00" min="0" step="0.01"/><select value={newCurrency} onChange={(e) => setNewCurrency(e.target.value)} className="absolute right-1 top-1 bottom-1 w-18 bg-slate-100 border-none rounded text-xs font-bold text-slate-600 cursor-pointer outline-none hover:bg-slate-200"><option value="ARS">ARS</option><option value="USD">USD</option></select></div></div>
                    <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Cuenta</label><div className="relative"><input type="text" value={newAccount} onChange={(e) => setNewAccount(e.target.value)} className="w-full pl-10 p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-slate-700" placeholder="Ej: Mercado Pago..." /><CreditCard className="absolute left-3 top-3.5 text-slate-400" size={16} /></div></div>
                    <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Fecha</label><input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-slate-700"/></div>
                    <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nota</label><input type="text" value={newNote} onChange={(e) => setNewNote(e.target.value)} className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-slate-700" placeholder="Ej: Aguinaldo..."/></div>
                    <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg shadow-md hover:shadow-lg transition-all flex justify-center items-center gap-2 mt-2"><Save size={18} /> Guardar</button>
                  </form>
                </div>
              </div>
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full min-h-[400px]">
                  <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center"><h3 className="font-bold text-slate-800">Historial de Caja</h3><div className="text-xs text-slate-500 bg-slate-200 px-2 py-1 rounded">{transactions.length} registros</div></div>
                  <div className="flex-1 overflow-auto max-h-[600px] p-2">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0 z-10"><tr><th className="px-3 py-3 rounded-l-lg">Quién</th><th className="px-3 py-3">Fecha</th><th className="px-3 py-3">Concepto</th><th className="px-3 py-3">Cuenta</th><th className="px-3 py-3 text-right">Monto</th><th className="px-3 py-3 rounded-r-lg"></th></tr></thead>
                      <tbody>
                        {[...transactions].sort((a,b) => new Date(b.date) - new Date(a.date)).map((t) => (
                          <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors group">
                            <td className="px-3 py-3"><span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${t.contributor === 'LUCAS' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-pink-50 text-pink-700 border border-pink-100'}`}>{t.contributor === 'LUCAS' ? 'L' : 'A'}</span></td>
                            <td className="px-3 py-3 font-medium text-slate-500 text-xs">{new Date(t.date).toLocaleDateString('es-AR', {timeZone: 'UTC', day: '2-digit', month: '2-digit'})}</td>
                            <td className="px-3 py-3 text-slate-800 font-medium truncate max-w-[120px]">{t.note}</td>
                            <td className="px-3 py-3 text-slate-500 text-xs truncate max-w-[100px]"><div className="flex items-center gap-1"><CreditCard size={12} className="text-slate-400" />{t.account}</div></td>
                            <td className="px-3 py-3 text-right"><span className={`font-bold ${t.currency === 'USD' ? 'text-emerald-700' : 'text-slate-700'}`}>{t.currency === 'USD' ? 'u$s' : '$'} {new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2 }).format(t.amount)}</span></td>
                            <td className="px-3 py-3 text-center"><button onClick={() => deleteTransaction(t.id)} className="text-slate-300 hover:text-red-500 p-1 hover:bg-red-50 rounded transition-all opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button></td>
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
                <div className="bg-indigo-900 text-white p-6 rounded-xl relative overflow-hidden flex flex-col justify-between h-40">
                  <div className="absolute right-0 top-0 p-16 bg-indigo-500 rounded-full blur-3xl opacity-20"></div>
                  <div className="relative z-10"><span className="text-indigo-200 text-sm font-bold uppercase tracking-wider">Valor de Mercado Actual</span><div className="flex items-baseline gap-2 mt-2"><span className="text-4xl font-bold">{formatMoney(totalCryptoValueView)}</span></div></div>
                  <div className="relative z-10 flex gap-4 text-xs text-indigo-200 mt-4"><span className="bg-indigo-800/50 px-2 py-1 rounded">{viewCurrency === 'ARS' ? `≈ ${formatMoney(totalCryptoValueView / exchangeRate, 'USD')}` : `≈ ${formatMoney(totalCryptoValueView * exchangeRate, 'ARS')}`}</span></div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-40 flex flex-col">
                  <h3 className="font-bold text-slate-700 mb-4">Composición del Portafolio</h3>
                  <div className="flex-1 flex items-end gap-2 px-4 pb-2">
                     {['BTC', 'ETH', 'SOL', 'USDT'].map((coin, idx) => {
                        const totalCoin = cryptoHoldings.filter(h => h.coin === coin).reduce((acc, h) => acc + h.amount * getCoinPrice(coin), 0);
                        const pct = totalCryptoValueUSD > 0 ? (totalCoin / totalCryptoValueUSD) * 100 : 0;
                        const colors = ['bg-yellow-500', 'bg-purple-500', 'bg-cyan-500', 'bg-green-500'];
                        return (
                          <div key={coin} className="flex-1 flex flex-col justify-end group relative"><div className={`w-full ${colors[idx]} rounded-t-md transition-all duration-500`} style={{ height: `${pct || 5}%`, minHeight: '4px' }}></div><span className="text-xs text-center font-bold text-slate-500 mt-1">{coin}</span><span className="text-[10px] text-center text-slate-400">{pct.toFixed(0)}%</span></div>
                        )
                     })}
                  </div>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-xl border border-indigo-100 shadow-sm overflow-hidden sticky top-32">
                    <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100"><h3 className="font-bold text-indigo-900 flex items-center gap-2"><Bitcoin size={18} /> Nueva Compra</h3></div>
                    <form onSubmit={handleAddCrypto} className="p-6 space-y-4">
                      <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
                        <button type="button" onClick={() => setNewCryptoContributor('LUCAS')} className={`py-2 text-sm font-bold rounded-md transition-all uppercase ${newCryptoContributor === 'LUCAS' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>LUCAS</button>
                        <button type="button" onClick={() => setNewCryptoContributor('AYELEN')} className={`py-2 text-sm font-bold rounded-md transition-all uppercase ${newCryptoContributor === 'AYELEN' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>AYELEN</button>
                      </div>
                      <div className="grid grid-cols-4 gap-1">
                         {['BTC', 'ETH', 'SOL', 'USDT'].map(c => (
                           <button key={c} type="button" onClick={() => setNewCryptoCoin(c)} className={`py-2 text-[10px] sm:text-xs font-bold border rounded-lg transition-colors ${newCryptoCoin === c ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'}`}>{c}</button>
                         ))}
                      </div>
                      <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Cantidad Comprada</label><input type="number" value={newCryptoAmount} onChange={(e) => setNewCryptoAmount(e.target.value)} className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-lg" placeholder="0.0000" step="0.000001"/></div>
                      <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Precio de Compra (USD)</label><div className="relative"><span className="absolute left-3 top-3.5 text-slate-400 text-sm">$</span><input type="number" value={newCryptoPrice} onChange={(e) => setNewCryptoPrice(e.target.value)} className="w-full pl-6 p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono" placeholder="Ej: 64000" step="0.01"/></div><p className="text-[10px] text-slate-400 mt-1">Precio unitario al momento de la compra</p></div>
                      <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Plataforma / Cuenta</label><div className="relative"><input type="text" value={newCryptoAccount} onChange={(e) => setNewCryptoAccount(e.target.value)} className="w-full pl-10 p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700" placeholder="Ej: Binance, Lemon..." /><Layers className="absolute left-3 top-3.5 text-slate-400" size={16} /></div></div>
                      <div><label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nota</label><input type="text" value={newCryptoNote} onChange={(e) => setNewCryptoNote(e.target.value)} className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700" placeholder="Ej: DCA Semanal"/></div>
                      <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg shadow-md hover:shadow-lg transition-all flex justify-center items-center gap-2 mt-2"><Save size={18} /> Registrar Compra</button>
                    </form>
                  </div>
                </div>
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full min-h-[400px]">
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center"><h3 className="font-bold text-slate-800">Mis Tenencias (Lotes)</h3></div>
                    <div className="flex-1 overflow-auto max-h-[600px] p-2">
                      <table className="w-full text-sm text-left border-collapse">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0 z-10">
                          <tr><th className="px-3 py-3 rounded-l-lg">Moneda</th><th className="px-3 py-3 text-right">Cantidad</th><th className="px-3 py-3 text-right hidden sm:table-cell">Plataforma</th><th className="px-3 py-3 text-right">Valor Hoy</th><th className="px-3 py-3 text-center">P&L</th><th className="px-3 py-3 rounded-r-lg"></th></tr>
                        </thead>
                        <tbody>
                          {[...cryptoHoldings].sort((a,b) => new Date(b.date) - new Date(a.date)).map((t) => {
                            const currentPrice = getCoinPrice(t.coin);
                            const currentValue = t.amount * currentPrice;
                            const costBasis = t.amount * t.priceUsd;
                            const profit = currentValue - costBasis;
                            const profitPercent = costBasis > 0 ? (profit / costBasis) * 100 : 0;
                            const isProfit = profit >= 0;
                            return (
                              <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors group">
                                <td className="px-3 py-3"><div className="flex items-center gap-2"><span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${t.coin === 'BTC' ? 'bg-yellow-500' : t.coin === 'ETH' ? 'bg-purple-600' : t.coin === 'SOL' ? 'bg-cyan-500' : 'bg-green-500'}`}>{t.coin}</span><div className="flex flex-col"><span className="font-bold text-slate-700">{t.coin}</span><span className="text-[10px] text-slate-400">{t.contributor}</span></div></div></td>
                                <td className="px-3 py-3 text-right font-mono text-slate-600">{formatCrypto(t.amount)}</td>
                                <td className="px-3 py-3 text-right text-slate-500 text-xs hidden sm:table-cell">{t.account}</td>
                                <td className="px-3 py-3 text-right font-bold text-indigo-900">{viewCurrency === 'ARS' ? formatMoney(currentValue * exchangeRate) : `$${currentValue.toLocaleString(undefined, {maximumFractionDigits: 2})}`}</td>
                                <td className="px-3 py-3 text-center"><div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold ${isProfit ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{isProfit ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}{profitPercent.toFixed(2)}%</div></td>
                                <td className="px-3 py-3 text-center"><button onClick={() => deleteCrypto(t.id)} className="text-slate-300 hover:text-red-500 p-1 hover:bg-red-50 rounded transition-all opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button></td>
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

        {activeTab === 'simulator' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-slate-900 text-white p-8 rounded-2xl shadow-lg relative overflow-hidden">
               <div className="absolute top-0 right-0 p-32 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
               <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                 <div>
                   <h2 className="text-3xl font-bold mb-2 flex items-center gap-2"><Calculator className="text-emerald-400" /> Proyección</h2>
                   <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700"><label className="text-xs text-slate-400 uppercase font-bold block mb-1">Capital Inicial</label><input type="number" value={simInitial} onChange={(e) => setSimInitial(Number(e.target.value))} className="w-full bg-transparent text-xl font-bold text-white outline-none border-b border-slate-600 focus:border-emerald-400 transition-colors"/></div>
                      <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700"><label className="text-xs text-slate-400 uppercase font-bold block mb-1">Aporte Mensual</label><input type="number" value={simMonthly} onChange={(e) => setSimMonthly(Number(e.target.value))} className="w-full bg-transparent text-xl font-bold text-white outline-none border-b border-slate-600 focus:border-emerald-400 transition-colors"/></div>
                      <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700"><label className="text-xs text-slate-400 uppercase font-bold block mb-1">Tasa Anual (%)</label><input type="number" value={simRate} onChange={(e) => setSimRate(Number(e.target.value))} className="w-full bg-transparent text-xl font-bold text-emerald-400 outline-none border-b border-slate-600 focus:border-emerald-400 transition-colors"/></div>
                      <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700"><label className="text-xs text-slate-400 uppercase font-bold block mb-1">Años</label><input type="number" value={simYears} onChange={(e) => setSimYears(Number(e.target.value))} className="w-full bg-transparent text-xl font-bold text-white outline-none border-b border-slate-600 focus:border-emerald-400 transition-colors"/></div>
                   </div>
                 </div>
                 <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10 h-full flex flex-col justify-between">
                    <div className="text-center mb-6"><span className="text-sm text-slate-300 font-medium uppercase tracking-wider">Proyección Final</span><div className="text-4xl md:text-5xl font-bold text-emerald-300 mt-2 truncate">{new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 2 }).format(compoundData.finalBalance)}</div></div>
                    <div className="flex-1 flex items-end justify-center gap-8 min-h-[150px] pb-4 px-4">
                       <div className="flex flex-col items-center gap-2 group w-1/3">
                          <span className="text-xs text-slate-400 mb-1 opacity-0 group-hover:opacity-100 transition-opacity text-center">Tu Esfuerzo</span>
                          <div className="w-full bg-slate-500/50 hover:bg-slate-500 rounded-t-lg transition-all relative" style={{ height: `${compoundData.finalBalance > 0 ? (compoundData.totalContributed / compoundData.finalBalance) * 100 : 0}%` }}></div>
                          <span className="text-xs font-bold text-slate-400 uppercase">Ahorro</span>
                       </div>
                       <div className="flex flex-col items-center gap-2 group w-1/3">
                          <span className="text-xs text-emerald-300 mb-1 opacity-0 group-hover:opacity-100 transition-opacity text-center">Interés</span>
                          <div className="w-full bg-emerald-500 hover:bg-emerald-400 rounded-t-lg transition-all relative" style={{ height: '100%' }}></div>
                          <span className="text-xs font-bold text-emerald-400 uppercase">Inversión</span>
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
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center">
                   <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><PieChart size={18} className="text-emerald-600"/> Distribución de Riqueza</h3>
                   <div className="relative w-48 h-48 rounded-full border-8 border-slate-100 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full" style={{ background: netWorth > 0 ? `conic-gradient(#10b981 0% ${(isNaN(totalCashSaved) ? 0 : totalCashSaved / netWorth) * 100}%, #4f46e5 ${(isNaN(totalCashSaved) ? 0 : totalCashSaved / netWorth) * 100}% 100%)` : '#e2e8f0' }}></div>
                      <div className="absolute inset-2 bg-white rounded-full flex flex-col items-center justify-center z-10"><span className="text-xs text-slate-400 font-bold uppercase">Total</span><span className="text-lg font-bold text-slate-800">{new Intl.NumberFormat('es-AR', { notation: "compact", compactDisplay: "short" }).format(netWorth)}</span></div>
                   </div>
                   <div className="mt-6 w-full space-y-2">
                      {chartsData.distribution.map((d, i) => (
                         <div key={i} className="flex justify-between items-center text-sm"><div className="flex items-center gap-2"><div className={`w-3 h-3 rounded-full ${d.color}`}></div><span className="text-slate-600">{d.name}</span></div><span className="font-bold text-slate-800">{netWorth > 0 ? ((d.value / netWorth) * 100).toFixed(1) : 0}%</span></div>
                      ))}
                   </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                   <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><Users size={18} className="text-blue-600"/> Batalla de Ahorristas</h3>
                   <div className="flex-1 flex flex-col justify-center gap-6">
                      {chartsData.contributors.map((c, i) => (
                         <div key={i}>
                            <div className="flex justify-between mb-1 text-sm font-bold"><span className={c.name === 'LUCAS' ? 'text-blue-700' : 'text-pink-700'}>{c.name}</span><span className="text-slate-500">{formatMoney(c.value)}</span></div>
                            <div className="w-full bg-slate-100 rounded-full h-6 overflow-hidden relative"><div className={`h-full ${c.color} transition-all duration-1000`} style={{ width: `${netWorth > 0 ? (c.value / netWorth) * 100 : 0}%` }}></div></div>
                         </div>
                      ))}
                   </div>
                   <p className="text-xs text-center text-slate-400 mt-4 italic">¿Quién invita la cena este mes?</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                   <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><Layers size={18} className="text-indigo-600"/> Crypto Mix</h3>
                   <div className="flex-1 flex items-end gap-3 px-2 pb-2 min-h-[150px]">
                      {chartsData.cryptoMix.map((c, i) => {
                         const pct = totalCryptoValueUSD > 0 ? (c.value / totalCryptoValueView) * 100 : 0;
                         return (
                            <div key={i} className="flex-1 flex flex-col justify-end group cursor-pointer"><div className="text-xs text-center font-bold text-slate-500 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">{pct.toFixed(0)}%</div><div className={`w-full ${c.color} rounded-t-lg transition-all hover:opacity-80`} style={{ height: `${pct}%`, minHeight: '10px' }}></div><div className="text-[10px] text-center font-bold text-slate-400 mt-2">{c.name}</div></div>
                         )
                      })}
                   </div>
                </div>
             </div>
             <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                 <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><LineChart size={18} className="text-slate-600"/> Historia Financiera</h3>
                 <div className="h-48 flex items-end justify-between gap-1 border-b border-l border-slate-200 p-4 relative">
                    {[...transactions, ...cryptoHoldings].sort((a,b) => new Date(a.date) - new Date(b.date)).slice(-10).map((t, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-2 group"><div className="w-1 md:w-2 bg-slate-300 rounded-full h-1/2 group-hover:bg-indigo-500 transition-colors"></div><span className="text-[8px] md:text-[10px] text-slate-400 -rotate-45 origin-top-left translate-y-4">{new Date(t.date).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</span></div>
                    ))}
                 </div>
                 <p className="text-xs text-slate-400 mt-8 text-center">Visualización simplificada de la actividad reciente.</p>
             </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardFinanciero;