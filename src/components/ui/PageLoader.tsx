type PageLoaderProps = {
  className?: string;
  message?: string;
};

const PageLoader = ({ className = 'container', message = 'Loading...' }: PageLoaderProps) => (
  <div className={className}>{message}</div>
);

export default PageLoader;
