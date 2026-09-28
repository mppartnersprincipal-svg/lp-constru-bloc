export interface CardProps extends React.HTMLAttributes<HTMLDivElement> { variant?: 'default' | 'elevated' | 'dark' | 'brand' | 'accent'; padding?: number | string; hoverable?: boolean; children?: React.ReactNode; }
export function Card(props: CardProps): JSX.Element;
