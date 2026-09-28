export interface TagProps { selected?: boolean; onClick?: () => void; onRemove?: () => void; children: React.ReactNode; style?: React.CSSProperties; }
export function Tag(props: TagProps): JSX.Element;
