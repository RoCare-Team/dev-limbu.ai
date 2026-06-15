import HomePageData from "../models/HomePageData.js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import mongoose from "mongoose";

const MONGO_URI = process.env.MONGODB_URI;

const seedData = {
  heroImage: {
    url: "https://limbuai.s3.ap-south-1.amazonaws.com/home-data/hero8.jpeg",
    alt: "LimbuAI Hero Banner",
  },

  clientLogos: [
    { name: "Anup Gupta AI",     url: "https://limbuai.s3.ap-south-1.amazonaws.com/home-data/anup_gupta_ai.png" },
    { name: "Lucky Dry",         url: "https://limbuai.s3.ap-south-1.amazonaws.com/home-data/lucky_dry2.png" },
    { name: "Mannu Bhai",        url: "https://limbuai.s3.ap-south-1.amazonaws.com/home-data/mannubhai-12.png" },
    { name: "RO Care India",     url: "https://limbuai.s3.ap-south-1.amazonaws.com/home-data/ro-care-india.webp" },
    { name: "Solution",          url: "https://limbuai.s3.ap-south-1.amazonaws.com/home-data/solution1.jpeg" },
    { name: "Srinus",            url: "https://limbuai.s3.ap-south-1.amazonaws.com/home-data/srinus-logo.jpeg" },
    { name: "Client 7",          url: "https://limbuai.s3.ap-south-1.amazonaws.com/home-data/unnamed+(13).png" },
    { name: "Client 8",          url: "https://limbuai.s3.ap-south-1.amazonaws.com/home-data/unnamed-1__2.png" },
    { name: "iSpect",            url: "https://limbuai.s3.ap-south-1.amazonaws.com/home-data/ispect1.jpeg" },
    { name: "Indom",             url: "https://limbuai.s3.ap-south-1.amazonaws.com/home-data/indom1.jpeg" },
    { name: "Banjara Salon",     url: "https://limbuai.s3.ap-south-1.amazonaws.com/home-data/banjara_salon-3.png" },
    { name: "BPC Special",       url: "https://limbuai.s3.ap-south-1.amazonaws.com/home-data/Bpc-Spl.jpeg" },
    { name: "DEIT",              url: "https://limbuai.s3.ap-south-1.amazonaws.com/home-data/deit2.jpeg" },
    { name: "Dynamic Drapery",   url: "https://limbuai.s3.ap-south-1.amazonaws.com/home-data/dynamic_drapry-24.png" },
    { name: "Gudiya Collection", url: "https://limbuai.s3.ap-south-1.amazonaws.com/home-data/gudiya_collection-2.png" },
    { name: "Zoin",              url: "https://limbuai.s3.ap-south-1.amazonaws.com/home-data/zoin2.jpeg" },
  ],

  businessCategories: [
    { title: "Gym & Fitness Centres",    slug: "gym-fitness",            image: "https://limbuai.s3.ap-south-1.amazonaws.com/home-data/jim.png" },
    { title: "Doctors & Health Clinics", slug: "doctors-health-clinics", image: "https://limbuai.s3.ap-south-1.amazonaws.com/home-data/doctor.png" },
    { title: "Bakers & Cake Shops",      slug: "bakers-cake-shops",      image: "https://limbuai.s3.ap-south-1.amazonaws.com/home-data/cake.png" },
    { title: "Salon Owners",             slug: "salon-owners",           image: "https://limbuai.s3.ap-south-1.amazonaws.com/home-data/salon.png" },
    { title: "Restaurants & Bars",       slug: "restaurants-bars",       image: "https://limbuai.s3.ap-south-1.amazonaws.com/home-data/restorent.png" },
    { title: "Pest Control Businesses",  slug: "pest-control",           image: "https://limbuai.s3.ap-south-1.amazonaws.com/home-data/pest.png" },
    { title: "Car Garages & Mechanics",  slug: "car-garages-mechanics",  image: "https://limbuai.s3.ap-south-1.amazonaws.com/home-data/car.png" },
    { title: "Tours & Travels",          slug: "tours-travels",          image: "https://limbuai.s3.ap-south-1.amazonaws.com/home-data/tour.png" },
    { title: "Yoga & Wellness",          slug: "yoga-wellness",          image: "https://limbuai.s3.ap-south-1.amazonaws.com/home-data/yoga.png" },
    { title: "Handyman Services",        slug: "handyman-services",      image: "https://limbuai.s3.ap-south-1.amazonaws.com/home-data/handyman3.png" },
    { title: "Education & Coaching",     slug: "education-coaching",     image: "https://limbuai.s3.ap-south-1.amazonaws.com/home-data/coaching.png" },
    { title: "Real Estate Agents",       slug: "real-estate",            image: "https://limbuai.s3.ap-south-1.amazonaws.com/home-data/realestate.png" },
  ],

  popularCities: [
    { name: "Mumbai",     slug: "mumbai",     image: "https://images.unsplash.com/photo-1566552881560-0be862a7c445?auto=format&fit=crop&q=80&w=400&h=300" },
    { name: "Delhi",      slug: "delhi",      image: "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&q=80&w=400&h=300" },
    { name: "Bangalore",  slug: "bangalore",  image: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&q=80&w=400&h=300" },
    { name: "Hyderabad",  slug: "hyderabad",  image: "https://plus.unsplash.com/premium_photo-1697730430283-7e4456c78375?q=80&w=580&auto=format&fit=crop" },
    { name: "Gurgaon",    slug: "gurgaon",    image: "https://images.unsplash.com/photo-1689338039987-8a2539194e27?q=80&w=774&auto=format&fit=crop" },
    { name: "Kolkata",    slug: "kolkata",    image: "https://images.unsplash.com/photo-1558431382-27e303142255?auto=format&fit=crop&q=80&w=400&h=300" },
    { name: "Noida",      slug: "noida",      image: "https://images.unsplash.com/photo-1645938374927-d74b9349be51?q=80&w=726&auto=format&fit=crop" },
    { name: "Chandigarh", slug: "chandigarh", image: "https://plus.unsplash.com/premium_photo-1691031429261-aeb324882888?q=80&w=870&auto=format&fit=crop" },
    { name: "Jaipur",     slug: "jaipur",     image: "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&q=80&w=400&h=300" },
    { name: "Surat",      slug: "surat",      image: "https://images.unsplash.com/photo-1593693411515-c20261bcad6e?auto=format&fit=crop&q=80&w=400&h=300" },
  ],

  postImages: [
    { type: "user_post", url: "https://limbuai.s3.ap-south-1.amazonaws.com/cloudinary-migration/1777963481384-0-45547213-4951-4c5a-ab9d-39f30bbf1040-tmpx28dvfi__qxwt1c.jpg" },
    { type: "user_post", url: "https://limbuai.s3.ap-south-1.amazonaws.com/cloudinary-migration/1777963484708-1-10bf8ae3-2297-4c4a-b74d-3286b6387343-LED_BOARD_MAKER_NEAR_ME_IN_VAISHALI_NAGAR_pethuq.jpg" },
    { type: "user_post", url: "https://limbuai.s3.ap-south-1.amazonaws.com/cloudinary-migration/1777963484276-2-a91af316-4477-4485-b1e4-511e10177794-output_yd9alt.jpg" },
    { type: "user_post", url: "https://limbuai.s3.ap-south-1.amazonaws.com/cloudinary-migration/1777963484589-3-b07e8d75-96dc-4bea-8eab-b594dcd6532a-Post_banana_Main_Ek_ka_ladiss_ka_makeup_Karta_Hai_HD_picture_send_karo_vp6d6s.jpg" },
    { type: "user_post", url: "https://limbuai.s3.ap-south-1.amazonaws.com/cloudinary-migration/1777963482280-4-34e89006-9fd6-4bba-aa4e-752496387bc6-Nutritionvalue_21_on_google_m2etix.jpg" },
    { type: "user_post", url: "https://limbuai.s3.ap-south-1.amazonaws.com/cloudinary-migration/1777963482076-5-3b3066e5-ddbf-4ba1-92a2-bd7e18fc926c-output_n1ahcx.jpg" },
    { type: "user_post", url: "https://limbuai.s3.ap-south-1.amazonaws.com/cloudinary-migration/1777963482057-6-4c702ac6-e19b-4e26-ae3d-33915bb67bbe-output_ryar6j.jpg" },
    { type: "user_post", url: "https://limbuai.s3.ap-south-1.amazonaws.com/cloudinary-migration/1777963481136-7-5fb74cbe-4e95-4527-8720-b08089490a8e-tmp9x2d_a52_hvhpw8.jpg" },
    { type: "ai_generated", label: "AC Service",                             url: "https://s3.ap-south-1.amazonaws.com/limbuai/ad-images/ai/ac_service_faeb35b3.png" },
    { type: "ai_generated", label: "Men's Salon Service",                    url: "https://s3.ap-south-1.amazonaws.com/limbuai/ad-images/ai/men_s_salon_service_8e1ac38d.png" },
    { type: "ai_generated", label: "Classic Lens",                           url: "https://s3.ap-south-1.amazonaws.com/limbuai/ad-images/ai/classic_lens_aa803764.png" },
    { type: "ai_generated", label: "Water Purifier Service (Summer)",        url: "https://s3.ap-south-1.amazonaws.com/limbuai/ad-images/ai/water_purifier_service_in_summer_1828b7c5.png" },
    { type: "ai_generated", label: "AC Service (Alt)",                       url: "https://s3.ap-south-1.amazonaws.com/limbuai/ad-images/ai/ac_service_5e8cfd05.png" },
    { type: "ai_generated", label: "Home Care Services",                     url: "https://s3.ap-south-1.amazonaws.com/limbuai/ad-images/ai/home_care_services_7ec35ed4.png" },
    { type: "ai_generated", label: "RO Service",                             url: "https://s3.ap-south-1.amazonaws.com/limbuai/ad-images/ai/ro_service_957b2151.png" },
    { type: "ai_generated", label: "Commercial Water Purifier Installation", url: "https://s3.ap-south-1.amazonaws.com/limbuai/ad-images/ai/Commercial_water_purifier_installation_3bd8819b.jpg" },
    { type: "ai_generated", label: "Fast Fan Services",                      url: "https://s3.ap-south-1.amazonaws.com/limbuai/ad-images/ai/fast_fan_services_445170da.jpg" },
    { type: "ai_generated", label: "Water Purifier Service (Summer Alt)",    url: "https://s3.ap-south-1.amazonaws.com/limbuai/ad-images/ai/water_purifier_service_in_summer_0ef4c872.png" },
  ],

  videoExamples: [
    { label: "Video Example 1", url: "https://limbuai.s3.ap-south-1.amazonaws.com/migrated_video/1777965758899-0-3963c931-8bdc-4c5b-83b7-a45e2f3dee5c-WhatsApp-Video-2026-02-02-at-2.50.11-PM.mp4" },
    { label: "Video Example 2", url: "https://limbuai.s3.ap-south-1.amazonaws.com/migrated_video/1777965759497-1-dcff2a8b-d608-4fad-8304-dd8f6d132c8f-WhatsApp-Video-2026-02-02-at-2.50.12-PM.mp4" },
    { label: "Video Example 3", url: "https://limbuai.s3.ap-south-1.amazonaws.com/migrated_video/1777965759390-2-bbc0bea6-909e-4566-a417-ba3cd713645e-WhatsApp-Video-2026-02-02-at-2.50.12-PM--2-.mp4" },
    { label: "Video Example 4", url: "https://limbuai.s3.ap-south-1.amazonaws.com/migrated_video/1777965758826-3-9a4c4050-5a50-41b5-9614-7228d1f04c24-WhatsApp_Video_2026-01-07_at_11.24.52_AM_jm18dh.mp4" },
    { label: "Video Example 5", url: "https://limbuai.s3.ap-south-1.amazonaws.com/migrated_video/1777965758630-4-cb36a2d7-1f46-42ba-8852-9a7429d1b3da-WhatsApp_Video_2026-01-07_at_11.24.14_AM_j6ck8w.mp4" },
    { label: "Video Example 6", url: "https://limbuai.s3.ap-south-1.amazonaws.com/migrated_video/1777965759013-5-1d0a1d2e-4af6-43b2-9680-a3b730d239ae-WhatsApp_Video_2026-01-07_at_11.25.30_AM_adbkxc.mp4" },
    { label: "Video Example 7", url: "https://limbuai.s3.ap-south-1.amazonaws.com/migrated_video/1777965758921-6-39fd61e5-fad7-492a-9270-80b3f15472f5-WhatsApp_Video_2026-01-07_at_11.26.00_AM_drdjma.mp4" },
  ],
};

async function seedHomePageData() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB connected");

    const exists = await HomePageData.findOne();

    if (exists) {
      console.log("⏭️  Skipped — HomePageData document already exists");
    } else {
      await HomePageData.create(seedData);
      console.log("✅ HomePageData seeded successfully!");
    }
  } catch (err) {
    console.error("❌ Seed failed:", err);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 MongoDB disconnected");
  }
}

seedHomePageData();