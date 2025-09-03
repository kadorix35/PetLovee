import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { Heart } from 'lucide-react-native';

interface LikeButtonProps {
  isLiked: boolean;
  likes: number;
  onToggle: () => void;
  size?: 'small' | 'medium' | 'large';
  showCount?: boolean;
  disabled?: boolean;
  animated?: boolean;
}

export default function LikeButton({
  isLiked,
  likes,
  onToggle,
  size = 'medium',
  showCount = true,
  disabled = false,
  animated = true
}: LikeButtonProps) {
  const [scaleAnim] = useState(new Animated.Value(1));
  const [heartAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (animated) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isLiked, animated]);

  const handlePress = () => {
    if (animated) {
      Animated.sequence([
        Animated.timing(heartAnim, {
          toValue: 1.3,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(heartAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
    onToggle();
  };

  const getSize = () => {
    switch (size) {
      case 'small':
        return {
          iconSize: 16,
          fontSize: 12,
          padding: 4,
        };
      case 'large':
        return {
          iconSize: 28,
          fontSize: 16,
          padding: 8,
        };
      default:
        return {
          iconSize: 22,
          fontSize: 14,
          padding: 6,
        };
    }
  };

  const formatLikes = (count: number): string => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  };

  const sizeConfig = getSize();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { padding: sizeConfig.padding },
        disabled && styles.disabled
      ]}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Animated.View
        style={[
          styles.iconContainer,
          {
            transform: [
              { scale: scaleAnim },
              { scale: heartAnim }
            ]
          }
        ]}
      >
        <Heart
          color={isLiked ? "#FF6B6B" : "#374151"}
          size={sizeConfig.iconSize}
          strokeWidth={2}
          fill={isLiked ? "#FF6B6B" : "none"}
        />
      </Animated.View>
      
      {showCount && (
        <Text style={[
          styles.likeCount,
          { 
            fontSize: sizeConfig.fontSize,
            color: isLiked ? "#FF6B6B" : "#374151"
          }
        ]}>
          {formatLikes(likes)}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  likeCount: {
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
  },
  disabled: {
    opacity: 0.5,
  },
});
