import {Button, IconButton, List, ListItem, ListItemButton, ListItemText, Zoom} from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import React, {FormEvent, useEffect, useRef, useState} from "react";
import './PresetComponent.scss'
import './App.scss'
import {DEFAULT_BITS_PER_SIGNAL, DEFAULT_OFFSET, DEFAULT_SCALING_FACTOR} from "./App.tsx";

export interface Preset {
    name: string,
    signalStartRow: number,
    signalEndRow: number,
    cspStartRow: number,
    cspEndRow: number,
    bitsPerSignal: number,
    signalTransforms: {
        signalName: string,
        offset: number,
        scaling: number
    }[],
    encoder: string,
    plotTransformedSignals: boolean
}
export function PresetComponent(props: {
    onPresetSelect: (preset: Preset) => void,
    initialDataPath: string,
    displayedStartRow: number,
    displayedEndRow: number,
    currentDataFile: string,
    plotTransformedSignals: boolean,
    scales: (number | undefined)[],
    offsets: (number | undefined)[],
    bitsPerSignal: number | string,
    minSfcValue: number,
    maxSfcValue: number,
    encoder: string,
    displayedDataLabels: string[] | null,
    currentPresetName: string
}) {
    const PRESET_FILE_SUFFIX = '_presets.json'

    const [presets, setPresets] = useState<Preset[] | null>()
    const [selectedIndex, setSelectedIndex] = useState(-1)
    const [deletedIndex, setDeletedIndex] = useState(-1)
    const inputRef = useRef<HTMLInputElement | null>(null)

    function setPresetsFromFileString(content: string) {
        // const lines = content.split('\n')
        const presArray = JSON.parse(content)
        /*lines.forEach(line => {
            const [startRow, endRow] = line.split(/[;,]/)
            presArray.push({
                signalStartRow: Number(startRow),
                signalEndRow: Number(endRow),
                bitsPerSignal: 0,
                cspEndRow: 0,
                cspStartRow: 0,
                encoder: "",
                name: "",
                plotTransformedSignals: false,
                signalTransforms: []

            })
        })*/
        presArray.sort((p1: Preset, p2: Preset) =>
            p1.name.localeCompare(p2.name))
        setPresets(presArray)
        setSelectedIndex(-1)
    }

    /*useEffect(() => {
        const presetPath = `${props.initialDataPath.replace('.json', '')}${PRESET_FILE_SUFFIX}`
        fetch(presetPath).then(r => {
            r.text().then(t => setPresetsFromFileString(t))
        })
    }, [])*/

    useEffect(() => {
        if (!presets) {
            return
        }

        for (const p of presets) {
            const i = presets.indexOf(p);
            if (props.currentPresetName === p.name) {
                setSelectedIndex(i)
                return;
            }
        }
        setSelectedIndex(-1)
    }, [presets, props.currentPresetName]);

    function onPresetClick(index: number) {
        setSelectedIndex(index)
        const preset = presets![index]
        props.onPresetSelect(preset)
    }

    function createPresetName() {
        let presetSuffix = 1
        while (presets?.some(p => p.name === `preset_0${presetSuffix}`)) {
            presetSuffix++
        }
        return `preset_0${presetSuffix}`;
    }

    function addPreset() {
        // TODO: Should a preset still only be displayed as selected if all its parameters are exactly the same as current state's?
        /*if (selectedIndex > -1) {
            return
        }*/

        const newPreset: Preset = {
            name: createPresetName(),
            signalStartRow: props.displayedStartRow,
            signalEndRow: props.displayedEndRow,
            cspStartRow: props.minSfcValue,
            cspEndRow: props.maxSfcValue,
            bitsPerSignal: props.bitsPerSignal === '' ? DEFAULT_BITS_PER_SIGNAL : Number(props.bitsPerSignal),
            signalTransforms: props.displayedDataLabels?.map((name, i) => {
                return {
                    signalName: String(name),
                    offset: props.offsets[i] ?? DEFAULT_OFFSET,
                    scaling: props.scales[i] ?? DEFAULT_SCALING_FACTOR
                }
            }) ?? [],
            encoder: props.encoder,
            plotTransformedSignals: props.plotTransformedSignals
        }
        console.log(newPreset)
        const newPresets = [...(presets ?? []), newPreset]
            .sort((p1, p2) => p1.name.localeCompare(p2.name))
        setPresets(newPresets)
        setSelectedIndex(newPresets.findIndex(p => p === newPreset))
        props.onPresetSelect(newPreset)
        console.log(newPresets.findIndex(p => p === newPreset))
    }

    function onPresetDeleteClick(i: number, e: React.MouseEvent<HTMLButtonElement>) {
        e.stopPropagation()
        setDeletedIndex(i)
    }

    function onLoadClick() {
        inputRef.current?.click()
    }

    function uploadFile(e: FormEvent<HTMLInputElement>) {
        const file = e.currentTarget?.files?.item(0)
        if (file?.type === 'text/csv') {
            const reader = new FileReader();
            reader.onload = () => {
                const text = reader.result?.toString();
                if (text) {
                    setPresetsFromFileString(text)
                } else {
                    alert("Error reading the file. Please try again.");
                }
            };
            reader.onerror = () => {
                alert("Error reading the file. Please try again.");
            };
            reader.readAsText(file);
        }
        if (e.currentTarget) {
            e.currentTarget.value = ''
        }
    }

    function savePresets() {
        // https://stackoverflow.com/a/72490299/23995082
        const textContent = presets?.map(p => JSON.stringify(p, undefined, ' ')).join(',\n') ?? ''
        const hiddenElement = document.createElement('a');
        hiddenElement.href = 'data:attachment/text,' + encodeURI(textContent ? `[${textContent}]` : '');
        hiddenElement.target = '_blank';
        hiddenElement.download = props.currentDataFile.replace('.csv', '') + PRESET_FILE_SUFFIX
        hiddenElement.click();
    }

    function removePreset(index: number) {
        setPresets(presets => [...presets!.slice(0, index), ...presets!.slice(index + 1)])
        setDeletedIndex(-1)
    }

    return <div className={'preset-list-container'}>
        <List id={'preset-list'}>
            {presets?.map((p, i) => <ListItem key={i}>
                 <Zoom appear={i == deletedIndex || p.name === props.currentPresetName}
                       in={i !== deletedIndex} onExited={() => removePreset(i)}>
                    <ListItemButton selected={p.name === props.currentPresetName} onClick={() => onPresetClick(i)}>
                        <ListItemText primary={<div className={'preset-item-text'}>
                            <p>{p.name}</p>
                        </div>} />
                        <IconButton onClick={e => onPresetDeleteClick(i, e)}>
                            <DeleteIcon />
                        </IconButton>
                    </ListItemButton>
                </Zoom>
            </ListItem>)}
        </List>
        <div id={'preset-button-panel'}>
            <input ref={inputRef} type="file" className="file-input" onInput={uploadFile} accept={'text/csv'}/>
            <Button className={'button'} id={'add-preset-button'} variant={'outlined'}
                    onClick={addPreset}>Create preset</Button>
            <Button className={'button'} id={'save-preset-button'} onClick={savePresets} disabled={!presets || presets.length === 0}>Save presets</Button>
            <Button className={'button'} id={'load-preset-button'} onClick={onLoadClick}>Load presets</Button>
        </div>
    </div>
}