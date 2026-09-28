export interface AccordionProps { items: Array<{ title: React.ReactNode; content: React.ReactNode }>; /** index open initially, -1 for none */ defaultOpen?: number; style?: React.CSSProperties; }
export function Accordion(props: AccordionProps): JSX.Element;
