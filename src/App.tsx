import { useState } from 'react';
import './App.css';

function App() {
  const [userId, setUserId] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [recipientId, setRecipientId] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // ✅ CORRECT (MATCHES JAVA CONTROLLER):
   const API_URL = 'https://wallet-api-goz5.onrender.com/api/wallets';

  // --- 1. Login Logic ---
  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userId) return;
    
    setIsLoading(true);
    setMessage('');
    try {
      await refreshData();
      setIsLoggedIn(true);
    } catch (err: any) {
      setMessage("User not found. Please create an account.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- 2. Register Logic (Updated) ---
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setIsLoading(true);
    setMessage('');
    try {
      const response = await fetch(`${API_URL}/create?userId=${userId}`, {
        method: 'POST'
      });

      if (!response.ok) {
        // FIX: Parse the Spring Boot JSON error to get the real message
        const errorData = await response.json();
        throw new Error(errorData.message || 'Creation failed');
      }

      await refreshData();
      setIsLoggedIn(true);
      setMessage(''); 
    } catch (err: any) {
      setMessage(err.message); // Now this will be "Wallet already exists!"
    } finally {
      setIsLoading(false);
    }
  };

  // --- 3. Logout Logic (THE FIX) ---
  const handleLogout = () => {
    setIsLoggedIn(false);
    // Wipe everything clean!
    setBalance(null);
    setHistory([]);
    setMessage('');
    setRecipientId('');
    setAmount('');
    setUserId(''); // Optional: clear username too if you want
  };

  // --- 4. Data Fetching ---
  const refreshData = async () => {
    const balRes = await fetch(`${API_URL}/${userId}`);
    if (!balRes.ok) throw new Error('Wallet not found');
    const balData = await balRes.json();
    setBalance(balData.balance);

    const histRes = await fetch(`${API_URL}/${userId}/history`);
    const histData = await histRes.json();
    setHistory(histData);
  };

  // --- 5. Transfer Logic (Updated) ---
  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(''); // Clear previous messages
    try {
      const params = new URLSearchParams({ fromUser: userId, toUser: recipientId, amount: amount });
      const response = await fetch(`${API_URL}/transfer?${params}`, { method: 'POST' });

      if (!response.ok) {
        // FIX: Read the JSON from the server to get the real error message
        const errorData = await response.json();
        throw new Error(errorData.message || 'Transfer failed');
      }
      
      const text = await response.text();
      setMessage(text); // "Transfer successful!"
      setAmount('');
      setRecipientId('');
      await refreshData();
    } catch (err: any) {
      setMessage(err.message); // This will now show "Insufficient funds!"
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="blob-container">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      <div className="app-container">
        <h1 className="header-title">LedgerFlow</h1>

        {!isLoggedIn ? (
          /* Login / Register Card */
          <div className="glass-card" style={{ width: '100%', maxWidth: '400px' }}>
            <h2 style={{ marginBottom: '20px', fontSize: '1.8rem' }}>
              {isRegistering ? 'Create Account' : 'Welcome Back'}
            </h2>
            
            <form onSubmit={isRegistering ? handleRegister : handleLogin}>
              <div style={{ marginBottom: '15px' }}>
                <label className="label-text">User ID</label>
                <input 
                  className="clay-input" 
                  placeholder="Choose a username..."
                  value={userId}
                  onChange={e => setUserId(e.target.value)}
                />
              </div>
              
              <button className="clay-button" disabled={isLoading}>
                {isLoading ? 'Processing...' : (isRegistering ? 'Create Wallet' : 'Access Vault')}
              </button>
            </form>

            <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.9rem', color: '#666' }}>
              {isRegistering ? "Already have an account? " : "New to LedgerFlow? "}
              <span 
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setMessage('');
                }}
                style={{ color: '#4f46e5', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }}
              >
                {isRegistering ? "Log In" : "Create Account"}
              </span>
            </p>

            {message && <p style={{ color: '#ef4444', marginTop: '15px', textAlign: 'center', fontWeight: 500 }}>{message}</p>}
          </div>
        ) : (
          /* Dashboard */
          <div style={{ width: '100%' }}>
            
            <div className="glass-card" style={{ textAlign: 'center', marginBottom: '30px', padding: '4rem 2rem' }}>
              <div className="label-text">Total Available Balance</div>
              <div className="balance-text">
                ${balance?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              {/* UPDATED LOGOUT BUTTON */}
              <button 
                className="clay-button" 
                style={{ width: 'auto', padding: '10px 24px', fontSize: '0.9rem', marginTop: '10px', background: 'rgba(0,0,0,0.8)' }} 
                onClick={handleLogout} 
              >
                Sign Out
              </button>
            </div>

            <div className="grid-2">
              <div className="glass-card">
                <h3 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>Send Money</h3>
                <form onSubmit={handleTransfer}>
                  <div style={{ marginBottom: '15px' }}>
                    <label className="label-text">To Recipient</label>
                    <input className="clay-input" placeholder="User ID" value={recipientId} onChange={e => setRecipientId(e.target.value)} />
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label className="label-text">Amount</label>
                    <input className="clay-input" type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
                  </div>
                  <button className="clay-button">Transfer Assets</button>
                  {message && <p style={{ marginTop: '15px', fontWeight: 600, color: message.includes('Success') ? '#10b981' : '#ef4444' }}>{message}</p>}
                </form>
              </div>

              <div className="glass-card">
                <h3 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>Recent Activity</h3>
                <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '10px' }}>
                  <table>
                    <tbody>
                      {history.map((txn) => (
                        <tr key={txn.id}>
                          <td>
                            <div style={{ fontWeight: 600, color: '#333' }}>{txn.type.replace('_', ' ')}</div>
                            <div style={{ fontSize: '0.8rem', color: '#999' }}>{new Date(txn.timestamp).toLocaleDateString()}</div>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: txn.amount > 0 ? '#10b981' : '#1d1d1f' }}>
                            {txn.amount > 0 ? '+' : ''}${txn.amount}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {history.length === 0 && <p style={{ textAlign: 'center', color: '#999', marginTop: '40px' }}>No transactions found</p>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default App;