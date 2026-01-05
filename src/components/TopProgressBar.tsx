'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import NProgress from 'nprogress';

// 创建全局钩子来拦截 router
let globalRouterRef: any = null;

export default function TopProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isNavigatingRef = useRef(false);

  useEffect(() => {
    // 配置 NProgress
    NProgress.configure({
      showSpinner: false,
      trickleSpeed: 200,
      minimum: 0.08,
      easing: 'ease',
      speed: 200,
    });

    // 保存原始的 router 方法
    globalRouterRef = router;
    const originalPush = router.push;
    const originalReplace = router.replace;
    const originalBack = router.back;
    const originalForward = router.forward;

    // 拦截 router.push
    router.push = function (...args: Parameters<typeof originalPush>) {
      isNavigatingRef.current = true;
      NProgress.start();
      return originalPush.apply(this, args);
    };

    // 拦截 router.replace
    router.replace = function (...args: Parameters<typeof originalReplace>) {
      isNavigatingRef.current = true;
      NProgress.start();
      return originalReplace.apply(this, args);
    };

    // 拦截 router.back
    router.back = function () {
      isNavigatingRef.current = true;
      NProgress.start();
      return originalBack.apply(this);
    };

    // 拦截 router.forward
    router.forward = function () {
      isNavigatingRef.current = true;
      NProgress.start();
      return originalForward.apply(this);
    };

    // 监听所有链接点击事件
    const handleAnchorClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const anchor = target.closest('a');

      if (anchor && anchor.href) {
        const currentUrl = window.location.href;
        const targetUrl = anchor.href;

        if (targetUrl !== currentUrl && !anchor.target && !anchor.download) {
          const currentOrigin = window.location.origin;
          try {
            const targetOrigin = new URL(targetUrl, currentOrigin).origin;
            if (currentOrigin === targetOrigin) {
              isNavigatingRef.current = true;
              NProgress.start();
            }
          } catch (e) {
            // URL 解析失败，忽略
          }
        }
      }
    };

    // 监听浏览器前进后退按钮
    const handlePopState = () => {
      isNavigatingRef.current = true;
      NProgress.start();
    };

    document.addEventListener('click', handleAnchorClick, true);
    window.addEventListener('popstate', handlePopState);

    return () => {
      // 恢复原始方法
      if (globalRouterRef) {
        globalRouterRef.push = originalPush;
        globalRouterRef.replace = originalReplace;
        globalRouterRef.back = originalBack;
        globalRouterRef.forward = originalForward;
      }

      document.removeEventListener('click', handleAnchorClick, true);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [router]);

  useEffect(() => {
    // 页面路径变化时，表示页面已加载完成，结束进度条
    if (isNavigatingRef.current) {
      NProgress.done();
      isNavigatingRef.current = false;
    }
  }, [pathname, searchParams]);

  return null;
}
