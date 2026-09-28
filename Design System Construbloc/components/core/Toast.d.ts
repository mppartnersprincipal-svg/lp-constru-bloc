export interface ToastProps { tone?: 'info' | 'success' | 'warning' | 'danger'; title?: React.ReactNode; children?: React.ReactNode; onClose?: () => void; style?: React.CSSProperties; }
export function Toast(props: ToastProps): JSX.Element;
