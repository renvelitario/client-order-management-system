import '../../styles/components/page-loader.css';

type PageLoaderProps = {
  className?: string;
  message?: string;
  pageName?: string;
};

const PageLoader = ({ className = 'container', message, pageName }: PageLoaderProps) => {
  const resolvedClassName = className ? `${className} page-loader` : 'page-loader';
  const resolvedMessage = message || (pageName ? `Loading ${pageName}...` : 'Loading...');

  return (
    <div className={resolvedClassName} role="status" aria-live="polite">
      <span className="page-loader-spinner" aria-hidden="true" />
      <span className="page-loader-text">{resolvedMessage}</span>
    </div>
  );
};

export default PageLoader;
