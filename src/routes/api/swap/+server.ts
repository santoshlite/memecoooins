import { Connection, Keypair, PublicKey, VersionedTransaction } from '@solana/web3.js';
import fetch from 'cross-fetch';
import { Wallet } from '@project-serum/anchor';
import bs58 from 'bs58';
import { RPC_URL } from '$env/static/private';
import { type MemecoinWithAllocation } from '$lib/interfaces/utils';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { AccountLayout } from '@solana/spl-token';
import { prisma } from '$lib/server/database';

const connection = new Connection(RPC_URL);

// Swap API Route
export async function POST({ request }) {
	try {
		// Parse input data
		const { userWalletPrivateKey, memecoinsWithAllocation, clerkId } = await request.json();

		// Convert allocation to swaps
		const swaps = memecoinsWithAllocation.map((entry: MemecoinWithAllocation) => ({
			outputMint: entry.solana_contract_address,
			amount: Math.floor(entry.allocation * 10 ** 6) // Convert USDC to smallest units (micro units)
		}));

		console.log('swaps', swaps);
		console.log('shhh', userWalletPrivateKey);

		// Decode user's wallet private key
		const userWallet = new Wallet(Keypair.fromSecretKey(bs58.decode(userWalletPrivateKey)));

		const transactionList = [];
		const signatures = [];
		const memecoinsReceived = [];

		// Iterate through each swap request
		for (const { outputMint, amount } of swaps) {
			// Step 1: Get the quote from USDC to the output mint
			const quoteResponse = await fetch(
				`https://quote-api.jup.ag/v6/quote?inputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&outputMint=${outputMint}&amount=${amount}&slippageBps=50`
			);
			const quote = await quoteResponse.json();
      
			// Step 2: Get the swap transaction
			const { swapTransaction } = await (
				await fetch('https://quote-api.jup.ag/v6/swap', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						quoteResponse: quote,
						userPublicKey: userWallet.publicKey.toString(),
						wrapAndUnwrapSol: true
					})
				})
			).json();

			// Deserialize and sign the transaction
			const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
			const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
			transaction.sign([userWallet.payer]);

			// Add the signed transaction to the list
			transactionList.push(transaction);
		}

		// Step 3: Send each transaction
		for (const transaction of transactionList) {
			const rawTransaction = transaction.serialize();
			const txid = await connection.sendRawTransaction(rawTransaction, {
				skipPreflight: true,
				maxRetries: 2
			});
			await connection.confirmTransaction(txid);
			signatures.push(txid);
		}

		// After all transactions are confirmed
		for (const memecoin of memecoinsWithAllocation) {
			if (!memecoin.solana_contract_address) continue;
			
			// Get token account
			const tokenAccounts = await connection.getTokenAccountsByOwner(
				userWallet.publicKey,
				{ mint: new PublicKey(memecoin.solana_contract_address) }
			);

			const accountInfo = AccountLayout.decode(tokenAccounts.value[0].account.data);
			const balance = tokenAccounts.value[0] ? 
				Number(accountInfo.amount) :
				0;

			memecoinsReceived.push({
				mint: memecoin.solana_contract_address,
				amount: balance,
				symbol: memecoin.symbol
			});
		}


    // const user = await prisma.user.update{}

		return new Response(
			JSON.stringify({
				success: true,
				signatures
			}),
			{
				status: 200,
				headers: {
					'Content-Type': 'application/json'
				}
			}
		);
	} catch (error) {
		console.error('Error in swap API:', error);
		return new Response(
			JSON.stringify({
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			}),
			{
				status: 500,
				headers: {
					'Content-Type': 'application/json'
				}
			}
		);
	}
}
