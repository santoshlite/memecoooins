import { PLATFORM_PRIVATE_KEY } from '$env/static/private';
import { json } from '@sveltejs/kit';
import { PublicKey, Transaction, Connection, Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import { getOrCreateAssociatedTokenAccount, createTransferInstruction } from '@solana/spl-token';
import { RPC_URL } from '$env/static/private';

const connection = new Connection(RPC_URL);
const platformWallet = Keypair.fromSecretKey(bs58.decode(PLATFORM_PRIVATE_KEY));
const USDC_MINT_ADDRESS = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');

export async function POST({ request }) {
	const { userWalletAddress, amount } = await request.json();
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
		return json({ success: true, signature });
	} catch (error: unknown) {
		if (error instanceof Error) {
			return json({ success: false, error: error.message }, { status: 500 });
		}
		return json({ success: false, error: 'An unknown error occurred' }, { status: 500 });
	}
}
