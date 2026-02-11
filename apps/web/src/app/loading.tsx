export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-bg">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto" />
        <p className="text-neutral-muted text-sm">Loading...</p>
      </div>
    </div>
  );
}