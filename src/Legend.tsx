import './Legend.scss'

export function Legend(props: { labels: string[] }) {
    return <div className={'legend'}>
        {props.labels.map((label, i) => <p key={i}>{label}</p>)}
    </div>;
}