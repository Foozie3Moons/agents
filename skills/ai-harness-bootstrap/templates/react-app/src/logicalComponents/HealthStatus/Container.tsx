import { useHealth } from '../../api/useHealth.js';
import { StatusBadge } from '../../molecules/StatusBadge/StatusBadge.js';

// Container: owns data and state, renders a molecule. Handles all three states.
export function HealthStatusContainer() {
  const { data, isPending, isError } = useHealth();
  if (isPending) return <StatusBadge label="Checking" tone="neutral" />;
  if (isError) return <StatusBadge label="Unreachable" tone="bad" />;
  return <StatusBadge label={data.status} tone={data.status === 'ok' ? 'good' : 'bad'} />;
}
