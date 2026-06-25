import dynamic from "next/dynamic";
import StormtrooperCanvas from "@/components/StormtrooperCanvas";
// Disabling SSR prevents Next.js from breaking during build time
// const StormtrooperCanvas = dynamic(
//   () => import("@/components/StormtrooperCanvas"),
//   { ssr: false }
// );

export default function Home() {
  return (
    <main>
      <StormtrooperCanvas />
    </main>
  );
}
