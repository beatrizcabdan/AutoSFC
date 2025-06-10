import {Button, IconButton, List, ListItem, ListItemButton, ListItemText, TextField, Zoom} from "@mui/material";
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
    onPresetSelect: (preset: Preset | null) => void,
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
    const [editablePresetNameIdx, setEditablePresetNameIdx] = useState(-1)
    const [deletedIndex, setDeletedIndex] = useState(-1)
    const loadButtonRef = useRef<HTMLInputElement | null>(null)

    function setPresetsFromFileString(content: string, selectPresetIndex = -1) {
        const presArray = JSON.parse(content)
        presArray.sort((p1: Preset, p2: Preset) =>
            p1.name.localeCompare(p2.name))
        setPresets(presArray)
        if (presArray.length > 0 && selectPresetIndex > -1) {
            props.onPresetSelect(presArray[selectPresetIndex])
        }
    }

    // Load initial presets from file
    useEffect(() => {
        const presetPath = `${props.initialDataPath.replace('.csv', '')}${PRESET_FILE_SUFFIX}`
        fetch(presetPath).then(r => {
            r.text().then(t => setPresetsFromFileString(t, 0))
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Don't show a preset as selected after user changed any parameter
    useEffect(() => {
        const currentPreset = presets?.find(p => p.name == props.currentPresetName)
        if (currentPreset) {
            let currPresStr = JSON.stringify(currentPreset)
            currPresStr = currPresStr.replace(`"name":"${props.currentPresetName}"`, '')
                .replace(/^\{,/, '{')
                .replace(/,}/, '}')
            const currParamStr = JSON.stringify(createPresetFromCurrParams(false))
            if (currPresStr !== currParamStr) {
                props.onPresetSelect(null)
                console.log('Set current preset to null!')
            }
        }
    }, [props.displayedStartRow, props.displayedEndRow, props.plotTransformedSignals, props.scales, props.offsets,
        props.bitsPerSignal, props.minSfcValue, props.maxSfcValue, props.encoder, props.displayedDataLabels]);

    function onPresetClick(index: number) {
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

    function createPresetFromCurrParams(includeName = true) {
        const obj = {
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
        };
        if (includeName) {
            Object.assign(obj, {name: createPresetName()})
        }
        return obj
    }

    function addPreset() {
        const newPreset: Preset = createPresetFromCurrParams() as Preset
        const newPresets = [...(presets ?? []), newPreset]
            .sort((p1, p2) => p1.name.localeCompare(p2.name))
        setPresets(newPresets)
        props.onPresetSelect(newPreset)
        setEditablePresetNameIdx((newPresets?.length ?? 0) - 1)
        console.log((newPresets?.length ?? 0) - 1)
    }

    useEffect(() => {
    }, [editablePresetNameIdx]);

    function onPresetDeleteClick(i: number, e: React.MouseEvent<HTMLButtonElement>) {
        e.stopPropagation()
        setDeletedIndex(i)
    }

    function onLoadClick() {
        loadButtonRef.current?.click()
    }

    function uploadFile(e: FormEvent<HTMLInputElement>) {
        const file = e.currentTarget?.files?.item(0)
        if (file?.type === 'application/json') {
            const reader = new FileReader();
            reader.onload = () => {
                const text = reader.result?.toString();
                if (text) {
                    setPresetsFromFileString(text, 0)
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

    function onPresetTextFieldKeyUp(presetIndex: number, e: React.KeyboardEvent<HTMLDivElement>) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        const targetVal = e.target.value
        // Don't allow multiple presets with same name
        if (e.key === 'Enter' && !presets?.some((p, i) => i != presetIndex && p.name === targetVal)) {
            setEditablePresetNameIdx(-1)
            const newPresets = [...presets!]
            newPresets[presetIndex].name = targetVal
            setPresets(newPresets)
        }
    }

    // Add click event listener on events outside preset name textfields to exit edit mode
    window.addEventListener('click', e => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        if (editablePresetNameIdx > -1 && e.target?.id !== 'add-preset-button') {
            setEditablePresetNameIdx(-1)
        }
    })

    const onPresetNameClicked = (e: React.MouseEvent<HTMLParagraphElement>, i: number) => {
        e.stopPropagation()
        setEditablePresetNameIdx(i)
    }

    return <div className={'preset-list-container'}>
        <List id={'preset-list'}>
            {presets?.map((p, i) => <ListItem key={i}>
                 <Zoom appear={i == deletedIndex || p.name === props.currentPresetName}
                       in={i !== deletedIndex} onExited={() => removePreset(i)}>
                    <ListItemButton selected={p.name === props.currentPresetName} onClick={() => onPresetClick(i)}>
                        <ListItemText primary={<div className={'preset-item-text'}>
                            {editablePresetNameIdx == i
                                ? <TextField inputRef={(el: HTMLInputElement) => el?.select()}
                                             id={'standard-basic'} defaultValue={p.name} onClick={e => e.stopPropagation()}
                                             onKeyUp={(e) => onPresetTextFieldKeyUp(i, e)}/>
                                : <p onClick={e => onPresetNameClicked(e, i)
                                }>{p.name}</p>}
                        </div>} />
                        <IconButton onClick={e => onPresetDeleteClick(i, e)}>
                            <DeleteIcon />
                        </IconButton>
                    </ListItemButton>
                </Zoom>
            </ListItem>)}
        </List>
        <div id={'preset-button-panel'}>
            <input ref={loadButtonRef} type="file" className="file-input" onInput={uploadFile} accept={'application/json'}/>
            <Button className={'button'} id={'add-preset-button'} variant={'outlined'}
                    onClick={addPreset}>Create preset</Button>
            <Button className={'button'} id={'save-preset-button'} onClick={savePresets} disabled={!presets || presets.length === 0}>Save presets</Button>
            <Button className={'button'} id={'load-preset-button'} onClick={onLoadClick}>Load presets</Button>
        </div>
    </div>
}