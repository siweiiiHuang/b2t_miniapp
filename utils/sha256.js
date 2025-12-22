/**
 * SHA-256 加密实现
 * 适用于微信小程序环境
 */

/**
 * SHA-256 哈希函数
 * @param {string} message 要加密的字符串
 * @returns {string} 64位十六进制哈希值
 */
function sha256(message) {
    // SHA-256 常量
    var K = [
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
        0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
        0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
        0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
        0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
        0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
        0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
        0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
        0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
        0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];

    // 初始哈希值
    var H = [
        0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
        0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
    ];

    // 将字符串转换为字节数组
    function stringToBytes(str) {
        var bytes = [];
        for (var i = 0; i < str.length; i++) {
            var charCode = str.charCodeAt(i);
            if (charCode < 0x80) {
                bytes.push(charCode);
            } else if (charCode < 0x800) {
                bytes.push(0xc0 | (charCode >> 6));
                bytes.push(0x80 | (charCode & 0x3f));
            } else if (charCode < 0xd800 || charCode >= 0xe000) {
                bytes.push(0xe0 | (charCode >> 12));
                bytes.push(0x80 | ((charCode >> 6) & 0x3f));
                bytes.push(0x80 | (charCode & 0x3f));
            } else {
                i++;
                charCode = 0x10000 + (((charCode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
                bytes.push(0xf0 | (charCode >> 18));
                bytes.push(0x80 | ((charCode >> 12) & 0x3f));
                bytes.push(0x80 | ((charCode >> 6) & 0x3f));
                bytes.push(0x80 | (charCode & 0x3f));
            }
        }
        return bytes;
    }

    // 右旋转
    function rightRotate(value, amount) {
        return (value >>> amount) | (value << (32 - amount));
    }

    // 将字节数组转换为字数组
    function bytesToWords(bytes) {
        var words = [];
        for (var i = 0; i < bytes.length; i += 4) {
            words.push(
                (bytes[i] << 24) |
                (bytes[i + 1] << 16) |
                (bytes[i + 2] << 8) |
                bytes[i + 3]
            );
        }
        return words;
    }

    // 将字数组转换为字节数组
    function wordsToBytes(words) {
        var bytes = [];
        for (var i = 0; i < words.length; i++) {
            bytes.push(
                (words[i] >>> 24) & 0xff,
                (words[i] >>> 16) & 0xff,
                (words[i] >>> 8) & 0xff,
                words[i] & 0xff
            );
        }
        return bytes;
    }

    // 将字节数组转换为十六进制字符串
    function bytesToHex(bytes) {
        var hex = '';
        for (var i = 0; i < bytes.length; i++) {
            hex += ((bytes[i] >>> 4) & 0xf).toString(16);
            hex += (bytes[i] & 0xf).toString(16);
        }
        return hex;
    }

    // 预处理：填充消息
    var bytes = stringToBytes(message);
    var bitLength = bytes.length * 8;
    
    // 添加填充位
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) {
        bytes.push(0x00);
    }

    // 添加长度（64位，大端序）
    var lengthBytes = [];
    for (var i = 7; i >= 0; i--) {
        lengthBytes.push((bitLength >>> (i * 8)) & 0xff);
    }
    bytes = bytes.concat(lengthBytes);

    // 处理每个512位块
    for (var chunk = 0; chunk < bytes.length; chunk += 64) {
        var w = [];
        for (var i = 0; i < 16; i++) {
            w[i] = (bytes[chunk + i * 4] << 24) |
                   (bytes[chunk + i * 4 + 1] << 16) |
                   (bytes[chunk + i * 4 + 2] << 8) |
                   bytes[chunk + i * 4 + 3];
        }

        // 扩展16个字到64个字
        for (var i = 16; i < 64; i++) {
            var s0 = rightRotate(w[i - 15], 7) ^ rightRotate(w[i - 15], 18) ^ (w[i - 15] >>> 3);
            var s1 = rightRotate(w[i - 2], 17) ^ rightRotate(w[i - 2], 19) ^ (w[i - 2] >>> 10);
            w[i] = (w[i - 16] + s0 + w[i - 7] + s1) & 0xffffffff;
        }

        // 初始化工作变量
        var a = H[0];
        var b = H[1];
        var c = H[2];
        var d = H[3];
        var e = H[4];
        var f = H[5];
        var g = H[6];
        var h = H[7];

        // 主循环
        for (var i = 0; i < 64; i++) {
            var S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
            var ch = (e & f) ^ ((~e) & g);
            var temp1 = (h + S1 + ch + K[i] + w[i]) & 0xffffffff;
            var S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
            var maj = (a & b) ^ (a & c) ^ (b & c);
            var temp2 = (S0 + maj) & 0xffffffff;

            h = g;
            g = f;
            f = e;
            e = (d + temp1) & 0xffffffff;
            d = c;
            c = b;
            b = a;
            a = (temp1 + temp2) & 0xffffffff;
        }

        // 添加到哈希值
        H[0] = (H[0] + a) & 0xffffffff;
        H[1] = (H[1] + b) & 0xffffffff;
        H[2] = (H[2] + c) & 0xffffffff;
        H[3] = (H[3] + d) & 0xffffffff;
        H[4] = (H[4] + e) & 0xffffffff;
        H[5] = (H[5] + f) & 0xffffffff;
        H[6] = (H[6] + g) & 0xffffffff;
        H[7] = (H[7] + h) & 0xffffffff;
    }

    // 转换为十六进制字符串
    var hashBytes = [];
    for (var i = 0; i < 8; i++) {
        hashBytes.push((H[i] >>> 24) & 0xff);
        hashBytes.push((H[i] >>> 16) & 0xff);
        hashBytes.push((H[i] >>> 8) & 0xff);
        hashBytes.push(H[i] & 0xff);
    }

    return bytesToHex(hashBytes);
}

module.exports = sha256;

