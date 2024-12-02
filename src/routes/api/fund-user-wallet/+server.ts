import { PLATFORM_PRIVATE_KEY } from '$env/static/private';
import { json } from '@sveltejs/kit';
import {
	PublicKey,
	Transaction,
	Connection,
	Keypair,
	SystemProgram,
	LAMPORTS_PER_SOL,
	ComputeBudgetProgram
} from '@solana/web3.js';
import bs58 from 'bs58';
import {
	getOrCreateAssociatedTokenAccount,
	createTransferInstruction,
	getAssociatedTokenAddress,
	createAssociatedTokenAccountInstruction,
	getAccount
} from '@solana/spl-token';
import { RPC_URL } from '$env/static/private';

const connection = new Connection(RPC_URL);
const platformWallet = Keypair.fromSecretKey(bs58.decode(PLATFORM_PRIVATE_KEY));
const USDC_MINT_ADDRESS = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

console.log('RPC', RPC_URL);
console.log('Private key', PLATFORM_PRIVATE_KEY);

const CONFIRMATION_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

async function sendAndConfirmTransaction(
	connection: Connection,
	transaction: Transaction,
	signers: Keypair[]
): Promise<string> {
	for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
		try {
			console.log(`\nAttempt ${attempt + 1} of ${MAX_RETRIES}`);

			// Get fresh blockhash
			const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('processed');

			// Create a new transaction instance each time
			const newTransaction = new Transaction().add(...transaction.instructions);
			newTransaction.recentBlockhash = blockhash;
			newTransaction.feePayer = signers[0].publicKey;

			// Sign the transaction properly
			console.log('Signing transaction...');
			newTransaction.sign(...signers);
			console.log('Transaction signed by:', signers[0].publicKey.toString());

			// Send transaction
			const rawTransaction = newTransaction.serialize();
			const signature = await connection.sendRawTransaction(rawTransaction, {
				skipPreflight: true,
				maxRetries: 3
			});
			console.log('Raw transaction sent:', signature);

			// Wait for confirmation with timeout
			const confirmationPromise = connection.confirmTransaction(
				{
					signature,
					blockhash,
					lastValidBlockHeight
				},
				'processed'
			); // Changed from 'confirmed' to 'processed'

			const timeoutPromise = new Promise((_, reject) => {
				setTimeout(() => reject(new Error('Confirmation timeout')), 30000);
			});

			const confirmation = await Promise.race([confirmationPromise, timeoutPromise]);

			// Quick status check
			const status = await connection.getSignatureStatus(signature);
			console.log('Transaction status:', {
				status: status?.value?.confirmationStatus,
				err: status?.value?.err,
				confirmations: status?.value?.confirmations
			});

			if (confirmation.value.err) {
				throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
			}

			return signature;
		} catch (error) {
			console.error(`Attempt ${attempt + 1} failed:`, {
				error: error.message,
				type: error.constructor.name,
				timestamp: new Date().toISOString()
			});

			if (attempt === MAX_RETRIES - 1) throw error;

			console.log(`Waiting ${RETRY_DELAY}ms before next attempt...`);
			await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
		}
	}
	throw new Error('Failed to send transaction after all retries');
}

export async function POST({ request }) {
	try {
		const { userWalletAddress, amount } = await request.json();

		if (!userWalletAddress || !amount) {
			throw new Error('Missing required parameters');
		}

		console.log('Processing request:', {
			userWallet: userWalletAddress,
			amount,
			platformWallet: platformWallet.publicKey.toString()
		});

		const userPublicKey = new PublicKey(userWalletAddress);

		// Platform wallet checks
		const platformSolBalance = await connection.getBalance(platformWallet.publicKey);
		console.log('Platform wallet status:', {
			address: platformWallet.publicKey.toString(),
			solBalance: platformSolBalance / LAMPORTS_PER_SOL,
			timestamp: new Date().toISOString()
		});

		if (platformSolBalance < 0.005 * LAMPORTS_PER_SOL) {
			throw new Error('Insufficient SOL balance in platform wallet');
		}

		// Get platform USDC account
		console.log('Getting platform USDC account...');
		const platformTokenAccount = await getOrCreateAssociatedTokenAccount(
			connection,
			platformWallet,
			USDC_MINT_ADDRESS,
			platformWallet.publicKey
		);
		console.log('Platform USDC account:', {
			address: platformTokenAccount.address.toString(),
			owner: platformTokenAccount.owner.toString()
		});

		// Get user USDC account
		console.log('Getting user USDC account address...');
		const userATA = await getAssociatedTokenAddress(USDC_MINT_ADDRESS, userPublicKey);
		console.log('User USDC ATA:', userATA.toString());

		// Create transaction
		const transaction = new Transaction();
		console.log('Creating transaction...');

		// Check if user ATA exists
		try {
			const userTokenAccount = await getAccount(connection, userATA);
			console.log('Existing user USDC account found:', {
				address: userTokenAccount.address.toString(),
				owner: userTokenAccount.owner.toString()
			});
		} catch (e) {
			// Add rent-exempt minimum balance check
			const rentExemptBalance = await connection.getMinimumBalanceForRentExemption(165); // 165 bytes for token account
			console.log('Rent-exempt minimum balance required:', {
				lamports: rentExemptBalance,
				inSOL: rentExemptBalance / LAMPORTS_PER_SOL
			});

			// Check if we're sending enough SOL to cover rent
			const plannedSolTransfer = 0.005 * LAMPORTS_PER_SOL;
			console.log('Planned SOL transfer vs rent requirement:', {
				plannedTransfer: plannedSolTransfer / LAMPORTS_PER_SOL,
				rentRequired: rentExemptBalance / LAMPORTS_PER_SOL,
				sufficient: plannedSolTransfer >= rentExemptBalance
			});

			console.log('User USDC account not found, adding creation instruction');
			transaction.add(
				createAssociatedTokenAccountInstruction(
					platformWallet.publicKey,
					userATA,
					userPublicKey,
					USDC_MINT_ADDRESS
				)
			);
		}

		// Add transfers
		console.log('Adding transfer instructions:', {
			solAmount: 0.005,
			usdcAmount: amount
		});

		transaction.add(
			SystemProgram.transfer({
				fromPubkey: platformWallet.publicKey,
				toPubkey: userPublicKey,
				lamports: 0.005 * LAMPORTS_PER_SOL
			})
		);

		transaction.add(
			createTransferInstruction(
				platformTokenAccount.address,
				userATA,
				platformWallet.publicKey,
				amount * 10 ** 6
			)
		);

		console.log('Transaction prepared:', {
			numInstructions: transaction.instructions.length,
			timestamp: new Date().toISOString()
		});

		// Before sending transaction, verify it's properly constructed
		console.log('Verifying transaction:', {
			numInstructions: transaction.instructions.length,
			feePayer: platformWallet.publicKey.toString(),
			signers: [platformWallet.publicKey.toString()]
		});

		// Sign and send
		const signature = await sendAndConfirmTransaction(connection, transaction, [platformWallet]);

		console.log('Transaction successful:', {
			signature,
			timestamp: new Date().toISOString()
		});

		return json({
			success: true,
			signature,
			userATA: userATA.toString()
		});
	} catch (error) {
		console.error('Transaction failed:', error);
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				errorType: error.constructor.name
			},
			{ status: 500 }
		);
	}
}
