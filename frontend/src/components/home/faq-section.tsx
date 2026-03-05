import SectionHeader from "@/components/common/section-header";

const faqs = [
  {
    question: "What is a hair patch?",
    answer:
      "A hair patch is a non-surgical hair replacement system designed for people experiencing hair loss. It is attached to the scalp using medical-grade adhesive or clips to give a natural hair look."
  },
  {
    question: "Will the hair patch look natural?",
    answer:
      "Yes. Our hair patches are designed with natural hairlines, scalp-like base material, and real human hair to ensure a natural appearance."
  },
  {
    question: "Is it real hair or synthetic hair?",
    answer: "We use 100% human hair for a natural look, styling flexibility, and durability."
  },
  {
    question: "Can I style the hair patch like normal hair?",
    answer: "Yes. You can cut, style, and set the hair patch just like natural hair."
  },
  {
    question: "How long does a hair patch last?",
    answer: "Depending on usage and maintenance, a hair patch usually lasts 8-10 months."
  },
  {
    question: "Do you offer Cash on Delivery (COD)?",
    answer: "Yes, we offer COD with open delivery, so you can check the hair patch quality before making payment."
  },
  {
    question: "What is open delivery?",
    answer: "Open delivery means you can inspect the product in front of the courier partner before paying."
  },
  {
    question: "What if I don't like the patch during open delivery?",
    answer:
      "If you are not satisfied with the product, you can return it immediately to the courier partner without paying anything."
  },
  {
    question: "How long does delivery take?",
    answer: "Delivery usually takes 2-5 days depending on your location."
  },
  {
    question: "How is the hair patch installed?",
    answer: "The hair patch is installed using skin-safe adhesives or tapes for a strong and comfortable hold."
  },
  {
    question: "Do you provide installation service?",
    answer: "Yes. Our trained technicians can visit your home to install the hair patch professionally."
  },
  {
    question: "How long does the installation take?",
    answer: "Installation usually takes 45-60 minutes."
  },
  {
    question: "Can I wash the hair patch?",
    answer: "Yes, you can wash it like normal hair using mild shampoo."
  },
  {
    question: "Can I sleep, shower, or exercise with the patch?",
    answer: "Yes, once installed properly, you can sleep, shower, and do regular activities comfortably."
  },
  {
    question: "How often do I need maintenance?",
    answer: "Maintenance is recommended every 3-4 weeks."
  },
  {
    question: "Why are your hair patches cheaper than other centers?",
    answer:
      "We work directly with factory-level sourcing (including Bangladesh factory) which helps us provide premium patches at factory prices."
  },
  {
    question: "Are there different types of hair patches?",
    answer:
      "Yes, we offer multiple types such as lace, mono, and skin base patches depending on your hair loss and styling preference."
  },
  {
    question: "Will anyone be able to tell I am wearing a hair patch?",
    answer: "No. When installed correctly and styled properly, it looks completely natural."
  },
  {
    question: "Is it safe for the scalp?",
    answer: "Yes. We use skin-friendly tapes and adhesives that are safe for the scalp."
  },
  {
    question: "Can I remove the patch myself?",
    answer: "Yes, but we recommend professional maintenance for better longevity and proper reattachment."
  }
];

export default function FaqSection() {
  return (
    <section className="space-y-8">
      <SectionHeader eyebrow="" title="Frequently asked questions" />
      <div className="grid gap-4">
        {faqs.map((faq) => (
          <article key={faq.question} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
            <h3 className="font-display text-lg text-coal md:text-xl">{faq.question}</h3>
            <p className="mt-2 text-sm text-gray-600 md:text-base">{faq.answer}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
