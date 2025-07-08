export const demoPreset1 = {
    dataPointInterval: 1,
    dataRangeStart: 0,
    dataRangeEnd: -1,
    lineDataSmoothing: 0
}
export const demoPreset2 = {
    dataPointInterval: 5,
    dataRangeStart: 13000,
    dataRangeEnd: 14000,
    lineDataSmoothing: 1.0
}
export const demoPreset3 = {
    dataPointInterval: 5,
    dataRangeStart: 63000,
    dataRangeEnd: 64000,
    lineDataSmoothing: 1.0
}
export const demoPreset4 = {
    dataPointInterval: 1,
    dataRangeStart: 1000,
    dataRangeEnd: 1020,
    lineDataSmoothing: 0
}
export const paperPreset = {
    dataPointInterval: 1,
    dataRangeStart: 720,
    dataRangeEnd: 880,
    lineDataSmoothing: 0
}
export const demoPreset5 = {
    dataPointInterval: 1,
    dataRangeStart: 0,
    dataRangeEnd: 236,
    lineDataSmoothing: 0,
    sfcRangeMin: 0,
    sfcRangeMax: 1000000000
}

 export const default_demo1 = {
    dataPointInterval: 1,
    file1: "./one_cell_sq00.csv",
    file2: "./two_cells_sq00.csv",
    file1_signals: ["cell_0", "cell_1", "cell_2", "cell_3", "cell_4", "cell_5"],
    file2_signals: ["cell_0", "cell_1", "cell_2", "cell_3", "cell_4", "cell_5"],
    file1_offsets: new Array(6).fill(10),
    file2_offsets: new Array(6).fill(10),
    file1_scales: new Array(6).fill(5),
    file2_scales: new Array(6).fill(5),
    bitsPerSignal: 3
}