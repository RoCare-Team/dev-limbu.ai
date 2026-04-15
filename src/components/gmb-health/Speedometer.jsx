import React from "react";

const Speedometer = React.memo(({ score }) => {
  const radius = 140;
  const strokeWidth = 24;
  const center = 160;

  const getCoords = (angleInDegrees) => {
    const angleInRadians = (angleInDegrees * Math.PI) / 180;
    return {
      x: center + radius * Math.cos(angleInRadians),
      y: center + radius * Math.sin(angleInRadians),
    };
  };

  const start = getCoords(180);
  const endRed = getCoords(288);
  const endOrange = getCoords(324);
  const endGreen = getCoords(360);

  const needleAngle = 180 + (score / 100) * 180;
  const needleRad = (needleAngle * Math.PI) / 180;
  const needleLength = radius - 20;
  const needleX = center + needleLength * Math.cos(needleRad);
  const needleY = center + needleLength * Math.sin(needleRad);

  const labels = [0, 25, 50, 75, 100];

  return (
    <svg width="320" height="200" viewBox="0 0 320 200" className="mx-auto">
      <path
        d={`M ${start.x} ${start.y} A ${radius} ${radius} 0 0 1 ${endRed.x} ${endRed.y}`}
        fill="none"
        stroke="#ef4444"
        strokeWidth={strokeWidth}
      />
      <path
        d={`M ${endRed.x} ${endRed.y} A ${radius} ${radius} 0 0 1 ${endOrange.x} ${endOrange.y}`}
        fill="none"
        stroke="#fb923c"
        strokeWidth={strokeWidth}
      />
      <path
        d={`M ${endOrange.x} ${endOrange.y} A ${radius} ${radius} 0 0 1 ${endGreen.x} ${endGreen.y}`}
        fill="none"
        stroke="#22c55e"
        strokeWidth={strokeWidth}
      />
      {labels.map((val) => {
        const a = 180 + (val / 100) * 180;
        const textRad = (a * Math.PI) / 180;
        const textR = radius - 35;
        const tx = center + textR * Math.cos(textRad);
        const ty = center + textR * Math.sin(textRad);
        return (
          <text
            key={val}
            x={tx}
            y={ty}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-xs font-bold"
            fill="#6b7280"
            style={{ fontSize: "12px" }}
          >
            {val}
          </text>
        );
      })}
      <circle cx={center} cy={center} r="45" fill="#1f2937" />
      <line
        x1={center}
        y1={center}
        x2={needleX}
        y2={needleY}
        stroke="#1f2937"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx={center} cy={center} r="6" fill="#ef4444" />
    </svg>
  );
});

Speedometer.displayName = "Speedometer";
export default Speedometer;
