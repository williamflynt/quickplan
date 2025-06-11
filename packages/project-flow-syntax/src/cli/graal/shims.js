// Polyfills for browser APIs in GraalVM

export class TextEncoder {
    encode(text) {
        const encoded = new Uint8Array(text.length);
        for (let i = 0; i < text.length; i++) {
            encoded[i] = text.charCodeAt(i);
        }
        return encoded;
    }
}

export class TextDecoder {
    decode(bytes) {
        return String.fromCharCode.apply(null, bytes);
    }
}
