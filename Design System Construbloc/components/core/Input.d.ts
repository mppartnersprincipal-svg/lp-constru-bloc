export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string; hint?: string; error?: string; icon?: React.ReactNode;
}
export function Input(props: InputProps): JSX.Element;
