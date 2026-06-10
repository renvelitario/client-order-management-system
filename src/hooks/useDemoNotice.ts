import { useMemo, useState } from 'react';

const DEMO_NOTICE_SESSION_KEY = 'demoNoticeSeenForAccessToken';

export const useDemoNotice = (accessToken?: string) => {
  const [dismissedNoticeId, setDismissedNoticeId] = useState<string | null>(null);

  const noticeSessionId = useMemo(() => {
    if (!accessToken) {
      return null;
    }

    return accessToken.slice(-24);
  }, [accessToken]);

  const hasSeenNotice = noticeSessionId
    ? sessionStorage.getItem(DEMO_NOTICE_SESSION_KEY) === noticeSessionId
    : true;

  const isDemoNoticeOpen = Boolean(
    noticeSessionId
    && dismissedNoticeId !== noticeSessionId
    && !hasSeenNotice,
  );

  const dismissDemoNotice = () => {
    if (!noticeSessionId) {
      return;
    }

    sessionStorage.setItem(DEMO_NOTICE_SESSION_KEY, noticeSessionId);
    setDismissedNoticeId(noticeSessionId);
  };

  return {
    isDemoNoticeOpen,
    dismissDemoNotice,
  };
};
