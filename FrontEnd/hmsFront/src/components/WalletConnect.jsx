import { useEffect, useState } from 'react';

export default function WalletConnect({ onConnect }) {
  const [account, setAccount] = useState(null);

  const connectWallet = async () => {
    if (!window.ethereum) return alert("MetaMask not installed!");
    const [selected] = await window.ethereum.request({ method: "eth_requestAccounts" });
    setAccount(selected);
    onConnect(selected);
  };

  useEffect(() => {
    if (window.ethereum?.selectedAddress) {
      setAccount(window.ethereum.selectedAddress);
      onConnect(window.ethereum.selectedAddress);
    }
  }, []);

  return (
    <button
      className="bg-blue-600 text-white px-4 py-2 rounded"
      onClick={connectWallet}
    >
      {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : "Connect Wallet"}
    </button>
  );
}
