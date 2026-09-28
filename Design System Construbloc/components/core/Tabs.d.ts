export interface TabsProps { items: Array<{ value: string; label: React.ReactNode }>; value?: string; defaultValue?: string; onChange?: (value: string) => void; style?: React.CSSProperties; }
export function Tabs(props: TabsProps): JSX.Element;
