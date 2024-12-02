import {
	Connection,
	Keypair,
	PublicKey,
	VersionedTransaction,
	TransactionMessage,
	TransactionInstruction
} from '@solana/web3.js';
import fetch from 'cross-fetch';
import { Wallet } from '@project-serum/anchor';
import bs58 from 'bs58';
import { RPC_URL } from '$env/static/private';
import { type MemecoinWithAllocation } from '$lib/interfaces/utils';
import { AccountLayout } from '@solana/spl-token';
import { decrypt } from '$lib/utils/encryption';
import { prisma } from '$lib/server/database';
import { json } from '@sveltejs/kit';
import { getAssociatedTokenAddress } from '@solana/spl-token';

const connection = new Connection(RPC_URL);
const JUPITER_API_BASE = 'https://quote-api.jup.ag/v6';
const SLIPPAGE_BPS = 100; // 1% slippage tolerance
const PRIORITY_FEE = 100000; // 0.0001 SOL

function allocateUSDC(totalAmount: number, numAllocations: number, minAllocation: number) {
	// Ensure there's enough totalAmount to meet the minimum allocation requirement
	if (totalAmount < numAllocations * minAllocation) {
		throw new Error('Total amount is insufficient to meet the minimum allocation requirement.');
	}

	// Initialize allocations with the minimum allocation
	const allocations = Array(numAllocations).fill(minAllocation);
	let remainingAmount = totalAmount - numAllocations * minAllocation;

	// Generate random weights for allocations
	const weights = Array(numAllocations)
		.fill(0)
		.map(() => Math.random());
	const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

	// Allocate the remaining amount based on weights
	for (let i = 0; i < numAllocations; i++) {
		allocations[i] += parseFloat(((weights[i] / totalWeight) * remainingAmount).toFixed(2));
	}

	// Ensure total allocations match totalAmount due to rounding errors
	let allocationSum = allocations.reduce((sum, value) => parseFloat((sum + value).toFixed(2)), 0);
	let diff = parseFloat((totalAmount - allocationSum).toFixed(2));

	// Adjust allocations to fix rounding differences
	for (let i = 0; diff !== 0 && i < allocations.length; i++) {
		const adjustment = diff > 0 ? 0.01 : -0.01;
		allocations[i] = parseFloat((allocations[i] + adjustment).toFixed(2));
		diff = parseFloat(
			(totalAmount - allocations.reduce((sum, value) => sum + value, 0)).toFixed(2)
		);
	}

	return allocations;
}

async function executeSwap(
	userWallet: Keypair,
	outputMint: string,
	amount: number,
	retryCount = 0
): Promise<{ success: boolean; signature: string | null; error?: string }> {
	try {
		// 1. Verify USDC balance before swap
		const userUsdcAccount = await getAssociatedTokenAddress(
			new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
			userWallet.publicKey
		);

		const userUsdcBalance = await connection.getTokenAccountBalance(userUsdcAccount);
		if (!userUsdcBalance.value.uiAmount || userUsdcBalance.value.uiAmount < amount / 10 ** 6) {
			throw new Error(
				`Insufficient USDC balance. Required: ${amount / 10 ** 6}, Found: ${userUsdcBalance.value.uiAmount}`
			);
		}

		// 3. Get quote with increased slippage and strict parameters
		const quoteResponse = await fetch(
			`${JUPITER_API_BASE}/quote?inputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&outputMint=${outputMint}&amount=${amount}&slippageBps=${SLIPPAGE_BPS}&onlyDirectRoutes=true`
		).then((res) => res.json());

		if (!quoteResponse || quoteResponse.error) {
			throw new Error(`Quote failed: ${quoteResponse?.error || 'Unknown error'}`);
		}

		// 4. Get swap transaction with improved parameters
		const { swapTransaction } = await fetch(`${JUPITER_API_BASE}/swap`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				quoteResponse,
				userPublicKey: userWallet.publicKey.toString(),
				wrapAndUnwrapSol: false,
				useSharedAccounts: false, // Disable shared accounts
				createAta: true,
				computeUnitPriceMicroLamports: PRIORITY_FEE,
				asLegacyTransaction: false,
				// Add strict parameters
				maxAccounts: 64,
				computeUnitLimit: 1_000_000,
				onlyDirectRoutes: true
			})
		}).then((res) => res.json());

		// 5. Process and send transaction
		const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
		const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

		transaction.sign([userWallet]);

		const signature = await connection.sendTransaction(transaction, {
			skipPreflight: false, // Enable preflight
			maxRetries: 3,
			preflightCommitment: 'processed'
		});

		console.log(`Swap transaction sent: ${signature}`);

		// 6. Wait for confirmation with timeout
		const confirmation = await Promise.race([
			connection.confirmTransaction(
				{
					signature,
					blockhash: transaction.message.recentBlockhash,
					lastValidBlockHeight: (await connection.getLatestBlockhash()).lastValidBlockHeight
				},
				'processed'
			),
			new Promise((_, reject) => setTimeout(() => reject(new Error('Confirmation timeout')), 30000))
		]);

		if (confirmation.value?.err) {
			throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
		}

		// 7. Verify the swap succeeded
		const finalBalance = await connection.getTokenAccountBalance(
			await getAssociatedTokenAddress(new PublicKey(outputMint), userWallet.publicKey)
		);
		console.log(`Final token balance: ${finalBalance.value.uiAmount}`);

		return { success: true, signature };
	} catch (error) {
		console.error(`Swap failed for ${outputMint}:`, error);

		if (retryCount < 2) {
			console.log(`Retrying swap for ${outputMint}...`);
			await new Promise((resolve) => setTimeout(resolve, 3000)); // Increased delay
			return executeSwap(userWallet, outputMint, amount, retryCount + 1);
		}

		return { success: false, signature: null, error: error.message };
	}
}

// // Add this helper function at the top level
// async function checkRouteAvailability(outputMint: string, amount: number): Promise<boolean> {
// 	try {
// 		const quoteResponse = await fetch(
// 			`${JUPITER_API_BASE}/quote?inputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&outputMint=${outputMint}&amount=${amount}&slippageBps=${SLIPPAGE_BPS}&onlyDirectRoutes=true`
// 		).then((res) => res.json());

// 		console.log('quoteResponse', quoteResponse);
// 		console.log('quote error', quoteResponse.error);
// 		return true;
// 		// return !quoteResponse.error && quoteResponse.routesInfos?.length > 0;
// 	} catch {
// 		return false;
// 	}
// }

async function getExpectedOutput(outputMint: string, amount: number): Promise<number> {
	try {
		const quoteResponse = await fetch(
			`${JUPITER_API_BASE}/quote?inputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&outputMint=${outputMint}&amount=${amount}&slippageBps=${SLIPPAGE_BPS}&onlyDirectRoutes=true`
		).then((res) => res.json());

		if (!quoteResponse.error && quoteResponse.outAmount) {
			return Number(quoteResponse.outAmount);
		}
		return 0;
	} catch {
		return 0;
	}
}

// Helper function to check if memecoin has valid output
async function hasValidOutput(memecoin: any, testAmount: number): Promise<boolean> {
	const expectedOutput = await getExpectedOutput(memecoin.solana_contract_address, testAmount);
	return expectedOutput > 0;
}

// Swap API Route
export async function POST({ request, fetch }) {
	try {
		const { encryptedPrivateKey, amount, memecoins, clerkId } = await request.json();
		console.log('Starting swap process for amount:', amount, 'USDC');

		// Shuffle all memecoins initially
		const shuffledMemecoins = [...memecoins];
		for (let i = shuffledMemecoins.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[shuffledMemecoins[i], shuffledMemecoins[j]] = [shuffledMemecoins[j], shuffledMemecoins[i]];
		}

		const selectedMemecoins: typeof shuffledMemecoins = [];
		const testAmount = Math.floor((amount / 4) * 10 ** 6); // Test with equal distribution

		// Try to find 4 valid memecoins
		for (const memecoin of shuffledMemecoins) {
			if (await hasValidOutput(memecoin, testAmount)) {
				selectedMemecoins.push(memecoin);
				console.log(`Added ${memecoin.name} to selection (${selectedMemecoins.length}/4)`);
				if (selectedMemecoins.length >= 4) break;
			}
		}

		// Handle case where we couldn't find enough valid memecoins
		if (selectedMemecoins.length === 0) {
			throw new Error('No valid memecoins found with available routes');
		}

		if (selectedMemecoins.length < 4) {
			console.log(
				`Warning: Only found ${selectedMemecoins.length} valid memecoins. Proceeding with available ones.`
			);
		}

		// Recalculate allocations based on actual number of selected memecoins
		const allocations = allocateUSDC(amount, selectedMemecoins.length, 1);

		const memecoinsWithAllocation = selectedMemecoins.map((memecoin, index) => ({
			...memecoin,
			allocation: allocations[index]
		}));

		// Convert allocation to swaps
		const swaps = memecoinsWithAllocation.map((entry: MemecoinWithAllocation) => ({
			outputMint: entry.solana_contract_address,
			amount: Math.floor(entry.allocation * 10 ** 6) // Convert USDC to smallest units (micro units)
		}));

		const portfolio = await Promise.all(
			memecoinsWithAllocation.map(async (entry: MemecoinWithAllocation) => ({
				id: entry.id,
				quantity: await getExpectedOutput(
					entry.solana_contract_address,
					Math.floor(entry.allocation * 10 ** 6) // Convert to proper USDC units
				)
			}))
		);

		const netWorthData = {
			netWorth: amount,
			coinsWorth: memecoinsWithAllocation.reduce(
				(acc, coin) => ({
					...acc,
					[coin.id]: coin.allocation
				}),
				{}
			)
		};

		// Log final swap plan
		console.log('Final swap plan:', {
			selectedTokens: selectedMemecoins.map((m) => m.name),
			allocations: allocations,
			totalSwaps: swaps.length
		});

		// const userWalletPrivateKey = await decrypt(encryptedPrivateKey, fetch);
		// const privateKeyBytes = userWalletPrivateKey.startsWith('0x')
		// 	? Uint8Array.from(Buffer.from(userWalletPrivateKey.slice(2), 'hex'))
		// 	: Uint8Array.from(Buffer.from(userWalletPrivateKey, 'hex'));

		// const userWallet = Keypair.fromSecretKey(privateKeyBytes);
		// console.log('Wallet loaded:', userWallet.publicKey.toString());

		// const userUsdcAccount = await getAssociatedTokenAddress(
		// 	new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'), // USDC mint
		// 	userWallet.publicKey
		// );

		// let balance;
		// try {
		// 	const accountInfo = await connection.getTokenAccountBalance(userUsdcAccount);
		// 	balance = accountInfo.value.uiAmount;
		// 	console.log('Verified USDC balance:', balance);

		// 	if (!balance || balance < amount) {
		// 		throw new Error(`Insufficient USDC balance. Required: ${amount}, Found: ${balance}`);
		// 	}
		// } catch (e) {
		// 	throw new Error('Failed to verify USDC balance: ' + e.message);
		// }

		// // Continue with swaps only if balance is verified
		// console.log("Proceeding with swaps, USDC balance confirmed:", balance);

		// // Execute swaps sequentially instead of in parallel
		// const signatures = [];
		// for (const swap of swaps) {
		// 	const result = await executeSwap(
		// 		userWallet,
		// 		swap.outputMint,
		// 		swap.amount
		// 	);
		// 	signatures.push(result);

		// 	// Add delay between swaps
		// 	await new Promise(resolve => setTimeout(resolve, 2000));
		// }

		// // Check results
		// const successfulSwaps = signatures.filter(s => s.success);
		// if (successfulSwaps.length === 0) {
		// 	throw new Error('All swaps failed');
		// }

		return json({
			success: true,
			portfolio: portfolio,
			netWorthHistory: [
				{
					netWorth: netWorthData.netWorth,
					coinsWorth: netWorthData.coinsWorth
				}
			]
		});
	} catch (error) {
		console.error('Swap failed:', error);
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
}
