import { useAuth } from '../../application/hooks/useAuth';

export function Toast() {
  const { toast } = useAuth();

  if (!toast) return null;

  const isError = toast.type === 'error';

  return (
    <div 
      className={`toast-banner ${isError ? 'toast-error' : 'toast-success'} animate-fade-in`}
      role="alert"
    >
      <span>{isError ? '⚠️' : '✨'}</span>
      <p>{toast.message}</p>
    </div>
  );
}
