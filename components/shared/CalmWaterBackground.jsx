const bubbles = Array.from({ length: 7 }, (_, index) => index);

export function CalmWaterBackground() {
  return (
    <div className="reader-water-bg" aria-hidden="true">
      <div className="reader-water-bg__flow" />
      <div className="reader-water-bg__current" />
      <div className="reader-water-bg__bubbles">
        {bubbles.map((bubble) => (
          <span key={bubble} className="reader-water-bg__bubble" />
        ))}
      </div>
    </div>
  );
}
