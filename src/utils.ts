//HILBERT (transpiled with ChatGPT as of feb 5, 2025)

function gray2binary(gray: number[]): number[] {
    const binary = [...gray];

    for (let i = 1; i < gray.length; i++) {
        binary[i] = binary[i - 1] ^ gray[i]; // XOR previous bit with current gray bit
    }
    return binary;
}

export function hilbertEncode2D( locs: number[][], numDims: number, numBits: number ): number[] {
// Convert locations to 64-bit unsigned integers and split into bytes
  const locsUint8: number[][][] = locs.map(row =>
    row.map(value => {
      const bytes = new Array(8).fill(0);
      for (let i = 0; i < 8; i++) {
        bytes[7 - i] = (value >> (i * 8)) & 0xff; // Extract each byte
      }
      return bytes;
    })
  );

  // Convert bytes to bits and truncate to `numBits`
    let bits: number[];
  const gray: number[][][] = locsUint8.map(row =>
    row.map(byteArr => {

        bits = byteArr.flatMap(byte =>
            Array.from({length: 8}, (_, i) => (byte >> (7 - i)) & 1)
        );
      return bits.slice(-numBits); // Keep only `numBits`
    })
  );

  // Run the Gray encoding process
    let mask: number[];
  for (let bit = 0; bit < numBits; bit++) {
    for (let dim = 0; dim < numDims; dim++) {

        mask = gray.map(row => row[dim][bit]);

      // Invert lower bits where this bit is active
      for (let i = 0; i < gray.length; i++) {
        if (mask[i]) {
          for (let j = bit + 1; j < numBits; j++) {
            gray[i][0][j] ^= 1;
          }
        }
      }

      // Swap lower bits between dim and 0 where the bit is inactive
        let swap: number;
      for (let i = 0; i < gray.length; i++) {
        if (!mask[i]) {
          for (let j = bit + 1; j < numBits; j++) {

              swap = gray[i][0][j] ^ gray[i][dim][j];
            gray[i][dim][j] ^= swap;
            gray[i][0][j] ^= swap;
          }
        }
      }
    }
  }

  // Flatten the bits array and swap axes
  const flattened: number[][] = gray.map(row =>
    row[0].map((_, bitIndex) => row.map(dimBits => dimBits[bitIndex])).flat()
  );

  // Convert Gray code to Binary
  const hhBin = flattened.map(gray2binary);

  // Pad back to 64-bit
  const extraDims = 64 - numBits * numDims;
  const padded = hhBin.map(binRow => [...Array(extraDims).fill(0), ...binRow]);

  // Convert binary values into uint8 bytes
  const hhUint8 = padded.map(binRow => {
    const packed: number[] = [];
    for (let i = 0; i < binRow.length; i += 8) {
        const byte = binRow.slice(i, i + 8).reduce((acc, bit, idx) => acc + (bit << (7 - idx)), 0);
      packed.push(byte);
    }
    return packed;
  });

  // Convert uint8 bytes into uint64 values
  const hhUint64 = hhUint8.map(bytes =>
    bytes.reduce((acc, byte, i) => acc + (BigInt(byte) << BigInt((7 - i) * 8)), BigInt(0))
  );

  const numberArray = Array.from(BigInt64Array.from(hhUint64), (value) => Number(value)); //todo: final conversion might lead to precision loss!

  return numberArray;
}

//MORTON

export function mortonEncode2D(xData: number[], yData: number[]) {
    const resultArr: number[] = []
    xData.forEach((x, i) => {
        x = Math.trunc(Math.trunc((x + 10.0) * 1000000)/1000000 * 100)
        const y = Math.trunc(Math.trunc((Number(yData[i]) + 10.0) * 1000000)/1000000 * 100)

        let xn = BigInt(x)
        xn = (xn | (xn << 16n)) & 0x0000FFFF0000FFFFn
        xn = (xn | (xn << 8n)) & 0x00FF00FF00FF00FFn
        xn = (xn | (xn << 4n)) & 0x0F0F0F0F0F0F0F0Fn
        xn = (xn | (xn << 2n)) & 0x3333333333333333n
        xn = (xn | (xn << 1n)) & 0x5555555555555555n

        let yn = BigInt(y)
        yn = (yn | (yn << 16n)) & 0x0000FFFF0000FFFFn
        yn = (yn | (yn << 8n)) & 0x00FF00FF00FF00FFn
        yn = (yn | (yn << 4n)) & 0x0F0F0F0F0F0F0F0Fn
        yn = (yn | (yn << 2n)) & 0x3333333333333333n
        yn = (yn | (yn << 1n)) & 0x5555555555555555n

        const result = xn | (yn << 1n)
        // console.log(x, y, xn, yn, result)

        resultArr.push(Number(result)) //todo: final conversion might lead to precision loss!
    })
    return resultArr
}

// https://fiveko.com/gaussian-filter-in-pure-javascript/
export function makeGaussKernel(sigma: number){
    const GAUSSKERN = 6.0;
    const dim = Math.round(Math.max(3.0, GAUSSKERN * sigma))
    const sqrtSigmaPi2 = Math.sqrt(Math.PI * 2.0) * sigma;
    const s2 = 2.0 * sigma * sigma;
    let sum = 0.0;

    // @ts-ignore
    const kernel = new Float32Array(dim - !(dim & 1)); // Make it odd number
    const half = Math.floor(kernel.length / 2)
    for (let j = 0, i = -half; j < kernel.length; i++, j++)
    {
        kernel[j] = Math.exp(-(i*i)/(s2)) / sqrtSigmaPi2;
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
        timer = setTimeout(func, time)
    }
}