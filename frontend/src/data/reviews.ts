import { Review } from "@/types";

type ReviewTemplate = Omit<Review, "id" | "date" | "avatar">;

const TOTAL_REVIEW_COUNT = 36;
const START_DATE = new Date("2026-03-06T00:00:00Z");

const avatarPool = [
  "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1542204625-de293a5f2f36?auto=format&fit=crop&w=200&q=80"
];

const reviewTemplates: ReviewTemplate[] = [
  {
    user: "Rohit Sharma",
    location: "Delhi, India",
    rating: 5,
    title: "Natural Look - Nobody Noticed",
    content:
      "I got the Mirage patch from HairIQ. The finish looks completely natural. Even my close friends didn't realise I was wearing a patch.",
    media: {
      type: "image",
      url: "https://images.unsplash.com/photo-1499996860823-5214fcc65f8f?auto=format&fit=crop&w=1200&q=80",
    },
  },
  {
    user: "Amit Verma",
    location: "Noida, India",
    rating: 5,
    title: "Best Price I Found",
    content: "I checked many places before buying. HairIQ offered much better pricing. Quality of the patch is also very good."
  },
  {
    user: "Sandeep Kumar",
    location: "Ghaziabad, India",
    rating: 4,
    title: "Good Service at Home",
    content: "Their team came to my home for service. Technicians were polite and experienced. The patch fitting was done properly."
  },
  {
    user: "Rahul Gupta",
    location: "Gurgaon, India",
    rating: 5,
    title: "Confidence Came Back",
    content:
      "Hair loss had reduced my confidence. After getting the patch from HairIQ things improved. Now I feel comfortable meeting people again.",
    media: {
      type: "video",
      url: "/videos/reel.mp4",
    },
  },
  {
    user: "Manish Arora",
    location: "Delhi, India",
    rating: 5,
    title: "Looks Like Real Hair",
    content: "The hair quality is really good. It blends perfectly with my existing hair. Very happy with the overall look."
  },
  {
    user: "Tarun Bansal",
    location: "Faridabad, India",
    rating: 4,
    title: "Smooth Installation Process",
    content: "Visited their centre for patch fitting. The process was smooth and quick. Team also explained maintenance clearly."
  },
  {
    user: "Deepak Yadav",
    location: "Noida, India",
    rating: 5,
    title: "Worth Every Rupee",
    content: "I purchased the Mirage patch. Quality is much better than my previous patch. Definitely worth the price."
  },
  {
    user: "Vikas Singh",
    location: "Delhi, India",
    rating: 5,
    title: "Very Natural Result",
    content: "I was worried before trying a patch. But the result looks very natural. Nobody noticed any difference."
  },
  {
    user: "Ankit Jain",
    location: "Gurgaon, India",
    rating: 4,
    title: "Good for First Time Users",
    content: "This was my first hair patch. The team guided me patiently. Overall experience was positive."
  }
];

const formatDate = (date: Date) => date.toISOString().slice(0, 10);

export const reviews: Review[] = Array.from({ length: TOTAL_REVIEW_COUNT }, (_, index) => {
  const template = reviewTemplates[index % reviewTemplates.length];
  const currentDate = new Date(START_DATE);
  currentDate.setUTCDate(START_DATE.getUTCDate() - index);

  return {
    id: `r${index + 1}`,
    user: template.user,
    location: template.location,
    rating: template.rating,
    title: template.title,
    content: template.content,
    date: formatDate(currentDate),
    avatar: avatarPool[index % avatarPool.length]
  };
});
