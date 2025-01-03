export function UploadButton(props: { onClick: () => void, label: string }) {
    return <>
        <input className={'button'} type={'button'} value={props.label}/>
    </>
}