import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ComponentProps } from 'react';
import { OpaqueColorValue, StyleProp, TextStyle } from 'react-native';

type IconMapping = Record<string, ComponentProps<typeof MaterialIcons>['name']>;
export type IconSymbolName = keyof typeof MAPPING;

const MAPPING = {
  'house.fill': 'home', 'list.bullet': 'list', calendar: 'calendar-today', 'chart.bar.fill': 'bar-chart', 'person.crop.circle': 'account-circle',
  'paperplane.fill': 'send', 'chevron.left.forwardslash.chevron.right': 'code', 'chevron.right': 'chevron-right', 'menu': 'menu', 'close': 'close',
} as IconMapping;

export function IconSymbol({ name, size = 24, color, style }: { name: IconSymbolName | string; size?: number; color: string | OpaqueColorValue; style?: StyleProp<TextStyle>; weight?: string }) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name] ?? 'help-outline'} style={style} />;
}
