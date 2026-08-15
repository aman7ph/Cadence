import * as React from "react";
import { cn } from "@/lib/utils";

const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        // Measured from the prototype's section labels: Lora, 10px, regular
        // weight, 0.05em tracking. The handoff prose says 700 weight; the
        // rendered design says 400, and the design wins (D0).
        "font-display text-[10px] font-normal uppercase tracking-[0.05em] text-muted-foreground",
        className,
      )}
      {...props}
    />
  ),
);
Label.displayName = "Label";

export { Label };
