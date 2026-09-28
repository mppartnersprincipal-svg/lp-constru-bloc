export interface DialogProps { open: boolean; onClose: () => void; title: React.ReactNode; children?: React.ReactNode; footer?: React.ReactNode; width?: number; }
export function Dialog(props: DialogProps): JSX.Element | null;
