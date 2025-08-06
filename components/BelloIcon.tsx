import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

interface BelloIconProps {
  size?: number;
  color?: string;
}

export const BelloIcon: React.FC<BelloIconProps> = ({ size = 24, color = '#2563EB' }) => {
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* Open sack body */}
        <Path
          d="M5 9C5 8.5 5.5 8 6 8H18C18.5 8 19 8.5 19 9V19C19 20.1 18.1 21 17 21H7C5.9 21 5 20.1 5 19V9Z"
          fill={color}
          opacity={0.2}
        />
        
        {/* Sack opening/rim */}
        <Path
          d="M4 8C4 7.5 4.5 7 5 7H19C19.5 7 20 7.5 20 8V9C20 9.5 19.5 10 19 10H5C4.5 10 4 9.5 4 9V8Z"
          fill={color}
        />
        
        {/* Sack outline */}
        <Path
          d="M5 9V19C5 20.1 5.9 21 7 21H17C18.1 21 19 20.1 19 19V9M4 8C4 7.5 4.5 7 5 7H19C19.5 7 20 7.5 20 8V9C20 9.5 19.5 10 19 10H5C4.5 10 4 9.5 4 9V8Z"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        
        {/* Coins/items spilling out */}
        <Circle cx="15" cy="5" r="1.5" fill={color} opacity={0.6} />
        <Circle cx="18" cy="6" r="1" fill={color} opacity={0.4} />
        <Circle cx="12" cy="4" r="1" fill={color} opacity={0.5} />
        
        {/* Sack tie/closure */}
        <Path
          d="M10 7V5C10 4.5 10.5 4 11 4H13C13.5 4 14 4.5 14 5V7"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
    </View>
  );
};
