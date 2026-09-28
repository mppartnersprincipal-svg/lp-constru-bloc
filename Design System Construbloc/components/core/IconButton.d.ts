export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'ghost' | 'solid' | 'accent' | 'inverse';
  /** square size in px, default 40 */
  size?: number;
  /** accessible label (required) */
  label: string;
  children?: React.ReactNode;
}
export function IconButton(props: IconButtonProps): JSX.Element;
