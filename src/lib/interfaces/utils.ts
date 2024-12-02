export interface Memecoin {
	symbol: string;
	id: string;
	name: string;
	solana_contract_address: string;
}

export interface MemecoinWithAllocation {
	symbol: string;
	id: string;
	name: string;
	solana_contract_address: string;
	allocation: number;
}
