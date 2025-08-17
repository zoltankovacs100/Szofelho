import React, { useEffect, useRef, useState } from 'react';

const CanvasWordCloud = ({ words, style, containerRef, fontFamily }) => {
  const canvasRef = useRef(null);
  const [placed, setPlaced] = useState([]);
  const [rects, setRects] = useState([]);

  // Konfiguráció a "vadvirág" stílushoz igazítva
  const CONFIG = {
    background: style.background,
    fontFamily: fontFamily || style.font || 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    palette: style.wordColors,
    rotations: [0, 0, 0, 0, -10*Math.PI/180, 10*Math.PI/180, -20*Math.PI/180, 20*Math.PI/180],
    baseFontPx: style.baseFontPx || 18,
    maxFontPx: style.maxFontPx || 110,
    padding: style.padding || 3,
    spiralStep: style.spiralStep || 3,
    iterationsPerWord: style.iterationsPerWord || 3000,
    hoverHighlight: true,
    clickable: true,
    responsive: true
  };

  const pickColor = (word) => {
    if (word.color) return word.color;
    return CONFIG.palette[Math.floor(Math.random() * CONFIG.palette.length)];
  };

  const weightToFont = (weight, minW, maxW) => {
    const clamped = Math.max(minW, Math.min(maxW, weight));
    const t = (clamped - minW) / (maxWeight - minWeight || 1);
    return Math.round(CONFIG.baseFontPx + t * (CONFIG.maxFontPx - CONFIG.baseFontPx));
  };

  const setCanvasSize = (canvas, ctx) => {
    if (!containerRef.current) return;
    
    const cssW = containerRef.current.offsetWidth;
    const cssH = Math.max(520, Math.floor(cssW * 0.55));
    
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';
    
    const deviceRatio = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    canvas.width = Math.floor(cssW * deviceRatio);
    canvas.height = Math.floor(cssH * deviceRatio);
    
    ctx.setTransform(deviceRatio, 0, 0, deviceRatio, 0, 0);
    ctx.fillStyle = CONFIG.background;
    ctx.fillRect(0, 0, cssW, cssH);
    
    return { cssW, cssH };
  };

  const measureWord = (ctx, text, fontPx, angle) => {
    ctx.save();
    ctx.font = `${fontPx}px ${CONFIG.fontFamily}`;
    const metrics = ctx.measureText(text);
    const w = Math.ceil(metrics.width);
    const h = Math.ceil(fontPx * 1.05);
    ctx.restore();
    
    const cos = Math.abs(Math.cos(angle));
    const sin = Math.abs(Math.sin(angle));
    const bw = Math.ceil(w * cos + h * sin) + 2 * CONFIG.padding;
    const bh = Math.ceil(w * sin + h * cos) + 2 * CONFIG.padding;
    
    return { w, h, bw, bh };
  };

  const collide = (r, rects) => {
    for (let i = 0; i < rects.length; i++) {
      const q = rects[i];
      if (r.x < q.x + q.w && r.x + r.w > q.x && r.y < q.y + q.h && r.y + r.h > q.y) {
        return true;
      }
    }
    return false;
  };

  const placeWord = (canvas, ctx, word, minWeight, maxWeight, rects, placed) => {
    const angle = CONFIG.rotations[Math.floor(Math.random() * CONFIG.rotations.length)];
    const fontPx = weightToFont(word.value, minWeight, maxWeight);
    const m = measureWord(ctx, word.text, fontPx, angle);

    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    const cx = W / 2, cy = H / 2;

    let a = 0;
    let r = 0;
    for (let i = 0; i < CONFIG.iterationsPerWord; i++) {
      a += 0.35;
      r += CONFIG.spiralStep / (1 + 0.003 * i);
      const x = Math.round(cx + Math.cos(a) * r - m.bw / 2);
      const y = Math.round(cy + Math.sin(a) * r - m.bh / 2);

      const rect = { x, y, w: m.bw, h: m.bh };
      if (x < 0 || y < 0 || x + m.bw > W || y + m.bh > H) continue;
      if (!collide(rect, rects)) {
        // Rajz
        ctx.save();
        ctx.translate(x + m.bw / 2, y + m.bh / 2);
        ctx.rotate(angle);
        ctx.font = `${fontPx}px ${CONFIG.fontFamily}`;
        ctx.fillStyle = pickColor(word);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(word.text, 0, 0);
        ctx.restore();

        const box = {
          text: word.text,
          x, y, w: m.bw, h: m.bh,
          angle, fontPx,
          color: ctx.fillStyle
        };
        
        return { box, rect };
      }
    }
    return null;
  };

  const drawAll = () => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current) return;

    const ctx = canvas.getContext('2d');
    const { cssW, cssH } = setCanvasSize(canvas, ctx);
    
    if (!cssW || !cssH) return;

    ctx.fillStyle = CONFIG.background;
    ctx.fillRect(0, 0, cssW, cssH);

    const newPlaced = [];
    const newRects = [];

    if (words.length === 0) return;

    const weights = words.map(w => w.value);
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);

    // Súly szerint nagytól a kicsi felé
    const sortedWords = [...words].sort((a, b) => b.value - a.value);
    
    sortedWords.forEach(word => {
      const result = placeWord(canvas, ctx, word, minWeight, maxWeight, newRects, newPlaced);
      if (result) {
        newPlaced.push(result.box);
        newRects.push(result.rect);
      }
    });

    setPlaced(newPlaced);
    setRects(newRects);
  };

  // Interakciók
  const pointInBox = (px, py, box) => {
    return px >= box.x && px <= box.x + box.w && py >= box.y && py <= box.y + box.h;
  };

  const addInteractions = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      let over = null;
      for (let i = placed.length - 1; i >= 0; i--) {
        if (pointInBox(x, y, placed[i])) {
          over = placed[i];
          break;
        }
      }

      if (over) {
        canvas.style.cursor = 'pointer';
        // Itt tooltip-et is hozzáadhatnánk
      } else {
        canvas.style.cursor = 'default';
      }
    };

    const handleMouseLeave = () => {
      canvas.style.cursor = 'default';
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  };

  // DPI és méretezés / interakciók változatlanok
  useEffect(() => {
    drawAll();
  }, [words, style, fontFamily]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '650px',
        display: 'block',
        borderRadius: '8px'
      }}
    />
  );
};

export default CanvasWordCloud;
