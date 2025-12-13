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
    // 监听窗口聚焦和失焦事件
    const handleFocus = () => {
      setIsWebActive(true);
    };

    /* 监听标签页不可见事件 */
    const handleInvisible = () => {
      if (!document.hidden) {
        return;
      }
      setIsWebActive(true);
    };

    window.addEventListener("visibilitychange", handleInvisible);
    window.addEventListener("focus", handleFocus);

    // 清理事件监听器
    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("visibilitychange", handleInvisible);
    };
  }, []);

  return {
    isWebActive,
    onChangeWebActive,
  };
}
