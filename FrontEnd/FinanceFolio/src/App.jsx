import React, { useState, useEffect } from 'react';

// Función para generar IDs únicos simples
const generateId = () => `tx-${Date.now().toString(36)}-${Math.random().toString(36).substring(2)}`;

// --- Helper Functions ---
const formatCurrency = (value, currency = 'ARS') => {
    const numericValue = typeof value === 'number' ? value : 0;
    let options = { style: 'currency', currency: currency, minimumFractionDigits: 2, maximumFractionDigits: 2 };
    if (Math.abs(numericValue) < 0.01 && numericValue !== 0) {
        options.maximumFractionDigits = 6;
    }
    return numericValue.toLocaleString('es-AR', options);
};
const formatNumber = (value) => {
    const numericValue = typeof value === 'number' ? value : 0;
    return numericValue.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 8 });
};

// --- Components ---

// Card Component
function Card({ children, className = "", title }) {
  return (
    <div className={`relative bg-gray-800 border border-gray-700 rounded-md shadow-lg p-4 md:p-5 ${className}`}>
      {title && <h2 className="text-lg font-semibold mb-3 text-gray-200 border-b border-gray-700 pb-2">{title}</h2>}
      {children}
    </div>
  );
}

// Formulario de Transacción
function TransactionForm({ addTransaction }) {
    const [formData, setFormData] = useState({
        ticker: '', tipo: 'compra', cantidad: '', precio: '',
        fecha: new Date().toISOString().split('T')[0]
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const cantidadNum = parseFloat(formData.cantidad.replace(',', '.'));
        const precioNum = parseFloat(formData.precio.replace(',', '.'));
        if (!formData.ticker.trim() || isNaN(cantidadNum) || cantidadNum <= 0 || isNaN(precioNum) || precioNum <= 0 || !formData.fecha) {
            alert('Por favor, completa todos los campos correctamente.'); return;
        }
        addTransaction({ ...formData, ticker: formData.ticker.toUpperCase().trim(), cantidad: cantidadNum, precio: precioNum });
        setFormData(prev => ({ ...prev, ticker: '', cantidad: '', precio: '' }));
    };

    const inputBaseStyle = "w-full px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-500 text-sm";
    const labelBaseStyle = "block text-xs font-medium text-gray-400 mb-1";

    return (
        <Card className="mb-6" title="Nueva Transacción">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
                <div>
                    <label htmlFor="ticker" className={labelBaseStyle}>Ticker / Símbolo</label>
                    <input type="text" id="ticker" name="ticker" value={formData.ticker} onChange={handleChange} className={`${inputBaseStyle} uppercase`} placeholder="Ej: AAPL, BTC" required />
                </div>
                <div>
                    <label htmlFor="tipo" className={labelBaseStyle}>Tipo</label>
                    <select id="tipo" name="tipo" value={formData.tipo} onChange={handleChange} className={inputBaseStyle} required>
                        <option value="compra">Compra</option>
                        <option value="venta">Venta</option>
                    </select>
                </div>
                 <div>
                    <label htmlFor="cantidad" className={labelBaseStyle}>Cantidad</label>
                    <input type="text" inputMode="decimal" id="cantidad" name="cantidad" value={formData.cantidad} onChange={handleChange} className={inputBaseStyle} placeholder="Ej: 10 o 0.5" required />
                </div>
                 <div>
                    <label htmlFor="precio" className={labelBaseStyle}>Precio Unitario (ARS)</label>
                    <input type="text" inputMode="decimal" id="precio" name="precio" value={formData.precio} onChange={handleChange} className={inputBaseStyle} placeholder="Ej: 150,75" required />
                </div>
                 <div>
                    <label htmlFor="fecha" className={labelBaseStyle}>Fecha</label>
                    <input type="date" id="fecha" name="fecha" value={formData.fecha} onChange={handleChange} className={inputBaseStyle} required />
                </div>
                <div className="sm:col-span-2 md:col-span-1 lg:col-span-1 lg:self-end">
                     <button type="submit" className="w-full py-1.5 px-4 rounded-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 text-sm bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white font-medium">
                        Agregar
                     </button>
                </div>
            </form>
        </Card>
    );
}

// Tabla de Historial de Transacciones *** MODIFICADA ***
function TransactionHistory({ transactions, deleteTransaction, fetchPrice, currentPrices }) {
    const sortedTransactions = [...transactions].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    return (
        <Card title="Historial de Transacciones">
             <div class="overflow-x-auto custom-scrollbar">
                 <table class="min-w-full divide-y divide-gray-700">
                    <thead class="bg-gray-700/50">
                        <tr>
                            <th scope="col" class="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Fecha</th>
                            <th scope="col" class="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Ticker</th>
                            <th scope="col" class="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Tipo</th>
                            <th scope="col" class="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Cantidad</th>
                            <th scope="col" class="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Precio Unit.</th>
                            <th scope="col" class="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Total (ARS)</th>
                            <th scope="col" class="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Precio Actual</th> {/* Nueva Columna */}
                            <th scope="col" class="px-4 py-2 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Acciones</th> {/* Cambiado Nombre */}
                        </tr>
                    </thead>
                    <tbody class="bg-gray-800 divide-y divide-gray-700">
                        {sortedTransactions.length === 0 ? (
                             <tr><td colSpan="8" class="text-center py-4 text-sm text-gray-500">No hay transacciones registradas.</td></tr> // Colspan 8
                        ) : (
                            sortedTransactions.map(tx => {
                                const total = tx.cantidad * tx.precio;
                                const tipoClass = tx.tipo === 'compra' ? 'text-green-400' : 'text-red-400';
                                const tipoText = tx.tipo === 'compra' ? 'Compra' : 'Venta';
                                const currentPrice = currentPrices[tx.ticker]; // Obtener precio actual del estado
                                return (
                                    <tr key={tx.id} className="hover:bg-gray-700/50">
                                        <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-300">{tx.fecha || 'N/A'}</td>
                                        <td class="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-100 uppercase">{tx.ticker}</td>
                                        <td class={`px-4 py-2 whitespace-nowrap text-sm font-medium ${tipoClass}`}>{tipoText}</td>
                                        <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-300 text-right">{formatNumber(tx.cantidad)}</td>
                                        <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-300 text-right">{formatCurrency(tx.precio)}</td>
                                        <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-300 text-right">{formatCurrency(total)}</td>
                                        {/* Celda Precio Actual */}
                                        <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-300 text-right">
                                            {currentPrice !== undefined ? formatCurrency(currentPrice) : '-'}
                                        </td>
                                        {/* Celda Acciones */}
                                        <td class="px-4 py-2 whitespace-nowrap text-sm text-center space-x-2">
                                            {/* Botón Refrescar Precio */}
                                            <button onClick={() => fetchPrice(tx.ticker)} class="text-blue-400 hover:text-blue-300 p-1 inline-flex items-center" title="Refrescar Precio">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m-15.357-2a8.001 8.001 0 0015.357 2M15 15H9" />
                                                </svg>
                                            </button>
                                            {/* Botón Eliminar */}
                                            <button onClick={() => deleteTransaction(tx.id)} class="text-red-500 hover:text-red-400 p-1 inline-flex items-center" title="Eliminar">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
             </div>
        </Card>
    );
}


// --- Main App Component ---
function App() {
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('investmentTransactions');
    return saved ? JSON.parse(saved).map(t => ({...t, id: t.id || generateId()})) : [];
  });

  // *** NUEVO ESTADO para precios actuales ***
  const [currentPrices, setCurrentPrices] = useState({}); // { TICKER: precio, ... }
  const [loadingPrices, setLoadingPrices] = useState({}); // { TICKER: true/false, ... }

  useEffect(() => {
    localStorage.setItem('investmentTransactions', JSON.stringify(transactions));
  }, [transactions]);

  const addTransaction = (newTransactionData) => {
    const newTx = { ...newTransactionData, id: generateId() };
    setTransactions(prev => [...prev, newTx]);
  };

  const deleteTransaction = (idToDelete) => {
      if (window.confirm('¿Estás seguro de que quieres eliminar esta transacción?')) {
          setTransactions(prev => prev.filter(tx => tx.id !== idToDelete));
      }
  };

   const handleResetData = () => {
       if (window.confirm("¿Estás seguro de que quieres borrar TODAS las transacciones? Esta acción no se puede deshacer.")) {
           setTransactions([]);
           setCurrentPrices({}); // Limpiar precios también
           setLoadingPrices({});
           localStorage.removeItem('investmentTransactions');
           alert("Datos reseteados.");
       }
   };

   // *** NUEVA FUNCIÓN para buscar precio en el backend ***
   const fetchPrice = async (ticker) => {
        if (!ticker || loadingPrices[ticker]) return; // Evitar llamadas duplicadas o sin ticker

        console.log(`[Frontend] Solicitando precio para ${ticker}...`);
        setLoadingPrices(prev => ({ ...prev, [ticker]: true })); // Marcar como cargando

        try {
            // Asegúrate que la URL coincida con donde corre tu backend
            const response = await fetch(`http://localhost:3001/api/price/${ticker}`);
            if (!response.ok) {
                // Intentar leer el mensaje de error del backend si existe
                let errorMsg = `Error ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.error || errorMsg;
                } catch (e) { /* No hacer nada si no hay cuerpo JSON */ }
                throw new Error(errorMsg);
            }
            const data = await response.json();
            console.log(`[Frontend] Precio recibido para ${data.ticker}: ${data.price}`);
            setCurrentPrices(prev => ({ ...prev, [data.ticker]: data.price }));

        } catch (error) {
            console.error(`[Frontend] Error al obtener precio para ${ticker}:`, error.message);
            // Opcional: Mostrar alerta al usuario
            // alert(`No se pudo obtener el precio actualizado para ${ticker}. (${error.message})`);
             // Limpiar precio si falló para que no muestre uno viejo
             setCurrentPrices(prev => {
                 const newState = {...prev};
                 delete newState[ticker];
                 return newState;
             });
        } finally {
             setLoadingPrices(prev => ({ ...prev, [ticker]: false })); // Marcar como no cargando
        }
   };

  return (
    <div className="container mx-auto p-4 md:p-8 bg-gray-900 min-h-screen font-sans flex flex-col">
      <header className="flex justify-between items-center mb-6 px-4 md:px-0">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-100 uppercase tracking-wider flex-grow">
            SEGUIMIENTO DE INVERSIONES
        </h1>
        <button onClick={handleResetData}
            className="p-2 bg-red-800 text-red-200 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            title="Resetear Todos los Datos">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
             </svg>
        </button>
      </header>

      <main className="flex-grow">
        <TransactionForm addTransaction={addTransaction} />
        <TransactionHistory
            transactions={transactions}
            deleteTransaction={deleteTransaction}
            fetchPrice={fetchPrice} // Pasar la función
            currentPrices={currentPrices} // Pasar el estado de precios
        />
      </main>

      <footer className="text-center text-xs text-gray-500 py-4 mt-8 border-t border-gray-700">
          Aplicación desarrollada por Pablo Martín Gatica. Gestión financiera con precisión.
      </footer>
    </div>
  );
}

export default App;
