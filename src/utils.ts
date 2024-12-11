export function mortonEncode2D(xData: number[], yData: number[]) {
    const resultArr: number[] = []
    xData.forEach((x, i) => {
        let xn = BigInt(x)
        xn = (xn | (xn << 16n)) & 0x0000FFFF0000FFFFn
        xn = (xn | (xn << 8n)) & 0x00FF00FF00FF00FFn
        xn = (xn | (xn << 4n)) & 0x0F0F0F0F0F0F0F0Fn
        xn = (xn | (xn << 2n)) & 0x3333333333333333n
        xn = (xn | (xn << 1n)) & 0x5555555555555555n

        let yn = BigInt(Math.round(yData[i] * 10000))
        yn = (yn | (yn << 16n)) & 0x0000FFFF0000FFFFn
        yn = (yn | (yn << 8n)) & 0x00FF00FF00FF00FFn
        yn = (yn | (yn << 4n)) & 0x0F0F0F0F0F0F0F0Fn
        yn = (yn | (yn << 2n)) & 0x3333333333333333n
        yn = (yn | (yn << 1n)) & 0x5555555555555555n

        const result = xn | (yn << 1n)
        resultArr.push(Number(result))
    })
    return resultArr
}