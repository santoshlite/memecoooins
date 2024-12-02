import { json } from '@sveltejs/kit';
import { PRIVATE_ENCRYPTION_KEY } from '$env/static/private';

export async function POST({ request }) {
  try {
    const { encryptedData } = await request.json();
    
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const combined = new Uint8Array(
      atob(encryptedData)
        .split('')
        .map((char) => char.charCodeAt(0))
    );

    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);

    const keyData = encoder.encode(PRIVATE_ENCRYPTION_KEY);
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );

    return json({ 
      success: true, 
      decrypted: decoder.decode(decrypted)
    });
  } catch (error) {
    return json({ success: false, error: 'Decryption failed' }, { status: 500 });
  }
}