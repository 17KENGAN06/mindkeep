type ErrorMessageProps = {
  message?: string;
};

export function ErrorMessage({ message }: ErrorMessageProps) {
  if (!message) return null;

  return (
    <div
      className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
      role="alert"
    >
      {message}
    </div>
  );
}
