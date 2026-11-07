import styles from './StatusBadge.module.css';

interface StatusBadgeProps {
  label: string;
  tone: 'good' | 'bad' | 'neutral';
}

// Molecule: props in, markup out. State-driven styling through data-*, not style={}.
export function StatusBadge({ label, tone }: StatusBadgeProps) {
  return (
    <span className={styles.statusBadge} data-tone={tone} role="status">
      {label}
    </span>
  );
}
