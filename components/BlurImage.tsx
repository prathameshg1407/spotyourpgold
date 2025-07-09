// 'use client';
// import { cn } from "@/lib/utils";
// import Image, { ImageProps } from "next/image";
// import { useState } from "react";

// export const BlurImage = ({
//   height,
//   width,
//   src,
//   className,
//   alt,
//   ...rest
// }: ImageProps) => {
//   const [isLoading, setLoading] = useState(true);
//   return (
//     <Image
//       className={cn(
//         "h-full w-full transition duration-300",
//         isLoading ? "blur-sm" : "blur-0",
//         className
//       )}
//       onLoad={() => setLoading(false)}
//       src={src as string}
//       width={width}
//       height={height}
//       loading="lazy"
//       decoding="async"
//       blurDataURL={typeof src === "string" ? src : undefined} // use this when i want to add a placeholder like skeleton or something
//       alt={alt ? alt : "Background of a beautiful view"}
//       {...rest}
//     />
//   );
// };

"use client";
import { cn } from "@/lib/utils";
import Image, { ImageProps } from "next/image";
import { useState } from "react";

export const BlurImage = ({
  height,
  width,
  src,
  className,
  priority = false,
  alt,
  openInNewTab = false,
  ...rest
}: ImageProps & { openInNewTab?: boolean }) => {
  const [isLoading, setLoading] = useState(true);

  return (
    <Image
      onClick={()=>{
        if(openInNewTab && typeof src === "string"){
          window.open(src, "_blank");
        }
      }}
      className={cn(
        "h-full w-full object-cover transition-all duration-500 ease-in-out",
        isLoading ? "blur-md scale-105" : "blur-0 scale-100",
        className
      )}
       onLoad={() => setLoading(false)}
      priority={priority}
      src={src}
      width={width}
      height={height}
      alt={alt || "Image"}
 {...(!priority ? { loading: "lazy" } : {})} 
       decoding="async"
      {...rest}
    />
  );
};
