
import React from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const FAQSection = () => {
  const faqs = [
    {
      question: "Do I need a wallet?",
      answer: "No. Our scan works without connecting any wallet - just enter a token ticker or contract address."
    },
    {
      question: "Is this free?",
      answer: "Yes, the basic token scan is completely free to use with no hidden costs."
    },
    {
      question: "What chains do you support?",
      answer: "Currently we support Ethereum (ETH) chain for the MVP. More chains will be added soon."
    },
    {
      question: "How is the score calculated?",
      answer: "We analyze various data points across security, liquidity, community engagement, and development activity to generate a comprehensive health score."
    },
    {
      question: "Do you store user data?",
      answer: "We only store minimal data necessary for account functionality. Your searches are anonymized after 30 days."
    },
    {
      question: "Can I see scans without signing up?",
      answer: "You can start a scan without signing up, but you'll need a free account to view the complete results."
    }
  ];

  return (
    <section className="py-16 px-4 bg-white" id="faq">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
          <Accordion type="single" collapsible className="w-full">
            {faqs.slice(0, 3).map((faq, index) => (
              <AccordionItem key={index} value={`faq-${index}`}>
                <AccordionTrigger className="text-lg font-medium">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-gray-600">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <Accordion type="single" collapsible className="w-full">
            {faqs.slice(3).map((faq, index) => (
              <AccordionItem key={index + 3} value={`faq-${index + 3}`}>
                <AccordionTrigger className="text-lg font-medium">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-gray-600">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};
