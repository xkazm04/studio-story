const ColoredBorder = ({ color = "blue" }: { color?: "blue" | "green" | "purple" | "yellow" | "pink" | "orange" | "gray" }) => {
  const colorClasses = {
    blue: "from-transparent via-blue-500/50 to-transparent",
    green: "from-transparent via-green-500/50 to-transparent",
    purple: "from-transparent via-purple-500/50 to-transparent",
    yellow: "from-transparent via-yellow-500/50 to-transparent",
    pink: "from-transparent via-pink-500/50 to-transparent",
    orange: "from-transparent via-orange-500/50 to-transparent",
    gray: "from-transparent via-gray-500/50 to-transparent",
  };

  const colorClass = colorClasses[color];

  return (
    <>
      {/* Top border */}
      <div className={`absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r ${colorClass}`} />
      {/* Bottom border */}
      <div className={`absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r ${colorClass} opacity-60`} />
      {/* Left border */}
      <div className={`absolute top-0 left-0 h-full w-[1px] bg-gradient-to-b ${colorClass}`} />
      {/* Right border */}
      <div className={`absolute top-0 right-0 h-full w-[1px] bg-gradient-to-b ${colorClass} opacity-60`} />
    </>
  );
};

export default ColoredBorder;
