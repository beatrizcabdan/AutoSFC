//HILBERT (transpiled with ChatGPT as of feb 5, 2025)

function gray2binary(gray: boolean[]): boolean[] {
    const binary = [...gray];
    for (let i = 1; i < binary.length; i++) {
        binary[i] = binary[i] !== binary[i - 1];
    }
    return binary;
}

function bitArrayToBigInt(bits: boolean[]): bigint {
    let result = 0n;
    for (let i = 0; i < bits.length; i++) {
        if (bits[i]) {
            result |= 1n << BigInt(bits.length - i - 1);
        }
    }
    return result;
}

export function hilbertEncode(transposed: number[][], raw_num_bits: number): number[] {
    const locs: number[][] = transposed[0].map((_, dim) => transposed.map(row => row[dim]));

    if (!locs.length || !Array.isArray(locs[0])) {
        throw new Error('locs must be a non-empty array of coordinate arrays');
    }
    const num_dims = locs[0].length;

    console.log('typeof num_bits:', typeof raw_num_bits, 'value:', raw_num_bits);
    const num_bits = Math.floor(raw_num_bits);
    // let num_bits = 10;
    if (!Number.isFinite(num_bits) || !Number.isInteger(num_bits) || num_bits <= 0) {
        throw new Error(`Invalid num_bits!! ${raw_num_bits}`);
    }

    const orig_shape = [locs.length, num_dims];

    if (orig_shape[1] !== num_dims) {
        throw new Error(
            `Shape mismatch: last dimension is ${orig_shape[1]} but num_dims=${num_dims}`
        );
    }

    if (num_dims * num_bits > 64) {
        throw new Error(
            `Too many bits: ${num_dims} dims * ${num_bits} bits = ${ num_dims * num_bits }, exceeds 64`
        );
    }

    // Simulate locs.astype('>u8').view(np.uint8)
    const locs_uint8 = locs.map((vec) =>
        vec.map((val) => {
            const bytes = new Uint8Array(8);
            const view = new DataView(bytes.buffer);
            view.setBigUint64(0, BigInt(val), false); // big-endian
            return Array.from(bytes);
        })
    );

    for (let i = 0; i < locs.length; i++) {
        if (!Array.isArray(locs[i])) {
            throw new Error(`locs[${i}] is not an array`);
        }
        if (locs[i].length !== num_dims) {
            throw new Error(
            `locs[${i}] has wrong dimension count: ${locs[i].length} instead of num_dims = ${num_dims}`
            );
        }
    }

    // Convert to bits and truncate to num_bits
    const gray: boolean[][][] = locs_uint8.map((vec) =>
        vec.map((byteArr) => {
            const bits: boolean[] = [];
            for (const b of byteArr) {
                for (let i = 7; i >= 0; i--) {
                    bits.push(((b >> i) & 1) !== 0);
                }
            }
            return bits.slice(-num_bits);
        })
    );

    const N = gray.length;

    for (let i = 0; i < gray.length; i++) {
        if (!gray[i]) {
            throw new Error(`gray[${i}] is undefined`);
        }
        for (let d = 0; d < gray[i].length; d++) {
            if (!gray[i][d]) {
                throw new Error(`gray[${i}][${d}] is undefined`);
            }
            if (gray[i][d].length !== num_bits) {
                throw new Error(
                    `gray[${i}][${d}] has wrong length: ${gray[i][d].length} instead of ${num_bits}`
                );
            }
        }
    }

    // Bit manipulation loop
    for (let bit = 0; bit < num_bits; bit++) {
        for (let dim = 0; dim < num_dims; dim++) {
            for (let i = 0; i < N; i++) {
                try {
                    const mask = gray[i][dim][bit];

                    for (let b = bit + 1; b < num_bits; b++) {
                        if (mask) {
                            gray[i][0][b] = gray[i][0][b] !== true;
                        } else {
                            const to_flip = gray[i][0][b] !== gray[i][dim][b];
                            gray[i][dim][b] = gray[i][dim][b] !== to_flip;
                            gray[i][0][b] = gray[i][0][b] !== to_flip;
                        }
                    }
                } catch (e) {
                    console.error(`Error at i=${i}, dim=${dim}, bit=${bit}:`, e);
                    throw e;
                }
            }
        }
    }

    const gray_flat = gray.map((entry) => {
        const transposed: boolean[][] = Array.from({ length: num_bits }, () =>
            new Array(num_dims).fill(false)
        );
        for (let d = 0; d < num_dims; d++) {
            for (let b = 0; b < num_bits; b++) {
                transposed[b][d] = entry[d][b];
            }
        }
        return transposed.flat(); // flatten to 1D
    });

    // Convert Gray to binary
    const hh_bin = gray_flat.map(gray2binary);

    // Pad to 64 bits
    const extra_dims = 64 - num_dims * num_bits;

    if (extra_dims < 0) {
        throw new Error(
            `Total bits exceed 64: num_dims=${num_dims}, num_bits=${num_bits}, total=${
                num_dims * num_bits
            }`
        );
    }
    // console.log(num_dims, num_bits, num_dims * num_bits);

    const padded = hh_bin.map((bits) => {
        const pad = new Array(extra_dims).fill(false);
        return [...pad, ...bits];
    });

    // Convert to BigUint64Array (simulate packbits + uint64 view)
    const hh_uint64 = padded.map((bits) => bitArrayToBigInt(bits));

    return bigUint64ToNumberArray(BigUint64Array.from(hh_uint64));
}

//MORTON

function assignSlice(
    c: bigint,
    dataPoint: number[],
    totalBits: number,
    dims: number
): bigint {
    for (let i = 0; i < dataPoint.length; i++) {
        // Convert the number to a bigint on the fly
        const v = BigInt(dataPoint[i]);
        let bitIndex = 0;
        for (let pos = i; pos < totalBits; pos += dims) {
            const bit = (v >> BigInt(bitIndex)) & 1n;
            c &= ~(1n << BigInt(pos));
            if (bit === 1n) {
                c |= 1n << BigInt(pos);
            }
            bitIndex++;
        }
    }
    return c;
}

export function mortonInterlace(data: number[][], bits_per_dim: number) {
    const dims = data.length;
    const resultArr: number[] = [];
    data = data[0].map((_, colIndex) => data.map((row) => row[colIndex])); //transpose
    data.forEach((x, i) => {
        const total_bits = dims * bits_per_dim;

        let c = BigInt(0);
        c = assignSlice(c, x, total_bits, dims);
        resultArr.push(Number(c));
    });
    return resultArr;
}

// https://fiveko.com/gaussian-filter-in-pure-javascript/
export function makeGaussKernel(sigma: number) {
    const GAUSSKERN = 6.0;
    const dim = Math.round(Math.max(3.0, GAUSSKERN * sigma));
    const sqrtSigmaPi2 = Math.sqrt(Math.PI * 2.0) * sigma;
    const s2 = 2.0 * sigma * sigma;
    let sum = 0.0;

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const kernel = new Float32Array(dim - !(dim & 1)); // Make it odd number
    const half = Math.floor(kernel.length / 2);
    for (let j = 0, i = -half; j < kernel.length; i++, j++) {
        kernel[j] = Math.exp(-(i * i) / s2) / sqrtSigmaPi2;
        sum += kernel[j];
    }
    // Normalize the gaussian kernel to prevent image darkening/brightening
    for (let i = 0; i < dim; i++) {
        kernel[i] /= sum;
    }
    return kernel;
}

export function debounce(func: () => void, time = 200) {
    let timer: number | undefined;
    return function () {
        if (timer) {
            clearTimeout(timer);
        }
        timer = setTimeout(func, time);
    };
}

function bigUint64ToNumberArray(bigArray: BigUint64Array): number[] {
    return Array.from(bigArray, (x) => {
        const num = Number(x);
        if (!Number.isSafeInteger(num)) {
            throw new Error(`Value ${x} exceeds safe integer limit`);
        }
        return num;
    });
}
