import { Keypair, Connection} from '@solana/web3.js';
import { PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import bs58 from 'bs58';
import {
    getOrCreateAssociatedTokenAccount,
    createTransferInstruction,
  } from '@solana/spl-token';

// Set up Solana connection
const connection = new Connection('https://api.devnet.solana.com');

// Add your Phantom Wallet private key (Base58 string) securely
const PLATFORM_WALLET_PRIVATE_KEY = '4P8TFSqgxcANHz1ZbjMjsCBhGs3qjMwQPG627TG3NL2rDdqNcUT6e7C3i8P1CFm5Zm1udKYYNzYZ4ctSjJkN9ZFE';
const platformWallet = Keypair.fromSecretKey(bs58.decode(PLATFORM_WALLET_PRIVATE_KEY));

// USDC Mint Address (on devnet, make sure USDC is available)
const USDC_MINT_ADDRESS = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');


export function generateSolanaWallet() {
	const keypair = Keypair.generate();
	const publicKey = keypair.publicKey.toString();

	// Convert Uint8Array to hex string without using Buffer
	const privateKey = Array.from(keypair.secretKey)
		.map((b) => b.toString(16).padStart(2, '0'))
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
		privateKeyHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
	);

	return privateKeyBytes;
}

// Function to transfer USDC
export async function transferUSDCToUser(userWalletAddress: string, amount: number) {
    try {
      const userPublicKey = new PublicKey(userWalletAddress);
  
      // Get or create associated token accounts for the platform and user wallets
      const platformTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        platformWallet, // Fee payer
        USDC_MINT_ADDRESS, // USDC token mint
        platformWallet.publicKey // Platform wallet as the owner
      );
  
      const userTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        platformWallet, // Fee payer
        USDC_MINT_ADDRESS, // USDC token mint
        userPublicKey // User's public key
      );
  
      // Create a transfer instruction
      const transferInstruction = createTransferInstruction(
        platformTokenAccount.address, // Source (platform's token account)
        userTokenAccount.address, // Destination (user's token account)
        platformWallet.publicKey, // Authority to sign the transfer
        amount * 10 ** 6 // Amount to transfer (USDC has 6 decimal places)
      );
  
      // Send transaction
      const transaction = new Transaction().add(transferInstruction);
      const signature = await connection.sendTransaction(transaction, [platformWallet]);
  
      // Confirm the transaction
      await connection.confirmTransaction(signature, 'confirmed');
      console.log('USDC transferred successfully. Transaction signature:', signature);
      return signature;
    } catch (error) {
      console.error('Error transferring USDC:', error);
      throw error;
    }
  }
  
  // Function to create a new wallet and fund it with USDC
  export async function createAndFundUserWalletWithUSDC(amount: number) {
    // Step 1: Generate a new wallet for the user
    const userKeypair = Keypair.generate();
    const userPublicKey = userKeypair.publicKey.toString();
  
    // Step 2: Transfer USDC to the user's wallet
    try {
      const txSignature = await transferUSDCToUser(userPublicKey, amount);
      console.log('Wallet funded successfully:', { userPublicKey, txSignature });
      return { userPublicKey, txSignature };
    } catch (error) {
      console.error('Error funding wallet with USDC:', error);
      throw error;
    }
  }