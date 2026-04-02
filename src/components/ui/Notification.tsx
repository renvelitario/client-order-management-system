type NotificationProps = {
  message: string;
  type: string;
};

const Notification = ({ message, type }: NotificationProps) => {
  if (!message) return null;
  return (
    <div className={`notification ${type}`} role="status" aria-live="polite">
      {message}
    </div>
  );
};

export default Notification;
