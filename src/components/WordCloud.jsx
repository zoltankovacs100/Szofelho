import React, { useEffect, useMemo, useRef, useState } from "react";
import "./WordCloud.css";

/**
 * Vásznon rajzolt, ütközés-kerülő szófelhő.
 * Props:
 *  - words: [{text, weight, color?}]
 *  - background: string
 *  - palette: string[]
 *  - rotations: number[]  (radian)
 *  - baseFontPx: number
 *  - maxFontPx: number
 *  - padding: number
 *  - spiralStep: number
 *  - iterationsPerWord: number
 *  - hoverTooltip: boolean
 */
export default function WordCloud({
  words,
  background = "#ffffff",
  palette = ["#ff8a3a", "#f6ad55", "#2ec4b6", "#2bb68a", "#c56cf0", "#475569", "#fbd38d", "#94a3b8"],
  rotations = [0, 0, 0, 0, -10 * Math.PI / 180, 10 * Math.PI / 180, -20 * Math.PI / 180, 20 * Math.PI / 180],
  baseFontPx = 18,
  maxFontPx = 110,
  padding = 3,
  spiralStep = 3,
  iterationsPerWord = 3000,
  hoverTooltip = true,
}) {
  const wrapperRef = useRef(null);
  const canvasRef = useRef(null);
  const tipRef = useRef(null);
  const [deviceRatio, setDeviceRatio] = useState(1);
  const placedRef = useRef([]); // interakcióhoz

  // Súlyok minimum/maximum
  const [minWeight, maxWeight] = useMemo(() => {
    const ws = words.map(w => w.weight);
    return [Math.min(...ws), Math.max(...ws)];
  }, [words]);

  const pickColor = (w) => (w.color ? w.color : palette[Math.floor(Math.random() * palette.length)]);

  const weightToFont = (weight) => {
    const clamped = Math.max(minWeight, Math.min(maxWeight, weight));
    const t = (clamped - minWeight) / (maxWeight - minWeight || 1);
    return Math.round(baseFontPx + t * (maxFontPx - baseFontPx));
  };

  const setCanvasSize = () => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;

    const cssW = wrapper.clientWidth;
    const cssH = Math.max(520, Math.floor(wrapper.clientWidth * 0.55)); // arány a mintához
    canvas.style.width = cssW + "px";
    canvas.style.height = cssH + "px";
    canvas.width = Math.floor(cssW * deviceRatio);
    canvas.height = Math.floor(cssH * deviceRatio);

    const ctx = canvas.getContext("2d");
    ctx.setTransform(deviceRatio, 0, 0, deviceRatio, 0, 0);
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, cssW, cssH);
  };

  const measureWord = (ctx, text, fontPx, angle) => {
    ctx.save();
    ctx.font = `${fontPx}px Montserrat,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif`;
    const metrics = ctx.measureText(text);
    const w = Math.ceil(metrics.width);
    const h = Math.ceil(fontPx * 1.05);
    ctx.restore();
    const cos = Math.abs(Math.cos(angle));
    const sin = Math.abs(Math.sin(angle));
    const bw = Math.ceil(w * cos + h * sin) + 2 * padding;
    const bh = Math.ceil(w * sin + h * cos) + 2 * padding;
    return { w, h, bw, bh };
  };

  const collide = (rect, rects) => {
    for (let i = 0; i < rects.length; i++) {
      const q = rects[i];
      if (rect.x < q.x + q.w && rect.x + rect.w > q.x && rect.y < q.y + q.h && rect.y + rect.h > q.y) {
        return true;
      }
    }
    return false;
  };

  const placeWord = (ctx, word, rects) => {
    const angle = rotations[Math.floor(Math.random() * rotations.length)];
    const fontPx = weightToFont(word.weight);
    const m = measureWord(ctx, word.text, fontPx, angle);

    const canvas = canvasRef.current;
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    const cx = W / 2;
    const cy = H / 2;

    let a = 0;
    let r = 0;
    for (let i = 0; i < iterationsPerWord; i++) {
      a += 0.35;
      r += spiralStep / (1 + 0.003 * i);
      const x = Math.round(cx + Math.cos(a) * r - m.bw / 2);
      const y = Math.round(cy + Math.sin(a) * r - m.bh / 2);

      const rect = { x, y, w: m.bw, h: m.bh };
      if (x < 0 || y < 0 || x + m.bw > W || y + m.bh > H) continue;
      if (!collide(rect, rects)) {
        // Draw
        ctx.save();
        ctx.translate(x + m.bw / 2, y + m.bh / 2);
        ctx.rotate(angle);
        ctx.font = `${fontPx}px Montserrat,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif`;
        ctx.fillStyle = pickColor(word);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(word.text, 0, 0);
        ctx.restore();

        const box = {
          text: word.text,
          x, y, w: m.bw, h: m.bh,
          angle, fontPx,
          color: ctx.fillStyle,
        };
        rects.push({ x, y, w: m.bw, h: m.bh });
        return box;
      }
    }
    return null;
  };

  const drawAll = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);

    const rects = [];
    const placed = [];
    const list = [...words].sort((a, b) => b.weight - a.weight);
    list.forEach((w) => {
      const box = placeWord(ctx, w, rects);
      if (box) placed.push(box);
    });
    placedRef.current = placed;
  };

  // Tooltip és egér-interakció
  useEffect(() => {
    const canvas = canvasRef.current;
    const tip = tipRef.current;
    if (!canvas) return;

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      let over = null;
      const placed = placedRef.current;
      for (let i = placed.length - 1; i >= 0; i--) {
        const b = placed[i];
        if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
          over = b;
          break;
        }
      }
      if (hoverTooltip && tip) {
        if (over) {
          tip.textContent = over.text;
          tip.style.display = "block";
          tip.style.left = e.clientX + "px";
          tip.style.top = e.clientY + "px";
        } else {
          tip.style.display = "none";
        }
      }
      canvas.style.cursor = over ? "default" : "default";
    };

    const onLeave = () => {
      if (tip) tip.style.display = "none";
    };

    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);
    return () => {
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
    };
  }, [hoverTooltip]);

  // DPI és méretezés
  useEffect(() => {
    const ratio = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    setDeviceRatio(ratio);
  }, []);

  // Kirajzolás és újrarajzolás
  useEffect(() => {
    setCanvasSize();
    drawAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceRatio, words, background, palette, rotations, baseFontPx, maxFontPx, padding, spiralStep, iterationsPerWord]);

  // Reszponzív újrarajz
  useEffect(() => {
    let to;
    const onResize = () => {
      clearTimeout(to);
      to = setTimeout(() => {
        setCanvasSize();
        drawAll();
      }, 120);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="wc-wrapper" ref={wrapperRef}>
      <canvas ref={canvasRef} className="wc-canvas" />
      <div ref={tipRef} className="wc-tooltip" />
    </div>
  );
}
