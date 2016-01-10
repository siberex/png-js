/**
 * Simple Zlib.
 *
 * © 2009 Stephan Legachyov <siberex@gmail.com>
 * http://tzone mag.tc
 * http://siberex.livejournal.com
 */

// Converts number to “reversed” binary data with specified length (2 by default = 16 bits).
var int2binR = function(data, len) {
    var len = len || 2;
    var result = [];
    for (var i = 0; i < len << 3; i += 8) {
        result[result.length] = (data & 0xFF << i) >>> i;
    }
    return result;
}

var Zlib = {
	lenLimit: 65535, // Each chunk must have less or equal length (2 byte limit).

    setHeader: function(windowSize) {
        //this.header = String.fromCharCode(0x08); // ZLib compression method
	    //var windowSize = windowSize || int2bin(0x8000, 2); //32768

    },

	wrapRawData: function(data, blockLen) {
        if (typeof data === 'string') for (i = 0, data = data.split(''); i < data.length; i++) data[i] = data[i].charCodeAt(0);
        var bloclLen = blockLen || this.lenLimit;
        var chunk, i, adler = int2bin(adler32(data));
		var stream = [0x78, 0x01];

		for (i = 0; i < data.length; i += bloclLen) {
            chunk = data.slice(i, i + bloclLen);
            stream = stream.concat(
                ~~(i + bloclLen >= data.length), // isLastChunk bit
                //i + bloclLen >= data.length ? 0x01 : 0x00, // isLastChunk bit
                int2binR(chunk.length),
                int2binR(~chunk.length),
                chunk
            );
		}
        return stream.concat(adler);
	}

};


var Deflate = {

    makeHuffmanTree: function(data) {
        var weights = [];
        for (var i = 0; i < data.length; i++) {
            /*if (typeof weights[data[i]] == 'undefined') {
                weights[data[i]] = 1;
            } else {
                weights[data[i]]++;
            }*/
			weights[data[i]] = weights[data[i]] + 1 || 1;
        }






    }

};

// Portable C implementation of Zlib: ftp://ftp.uu.net/pub/archiving/zip/
//                                    ftp://ftp.info-zip.org/pub/infozip/
