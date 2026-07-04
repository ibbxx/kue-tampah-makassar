import { useState } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  wrapperClassName?: string;
  skeletonClassName?: string;
}

export function LazyImage({
  src,
  alt,
  className,
  wrapperClassName,
  skeletonClassName,
  onLoad,
  ...props
}: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className={cn("relative overflow-hidden w-full h-full", wrapperClassName)}>
      {src && !loaded && !error && (
        <Skeleton
          className={cn(
            "absolute inset-0 z-10 w-full h-full rounded-[inherit]",
            skeletonClassName
          )}
        />
      )}
      <img
        src={src}
        alt={alt}
        className={cn(
          "transition-all duration-300",
          !loaded && !error ? "opacity-0 scale-95" : "opacity-100 scale-100",
          className
        )}
        onLoad={(e) => {
          setLoaded(true);
          if (onLoad) onLoad(e);
        }}
        onError={() => {
          setError(true);
        }}
        {...props}
      />
    </div>
  );
}
