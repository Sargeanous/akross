import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  type ViewStyle,
  type TextStyle,
} from 'react-native';

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
}: ButtonProps) {
  const buttonStyle: ViewStyle[] = [
    styles.base,
    styles[`variant_${variant}`],
    styles[`size_${size}`],
    (disabled || loading) && styles.disabled,
    style as ViewStyle,
  ].filter(Boolean) as ViewStyle[];

  const textStyle: TextStyle[] = [
    styles.text,
    styles[`text_${variant}`],
    styles[`text_${size}`],
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? '#FF6B6B' : '#fff'} />
      ) : (
        <Text style={textStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  variant_primary: { backgroundColor: '#FF6B6B' },
  variant_secondary: { backgroundColor: '#4A90D9' },
  variant_outline: { backgroundColor: 'transparent', borderWidth: 2, borderColor: '#FF6B6B' },
  variant_danger: { backgroundColor: '#E53E3E' },
  size_sm: { paddingHorizontal: 16, paddingVertical: 8 },
  size_md: { paddingHorizontal: 24, paddingVertical: 14 },
  size_lg: { paddingHorizontal: 32, paddingVertical: 18 },
  disabled: { opacity: 0.5 },
  text: { fontWeight: '600' },
  text_primary: { color: '#fff' },
  text_secondary: { color: '#fff' },
  text_outline: { color: '#FF6B6B' },
  text_danger: { color: '#fff' },
  text_sm: { fontSize: 14 },
  text_md: { fontSize: 16 },
  text_lg: { fontSize: 18 },
});
