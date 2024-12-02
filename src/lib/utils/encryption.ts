export async function encrypt(text: string, fetch: Function): Promise<string> {
	const response = await fetch('/api/encrypt', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ text })
	});

	const data = await response.json();
	if (!data.success) throw new Error('Encryption failed');

	return data.encrypted;
}

export async function decrypt(encryptedData: string, fetch: Function): Promise<string> {
	const response = await fetch('/api/decrypt', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ encryptedData })
	});

	const data = await response.json();
	if (!data.success) throw new Error('Decryption failed');

	return data.decrypted;
}
