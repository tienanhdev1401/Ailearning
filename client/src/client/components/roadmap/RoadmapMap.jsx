import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import styles from './RoadmapMap.module.css';

const DEFAULT_VIEWBOX_WIDTH = 960;
const DEFAULT_VIEWBOX_HEIGHT = 600;

const buildDefaultNodes = (count) => {
  const generated = [];
  for (let i = 0; i < count; i += 1) {
    let status = 'locked';
    if (i === 0) status = 'available';
    if (i < 3) status = 'completed';
    generated.push({
      day: i + 1,
      title: `Day ${i + 1}`,
      status,
    });
  }
  return generated;
};

const buildSmoothPath = (points) => {
  if (!points.length) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const current = points[i];
    const midX = (prev.x + current.x) / 2;
    d += ` Q ${midX} ${prev.y} ${current.x} ${current.y}`;
  }
  return d;
};

const buildGalaxyLayout = (count, width, baseHeight) => {
  if (!count) return { positions: [], pathD: '', canvasHeight: baseHeight };

  const paddingX = 120;
  const paddingY = 100;
  const usableWidth = Math.max(640, width - paddingX * 2);
  const minRowSpacing = 170;
  const maxColumns = Math.min(6, Math.max(3, Math.floor(usableWidth / 140)));
  const columnCount = Math.max(3, maxColumns);
  const columnSpacing = usableWidth / Math.max(columnCount - 1, 1);
  const rows = Math.ceil(count / columnCount);
  const usableHeight = Math.max(baseHeight - paddingY * 2, rows * minRowSpacing);
  const rowSpacing = usableHeight / Math.max(rows - 1, 1);
  const canvasHeight = paddingY * 2 + usableHeight;

  const catmullRom = (p0, p1, p2, p3, t) => {
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      0.5 *
      ((2 * p1) +
        (-p0 + p2) * t +
        (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
        (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
    );
  };

  const sampleCurve = (points, samples) => {
    if (samples === 1) return [points[0]];
    const result = [];
    const segments = points.length - 1;
    for (let i = 0; i < samples; i += 1) {
      const progress = (i / Math.max(samples - 1, 1)) * segments;
      const segIndex = Math.min(Math.floor(progress), segments - 1);
      const localT = progress - segIndex;
      const p0 = points[Math.max(segIndex - 1, 0)];
      const p1 = points[segIndex];
      const p2 = points[Math.min(segIndex + 1, segments)];
      const p3 = points[Math.min(segIndex + 2, segments)];
      result.push({
        x: catmullRom(p0.x, p1.x, p2.x, p3.x, localT),
        y: catmullRom(p0.y, p1.y, p2.y, p3.y, localT),
      });
    }
    return result;
  };

  const gridPoints = [];
  const horizontalWave = columnSpacing * 0.18;
  const verticalWave = rowSpacing * 0.12;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < columnCount; col += 1) {
      const nodeIndex = row * columnCount + col;
      if (nodeIndex >= count) break;
      const direction = row % 2 === 0 ? 1 : -1;
      const serpentineCol = direction === 1 ? col : columnCount - 1 - col;
      const baseX = paddingX + serpentineCol * columnSpacing;
      const wobble = Math.sin((row + serpentineCol / columnCount) * 0.9) * columnSpacing * 0.15;
      const flowingWave = Math.sin(row * 0.65 + serpentineCol * 0.45) * horizontalWave;
      const x = baseX + wobble + flowingWave;
      const y = paddingY + row * rowSpacing +
        Math.cos(row * 0.55 + serpentineCol * 0.7) * verticalWave;
      gridPoints.push({ x, y });
    }
  }

  const positions = sampleCurve(gridPoints, count);
  return { positions, pathD: buildSmoothPath(positions), canvasHeight };
};

const RoadmapMap = ({
  nodes,
  nodesCount = 60,
  width = '100%',
  height = 560,
  onSelect,
  onLoadMore,
  onCanvasResize,
}) => {
  const data = useMemo(() => (nodes && nodes.length ? nodes : buildDefaultNodes(nodesCount)), [nodes, nodesCount]);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, label: '' });
  const wrapperRef = useRef(null);
  const [canvasWidth, setCanvasWidth] = useState(() => {
    if (typeof width === 'number') return Math.max(720, width);
    return 960;
  });

  useLayoutEffect(() => {
    const element = wrapperRef.current;
    if (!element) return undefined;

    const updateWidth = () => {
      const measured = element.clientWidth || DEFAULT_VIEWBOX_WIDTH;
      setCanvasWidth((prev) => {
        const next = Math.max(720, Math.round(measured));
        return Math.abs(next - prev) < 4 ? prev : next;
      });
    };

    updateWidth();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(updateWidth);
      observer.observe(element);
      return () => observer.disconnect();
    }

    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const baseHeight = useMemo(() => {
    const minHeight = height ?? DEFAULT_VIEWBOX_HEIGHT;
    return Math.max(minHeight, Math.round(canvasWidth * 0.45));
  }, [canvasWidth, height]);

  const { positions, pathD, canvasHeight } = useMemo(
    () => buildGalaxyLayout(data.length, canvasWidth, baseHeight),
    [data.length, canvasWidth, baseHeight]
  );

  useEffect(() => {
    if (typeof onCanvasResize === 'function') {
      onCanvasResize(canvasHeight);
    }
  }, [canvasHeight, onCanvasResize]);

  const handleSelect = useCallback(
    (node) => {
      if (node.status === 'locked') return;
      if (typeof onSelect === 'function') {
        onSelect(node);
      }
    },
    [onSelect]
  );

  const handlePointerMove = (event, node) => {
    if (window.matchMedia('(max-width: 768px)').matches) return;
    const wrapperRect = wrapperRef.current?.getBoundingClientRect();
    if (!wrapperRect) return;
    setTooltip({
      visible: true,
      x: event.clientX - wrapperRect.left + 12,
      y: event.clientY - wrapperRect.top - 12,
      label: node.title ?? `Day ${node.day}`,
    });
  };

  const hideTooltip = () => setTooltip((prev) => ({ ...prev, visible: false }));

  const handleKey = (event, node) => {
    if (node.status === 'locked') return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (typeof onSelect === 'function') onSelect(node);
    }
  };

  return (
    <div className={styles.wrapper} ref={wrapperRef} style={{ width, minHeight: Math.max(height, canvasHeight) }}>
      <svg
        className={styles.svg}
        role="img"
        aria-label="Roadmap progression"
        viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="roadmap-track" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00fbff" />
            <stop offset="100%" stopColor="#00ff88" />
          </linearGradient>
        </defs>

        <path d={pathD} className={styles.trackPath} />

        {positions.map((pos, idx) => {
          const node = data[idx];
          if (!node) return null;
          const isLoadMore = Boolean(node.isLoadMore);
          const handleLoadMore = () => {
            if (typeof onLoadMore === 'function') onLoadMore();
          };

          if (isLoadMore) {
            return (
              <g
                key={`load-more-${idx}`}
                className={[styles.node, styles.nodeAvailable, styles.nodeLoadMore].join(' ')}
                transform={`translate(${pos.x} ${pos.y})`}
                role="button"
                tabIndex={0}
                aria-label="Tải thêm ngày"
                onClick={handleLoadMore}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleLoadMore();
                  }
                }}
              >
                <circle className={styles.nodeOuter} r={46} />
                <circle className={styles.nodeInner} r={32} />
                <text className={styles.loadMoreLabel} y={8}>
                  {node.loadingMore ? '…' : '➜'}
                </text>
              </g>
            );
          }

          const isClickable = node.status !== 'locked';
          const isLocked = node.status === 'locked';
          const isCompleted = node.status === 'completed';
          const isAvailable = node.status === 'available';
          const nodeStyle = { '--delay': `${idx * 0.03}s` };
          return (
            <g
              key={`${node.day}-${idx}`}
              className={[
                styles.node,
                isLocked && styles.nodeLocked,
                isAvailable && styles.nodeAvailable,
                isCompleted && styles.nodeCompleted,
              ]
                .filter(Boolean)
                .join(' ')}
              transform={`translate(${pos.x} ${pos.y})`}
              tabIndex={isClickable ? 0 : -1}
              role={isClickable ? 'button' : 'presentation'}
              aria-label={`Day ${node.day} ${node.status}`}
              onClick={() => handleSelect(node)}
              onKeyDown={(event) => handleKey(event, node)}
              onMouseEnter={(event) => handlePointerMove(event, node)}
              onMouseLeave={hideTooltip}
              style={nodeStyle}
            >
              <circle className={styles.nodeOuter} r={46} />
              <circle className={styles.nodeInner} r={32} />
              <text className={styles.nodeDayTag} y={-6}>
                DAY
              </text>
              <text className={styles.nodeNumber} y={20}>
                {node.day}
              </text>
              {isLocked && (
                <text className={styles.lockBadge} x={26} y={-22}>
                  🔒
                </text>
              )}
              {isCompleted && (
                <text className={styles.nodeStar} x={18} y={-22}>
                  ★
                </text>
              )}
              {isCompleted && <circle className={styles.nodeAccent} r={48} />}
              {isAvailable && <circle className={styles.nodeGlow} r={48} />}
            </g>
          );
        })}
      </svg>

      {tooltip.visible && (
        <div className={styles.tooltip} style={{ left: tooltip.x, top: tooltip.y }}>
          {tooltip.label}
        </div>
      )}
    </div>
  );
};

export default RoadmapMap;
