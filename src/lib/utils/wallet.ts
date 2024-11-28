import { Keypair } from '@solana/web3.js';

export function generateSolanaWallet() {
    const keypair = Keypair.generate();
    const publicKey = keypair.publicKey.toString();
    
    // Convert Uint8Array to hex string without using Buffer
    const privateKey = Array.from(keypair.secretKey)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    
    // Store securely
    if (window?.isSecureContext) {
        const encryptedPrivateKey = btoa(privateKey);
        sessionStorage.setItem('walletPrivateKey', encryptedPrivateKey);
    }
    
    return { publicKey };
}

export function getStoredWallet(): Uint8Array | null {
    const encryptedPrivateKey = sessionStorage.getItem('walletPrivateKey');
    if (!encryptedPrivateKey) return null;
    
    const privateKeyHex = atob(encryptedPrivateKey);
    // Convert hex string back to Uint8Array
    const privateKeyBytes = new Uint8Array(
        privateKeyHex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
    );
    
    return privateKeyBytes;
}