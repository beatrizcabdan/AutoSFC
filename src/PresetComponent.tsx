import {Button, List, ListItem, ListItemButton, ListItemText} from "@mui/material";
import {useEffect, useState} from "react";
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

    useEffect(() => {
        const presetPath = `${props.initialDataPath.replace('.csv', '')}${PRESET_FILE_SUFFIX}`
        fetch(presetPath).then(r => {
            r.text().then(t => {
                // console.log(t)
                const lines = t.split('\n')
                const presArray: Preset[] = []
                lines.forEach(line => {
                    const [startRow, endRow] = line.split(/[;,]/)
                    presArray.push({startRow: Number(startRow), endRow: Number(endRow)})
                })
                setPresets(presArray)
            })
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
    }, [props.displayedStartRow, props.displayedEndRow]);

    function onPresetClick(index: number) {
        setSelectedIndex(index)
        const preset = presets![index]
        props.onPresetSelect(preset.startRow, preset.endRow)
    }

    function addPreset() {
        setPresets(presets => [...presets!, {startRow: props.displayedStartRow,
            endRow: props.displayedEndRow}])
        setSelectedIndex(presets!.length)
    }

    return <div className={'preset-list-container'}>
        <h3>Presets</h3>
        <List id={'preset-list'}>
            {presets?.map((p, i) => <ListItem key={i}>
                <ListItemButton selected={i === selectedIndex} onClick={() => onPresetClick(i)}>
                    <ListItemText primary={<div className={'preset-item-text'}>
                        <p>{p.startRow}<span>Start</span></p>
                        <p>{p.endRow}<span>End</span></p>
                    </div>} />
                </ListItemButton>
            </ListItem>)}
        </List>
        <div className={'preset-button-panel'}>
            <Button className={'button'} id={'add-preset-button'} variant={'outlined'} onClick={addPreset}>Create preset</Button>
        </div>
    </div>
}