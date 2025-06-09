import { toast } from "react-toastify";
import "./ConnectWalletButton.css";
import { useWriteContract, useTransactionReceipt } from "wagmi";
import nftAbi from "../../../../../Shared/AppkitProvider/NFTAbi.json";
import { parseEther } from "viem";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES_CONFIG } from "../../../../../Shared/Constants";

const contractAddress = "0xE32383aB1dbea75Fa416CB7cA200b0e1c89735AC";

interface ConnectWalletButtonProps {
  readonly onSuccess: () => void;
  readonly totalEthPrice: number;
  readonly hasDate: boolean;
  readonly hasTime: boolean;
  readonly hasTickets: boolean;
}

type TransactionStatus = 'idle' | 'submitting' | 'confirming' | 'success' | 'error';


interface TransactionStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: TransactionStatus;
  txHash?: string;
  errorMessage?: string;
}

const TransactionStatusModal: React.FC<TransactionStatusModalProps> = ({
  isOpen,
  onClose,
  status,
  txHash,
  errorMessage
}) => {
  if (!isOpen) return null;

  const getStatusContent = () => {
    switch (status) {
      case 'submitting':
        return {
          icon: '⏳',
          title: 'Submitting Transaction',
          message: 'Please confirm the transaction in your wallet...',
          showSpinner: true
        };
      case 'confirming':
        return {
          icon: '🔄',
          title: 'Confirming Payment',
          message: 'Transaction submitted successfully. Waiting for blockchain confirmation...',
          showSpinner: true
        };
      case 'success':
        return {
          icon: '✅',
          title: 'Payment Successful!',
          message: 'Your booking has been confirmed. Redirecting to your booked tours...',
          showSpinner: false
        };
      case 'error':
        return {
          icon: '❌',
          title: 'Transaction Failed',
          message: errorMessage || 'Something went wrong. Please try again.',
          showSpinner: false
        };
      default:
        return {
          icon: '⏳',
          title: 'Processing',
          message: 'Please wait...',
          showSpinner: true
        };
    }
  };

  const statusContent = getStatusContent();

  return (
    <div className="transaction-modal-overlay">
      <div className={`transaction-modal ${status}`}>
        <div className="transaction-modal-content">
          <div className="transaction-status-icon">
            {statusContent.showSpinner ? (
              <div className="spinner"></div>
            ) : (
              <span className="status-emoji">{statusContent.icon}</span>
            )}
          </div>
          
          <h3 className="transaction-status-title">{statusContent.title}</h3>
          <p className="transaction-status-message">{statusContent.message}</p>
          
          {txHash && (
            <div className="transaction-hash">
              <p className="hash-label">Transaction Hash:</p>
              <p className="hash-value">
                {txHash.slice(0, 12)}...{txHash.slice(-10)}
              </p>
              <button 
                className="view-explorer-btn"
                onClick={() => window.open(`https://etherscan.io/tx/${txHash}`, '_blank')}
              >
                View on Explorer
              </button>
            </div>
          )}
          
          {status === 'error' && (
            <button className="close-modal-btn" onClick={onClose}>
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const ConnectWalletButton = ({
  onSuccess,
  totalEthPrice,
  hasDate,
  hasTime,
  hasTickets,
}: ConnectWalletButtonProps) => {
  const { writeContractAsync, isPending } = useWriteContract();
  const navigate = useNavigate();
  
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const { data: receipt, isSuccess: isReceiptSuccess, error: receiptError } = useTransactionReceipt({
    hash: txHash || undefined,
    query: {
      enabled: !!txHash,
      retry: (failureCount) => {
        if (failureCount < 20) { 
          return true;
        }
        return false;
      },
      retryDelay: 3000, 
    }
  });

  
  useEffect(() => {
    if (isReceiptSuccess && receipt) {
      setTransactionStatus('success');
      
      
      setTimeout(() => {
        onSuccess();
        navigate(ROUTES_CONFIG.BOOKED_TOURS.path);
        resetTransaction();
      }, 2000);
    }
  }, [isReceiptSuccess, receipt, onSuccess, navigate]);

  
  useEffect(() => {
    if (receiptError && txHash) {
      const errorMessage = receiptError.message || '';
      
      
      if (errorMessage.includes('reverted') || 
          errorMessage.includes('failed') || 
          errorMessage.includes('insufficient funds') ||
          errorMessage.includes('gas')) {
        setTransactionStatus('error');
        setErrorMessage('Transaction failed: ' + errorMessage);
      }

    }
  }, [receiptError, txHash]);

  useEffect(() => {
    if (txHash && transactionStatus === 'submitting') {
      setTransactionStatus('confirming');
    }
  }, [txHash, transactionStatus]);

  const resetTransaction = () => {
    setTxHash(null);
    setTransactionStatus('idle');
    setErrorMessage('');
  };

  const handlePayment = async (totalPrice: number) => {
    if (!window.ethereum) {
      toast.error("Please install MetaMask first.");
      return;
    }

    if (!hasDate && !hasTime && !hasTickets) {
      toast.error("Please select time and at least one ticket.");
      return;
    }
    
    if (!hasTime) {
      toast.error("Please select a time.");
      return;
    }
    
    if (!hasTickets) {
      toast.error("Please select at least one ticket.");
      return;
    }

    try {
      setTransactionStatus('submitting');
      
      const hash = await writeContractAsync({
        address: contractAddress,
        abi: nftAbi,
        functionName: "mintNFT",
        args: [""], 
        value: parseEther(totalPrice.toString()), 
      });

      setTxHash(hash);
      
    } catch (err: any) {
      console.error("Transaction error:", err.message);
      setTransactionStatus('error');
      setErrorMessage(err.message || "Transaction failed. Please try again.");
      setTxHash(null);
    }
  };

  const closeModal = () => {
    if (transactionStatus === 'error') {
      resetTransaction();
    }
  };

  const isModalOpen = transactionStatus !== 'idle';

  return (
    <>
      <div className="wallet-btn-wrapper">
        <button
          className="button-hovering-color"
          onClick={() => handlePayment(totalEthPrice)}
          disabled={isPending || isModalOpen}
        >
          {isPending ? "Processing..." : "Book Now"}
        </button>
      </div>

      <TransactionStatusModal
        isOpen={isModalOpen}
        onClose={closeModal}
        status={transactionStatus}
        txHash={txHash || undefined}
        errorMessage={errorMessage}
      />
    </>
  );
};

export default ConnectWalletButton;