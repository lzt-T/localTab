import { useEffect, useState } from "react";

/**
 * 监听标签页激活状态
 * @returns 返回标签页是否激活的状态和手动改变状态的函数
 */
export function useWebActive() {
  const [isWebActive, setIsWebActive] = useState(false);

  /* 改变标签页聚焦状态 */
  const onChangeWebActive = (isActive: boolean) => {
    setIsWebActive(isActive);
  };

  useEffect(() => {
    /** 标签页重新可见时标记页面为激活状态。 */
    const handleVisibilityChange = () => {
      if (document.hidden) {
        return;
      }
      setIsWebActive(true);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // 清理事件监听器
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return {
    isWebActive,
    onChangeWebActive,
  };
}
