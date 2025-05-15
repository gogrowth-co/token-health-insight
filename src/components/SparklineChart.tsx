
import { useEffect, useRef } from "react";

interface SparklineChartProps {
  data: number[];
  color: string;
  height?: number;
  width?: number;
  strokeWidth?: number;
}

export const SparklineChart = ({
  data,
  color,
  height = 24,
  width = 80,
  strokeWidth = 1.5
}: SparklineChartProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!canvasRef.current || data.length < 2) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Find min and max for scaling
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1; // Avoid division by zero
    
    // Plot the sparkline
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = strokeWidth;
    ctx.lineJoin = 'round';
    
    // Calculate points
    const step = width / (data.length - 1);
    
    data.forEach((value, index) => {
      const x = index * step;
      // Normalize the y value (inverting because canvas y increases downwards)
      const normalizedY = height - ((value - min) / range) * height;
      
      if (index === 0) {
        ctx.moveTo(x, normalizedY);
      } else {
        ctx.lineTo(x, normalizedY);
      }
    });
    
    ctx.stroke();
    
  }, [data, color, height, width, strokeWidth]);
  
  if (data.length < 2) {
    return null;
  }
  
  return (
    <canvas 
      ref={canvasRef} 
      width={width} 
      height={height} 
      className="inline-block"
    />
  );
};
