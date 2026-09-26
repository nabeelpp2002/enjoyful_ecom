import type { Metadata } from "next";
import { ProductHunt } from "@/components/game/ProductHunt";

export const metadata: Metadata = {
  title: "Product Hunt | Enjoyful Life",
  description: "Play the Enjoyful Life hidden-product game. Move objects, find our products, unlock new scenes, and beat your best score.",
  alternates: { canonical: "/404" },
};

export default function GamePage() {
  return <ProductHunt />;
}
