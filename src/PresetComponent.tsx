import {Button, IconButton, List, ListItem, ListItemButton, ListItemText, Zoom} from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import React, {ChangeEvent, FormEvent, useEffect, useRef, useState} from "react";
import './PresetComponent.scss'
import './App.scss'

interface Preset {
    startRow: number,
    endRow: number
}
export function PresetComponent(props: {
    onPresetSelect: (startRow: number, endRow: number) => void, initialDataPath: string,
    displayedStartRow: number, displayedEndRow: number
}) {
    const PRESET_FILE_SUFFIX = '_presets.csv'

    const [presets, setPresets] = useState<Preset[] | null>()
    const [selectedIndex, setSelectedIndex] = useState(0)
    const inputRef = useRef<HTMLInputElement | null>(null)

    function setPresetsFromFileString(content: string) {
        const lines = content.split('\n')
        const presArray: Preset[] = []
        lines.forEach(line => {
            const [startRow, endRow] = line.split(/[;,]/)
            presArray.push({startRow: Number(startRow), endRow: Number(endRow)})
        })
        setPresets(presArray)
        setSelectedIndex(0)
    }

    useEffect(() => {
        const presetPath = `${props.initialDataPath.replace('.csv', '')}${PRESET_FILE_SUFFIX}`
        fetch(presetPath).then(r => {
            r.text().then(t => setPresetsFromFileString(t))
        })
        setPresetsFromFileString(presetPath);
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
    }, [props.displayedStartRow, props.displayedEndRow]);

    function onPresetClick(index: number) {
        setSelectedIndex(index)
        const preset = presets![index]
        props.onPresetSelect(preset.startRow, preset.endRow)
    }

    function addPreset() {
        if (selectedIndex > -1) {
            return
        }
        setPresets(presets => [...presets!, {startRow: props.displayedStartRow,
            endRow: props.displayedEndRow}])
        setSelectedIndex(presets!.length)
    }

    function onPresetDeleteClick(i: number, e: React.MouseEvent<HTMLButtonElement>) {
        e.stopPropagation()
        setPresets(presets => [...presets!.slice(0, i), ...presets!.slice(i + 1)])
        if (selectedIndex === i) {
            setSelectedIndex(-1)
        } else if (i < selectedIndex) {
            setSelectedIndex(selectedIndex - 1)
        }
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

    return <div className={'preset-list-container'}>
        <h3>Presets</h3>
        <List id={'preset-list'}>
            {presets?.map((p, i) => <ListItem key={i}>
                <Zoom in={true}>
                    <ListItemButton selected={i === selectedIndex} onClick={() => onPresetClick(i)}>
                        <ListItemText primary={<div className={'preset-item-text'}>
                            <p>{p.startRow}<span>Start</span></p>
                            <p>{p.endRow}<span>End</span></p>
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
            <Button className={'button'} id={'save-preset-button'}>Save presets</Button>
            <Button className={'button'} id={'load-preset-button'} onClick={onLoadClick}>Load presets</Button>
        </div>
    </div>
}