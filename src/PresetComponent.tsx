import {Button, IconButton, List, ListItem, ListItemButton, ListItemText, Zoom} from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import React, {FormEvent, useEffect, useRef, useState} from "react";
import './PresetComponent.scss'
import './App.scss'

interface Preset {
    startRow: number,
    endRow: number
}
export function PresetComponent(props: {
    onPresetSelect: (startRow: number, endRow: number) => void, initialDataPath: string,
    displayedStartRow: number, displayedEndRow: number, currentDataFile: string
}) {
    const PRESET_FILE_SUFFIX = '_presets.csv'

    const [presets, setPresets] = useState<Preset[] | null>()
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [deletedIndex, setDeletedIndex] = useState(-1)
    const inputRef = useRef<HTMLInputElement | null>(null)

    function setPresetsFromFileString(content: string) {
        const lines = content.split('\n')
        const presArray: Preset[] = []
        lines.forEach(line => {
            const [startRow, endRow] = line.split(/[;,]/)
            presArray.push({startRow: Number(startRow), endRow: Number(endRow)})
        })
        presArray.sort((p1, p2) =>
            // Sort first by startRow, then by endRow
            p1.startRow !== p2.startRow ? p1.startRow - p2.startRow : p1.endRow - p2.endRow)
        setPresets(presArray)
        setSelectedIndex(-1)
    }

    useEffect(() => {
        const presetPath = `${props.initialDataPath.replace('.csv', '')}${PRESET_FILE_SUFFIX}`
        fetch(presetPath).then(r => {
            r.text().then(t => setPresetsFromFileString(t))
        })
    }, [])

    useEffect(() => {
        if (!presets) {
            return
        }

        for (const p of presets) {
            const i = presets.indexOf(p);
            if (props.displayedStartRow === p.startRow && props.displayedEndRow === p.endRow) {
                setSelectedIndex(i)
                return;
            }
        }
        setSelectedIndex(-1)
    }, [presets, props.displayedStartRow, props.displayedEndRow]);

    function onPresetClick(index: number) {
        setSelectedIndex(index)
        const preset = presets![index]
        props.onPresetSelect(preset.startRow, preset.endRow)
    }

    function addPreset() {
        if (selectedIndex > -1) {
            return
        }
        const newPreset = {startRow: props.displayedStartRow,
            endRow: props.displayedEndRow}
        const newPresets = [...presets!, newPreset]
            .sort((p1, p2) =>
                p1.startRow !== p2.startRow ? p1.startRow - p2.startRow : p1.endRow - p2.endRow)
        setPresets(newPresets)
        setSelectedIndex(newPresets.findIndex(p => p === newPreset))
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
        const textContent = presets?.map(p => `${p.startRow};${p.endRow}`).join('\n') ?? ''
        const hiddenElement = document.createElement('a');
        hiddenElement.href = 'data:attachment/text,' + encodeURI(textContent);
        hiddenElement.target = '_blank';
        hiddenElement.download = props.currentDataFile.replace('.csv', '') + '_presets.csv'
        hiddenElement.click();
    }

    function removePreset(index: number) {
        setPresets(presets => [...presets!.slice(0, index), ...presets!.slice(index + 1)])
        setDeletedIndex(-1)
    }

    return <div className={'preset-list-container'}>
        <List id={'preset-list'}>
            <ListItem id={'preset-labels'}>
                <ListItemText primary={<span id={'start-label'}>Start</span>}/>
                <ListItemText primary={<span id={'end-label'}>End</span>}/>
            </ListItem>
            {presets?.map((p, i) => <ListItem key={i}>
                 <Zoom appear={i == deletedIndex || p.startRow === props.displayedStartRow && p.endRow === props.displayedEndRow}
                       in={i !== deletedIndex} onExited={() => removePreset(i)}>
                    <ListItemButton selected={i === selectedIndex} onClick={() => onPresetClick(i)}>
                        <ListItemText primary={<div className={'preset-item-text'}>
                            <p>{p.startRow}</p>
                            <p>{p.endRow}</p>
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
            <Button className={'button'} id={'add-preset-button'} variant={'outlined'} disabled={selectedIndex > -1}
                    onClick={addPreset}>Create preset</Button>
            <Button className={'button'} id={'save-preset-button'} onClick={savePresets} disabled={!presets || presets.length === 0}>Save presets</Button>
            <Button className={'button'} id={'load-preset-button'} onClick={onLoadClick}>Load presets</Button>
        </div>
    </div>
}