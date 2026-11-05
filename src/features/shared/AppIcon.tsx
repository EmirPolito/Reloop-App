import { SymbolView } from 'expo-symbols';
import { ICONS, type IconName } from './constants';

export function AppIcon({
  name,
  size = 22,
  color = '#0785FF',
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  return <SymbolView name={ICONS[name]} size={size} tintColor={color} />;
}
