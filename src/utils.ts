export function mortonEncode2D(xData: number[], yData: number[], minValue: number) {
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
        // console.log(result)

        resultArr.push(Number(result))
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