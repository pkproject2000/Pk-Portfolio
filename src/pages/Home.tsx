import { Hero } from '../components/Hero';
import { FeaturedPortfolios } from '../components/FeaturedPortfolios';

export function Home() {
  return (
    <main className="flex-1">
      <Hero />
      <FeaturedPortfolios />
    </main>
  );
}
