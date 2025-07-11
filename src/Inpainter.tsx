import React, { useState, useRef, useEffect, useCallback } from "react";

interface Point {
  x: number;
  y: number;
}

interface InPaintingEditorProps {
  imageUrl: string;
  onSave: (editedImageData: string) => void;
  onCancel: () => void;
}

export function InPaintingEditor({ imageUrl, onSave, onCancel }: InPaintingEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(20);
  const [selectedTool, setSelectedTool] = useState<'paint' | 'erase' | 'heal' | 'clone'>('paint');
  const [originalImageData, setOriginalImageData] = useState<ImageData | null>(null);
  const [maskImageData, setMaskImageData] = useState<ImageData | null>(null);
  const [cloneSourcePoint, setCloneSourcePoint] = useState<Point | null>(null);
  const [isSelectingCloneSource, setIsSelectingCloneSource] = useState(false);
  const [brushOpacity, setBrushOpacity] = useState(1);
  
  // In-painting filters
  const [selectedFilter, setSelectedFilter] = useState<'blur' | 'sharpen' | 'brighten' | 'darken' | 'saturate' | 'desaturate' | 'noise' | 'smooth'>('blur');

  useEffect(() => {
    loadImageToCanvas();
  }, [imageUrl]);

  const loadImageToCanvas = () => {
    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!canvas || !maskCanvas) return;

    const ctx = canvas.getContext("2d");
    const maskCtx = maskCanvas.getContext("2d");
    if (!ctx || !maskCtx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // Set canvas size
      const maxWidth = 800;
      const maxHeight = 600;
      let { width, height } = img;

      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      maskCanvas.width = width;
      maskCanvas.height = height;

      ctx.drawImage(img, 0, 0, width, height);
      
      // Store original image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setOriginalImageData(imageData);

      // Initialize mask canvas with transparent background
      maskCtx.fillStyle = "rgba(0, 0, 0, 0)";
      maskCtx.fillRect(0, 0, width, height);
      const maskData = maskCtx.getImageData(0, 0, width, height);
      setMaskImageData(maskData);
    };
    img.src = imageUrl;
  };

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const drawBrush = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!canvas || !maskCanvas || !originalImageData) return;

    const ctx = canvas.getContext("2d");
    const maskCtx = maskCanvas.getContext("2d");
    if (!ctx || !maskCtx) return;

    if (selectedTool === 'paint') {
      // Update mask
      maskCtx.globalCompositeOperation = 'source-over';
      maskCtx.fillStyle = `rgba(255, 255, 255, ${brushOpacity})`;
      maskCtx.beginPath();
      maskCtx.arc(x, y, brushSize / 2, 0, 2 * Math.PI);
      maskCtx.fill();

      // Apply filter to the painted area
      applyInPaintingFilter(x, y);
    } else if (selectedTool === 'erase') {
      // Erase from mask
      maskCtx.globalCompositeOperation = 'destination-out';
      maskCtx.beginPath();
      maskCtx.arc(x, y, brushSize / 2, 0, 2 * Math.PI);
      maskCtx.fill();

      // Restore original image in erased area
      restoreOriginalArea(x, y);
    } else if (selectedTool === 'heal') {
      healArea(x, y);
    } else if (selectedTool === 'clone' && cloneSourcePoint) {
      cloneArea(x, y, cloneSourcePoint);
    }
  }, [selectedTool, brushSize, brushOpacity, cloneSourcePoint, originalImageData, selectedFilter]);

  const applyInPaintingFilter = (centerX: number, centerY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !originalImageData) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const originalData = originalImageData.data;

    const radius = Math.floor(brushSize / 2);
    const startX = Math.max(0, centerX - radius);
    const startY = Math.max(0, centerY - radius);
    const endX = Math.min(canvas.width, centerX + radius);
    const endY = Math.min(canvas.height, centerY + radius);

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        if (distance <= radius) {
          const index = (y * canvas.width + x) * 4;
          const intensity = 1 - (distance / radius); // Fade effect

          let r = originalData[index];
          let g = originalData[index + 1];
          let b = originalData[index + 2];

          let blurResult, sharpenResult, satGray, desatGray, noiseAmount, smoothResult;
          switch (selectedFilter) {
            case 'blur':
              blurResult = getBlurredPixel(x, y, originalData, canvas.width, canvas.height);
              r = blurResult.r;
              g = blurResult.g;
              b = blurResult.b;
              break;
            case 'sharpen':
              sharpenResult = getSharpenedPixel(x, y, originalData, canvas.width, canvas.height);
              r = sharpenResult.r;
              g = sharpenResult.g;
              b = sharpenResult.b;
              break;
            case 'brighten':
              r = Math.min(255, r + 30);
              g = Math.min(255, g + 30);
              b = Math.min(255, b + 30);
              break;
            case 'darken':
              r = Math.max(0, r - 30);
              g = Math.max(0, g - 30);
              b = Math.max(0, b - 30);
              break;
            case 'saturate':
              satGray = 0.299 * r + 0.587 * g + 0.114 * b;
              r = satGray + 1.5 * (r - satGray);
              g = satGray + 1.5 * (g - satGray);
              b = satGray + 1.5 * (b - satGray);
              break;
            case 'desaturate':
              desatGray = 0.299 * r + 0.587 * g + 0.114 * b;
              r = desatGray + 0.3 * (r - desatGray);
              g = desatGray + 0.3 * (g - desatGray);
              b = desatGray + 0.3 * (b - desatGray);
              break;
            case 'noise':
              noiseAmount = 20;
              r += (Math.random() - 0.5) * noiseAmount;
              g += (Math.random() - 0.5) * noiseAmount;
              b += (Math.random() - 0.5) * noiseAmount;
              break;
            case 'smooth':
              smoothResult = getSmoothPixel(x, y, originalData, canvas.width, canvas.height);
              r = smoothResult.r;
              g = smoothResult.g;
              b = smoothResult.b;
              break;
          }

          // Apply with intensity and opacity
          const alpha = intensity * brushOpacity;
          data[index] = Math.max(0, Math.min(255, data[index] * (1 - alpha) + r * alpha));
          data[index + 1] = Math.max(0, Math.min(255, data[index + 1] * (1 - alpha) + g * alpha));
          data[index + 2] = Math.max(0, Math.min(255, data[index + 2] * (1 - alpha) + b * alpha));
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
  };

  const getBlurredPixel = (x: number, y: number, data: Uint8ClampedArray, width: number, height: number) => {
    let r = 0, g = 0, b = 0, count = 0;
    const blurRadius = 3;

    for (let dy = -blurRadius; dy <= blurRadius; dy++) {
      for (let dx = -blurRadius; dx <= blurRadius; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const index = (ny * width + nx) * 4;
          r += data[index];
          g += data[index + 1];
          b += data[index + 2];
          count++;
        }
      }
    }

    return { r: r / count, g: g / count, b: b / count };
  };

  const getSharpenedPixel = (x: number, y: number, data: Uint8ClampedArray, width: number, height: number) => {
    const index = (y * width + x) * 4;
    const centerR = data[index];
    const centerG = data[index + 1];
    const centerB = data[index + 2];

    const blur = getBlurredPixel(x, y, data, width, height);
    const sharpAmount = 2;

    return {
      r: centerR + sharpAmount * (centerR - blur.r),
      g: centerG + sharpAmount * (centerG - blur.g),
      b: centerB + sharpAmount * (centerB - blur.b)
    };
  };

  const getSmoothPixel = (x: number, y: number, data: Uint8ClampedArray, width: number, height: number) => {
    return getBlurredPixel(x, y, data, width, height);
  };

  const restoreOriginalArea = (centerX: number, centerY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !originalImageData) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const originalData = originalImageData.data;

    const radius = Math.floor(brushSize / 2);
    const startX = Math.max(0, centerX - radius);
    const startY = Math.max(0, centerY - radius);
    const endX = Math.min(canvas.width, centerX + radius);
    const endY = Math.min(canvas.height, centerY + radius);

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        if (distance <= radius) {
          const index = (y * canvas.width + x) * 4;
          data[index] = originalData[index];
          data[index + 1] = originalData[index + 1];
          data[index + 2] = originalData[index + 2];
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
  };

  const healArea = (centerX: number, centerY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !originalImageData) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    const radius = Math.floor(brushSize / 2);
    const startX = Math.max(0, centerX - radius);
    const startY = Math.max(0, centerY - radius);
    const endX = Math.min(canvas.width, centerX + radius);
    const endY = Math.min(canvas.height, centerY + radius);

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        if (distance <= radius) {
          const healedPixel = getHealedPixel(x, y, data, canvas.width, canvas.height);
          const index = (y * canvas.width + x) * 4;
          const intensity = 1 - (distance / radius);
          
          data[index] = data[index] * (1 - intensity) + healedPixel.r * intensity;
          data[index + 1] = data[index + 1] * (1 - intensity) + healedPixel.g * intensity;
          data[index + 2] = data[index + 2] * (1 - intensity) + healedPixel.b * intensity;
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
  };

  const getHealedPixel = (x: number, y: number, data: Uint8ClampedArray, width: number, height: number) => {
    let r = 0, g = 0, b = 0, count = 0;
    const healRadius = 5;

    for (let dy = -healRadius; dy <= healRadius; dy++) {
      for (let dx = -healRadius; dx <= healRadius; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance <= healRadius && distance > 2) { // Exclude center area
            const index = (ny * width + nx) * 4;
            const weight = 1 / (distance * distance);
            r += data[index] * weight;
            g += data[index + 1] * weight;
            b += data[index + 2] * weight;
            count += weight;
          }
        }
      }
    }

    return count > 0 ? { r: r / count, g: g / count, b: b / count } : { r: 0, g: 0, b: 0 };
  };

  const cloneArea = (centerX: number, centerY: number, sourcePoint: Point) => {
    const canvas = canvasRef.current;
    if (!canvas || !originalImageData) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    const radius = Math.floor(brushSize / 2);
    const startX = Math.max(0, centerX - radius);
    const startY = Math.max(0, centerY - radius);
    const endX = Math.min(canvas.width, centerX + radius);
    const endY = Math.min(canvas.height, centerY + radius);

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        if (distance <= radius) {
          const sourceX = sourcePoint.x + (x - centerX);
          const sourceY = sourcePoint.y + (y - centerY);
          
          if (sourceX >= 0 && sourceX < canvas.width && sourceY >= 0 && sourceY < canvas.height) {
            const sourceIndex = (sourceY * canvas.width + sourceX) * 4;
            const destIndex = (y * canvas.width + x) * 4;
            const intensity = 1 - (distance / radius);
            
            data[destIndex] = data[destIndex] * (1 - intensity) + data[sourceIndex] * intensity;
            data[destIndex + 1] = data[destIndex + 1] * (1 - intensity) + data[sourceIndex + 1] * intensity;
            data[destIndex + 2] = data[destIndex + 2] * (1 - intensity) + data[sourceIndex + 2] * intensity;
          }
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    
    if (selectedTool === 'clone' && !cloneSourcePoint && !isSelectingCloneSource) {
      setIsSelectingCloneSource(true);
      return;
    }

    if (isSelectingCloneSource) {
      setCloneSourcePoint(pos);
      setIsSelectingCloneSource(false);
      return;
    }

    setIsDrawing(true);
    drawBrush(pos.x, pos.y);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const pos = getMousePos(e);
    drawBrush(pos.x, pos.y);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const resetCanvas = () => {
    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!canvas || !maskCanvas || !originalImageData) return;

    const ctx = canvas.getContext("2d");
    const maskCtx = maskCanvas.getContext("2d");
    if (!ctx || !maskCtx) return;

    ctx.putImageData(originalImageData, 0, 0);
    maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
    setCloneSourcePoint(null);
    setIsSelectingCloneSource(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataURL = canvas.toDataURL('image/png');
    onSave(dataURL);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-800">In-Painting Editor</h3>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Save
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Tools Panel */}
        <div className="w-64 bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold mb-3 text-gray-700">Tools</h4>
          <div className="space-y-2 mb-4">
            {[
              { id: 'paint', label: 'Paint', icon: '🖌️' },
              { id: 'erase', label: 'Erase', icon: '🧽' },
              { id: 'heal', label: 'Heal', icon: '🩹' },
              { id: 'clone', label: 'Clone', icon: '📋' }
            ].map(tool => (
              <button
                key={tool.id}
                onClick={() => setSelectedTool(tool.id as any)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  selectedTool === tool.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-white hover:bg-gray-100'
                }`}
              >
                {tool.icon} {tool.label}
              </button>
            ))}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Brush Size: {brushSize}px
            </label>
            <input
              type="range"
              min="5"
              max="50"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Opacity: {Math.round(brushOpacity * 100)}%
            </label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={brushOpacity}
              onChange={(e) => setBrushOpacity(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-600 mb-2">Filter</label>
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value as any)}
              className="w-full p-2 border rounded-lg"
            >
              <option value="blur">Blur</option>
              <option value="sharpen">Sharpen</option>
              <option value="brighten">Brighten</option>
              <option value="darken">Darken</option>
              <option value="saturate">Saturate</option>
              <option value="desaturate">Desaturate</option>
              <option value="noise">Add Noise</option>
              <option value="smooth">Smooth</option>
            </select>
          </div>

          <button
            onClick={resetCanvas}
            className="w-full px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            Reset All
          </button>

          {selectedTool === 'clone' && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                {!cloneSourcePoint 
                  ? isSelectingCloneSource 
                    ? "Click to set clone source" 
                    : "Click to select clone source"
                  : "Clone source set. Paint to clone."}
              </p>
              {cloneSourcePoint && (
                <button
                  onClick={() => setCloneSourcePoint(null)}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                >
                  Clear source
                </button>
              )}
            </div>
          )}
        </div>

        {/* Canvas Area */}
        <div className="flex-1">
          <div className="relative border-2 border-gray-300 rounded-lg overflow-hidden">
            <canvas
              ref={canvasRef}
              className="max-w-full h-auto cursor-crosshair"
              style={{ 
                cursor: isSelectingCloneSource ? 'crosshair' : 'none',
                maxHeight: '600px'
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
            <canvas
              ref={maskCanvasRef}
              className="absolute top-0 left-0 pointer-events-none opacity-30"
              style={{ mixBlendMode: 'multiply' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}