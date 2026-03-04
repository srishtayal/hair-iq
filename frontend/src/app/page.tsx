import AboutSection from "@/components/home/about-section";
import FeaturedProducts from "@/components/home/featured-products";
import HeroSection from "@/components/home/hero-section";
import TestimonialSection from "@/components/home/testimonial-section";
import VideoPreview from "@/components/home/video-preview";

export default function HomePage() {
  return (
    <div className="space-y-16">
      <HeroSection />
      <AboutSection />
      <VideoPreview />
      <TestimonialSection />
      <FeaturedProducts />
    </div>
  );
}
