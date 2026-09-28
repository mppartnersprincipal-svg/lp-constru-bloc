export interface BadgeProps { tone?: 'blue' | 'gold' | 'solid' | 'accent' | 'gray' | 'success' | 'danger'; children: React.ReactNode; style?: React.CSSProperties; }
export function Badge(props: BadgeProps): JSX.Element;
