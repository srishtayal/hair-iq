import SectionHeader from "@/components/common/section-header";

const faqs = [
  {
    question: "What is Hair IQ's delivery process?",
    answer:
      "We deliver directly from our factory in Bangladesh to your doorstep. Once you place an order, we ship it promptly, and you can track it every step of the way."
  },
  {
    question: "How do you ensure the best pricing?",
    answer:
      "We guarantee the lowest prices by sourcing directly with no middlemen, so we pass the savings straight to you."
  },
  {
    question: "What is open delivery?",
    answer:
      "Open delivery means you can inspect your patch before confirming acceptance. There are no hidden surprises and complete transparency."
  },
  {
    question: "How long does delivery take?",
    answer:
      "Delivery times vary, but we aim to get your patch to you as quickly as possible. Once shipped, we keep you updated with estimated timelines."
  },
  {
    question: "Can I return or exchange my patch?",
    answer: "We do not accept returns since we offer open delivery, which lets you check the product upon arrival."
  },
  {
    question: "Is there a customer support contact?",
    answer:
      "Yes. You can reach us via WhatsApp chat or at support@hairiq.in, and our team will respond as soon as possible."
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
