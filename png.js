/**
 * PNG object.
 *
 * © 2008—2009 Stephan Legachyov <siberex@gmail.com>
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

// Base 2 logarithm
var log2 = function(n) { return Math.log(n) / Math.log(2); };

var Png = {

    width: 0,
    height: 0,
    bps: 8,         // Bits per sample.
    colorMode: 6,
    bytesPp: 4,     // Bytes per pixel.
    pixelData: [],
    //filterTypes: [],

    fileSignature: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
    // PNG file signature: 89  P N G  0D 0A 1A 0A
    IHDR: [],
    // length         IHDR           width          height          bps col com fil int     CRC32
    // 00 00 00 0D    49 48 44 52    00 00 00 05    00 00 00 05     08  06  00  00  00      8D 6F 26 E5


    IDAT: [],
    // length (45)    IDAT           Zlib                                                                                                                                      CRC32
    // 00 00 00 2D    49 44 41 54    78 DA 62 F8 CF C0 F0 1F 0C 19 FE 03 31 90 00 02 16 20 A3 91 01 0D 80 04 0F A0 0B 32 FE 07 EB 42 05 4C 0C 58 00 40 80 01 00 CA 5E 0F 3F    2C 1C 3C C7

    // 2 full-opaque pixels (black and white in 1*2 image), data len = 17, data is:
    // Zlib:
    // 78 DA 62 60 00 82 FF FF FF 03 04 18 00 06 02 02 FE

    IEND: [].concat(int2bin(0), str2bin('IEND'), 0xAE, 0x42, 0x60, 0x82), // With CRC, length = 0
    // 00 00 00 00    49 45 4E 44    AE 42 60 82

    map: function(x, y) {


    },

    setHeader: function(width, height, bps, color, interlace) {
        if (typeof width === 'undefined') throw 'Width must be specified.';
        if (typeof height === 'undefined') throw 'Height must be specified.';
        if (width > 0x7FFFFFFF || height > 0x7FFFFFFF) throw 'Too big dimensions are set.'; // Must be <= pow(2, 31) - 1
        // Bits per sample: 8 or 16
        var bps = bps || 8;
        // Check for full PNG implementation:
        // if (bps > 16 || parseInt(log2(bps)) !== log2(bps)) throw 'Bits per sample must be 1, 2, 4, 8 or 16.';
        // Check for my implementation:
        if (bps !== 16 && bps !== 8) throw 'Allowed only 8 or 16 bits per sample.';
        // Color mode                           Allowed bps             Bytes per pixel
        // 0 = grayscale                        1, 2, 4, 8, 16          <1, 1, 2
        // 2 = RGB                              8, 16                   3, 6
        // 3 = Palette, PLTE chunk must exist   1, 2, 4, 8              <1, 1
        // 4 = grayscale + alpha                8, 16                   2, 4
        // 6 = RGB + alpha                      8, 16                   4, 8
        var color = color || 6;
        if ( color < 0 || color > 6 || (color !== 3 && color >>> 1 !== color / 2) ) throw 'Color mode must be 0, 2, 3, 4 or 6.';
        if (color > 0 && color !== 3 && bps >>> 3 !== bps / 8) throw 'This color mode supports only 8 or 16 bits per sample.';
        if (color === 3 && bps === 16) throw 'For this color mode 16 bits per sample NOT allowed.';

        /*var bppMap = {
            0: {8: 1, 16: 2}, // bps / 8, bps / (8 - cm)
            2: {8: 3, 16: 6}, // bps / 8 * 3
            3: {8: 1},        // bps / 8
            4: {8: 2, 16: 4}, // bps / 4, bps / cm, bps / (8 - cm)
            6: {8: 4, 16: 8}  // bps / 2, bps / (8 - cm)
        };*/
        this.bytesPp = color !== 2 ? parseInt(bps / (8 - color)) : bps / 8 * 3;

        var interlace = interlace || 0;
        if (interlace !== 0) interlace = 1;
        this.buildChunk('IHDR', [].concat(
            int2bin(width), int2bin(height),
            bps,                // Bits per sample = 8.
            color,              // Color type = 6 (color + alpha).
            0, 0, interlace     // Compression method, filter method and interlace method.
        ));

        this.width  = width;
        this.height = height;

        this.setDimensions();
    },

    setDimensions: function() {
        var i, j, k;
        this.pixelData = [];
        var scanLine = [];

        var RGBa = [parseInt(Math.random() * 256), parseInt(Math.random() * 256), parseInt(Math.random() * 256), parseInt(Math.random() * 256)];

        for (j = 0; j < this.width; j++) {
            //scanLine = scanLine.concat(0x00, 0x00, 0xFF, 0xFF); // Color mode = 6, 4 bytes in each pixel
            scanLine = scanLine.concat(RGBa); // Color mode = 6, 4 bytes in each pixel
        }


        /*for (var i = 0; i < this.height; i++) {
            this.pixelData[i] = [];
            this.filterTypes[i] = 0; // Filter type must prepend each scanline
            for (var j = 0; j < this.width; j++) {
                this.pixelData[i][j] = 0x0000FFFF; //RGBa
            }
        }*/

        for (i = 0; i < this.height; i++) {
            this.pixelData = this.pixelData.concat(0, scanLine); // Filter type
            /*for (j = 0; j < this.width; j++) {
                this.pixelData = this.pixelData.concat(0, 0, 0xFF, 0xFF); // Color mode = 6, 4 bytes in each pixel
            }*/

        }

        //console.debug('wooohooooo');
        //console.debug(this.pixelData);

    },

    // Creates chunk: length + type + data + crc32
    buildChunk: function(type, data) {
        //if (typeof this[type] !== 'undefined')
        this[type] = [].concat(str2bin(type), data);
        return this[type] = [].concat(
            int2bin(data.length),           // Length of chunk data.
            this[type],                     // Chunk data itself.
            int2bin( crc32(this[type]) )    // CRC of (chunk type + chunk data)
        );
    },

    buildIDat: function() {
        return this.buildChunk( 'IDAT', Zlib.wrapRawData(this.pixelData) );

        //var stream = [];
        //stream = Zlib.wrapRawData(this.pixelData);
        //alert(bin2hexStr(this.pixelData));
        //alert(bin2hexStr(stream));
        //stream = this.buildChunk( 'IDAT', stream );
        //alert(bin2hexStr(stream));

        //Пока что годится только для RGBa (color mode = 6)!

        //var stream = [];
        //var scanLine, i, j;

        /*****
        // Beware JS syntax, my darling :-)
        for (var i = 0; i < this.height; i++) {
            stream[i] = [ this.filterTypes[i] ].concat(
                this.pixelData[i].reduce(function(prev, curr) {
                  return prev.concat( int2bin(curr) ); // Extremely slow
                }, [])
            );
        }
        return this.buildChunk('IDAT', [0x78, 0x01].concat(
            stream.reduce(function(prev, curr, index, arr) {
                return prev.concat(~~(index === arr.length - 1), int2binR(curr.length), int2binR(~curr.length), curr); // Extremely slow
            }, []),
            int2bin( adler32( stream.reduce(function(prev, curr) {
                return prev.concat(curr); // Extremely slow
            }) ) )
        ));
        *****/

        //console.debug(stream);




        //console.debug(bin2hexStr(stream, ' '));
        //stream = Zlib.wrapRawData(stream);
        //console.debug(bin2hexStr(stream, ' '));

        //return this.buildChunk('IDAT', stream);
    },

    createFile: function() {
        //console.debug(bin2hexStr(this.IHDR, ' '));
        var data = this.fileSignature.concat(this.IHDR, this.IDAT, this.IEND);
        //console.debug(bin2hexStr(data));
        //alert(bin2hexStr(data));
        return 'data:image/png;base64;HTTP://TZONE.MAG.TC,' + bin2base64(data);
    }

};