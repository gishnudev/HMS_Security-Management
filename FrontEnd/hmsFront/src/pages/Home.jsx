import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { Button } from '../components/Button';

export default function HomePage() {
  const [account, setAccount] = useState(null);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send('eth_requestAccounts', []);
        setAccount(accounts[0]);
      } catch (error) {
        console.error('User rejected request', error);
      }
    } else {
      alert('Please install MetaMask to use this DApp!');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-100 to-purple-200 text-center px-4">
      <h1 className="text-4xl font-bold mb-4">🏥 Hospital Security DApp</h1>
      <p className="text-lg mb-6 max-w-xl">
        Manage healthcare records securely with blockchain. Connect your wallet to get started.
      </p>
      {account ? (
        <p className="text-green-600 font-semibold">Connected: {account}</p>
      ) : (
        <Button onClick={connectWallet} className="px-6 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl">
          Connect Wallet
        </Button>
      )}
    </div>
  );
}
