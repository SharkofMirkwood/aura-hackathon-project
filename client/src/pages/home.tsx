import { useState, useEffect } from "react";
import ChatArea from "@/components/chat/chat-area";
import WalletSidebar from "@/components/wallet/wallet-sidebar";
import AddWalletModal from "@/components/modals/add-wallet-modal";
import { useWallet } from "@/hooks/use-wallet";
import { useChat } from "@/hooks/use-chat";
import { Button } from "@/components/ui/button";
import { Wallet2, X } from "lucide-react";

export default function Home() {
  const [showAddWalletModal, setShowAddWalletModal] = useState(false);
  const [showMobileWallet, setShowMobileWallet] = useState(false);

  const {
    wallets,
    selectedWallets,
    connectWallet,
    isConnected,
    getSelectedWallets,
    isInitialized,
  } = useWallet();
  const { messages, isTyping, sendMessage, clearChat, currentChatId } =
    useChat();

  return (
    <div className="flex h-[100dvh] bg-background relative">
      <ChatArea
        messages={messages}
        isTyping={isTyping}
        onSendMessage={sendMessage}
        onClearChat={clearChat}
        isConnected={isConnected}
        hasWallets={
          !isInitialized ? undefined : wallets.some((w) => w.isConnected)
        }
        onShowAddWallet={() => setShowAddWalletModal(true)}
        onConnectWallet={connectWallet}
        data-testid="chat-area"
      />

      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <WalletSidebar
          wallets={wallets}
          selectedWallets={selectedWallets}
          onShowAddWallet={() => setShowAddWalletModal(true)}
          data-testid="wallet-sidebar"
        />
      </div>

      {/* Mobile: Wallet Drawer Overlay (triggered from ChatArea connect button on mobile) */}
      {showMobileWallet && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowMobileWallet(false)}
          />
          <div className="md:hidden fixed inset-y-0 right-0 w-full max-w-sm bg-card z-50 transform transition-transform duration-300 ease-in-out">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Wallet2 className="w-5 h-5 text-warning" />
                Wallets
              </h2>
              <Button
                variant="ghost"
                onClick={() => setShowMobileWallet(false)}
                className="h-11 w-11 p-0 min-h-[44px] min-w-[44px]"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="h-[calc(100%-4rem)] overflow-hidden">
              <WalletSidebar
                wallets={wallets}
                selectedWallets={selectedWallets}
                onShowAddWallet={() => {
                  setShowAddWalletModal(true);
                  setShowMobileWallet(false);
                }}
                data-testid="mobile-wallet-sidebar"
                isMobile={true}
              />
            </div>
          </div>
        </>
      )}

      {showAddWalletModal && (
        <AddWalletModal
          onClose={() => setShowAddWalletModal(false)}
          data-testid="add-wallet-modal"
        />
      )}
    </div>
  );
}
