/**
 * CRC32 computing function.
 * Usage:  bin2hexStr(int2bin(crc32('123456789')));
 * Result: "cbf43926"
 *
 * Adler32 hash computing function.
 * Usage:  bin2hexStr(int2bin(adler32('123456789')));
 * Result: "091e01de"
 *
 * © 2009 Stephan Legachyov
 * http://tzone.mag.tc
 * http://siberex.livejournal.com
 * siberex@gmail.com
 */

// Creating CRC32 table for quick computing.
var crcTable = function(table) {
    var c, i, j;
    for (i = 0; i < 256; c = ++i) {
        for (j = 0; j < 8; j++) {
            c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
        }
        table[i] = c;
    }
    return table;
}([]); // We need extra 1024 bytes of RAM for this.

// Converts number to binary data with specified length (4 by default = 32 bits).
var int2bin = function(data, len) {
    var len = len || 4;
    var result = [];
    for (var i = (len - 1) << 3; i >= 0; i -= 8) {
        result[result.length] = (data & 0xFF << i) >>> i;
    }
    return result;
}

// Converts string to binary buffer
var str2bin = function(data) {
    for (i = 0, data = data.split(''); i < data.length; i++) data[i] = data[i].charCodeAt(0);
    return data;
}

/**
 * Converts binary data to human-readable hex string. Just for debugging purposes.
 *
 * separators: defines how to separate hex data,
 * E.g {1 : ' ', 8 : '| ', 16 : "\n"} means space between each byte, vertical bar between
 * every 8 bytes, and line feed between groups of 16 bytes.
 */
var bin2hexStr = function(data, separators) {
    var separators = separators || {1 : ' ', 8 : ' | ', 32 : "\n"};
    var result = '', s = '', i, k;
    for (i = 0; i < data.length; i++) {
        result += (data[i] < 15 ? '0' : '') + data[i].toString(16); //.toUpperCase();
        for (k in separators) if ((i+1) % k === 0) s = separators[k];
        result += s; s = '';
    }
    return result;
}

// Computes CRC32 checksum of binary data or string.
// Returns number.
var crc32 = function(buf) {
    var c = 0xFFFFFFFF, i;
    if (typeof buf === 'string') for (i = 0, buf = buf.split(''); i < buf.length; i++) buf[i] = buf[i].charCodeAt(0);
    for (i = 0; i < buf.length; i++) {
        c = crcTable[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
    }
    return ~c;
}

// Computes Adler32 checksum of binary data or string.
// Returns number.
var adler32 = function(data) {
    var s1 = 1, s2 = 0, i;
    // Same as “data = str2bin(data);”:
    if (typeof data === 'string') for (i = 0, data = data.split(''); i < data.length; i++) data[i] = data[i].charCodeAt(0);
    for (i = 0; i < data.length; i++) {
        s1 = ( s1 + data[i] ) % 65521;
        s2 = (s1 + s2) % 65521; // Largest prime number that < pow(2, 16).
    }
    return (s2 << 16) + s1;
}