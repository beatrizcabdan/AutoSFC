import './EncodingComponent.scss'

export function EncodingComponent() {
    return <div className={'control-container'} id={'encoding-container'}>
        <label className={'input-label'} id={'encoding-label'}>
            Bits per signal:
            <input type={'number'}/>
        </label>
    </div>;
}