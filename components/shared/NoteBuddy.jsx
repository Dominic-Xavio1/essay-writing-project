export function NoteBuddy({ size = 'sm', className = '' }) {
  const sizeClasses = {
    sm: 'h-12 w-12',
    md: 'h-16 w-16',
    lg: 'h-20 w-20',
  };
  const noteClasses = {
    sm: 'h-9 w-8',
    md: 'h-11 w-10',
    lg: 'h-14 w-12',
  };

  return (
    <div aria-hidden="true" className={`relative grid shrink-0 place-items-center animate-bob ${sizeClasses[size] || sizeClasses.sm} ${className}`}>
      <span className="absolute h-4/5 w-2/3 -rotate-6 rounded-lg border border-primary/20 bg-primary/5" />
      <span className={`relative grid rotate-3 place-items-center rounded-lg border border-primary/30 bg-white shadow-sm ${noteClasses[size] || noteClasses.sm}`}>
        <span className="absolute -top-1 h-1.5 w-2.5 rounded-full bg-primary/70" />
        <span className="mt-1 flex items-center gap-1.5">
          <span className="relative h-1.5 w-1.5 rounded-full bg-foreground after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0.5 after:rounded-full after:bg-primary/40" />
          <span className="relative h-1.5 w-1.5 rounded-full bg-foreground after:absolute after:-bottom-1 after:right-0 after:h-0.5 after:w-0.5 after:rounded-full after:bg-primary/40" />
        </span>
        <span className="-mt-0.5 h-2 w-3 rounded-b-full border-b-2 border-primary" />
      </span>
      <span className="absolute bottom-1 left-0 h-2.5 w-1.5 -rotate-12 rounded-full bg-primary/70" />
      <span className="absolute bottom-1 right-0 h-2.5 w-1.5 rotate-12 rounded-full bg-primary/70" />
    </div>
  );
}