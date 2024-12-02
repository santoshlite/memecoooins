import { json } from '@sveltejs/kit';
import { PRIVATE_ENCRYPTION_KEY } from '$env/static/private';

export async function POST({ request }) {
  try {
    const { text } = await request.json();
    
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    
    const keyData = encoder.encode(PRIVATE_ENCRYPTION_KEY);
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    const encryptedArray = new Uint8Array(encrypted);
    const combined = new Uint8Array(iv.length + encryptedArray.length);
    combined.set(iv);
    combined.set(encryptedArray, iv.length);

    return json({ 
      success: true, 
      encrypted: btoa(String.fromCharCode(...combined))
    });
  } catch (error) {
    return json({ success: false, error: 'Encryption failed' }, { status: 500 });
  }
}