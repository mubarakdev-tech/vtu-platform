"use client";

import CountUp from "react-countup";

interface Props {
  value: number;
}

export default function AnimatedCounter({
  value,
}: Props) {
  return (
    <CountUp
      end={value}
      duration={2}
      separator=","
    />
  );
}