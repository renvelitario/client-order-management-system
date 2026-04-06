import type { ReactNode } from 'react';

type PageContainerProps = {
  children: ReactNode;
};

const PageContainer = ({ children }: PageContainerProps) => {
  return <section className="app-page-container">{children}</section>;
};

export default PageContainer;
