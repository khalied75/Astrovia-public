import { useEffect, useRef } from "react";
import { markPostSeen } from "../../services/feedHistory";

export default function ViewedPost({ postId, viewerId, children }) {
  const postRef = useRef(null);

  useEffect(() => {
    const element = postRef.current;
    if (!element) return undefined;

    const markAsSeen = () => markPostSeen(viewerId, postId);
    if (!("IntersectionObserver" in window)) {
      markAsSeen();
      return undefined;
    }

    let viewTimer;
    const observer = new IntersectionObserver(
      ([entry]) => {
        clearTimeout(viewTimer);
        if (!entry.isIntersecting) return;
        viewTimer = setTimeout(() => {
          markAsSeen();
          observer.disconnect();
        }, 500);
      },
      { threshold: 0.1 },
    );
    observer.observe(element);

    return () => {
      clearTimeout(viewTimer);
      observer.disconnect();
    };
  }, [postId, viewerId]);

  return <div ref={postRef}>{children}</div>;
}
