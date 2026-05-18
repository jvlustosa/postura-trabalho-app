export interface RawPoseLandmark {
  x: number;
  y: number;
  visibility?: number;
}

export interface PoseOverlayPoint {
  index: number;
  x: number;
  y: number;
  visibility: number;
}

export interface PoseOverlayViewport {
  viewportWidth: number;
  viewportHeight: number;
  sourceWidth: number;
  sourceHeight: number;
  pixelRatio?: number;
}

export const poseConnections: Array<[number, number]> = [
  [0, 7],
  [0, 8],
  [7, 11],
  [8, 12],
  [11, 12],
  [11, 23],
  [12, 24],
  [23, 24],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
  [23, 25],
  [25, 27],
  [24, 26],
  [26, 28],
];

export const getVisiblePosePoints = (
  landmarks: RawPoseLandmark[] | undefined,
  viewport: PoseOverlayViewport,
  minVisibility = 0.5,
): PoseOverlayPoint[] => {
  if (!landmarks) {
    return [];
  }

  const scale = Math.max(
    viewport.viewportWidth / viewport.sourceWidth,
    viewport.viewportHeight / viewport.sourceHeight,
  );
  const renderedWidth = viewport.sourceWidth * scale;
  const renderedHeight = viewport.sourceHeight * scale;
  const offsetX = (viewport.viewportWidth - renderedWidth) / 2;
  const offsetY = (viewport.viewportHeight - renderedHeight) / 2;

  return landmarks.flatMap((landmark, index) => {
    const visibility = landmark.visibility ?? 1;

    if (visibility < minVisibility) {
      return [];
    }

    return {
      index,
      x: offsetX + landmark.x * renderedWidth,
      y: offsetY + landmark.y * renderedHeight,
      visibility,
    };
  });
};

export const drawPoseOverlay = (
  canvas: HTMLCanvasElement,
  landmarks: RawPoseLandmark[] | undefined,
  viewport: PoseOverlayViewport,
): void => {
  const context = canvas.getContext('2d');

  if (!context) {
    return;
  }

  const pixelRatio = viewport.pixelRatio ?? 1;
  canvas.width = Math.round(viewport.viewportWidth * pixelRatio);
  canvas.height = Math.round(viewport.viewportHeight * pixelRatio);
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);

  const points = getVisiblePosePoints(landmarks, viewport);
  const pointByIndex = new Map(points.map((point) => [point.index, point]));

  context.lineWidth = 1.5;
  context.lineCap = 'round';
  context.strokeStyle = 'rgba(180, 240, 240, 0.42)';
  context.shadowColor = 'rgba(0, 0, 0, 0.25)';
  context.shadowBlur = 2;

  for (const [fromIndex, toIndex] of poseConnections) {
    const from = pointByIndex.get(fromIndex);
    const to = pointByIndex.get(toIndex);

    if (!from || !to) {
      continue;
    }

    context.beginPath();
    context.moveTo(from.x, from.y);
    context.lineTo(to.x, to.y);
    context.stroke();
  }

  context.shadowBlur = 0;

  for (const point of points) {
    context.beginPath();
    context.arc(point.x, point.y, 2.5, 0, Math.PI * 2);
    context.fillStyle = 'rgba(255, 255, 255, 0.78)';
    context.fill();
    context.lineWidth = 1;
    context.strokeStyle = 'rgba(76, 218, 218, 0.45)';
    context.stroke();
  }
};
