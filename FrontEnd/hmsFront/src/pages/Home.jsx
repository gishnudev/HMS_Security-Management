import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { Button } from '../components/Button';
import hospitalImage from '../../public/secure.jpg';
import blockchainImage from '../../public/blockchain.jpg';
import secureImage from '../../public/secure.jpg';
import dashboardImage from '../../public/security.jpeg';
import teamImage from '../../public/hospital.jpg';

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
    <div className="bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-indigo-600 to-purple-700 text-white py-20">
        <div className="container mx-auto px-6 flex flex-col items-center text-center">
          <h1 className="text-5xl font-bold mb-6">🏥 Secure Hospital Management</h1>
          <p className="text-xl mb-8 max-w-2xl">
            Revolutionizing healthcare record security with blockchain technology.
            Immutable, transparent, and patient-controlled medical records.
          </p>
          {account ? (
            <div className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold">
              Connected: {`${account.substring(0, 6)}...${account.substring(account.length - 4)}`}
            </div>
          ) : (
            <Button 
              onClick={connectWallet} 
              className="px-8 py-3 text-lg bg-white text-indigo-600 hover:bg-indigo-50 rounded-lg font-bold shadow-lg transition-all"
            >
              Connect Wallet to Begin
            </Button>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-white transform skew-y-1 -mb-8"></div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-16 text-gray-800">Key Features</h2>
          
          <div className="grid md:grid-cols-3 gap-12">
            <div className="bg-gray-50 p-8 rounded-xl shadow-md hover:shadow-lg transition-all">
              <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-center">Tamper-Proof Records</h3>
              <p className="text-gray-600 text-center">
                All medical records are stored on the blockchain, making them immutable and protected from unauthorized changes.
              </p>
            </div>
            
            <div className="bg-gray-50 p-8 rounded-xl shadow-md hover:shadow-lg transition-all">
              <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-center">Patient Control</h3>
              <p className="text-gray-600 text-center">
                Patients have complete control over who can access their medical data through smart contract permissions.
              </p>
            </div>
            
            <div className="bg-gray-50 p-8 rounded-xl shadow-md hover:shadow-lg transition-all">
              <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-center">Instant Access</h3>
              <p className="text-gray-600 text-center">
                Authorized healthcare providers can access patient records instantly in emergencies, saving critical time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-100">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-16 text-gray-800">How It Works</h2>
          
          <div className="flex flex-col md:flex-row items-center mb-16">
            <div className="md:w-1/2 mb-8 md:mb-0 md:pr-12">
              <img src={hospitalImage} alt="Hospital" className="rounded-xl shadow-lg w-full h-auto" />
            </div>
            <div className="md:w-1/2">
              <h3 className="text-2xl font-semibold mb-4 text-indigo-600">1. Secure Patient Onboarding</h3>
              <p className="text-gray-600 mb-4">
                Patients connect their wallet to create a secure identity. Medical records are linked to this blockchain identity.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>Zero-knowledge proof authentication</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>Biometric verification options</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row-reverse items-center mb-16">
            <div className="md:w-1/2 mb-8 md:mb-0 md:pl-12">
              <img src={blockchainImage} alt="Blockchain" className="rounded-xl shadow-lg w-full h-auto" />
            </div>
            <div className="md:w-1/2">
              <h3 className="text-2xl font-semibold mb-4 text-indigo-600">2. Blockchain Record Storage</h3>
              <p className="text-gray-600 mb-4">
                Medical records are encrypted and stored with cryptographic proofs on the blockchain.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>IPFS for large file storage</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>Selective disclosure of information</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-8 md:mb-0 md:pr-12">
              <img src={dashboardImage} alt="Dashboard" className="rounded-xl shadow-lg w-full h-auto" />
            </div>
            <div className="md:w-1/2">
              <h3 className="text-2xl font-semibold mb-4 text-indigo-600">3. Access Management</h3>
              <p className="text-gray-600 mb-4">
                Patients control exactly which providers can access which parts of their medical history.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>Time-limited access tokens</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>Revocable permissions</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>Full audit trail of access</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-indigo-600 text-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-16">Benefits for Healthcare</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white bg-opacity-10 p-6 rounded-xl backdrop-filter backdrop-blur-sm">
              <h3 className="text-xl font-semibold mb-3">Reduced Fraud</h3>
              <p>Eliminate fake medical records and prescription fraud with verifiable blockchain data.</p>
            </div>
            
            <div className="bg-white bg-opacity-10 p-6 rounded-xl backdrop-filter backdrop-blur-sm">
              <h3 className="text-xl font-semibold mb-3">Interoperability</h3>
              <p>Seamless sharing between different healthcare providers with patient consent.</p>
            </div>
            
            <div className="bg-white bg-opacity-10 p-6 rounded-xl backdrop-filter backdrop-blur-sm">
              <h3 className="text-xl font-semibold mb-3">Cost Savings</h3>
              <p>Reduce administrative costs by eliminating redundant tests and paperwork.</p>
            </div>
            
            <div className="bg-white bg-opacity-10 p-6 rounded-xl backdrop-filter backdrop-blur-sm">
              <h3 className="text-xl font-semibold mb-3">Research Ready</h3>
              <p>Patients can opt-in to share anonymized data for medical research.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-6 text-gray-800">Ready to Secure Your Medical Records?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-gray-600">
            Join the future of healthcare data security today. Take control of your medical information.
          </p>
         
        </div>
      </section>
    </div>
  );
}