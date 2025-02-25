import {List, ListItem, ListItemButton, ListItemText} from "@mui/material";
import {useEffect, useState} from "react";
import './PresetList.scss'

interface Preset {
    startRow: number,
    endRow: number
}

export function PresetList(props: { onPresetSelect: (startRow: number, endRow: number) => void,
    initialDataPath: string
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

    function onPresetClick(index: number) {
        setSelectedIndex(index)
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
    </div>
}