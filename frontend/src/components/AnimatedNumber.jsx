// import { useEffect, useState } from "react";
// import { motion, useMotionValue, useTransform, animate } from "framer-motion";

// function AnimatedNumber({ value, suffix = "" }) {
//   const count = useMotionValue(0);
//   const rounded = useTransform(count, (latest) => Math.round(latest));
//   const [display, setDisplay] = useState(0);

//   useEffect(() => {
//     const controls = animate(count, value, { duration: 0.8, ease: "easeOut" });
//     const unsubscribe = rounded.on("change", (v) => setDisplay(v));
//     return () => {
//       controls.stop();
//       unsubscribe();
//     };
//   }, [value]);

//   return (
//     <span>
//       {display}
//       {suffix}
//     </span>
//   );
// }

// export default AnimatedNumber;

import { useEffect, useState } from "react";
import { useMotionValue, useTransform, animate } from "framer-motion";

// ✅ decimals prop — avgFocus (3.7) ko 4 na banaye
function AnimatedNumber({ value, suffix = "", decimals = 0 }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) =>
    decimals > 0 ? latest.toFixed(decimals) : Math.round(latest),
  );
  const [display, setDisplay] = useState(
    decimals > 0 ? (0).toFixed(decimals) : 0,
  );

  useEffect(() => {
    const controls = animate(count, value, { duration: 0.8, ease: "easeOut" });
    const unsubscribe = rounded.on("change", (v) => setDisplay(v));
    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [value, decimals]);

  return (
    <span>
      {display}
      {suffix}
    </span>
  );
}

export default AnimatedNumber;
