import PropTypes from 'prop-types';
import { useRef, useEffect, useState } from 'react';
import {
  primaryColors,
  secondaryColors
} from '../../utilities/theme.utilities';

export const BarChart = props => {
  const { className, title, options, height = 1 } = props;
  const accentColor = primaryColors[localStorage.getItem('accent') || 'blue'];
  const baseColor = secondaryColors[localStorage.getItem('base') || 'neutral'];
  const domRef = useRef(null);
  const canvasRef = useRef(null);
  const state = {
    tooltipVisible: false,
    hoveredDatasetIndex: -1,
    hoveredLabelIndex: -1,
    rect: {},
    ratio: window.devicePixelRatio,
    auxRatio: window.devicePixelRatio
  };

  const [ctx, setContext] = useState(null);

  const initial = () => {
    const { current: canvasEl } = canvasRef;
    const parent = canvasEl.parentNode;

    if (options.maintainAspectRatio) {
      canvasEl.width = canvasEl.clientWidth;
      canvasEl.height = canvasEl.width / 2;
    } else {
      canvasEl.width = parent.clientWidth;
      canvasEl.height = parent.clientHeight;
    }

    state.rect = canvasEl.getBoundingClientRect();
    state.legend = options.data.datasets.filter(item => item.label).length > 0;
    state.fontSize = 12;
    state.fontFamily = 'sans-serif';
    state.textHeight = calculateTextSize();
    state.padding = 10;
    state.sizeTitle = state.textHeight + state.padding * 2;
    state.paddingTop =
      state.textHeight + (state.legend ? state.padding * 2 : 0);
    state.paddingBottom = state.textHeight + state.padding * 2;
    state.paddingLeft = calculateWidthAxisY() + state.padding * 2;
    state.tooltipMargin = state.padding;
    state.tooltipHeight = state.textHeight + state.tooltipMargin * 2;
    state.tooltipCornerRadius = state.padding / 2;
    state.tooltipBox = state.textHeight;
    state.tooltipSizeArrow = Math.floor(state.tooltipHeight / 4);
    state.angleLabels = 0;

    if (canvasEl.width < 450) {
      state.angleLabels = Math.PI / 4;
      state.paddingBottom *= 2;
    }

    state.chart = {
      width: canvasEl.width - state.paddingLeft,
      height:
        canvasEl.height -
        state.paddingTop -
        state.paddingBottom -
        (options.title ? state.sizeTitle : 0)
    };

    state.sectionWidth = Math.floor(
      state.chart.width / options.data.datasets[0].data.length
    );
    const divider =
      options.data.datasets.length * 6 + options.data.datasets.length - 1 + 2;
    state.paddingSection = Math.ceil(state.sectionWidth / divider);
    state.barWidth =
      (state.sectionWidth -
        state.paddingSection * (options.data.datasets.length + 1)) /
      options.data.datasets.length;

    state.legendBox = {
      width: state.textHeight * 2,
      height: state.textHeight,
      gap: Math.floor(state.textHeight / 2)
    };

    state.numLabels = 10;
    while (state.chart.height / state.numLabels < 20) {
      if (state.chart.height / state.numLabels < 2) return;
      state.numLabels--;
    }

    const data = options.data.datasets.reduce(
      (acc, set) => [...acc, ...set.data],
      []
    );
    state.maxValue = Math.max(...data);
    state.minValue = Math.min(...data);
    state.range = 0;
    calculateStadistic(state);
  };

  const calculateTextSize = () => {
    ctx.font = `${state.fontSize}px ${state.fontFamily}`;
    const textMetrics = ctx.measureText('Ag');
    return (
      textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent
    );
  };

  const calculateWidthAxisY = () => {
    ctx.font = `${state.fontSize}px ${state.fontFamily}`;
    return ctx.measureText(
      Math.max(
        ...options.data.datasets.reduce(
          (acc, set) => [...acc, ...set.data.map(Math.abs)],
          []
        )
      )
    ).width;
  };

  const calculateStadistic = state => {
    const adjustedMin = Math.min(0, state.minValue);
    const adjustedMax = Math.max(0, state.maxValue);
    state.range = adjustedMax - adjustedMin;
    calculateIntervalWidth(state);
    state.roundedMin =
      Math.floor(adjustedMin / state.intervalWidth) * state.intervalWidth;
    state.roundedMax =
      Math.ceil(adjustedMax / state.intervalWidth) * state.intervalWidth;
    state.roundedRange = state.roundedMax - state.roundedMin;
  };

  const calculateIntervalWidth = state => {
    state.intervalWidth = Math.ceil(state.range / state.numLabels);
    const multiple = nearestPowerOfTen(state.intervalWidth);

    while (state.intervalWidth % multiple !== 0) {
      state.intervalWidth++;
    }
  };

  const nearestPowerOfTen = number => {
    const log = Math.floor(Math.log10(number));
    return Math.pow(10, log);
  };

  const draw = () => {
    if (!ctx) return;
    clearCanvas();

    ctx.strokeStyle = `rgb(${baseColor[400]})`;
    ctx.lineWidth = 0.2;
    drawHorizontalLines();
    drawVerticalLines();

    drawAxisX();
    drawAxisY();

    if (options.title) drawTitle();

    drawBars();
    drawLegend();

    drawTooltip();
  };

  const clearCanvas = () => {
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const drawText = ({ title, x, y, bold, align, baseline, color }) => {
    bold = !!bold;
    align = align || 'center';
    baseline = baseline || 'top';
    color = color || `rgb(${baseColor[400]})`;
    ctx.fillStyle = color;
    ctx.font = (bold && 'bold ') + state.fontSize + 'px ' + state.fontFamily;
    ctx.textAlign = align;
    ctx.textBaseline = baseline;
    ctx.fillText(title, x, y);
  };

  const drawBox = ({ index, x, y, width, height, bottom, background }) => {
    if (background) {
      ctx.fillStyle = 'rgba(255, 255, 255, 1)';
      ctx.fillRect(x, y, width, height);
    }

    ctx.fillStyle =
      options.data.datasets[index].backgroundColor ||
      `rgba(${accentColor['500']} / 0.2)`;
    ctx.strokeStyle =
      options.data.datasets[index].borderColor ||
      `rgba(${accentColor['500']} / 1)`;
    ctx.lineWidth = options.data.datasets[index].borderWidth || 2;
    ctx.fillRect(x, y, width, height);

    if (!bottom) {
      ctx.beginPath();
      ctx.moveTo(x, y + height);
      ctx.lineTo(x, y);
      ctx.lineTo(x + width, y);
      ctx.lineTo(x + width, y + height);
      ctx.stroke();
    } else {
      ctx.strokeRect(x, y, width, height);
    }
  };

  const drawCloud = (x, y, width, direction) => {
    ctx.fillStyle = `rgba(0, 0, 0, 0.7)`;
    ctx.beginPath();
    ctx.moveTo(x + state.tooltipCornerRadius, y);
    ctx.lineTo(x + width - state.tooltipCornerRadius, y);
    ctx.quadraticCurveTo(
      x + width,
      y,
      x + width,
      y + state.tooltipCornerRadius
    );
    ctx.lineTo(x + width, y + state.tooltipHeight - state.tooltipCornerRadius);
    ctx.quadraticCurveTo(
      x + width,
      y + state.tooltipHeight,
      x + width - state.tooltipCornerRadius,
      y + state.tooltipHeight
    );
    ctx.lineTo(x + state.tooltipCornerRadius, y + state.tooltipHeight);
    ctx.quadraticCurveTo(
      x,
      y + state.tooltipHeight,
      x,
      y + state.tooltipHeight - state.tooltipCornerRadius
    );
    ctx.lineTo(x, y + state.tooltipCornerRadius);
    ctx.quadraticCurveTo(x, y, x + state.tooltipCornerRadius, y);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(
      x + (direction === 'right' ? width : 0),
      y +
        state.tooltipHeight / 2 -
        state.tooltipSizeArrow / 2 -
        state.tooltipSizeArrow / 2
    );
    ctx.lineTo(
      x +
        (direction === 'right'
          ? width + state.tooltipSizeArrow
          : -state.tooltipSizeArrow),
      y + state.tooltipHeight / 2
    );
    ctx.lineTo(
      x + (direction === 'right' ? width : 0),
      y +
        state.tooltipHeight / 2 +
        state.tooltipSizeArrow / 2 +
        state.tooltipSizeArrow / 2
    );
    ctx.closePath();
    ctx.fill();
  };

  const drawTitle = () => {
    drawText({
      title: options.title,
      x: canvasRef.current.width / 2,
      y: state.sizeTitle / 2,
      bold: true
    });
  };

  const drawLegend = () => {
    if (!state.legend) return;
    ctx.font = state.fontSize + 'px ' + state.fontFamily;
    const fullWidthLegend = options.data.datasets.reduce(
      (acc, set) =>
        acc +
        state.legendBox.width +
        state.legendBox.gap +
        ctx.measureText(set.label).width +
        state.legendBox.gap * 2,
      0 - state.legendBox.gap * 2
    );
    let x = (canvasRef.current.width - fullWidthLegend) / 2;

    options.data.datasets.forEach((set, index) => {
      const widthLegend =
        state.legendBox.width +
        state.legendBox.gap +
        ctx.measureText(set.label).width;

      drawBox({
        index,
        x,
        y:
          state.paddingTop / 2 -
          state.legendBox.height / 2 +
          (options.title ? state.sizeTitle : 0),
        width: state.legendBox.width,
        height: state.legendBox.height,
        bottom: true
      });

      drawText({
        title: set.label,
        x: x + state.legendBox.width + state.legendBox.gap,
        y:
          (options.title ? state.sizeTitle : 0) +
          state.paddingTop / 2 -
          Math.floor(state.textHeight / 2),
        align: 'left'
      });

      x += widthLegend + state.legendBox.gap * 2;
    });
  };

  const drawHorizontalLines = () => {
    for (
      let value = state.roundedMin;
      value <= state.roundedMax;
      value += state.intervalWidth
    ) {
      const y =
        state.chart.height -
        ((value - state.roundedMin) / (state.roundedMax - state.roundedMin)) *
          state.chart.height +
        state.paddingTop +
        (options.title ? state.sizeTitle : 0);

      ctx.beginPath();
      ctx.moveTo(state.paddingLeft - 10, y);
      ctx.lineTo(canvasRef.current.width, y);
      ctx.stroke();
    }
  };

  const drawVerticalLines = () => {
    for (let i = 0; i < options.data.labels.length; i++) {
      const x = i * state.sectionWidth + state.paddingLeft;

      ctx.beginPath();
      ctx.moveTo(x, state.paddingTop + (options.title ? state.sizeTitle : 0));
      ctx.lineTo(x, canvasRef.current.height - state.paddingBottom + 10);
      ctx.stroke();
    }
  };

  const drawAxisX = () => {
    for (let i = 0; i < options.data.labels.length; i++) {
      const x = i * state.sectionWidth + state.paddingLeft;
      const label = options.data.labels[i];
      const sectionCenterX = x + state.sectionWidth / 2;

      ctx.save();
      ctx.translate(
        sectionCenterX,
        canvasRef.current.height - state.paddingBottom / 2
      );
      ctx.rotate(-state.angleLabels);
      drawText({ title: label, x: 0, y: 0 });
      ctx.rotate(state.angleLabels);
      ctx.restore();
    }
  };

  const drawAxisY = () => {
    for (
      let value = state.roundedMin;
      value <= state.roundedMax;
      value += state.intervalWidth
    ) {
      const y =
        state.chart.height -
        ((value - state.roundedMin) / (state.roundedMax - state.roundedMin)) *
          state.chart.height +
        state.paddingTop +
        (options.title ? state.sizeTitle : 0);

      drawText({
        title: value,
        x: state.paddingLeft - 15,
        y,
        align: 'right',
        baseline: 'middle'
      });
    }
  };

  const drawBars = () => {
    options.data.datasets.forEach((set, i) => {
      set.data.forEach((data, j) => {
        const value = data;
        const origin =
          state.roundedMax * (state.chart.height / state.roundedRange);
        const x =
          j * state.sectionWidth +
          state.paddingSection +
          state.paddingLeft +
          i * (state.paddingSection + state.barWidth);
        const barHeight = value * (state.chart.height / state.roundedRange);
        const y =
          (options.title ? state.sizeTitle : 0) +
          state.paddingTop +
          origin -
          barHeight;

        drawBox({
          index: i,
          x,
          y,
          width: state.barWidth,
          height: barHeight
        });
      });
    });
  };

  const drawTooltip = () => {
    if (
      !state.tooltipVisible ||
      state.hoveredDatasetIndex === -1 ||
      state.hoveredLabelIndex === -1
    )
      return;

    const label = options.data.labels[state.hoveredLabelIndex];
    const value =
      options.data.datasets[state.hoveredDatasetIndex].data[
        state.hoveredLabelIndex
      ];
    const origin = state.roundedMax * (state.chart.height / state.roundedRange);
    const widthText = ctx.measureText(`${label}: ${value}`).width;
    const tooltipWidth = state.tooltipMargin * 3 + state.tooltipBox + widthText;
    const x =
      state.hoveredLabelIndex * state.sectionWidth +
      state.paddingSection +
      state.paddingLeft +
      state.hoveredDatasetIndex * (state.paddingSection + state.barWidth);
    const barHeight = value * (state.chart.height / state.roundedRange);
    const y =
      (options.title ? state.sizeTitle : 0) +
      state.paddingTop +
      origin -
      barHeight;

    let tooltipX;
    let arrowDirection;

    if (state.hoveredLabelIndex < Math.floor(options.data.labels.length / 2)) {
      tooltipX =
        x + state.barWidth - state.barWidth / 2 + state.tooltipSizeArrow;
      arrowDirection = 'left';
    } else {
      tooltipX = x - tooltipWidth + state.barWidth / 2;
      arrowDirection = 'right';
    }

    const tooltipY = y - state.tooltipHeight / 2;

    drawCloud(
      Math.ceil(tooltipX),
      Math.ceil(tooltipY),
      Math.ceil(tooltipWidth),
      arrowDirection
    );

    drawBox({
      index: state.hoveredDatasetIndex,
      x: tooltipX + state.tooltipMargin,
      y: tooltipY + state.tooltipMargin,
      width: state.tooltipBox,
      height: state.tooltipBox,
      bottom: true,
      background: true
    });

    drawText({
      title: `${label}: ${value}`,
      x: tooltipX + state.tooltipMargin * 2 + state.tooltipBox,
      y: tooltipY + state.tooltipHeight / 2 - Math.floor(state.textHeight / 2),
      align: 'left',
      color: '#fff'
    });
  };

  const handleMouseMove = e => {
    const mousePos = getMousePos(e);

    options.data.datasets.forEach((set, i) => {
      set.data.forEach((value, j) => {
        const origin =
          state.roundedMax * (state.chart.height / state.roundedRange);
        const x =
          j * state.sectionWidth +
          state.paddingSection +
          state.paddingLeft +
          i * (state.paddingSection + state.barWidth);
        const barHeight =
          value *
          (state.chart.height / state.roundedRange) *
          (value < 0 ? -1 : 1);
        const y =
          (options.title ? state.sizeTitle : 0) +
          state.paddingTop +
          origin -
          (value < 0 ? 0 : barHeight);

        if (
          mousePos.x >= x &&
          mousePos.x <= x + state.barWidth &&
          mousePos.y >= y &&
          mousePos.y <= y + barHeight
        ) {
          state.hoveredDatasetIndex = i;
          state.hoveredLabelIndex = j;
          state.tooltipVisible = true;
        } else if (
          state.hoveredDatasetIndex === i &&
          state.hoveredLabelIndex === j
        ) {
          state.hoveredDatasetIndex = -1;
          state.hoveredLabelIndex = -1;
          state.tooltipVisible = false;
        }
      });
    });

    draw();
  };

  const getMousePos = e => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const resize = () => {
    if (options.maintainAspectRatio) {
      const ratio = window.devicePixelRatio;

      if (state.auxRatio !== ratio) {
        canvasRef.current.style.width = `${state.rect.width / ratio}px`;
        canvasRef.current.style.height = `${state.rect.height / ratio}px`;
        state.auxRatio = ratio;
      } else {
        canvasRef.current.removeAttribute('style');
        initial();
      }
    } else {
      canvasRef.current.width = canvasRef.current.parentNode.clientWidth;
      canvasRef.current.height = canvasRef.current.parentNode.clientHeight;
      initial();
    }

    draw();
  };

  useEffect(() => {
    if (!ctx) return;

    initial();
    draw();
    // eslint-disable-next-line
  }, [ctx]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const _canvasRef = canvasRef.current;
    setContext(_canvasRef.getContext('2d'));

    window.addEventListener('resize', resize);
    _canvasRef.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('resize', resize);
      _canvasRef.removeEventListener('mousemove', handleMouseMove);
    };
    // eslint-disable-next-line
  }, [canvasRef.current]);

  useEffect(() => {
    if (!ctx) return;
    resize();
    // eslint-disable-next-line
  }, [className, height]);

  return (
    <div
      ref={domRef}
      style={{ height: 86.5 * height + 16 * (height - 1) + 'px' }}
    >
      {title && (
        <p className="h-10 text-lg text-nowrap font-semibold truncate text-secondary-600 dark:text-secondary-200">
          {title}
        </p>
      )}
      <div className="h-[calc(100%-40px)]">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
};

BarChart.propTypes = {
  className: PropTypes.string,
  title: PropTypes.string,
  data: PropTypes.object,
  options: PropTypes.object,
  height: PropTypes.number
};
