/**
 * Base32 encoding and decoding utility
 */
const Base32 = {
    // RFC 4648 Base32 alphabet
    ALPHABET: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567',
    
    // Encode a string to Base32
    encode: function(input) {
        if (!input) return '';
        
        // Convert string to byte array
        const bytes = [];
        for (let i = 0; i < input.length; i++) {
            bytes.push(input.charCodeAt(i));
        }
        
        let result = '';
        let bits = 0;
        let value = 0;
        
        for (let i = 0; i < bytes.length; i++) {
            value = (value << 8) | bytes[i];
            bits += 8;
            
            while (bits >= 5) {
                bits -= 5;
                result += this.ALPHABET[(value >>> bits) & 31];
            }
        }
        
        // Handle remaining bits
        if (bits > 0) {
            result += this.ALPHABET[(value << (5 - bits)) & 31];
        }
        
        // Add padding
        while (result.length % 8 !== 0) {
            result += '=';
        }
        
        return result;
    },
    
    // Decode a Base32 string
    decode: function(input) {
        if (!input) return '';
        
        // Remove padding and whitespace
        input = input.trim().replace(/=+$/, '').toUpperCase();
        
        let result = '';
        let bits = 0;
        let value = 0;
        
        for (let i = 0; i < input.length; i++) {
            const index = this.ALPHABET.indexOf(input[i]);
            if (index === -1) continue; // Skip invalid characters
            
            value = (value << 5) | index;
            bits += 5;
            
            if (bits >= 8) {
                bits -= 8;
                result += String.fromCharCode((value >>> bits) & 255);
            }
        }
        
        return result;
    }
};

// Make it available globally
window.Base32 = Base32;