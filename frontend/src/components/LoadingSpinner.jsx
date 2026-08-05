/**
 * Loading spinner for async operations
 */
export default function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div className="loading-spinner" role="status">
      <div className="spinner" />
      <p>{text}</p>
    </div>
  );
}
