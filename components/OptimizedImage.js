"use client";

import Image from "next/image";
import { useState } from "react";
import { API_BASE_URL } from "../services/api";

const IMAGE_SIZES = {
  thumbnail: { w: 200, label: "thumb" },
  small: { w: 400, label: "sm" },
  medium: { w: 800, label: "md" },
  large: { w: 1200, label: "lg" },
};

export default function OptimizedImage({
  src,
  alt,
  size = "medium",
  fill: useFill = false,
  priority = false,
  className = "",
  containerClassName = "",
  ...props
}) {
  const [usingFallback, setUsingFallback] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const sizeConfig = IMAGE_SIZES[size];
  if (!sizeConfig) {
    return (
      <Image
        src={src}
        alt={alt}
        fill={useFill}
        priority={priority}
        className={className}
        {...props}
      />
    );
  }

  const isCloudinary = typeof src === "string" && src.includes("cloudinary.com");
  const isHttp = typeof src === "string" && src.startsWith("http");

  let optimizedSrc = src;

  if (isCloudinary) {
    optimizedSrc = src.replace(
      "/upload/",
      `/upload/w_${sizeConfig.w},f_auto,q_auto/`
    );
  } else if (!isHttp && src) {
    const filename = src.split("/").pop();
    optimizedSrc = `/uploads/resize/${sizeConfig.label}/${filename}`;
  }

  const handleError = () => {
    if (!usingFallback) {
      setUsingFallback(true);
    }
  };

  return (
    <div className={`${useFill ? 'absolute inset-0' : 'relative'} ${containerClassName}`}>
      {!loaded && !priority && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse" />
      )}
      <Image
        src={usingFallback ? src : optimizedSrc}
        alt={alt}
        fill={useFill}
        priority={priority}
        unoptimized={isHttp && !isCloudinary}
        onLoad={() => setLoaded(true)}
        onError={handleError}
        className={`transition-opacity duration-300 ${loaded || priority || (isHttp && !isCloudinary) ? "opacity-100" : "opacity-0"} ${className}`}
        sizes={
          useFill
            ? "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            : undefined
        }
        {...props}
      />
    </div>
  );
}

export function getOptimizedUrl(src, size = "medium") {
  const sizeConfig = IMAGE_SIZES[size];
  if (!sizeConfig || !src) return src || "";

  if (src.includes("cloudinary.com")) {
    return src.replace("/upload/", `/upload/w_${sizeConfig.w},f_auto,q_auto/`);
  }

  if (src.startsWith("http")) return src;

  const filename = src.split("/").pop();
  return `/uploads/resize/${sizeConfig.label}/${filename}`;
}

export { IMAGE_SIZES };
