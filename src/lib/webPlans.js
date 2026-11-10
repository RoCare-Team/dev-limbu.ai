/** Website development plans — shown on /pricing and /website-development. */
export const WEB_DEVELOPMENT_PLANS = [
  {
    title: "Starter Website",
    basePrice: 9999,
    basePages: 5,
    staticFeatures: [
      "Responsive Design",
      "Basic SEO Setup",
      "Contact Form",
      "Social Media",
      "1 Month Support",
    ],
    description: "Perfect for small businesses or startups",
  },
  {
    title: "Business Website",
    basePrice: 25000,
    basePages: 15,
    staticFeatures: [
      "Custom UI/UX Design",
      "Advanced SEO",
      "Admin Panel",
      "Google Analytics",
      "3 Months Support",
    ],
    popular: true,
    description: "Best for growing businesses",
  },
  {
    title: "Enterprise Website",
    basePrice: 48000,
    basePages: 35,
    staticFeatures: [
      "Fully Custom Design",
      "E-commerce Integration",
      "Payment Gateway",
      "Advanced Security",
      "6 Months Support",
    ],
    description: "Perfect for large businesses & brands",
  },
];

export const GST_RATE = 0.18;

/** Plan shape the booking modal + Razorpay checkout expect. */
export const toCheckoutPlan = (plan) => ({
  ...plan,
  price: `₹${plan.basePrice.toLocaleString("en-IN")}`,
  gstAmount: `₹${Math.round(plan.basePrice * GST_RATE).toLocaleString("en-IN")}`,
  totalPrice: `₹${Math.round(plan.basePrice * (1 + GST_RATE)).toLocaleString("en-IN")}`,
  subtitle: plan.description,
});
