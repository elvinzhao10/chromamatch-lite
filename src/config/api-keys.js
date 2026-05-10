/**
 * Secure API Key Manager for Browser
 * 
 * Features:
 * - Encrypted storage in localStorage
 * - Session-based encryption key
 * - Key validation
 * - Import/export functionality
 */

class SecureKeyManager {
    constructor() {
        this.storageKey = 'chromamatch_secure_keys';
        this.sessionKey = this.generateSessionKey();
        this.providers = ['unsplash', 'pexels', 'openai', 'google'];
    }

    /**
     * Generate a random session key for encryption
     */
    generateSessionKey() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Simple XOR encryption (for basic obfuscation)
     * Note: For production, consider using Web Crypto API with AES-GCM
     */
    encrypt(text, key) {
        const textBytes = new TextEncoder().encode(text);
        const keyBytes = new TextEncoder().encode(key);
        const encrypted = new Uint8Array(textBytes.length);
        
        for (let i = 0; i < textBytes.length; i++) {
            encrypted[i] = textBytes[i] ^ keyBytes[i % keyBytes.length];
        }
        
        return btoa(String.fromCharCode(...encrypted));
    }

    decrypt(encryptedBase64, key) {
        try {
            const encrypted = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
            const keyBytes = new TextEncoder().encode(key);
            const decrypted = new Uint8Array(encrypted.length);
            
            for (let i = 0; i < encrypted.length; i++) {
                decrypted[i] = encrypted[i] ^ keyBytes[i % keyBytes.length];
            }
            
            return new TextDecoder().decode(decrypted);
        } catch {
            return null;
        }
    }

    /**
     * Save all keys to encrypted storage
     */
    saveKeys(keys) {
        const validKeys = {};
        for (const [provider, key] of Object.entries(keys)) {
            if (key && key.trim()) {
                validKeys[provider] = key.trim();
            }
        }
        
        if (Object.keys(validKeys).length === 0) {
            localStorage.removeItem(this.storageKey);
            return;
        }
        
        const json = JSON.stringify(validKeys);
        const encrypted = this.encrypt(json, this.sessionKey);
        localStorage.setItem(this.storageKey, encrypted);
    }

    /**
     * Load keys from encrypted storage
     */
    loadKeys() {
        try {
            const encrypted = localStorage.getItem(this.storageKey);
            if (!encrypted) return {};
            
            const json = this.decrypt(encrypted, this.sessionKey);
            if (!json) {
                // Decryption failed (session changed), clear storage
                localStorage.removeItem(this.storageKey);
                return {};
            }
            return JSON.parse(json);
        } catch {
            localStorage.removeItem(this.storageKey);
            return {};
        }
    }

    /**
     * Get a single key
     */
    getKey(provider) {
        const keys = this.loadKeys();
        return keys[provider] || null;
    }

    /**
     * Set a single key
     */
    setKey(provider, key) {
        const keys = this.loadKeys();
        if (key && key.trim()) {
            keys[provider] = key.trim();
        } else {
            delete keys[provider];
        }
        this.saveKeys(keys);
    }

    /**
     * Check if a provider has a configured key
     */
    hasKey(provider) {
        return !!this.getKey(provider);
    }

    /**
     * Get status of all keys (without revealing values)
     */
    getStatus() {
        const keys = this.loadKeys();
        const status = {};
        
        for (const provider of this.providers) {
            const key = keys[provider];
            status[provider] = {
                configured: !!key,
                masked: key ? this.maskKey(key) : null
            };
        }
        
        return status;
    }

    /**
     * Mask a key for display (show first 4 and last 4 chars)
     */
    maskKey(key) {
        if (!key || key.length < 12) return '****';
        return `${key.slice(0, 4)}${'*'.repeat(8)}${key.slice(-4)}`;
    }

    /**
     * Validate key format
     */
    validateKey(provider, key) {
        if (!key) return { valid: false, error: 'Key is empty' };
        
        const validators = {
            unsplash: (k) => k.length >= 20,
            pexels: (k) => k.length >= 20,
            openai: (k) => k.startsWith('sk-') && k.length > 20,
            google: (k) => k.length >= 20
        };
        
        const validator = validators[provider];
        if (!validator) return { valid: false, error: 'Unknown provider' };
        
        const valid = validator(key);
        return {
            valid,
            error: valid ? null : `Invalid ${provider} key format`
        };
    }

    /**
     * Export keys to a backup format
     */
    exportKeys() {
        const keys = this.loadKeys();
        const exportData = {
            version: 1,
            exported: new Date().toISOString(),
            providers: Object.keys(keys)
        };
        
        return {
            metadata: exportData,
            data: btoa(JSON.stringify(keys))
        };
    }

    /**
     * Import keys from a backup
     */
    importKeys(data) {
        try {
            const keys = JSON.parse(atob(data));
            this.saveKeys(keys);
            return { success: true, imported: Object.keys(keys) };
        } catch (error) {
            return { success: false, error: 'Invalid import data' };
        }
    }

    /**
     * Clear all stored keys
     */
    clearAll() {
        localStorage.removeItem(this.storageKey);
    }
}

// Singleton instance
window.SecureKeyManager = new SecureKeyManager();
