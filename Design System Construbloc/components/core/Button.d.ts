/** @startingPoint section="Core" subtitle="Brand buttons — primary blue, gold accent, WhatsApp" viewport="700x260" */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** primary (blue) | accent (gold CTA) | outline | ghost | inverse (on dark) | whatsapp */
  variant?: 'primary' | 'accent' | 'outline' | 'ghost' | 'inverse' | 'whatsapp';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
}
export function Button(props: ButtonProps): JSX.Element;
