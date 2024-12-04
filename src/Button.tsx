export function Button(props: { onClick: () => void, label: string }) {
    return <>
        <input className={'button'} type={'button'} value={props.label}/>
    </>
}