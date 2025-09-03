import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { UserPlus, UserMinus, Check } from 'lucide-react-native';

interface FollowButtonProps {
  isFollowing: boolean;
  onToggle: () => void;
  loading?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
}

export default function FollowButton({
  isFollowing,
  onToggle,
  loading = false,
  size = 'medium',
  variant = 'primary',
  disabled = false
}: FollowButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  const getButtonSize = () => {
    switch (size) {
      case 'small':
        return {
          paddingHorizontal: 12,
          paddingVertical: 6,
          fontSize: 12,
          iconSize: 14,
          borderRadius: 16,
        };
      case 'large':
        return {
          paddingHorizontal: 20,
          paddingVertical: 12,
          fontSize: 16,
          iconSize: 18,
          borderRadius: 24,
        };
      default:
        return {
          paddingHorizontal: 16,
          paddingVertical: 8,
          fontSize: 14,
          iconSize: 16,
          borderRadius: 20,
        };
    }
  };

  const getButtonStyle = () => {
    const buttonSize = getButtonSize();
    const baseStyle = {
      ...buttonSize,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: 6,
      opacity: disabled ? 0.6 : 1,
    };

    if (isFollowing) {
      switch (variant) {
        case 'secondary':
          return {
            ...baseStyle,
            backgroundColor: '#F3F4F6',
            borderWidth: 1,
            borderColor: '#D1D5DB',
          };
        case 'outline':
          return {
            ...baseStyle,
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: '#10B981',
          };
        default:
          return {
            ...baseStyle,
            backgroundColor: '#10B981',
          };
      }
    } else {
      switch (variant) {
        case 'secondary':
          return {
            ...baseStyle,
            backgroundColor: '#F3F4F6',
            borderWidth: 1,
            borderColor: '#D1D5DB',
          };
        case 'outline':
          return {
            ...baseStyle,
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: '#667eea',
          };
        default:
          return {
            ...baseStyle,
            backgroundColor: '#667eea',
          };
      }
    }
  };

  const getTextStyle = () => {
    const buttonSize = getButtonSize();
    const baseStyle = {
      fontSize: buttonSize.fontSize,
      fontFamily: 'Inter-SemiBold',
    };

    if (isFollowing) {
      switch (variant) {
        case 'outline':
          return {
            ...baseStyle,
            color: '#10B981',
          };
        default:
          return {
            ...baseStyle,
            color: '#FFFFFF',
          };
      }
    } else {
      switch (variant) {
        case 'outline':
          return {
            ...baseStyle,
            color: '#667eea',
          };
        default:
          return {
            ...baseStyle,
            color: '#FFFFFF',
          };
      }
    }
  };

  const getIconColor = () => {
    if (isFollowing) {
      switch (variant) {
        case 'outline':
          return '#10B981';
        default:
          return '#FFFFFF';
      }
    } else {
      switch (variant) {
        case 'outline':
          return '#667eea';
        default:
          return '#FFFFFF';
      }
    }
  };

  const buttonSize = getButtonSize();

  return (
    <TouchableOpacity
      style={[
        getButtonStyle(),
        isPressed && styles.pressed,
      ]}
      onPress={onToggle}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      disabled={loading || disabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={getIconColor()} 
        />
      ) : (
        <>
          {isFollowing ? (
            <Check color={getIconColor()} size={buttonSize.iconSize} strokeWidth={2} />
          ) : (
            <UserPlus color={getIconColor()} size={buttonSize.iconSize} strokeWidth={2} />
          )}
          <Text style={getTextStyle()}>
            {isFollowing ? 'Takip Ediliyor' : 'Takip Et'}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pressed: {
    transform: [{ scale: 0.95 }],
  },
});
