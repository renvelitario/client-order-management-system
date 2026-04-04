import '../../styles/components/page-loader.css';

type PageLoaderProps = {
  className?: string;
  message?: string;
};

const PageLoader = ({ className = 'container', message = 'Loading...' }: PageLoaderProps) => {
  const resolvedClassName = className ? `${className} page-loader` : 'page-loader';

  return (
    <div className={resolvedClassName} role="status" aria-live="polite">
      <span className="page-loader-spinner" aria-hidden="true" />
      <span className="page-loader-text">{message}</span>
    </div>
  );
};

export default PageLoader;
