import IndustryLandingTemplate from "@/components/IndustryLandingTemplate";
import { Stethoscope, CalendarCheck, ShieldCheck } from "lucide-react"; // Using available icons

export const metadata = {
  title: "AI Marketing Software for Doctors & Clinics | Limbu AI",
  description: "Boost your clinic's local SEO, manage patient reviews, and grow your medical practice with Limbu AI.",
};

export default function ClinicMarketingPage() {
  const benefits = [
    {
      title: "Attract More Patients",
      description: "Build trust by automatically collecting 5-star reviews from satisfied patients right after their appointment.",
      icon: <Stethoscope className="w-6 h-6 text-lemon-hover" />
    },
    {
      title: "Save Time on Socials",
      description: "Auto-publish health tips, clinic updates, and service information without spending hours online.",
      icon: <CalendarCheck className="w-6 h-6 text-lemon-hover" />
    },
    {
      title: "Protect Patient Trust",
      description: "Handle patient complaints privately through our Smart Review Shield, keeping your online rating spotless.",
      icon: <ShieldCheck className="w-6 h-6 text-lemon-hover" />
    }
  ];

  return (
    <IndustryLandingTemplate
      industryName="Doctors & Clinics"
      heroHeading="Get More Patients with Top Local Rankings"
      heroSubheading="Focus on your patients. Let Limbu AI handle your clinic's reviews, local SEO, and daily online updates."
      heroImage="/images/category/doctor.png"
      heroimage2="/images/bussiness/hospital.png"
      benefitsList={benefits}
    />
  );
}