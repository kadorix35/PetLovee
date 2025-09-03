import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Heart, MessageCircle, Share2, Eye } from 'lucide-react-native';

interface SocialStatsProps {
  likes: number;
  comments: number;
  shares?: number;
  views?: number;
  onLikePress?: () => void;
  onCommentPress?: () => void;
  onSharePress?: () => void;
  isLiked?: boolean;
  showLabels?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export default function SocialStats({
  likes,
  comments,
  shares = 0,
  views = 0,
  onLikePress,
  onCommentPress,
  onSharePress,
  isLiked = false,
  showLabels = true,
  size = 'medium'
}: SocialStatsProps) {
  const getIconSize = () => {
    switch (size) {
      case 'small': return 16;
      case 'large': return 24;
      default: return 20;
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'small': return 12;
      case 'large': return 16;
      default: return 14;
    }
  };

  const getSpacing = () => {
    switch (size) {
      case 'small': return 12;
      case 'large': return 20;
      default: return 16;
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const StatItem = ({ 
    icon: Icon, 
    count, 
    onPress, 
    color, 
    activeColor 
  }: {
    icon: any;
    count: number;
    onPress?: () => void;
    color: string;
    activeColor?: string;
  }) => (
    <TouchableOpacity 
      style={[styles.statItem, { marginRight: getSpacing() }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <Icon 
        color={isLiked && Icon === Heart ? activeColor : color} 
        size={getIconSize()} 
        strokeWidth={2}
        fill={isLiked && Icon === Heart ? activeColor : 'none'}
      />
      {showLabels && (
        <Text style={[
          styles.statText, 
          { 
            fontSize: getTextSize(),
            color: isLiked && Icon === Heart ? activeColor : '#374151'
          }
        ]}>
          {formatNumber(count)}
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatItem
        icon={Heart}
        count={likes}
        onPress={onLikePress}
        color="#374151"
        activeColor="#FF6B6B"
      />
      
      <StatItem
        icon={MessageCircle}
        count={comments}
        onPress={onCommentPress}
        color="#667eea"
      />
      
      {shares > 0 && (
        <StatItem
          icon={Share2}
          count={shares}
          onPress={onSharePress}
          color="#764ba2"
        />
      )}
      
      {views > 0 && (
        <StatItem
          icon={Eye}
          count={views}
          color="#6B7280"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
  },
});
