import dynamic from "next/dynamic";

const ExploreMapClient = dynamic(() => import("./ExploreMapClient"), { ssr: false });

export const metadata = {
  title: "Explore Map – PlotBazaar",
  description: "Browse all land listings across India on an interactive map.",
};

export default function ExploreMapPage() {
  return <ExploreMapClient />;
}
