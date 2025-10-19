import {
  useState,
  useCallback,
  createContext,
  useContext,
  ReactNode,
} from "react";
import PaymentConfirmationModal from "@/components/modals/payment-confirmation-modal";
import { useWallet } from "./use-wallet";
import { API_COSTS } from "@shared/config";

interface PaymentRequest {
  amount: number;
  functionName: string;
  resolve: (useBuiltIn: boolean) => void;
  reject: (error: Error) => void;
}

interface PaymentContextType {
  requestPayment: (amount: number, functionName: string) => Promise<boolean>;
}

const PaymentContext = createContext<PaymentContextType | null>(null);

export function PaymentProvider({ children }: { children: ReactNode }) {
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(
    null
  );
  const { wallets, isConnected } = useWallet();

  const connectedWallet = wallets.find((w) => w.isConnected) || null;
  const builtInWallet = wallets.find((w) => w.isBuiltIn) || null;

  const requestPayment = useCallback(
    (amount: number, functionName: string): Promise<boolean> => {
      return new Promise((resolve, reject) => {
        setPaymentRequest({
          amount,
          functionName,
          resolve: (useBuiltIn: boolean) => {
            setPaymentRequest(null);
            resolve(useBuiltIn);
          },
          reject: (error: Error) => {
            setPaymentRequest(null);
            reject(error);
          },
        });
      });
    },
    []
  );

  const handleConfirm = (useBuiltIn: boolean) => {
    if (paymentRequest) {
      paymentRequest.resolve(useBuiltIn);
    }
  };

  const handleClose = () => {
    if (paymentRequest) {
      paymentRequest.reject(new Error("Payment cancelled by user"));
    }
    setPaymentRequest(null);
  };

  return (
    <PaymentContext.Provider value={{ requestPayment }}>
      {children}
      {paymentRequest && (
        <PaymentConfirmationModal
          amount={paymentRequest.amount}
          functionName={paymentRequest.functionName}
          connectedWallet={connectedWallet}
          builtInWallet={builtInWallet}
          onClose={handleClose}
          onConfirm={handleConfirm}
        />
      )}
    </PaymentContext.Provider>
  );
}

export function usePayment() {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error("usePayment must be used within PaymentProvider");
  }
  return context;
}
