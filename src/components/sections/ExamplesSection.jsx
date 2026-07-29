import ImageGallery from "../ImageGallery";


const postImages = [
  "https://limbuai.s3.ap-south-1.amazonaws.com/cloudinary-migration/1777963481384-0-45547213-4951-4c5a-ab9d-39f30bbf1040-tmpx28dvfi__qxwt1c.jpg",
  "https://s3.ap-south-1.amazonaws.com/limbuai/ad-images/ai/Microwave_Service_Near_Me_784075a4.png",
  "https://limbuai.s3.ap-south-1.amazonaws.com/cloudinary-migration/1777963484708-1-10bf8ae3-2297-4c4a-b74d-3286b6387343-LED_BOARD_MAKER_NEAR_ME_IN_VAISHALI_NAGAR_pethuq.jpg",
  "https://limbuai.s3.ap-south-1.amazonaws.com/cloudinary-migration/1777963484276-2-a91af316-4477-4485-b1e4-511e10177794-output_yd9alt.jpg",
  "https://s3.ap-south-1.amazonaws.com/limbuai/ad-images/ai/tvs_genuine_spare_parts_727ca330.png",
  "https://limbuai.s3.ap-south-1.amazonaws.com/cloudinary-migration/1777963484589-3-b07e8d75-96dc-4bea-8eab-b594dcd6532a-Post_banana_Main_Ek_ka_ladiss_ka_makeup_Karta_Hai_HD_picture_send_karo_vp6d6s.jpg",
  "https://s3.ap-south-1.amazonaws.com/limbuai/ad-images/ai/health_care_a71640a3.png",
  "https://limbuai.s3.ap-south-1.amazonaws.com/cloudinary-migration/1777963482280-4-34e89006-9fd6-4bba-aa4e-752496387bc6-Nutritionvalue_21_on_google_m2etix.jpg",
  "https://limbuai.s3.ap-south-1.amazonaws.com/cloudinary-migration/1777963482076-5-3b3066e5-ddbf-4ba1-92a2-bd7e18fc926c-output_n1ahcx.jpg",
  "https://s3.ap-south-1.amazonaws.com/limbuai/ad-images/ai/Pre_Nursery_School_Near_Me_af135cf2.png",
  "https://limbuai.s3.ap-south-1.amazonaws.com/cloudinary-migration/1777963482057-6-4c702ac6-e19b-4e26-ae3d-33915bb67bbe-output_ryar6j.jpg",
  "https://s3.ap-south-1.amazonaws.com/limbuai/ad-images/ai/silk_shop_near_me_0f7ead3b.png",
  "https://limbuai.s3.ap-south-1.amazonaws.com/cloudinary-migration/1777963481136-7-5fb74cbe-4e95-4527-8720-b08089490a8e-tmp9x2d_a52_hvhpw8.jpg",
  "https://s3.ap-south-1.amazonaws.com/limbuai/ad-images/ai/ac_service_faeb35b3.png",
  "https://s3.ap-south-1.amazonaws.com/limbuai/ad-images/ai/customised_wallpaper_for_living_room_88e584f9.png",
  "https://s3.ap-south-1.amazonaws.com/limbuai/ad-images/ai/men_s_salon_service_8e1ac38d.png",
  "https://limbuai.s3.ap-south-1.amazonaws.com/images/1781844678227-a5c544844e4b2768dbab749d910d26a9.jpg",
  "https://s3.ap-south-1.amazonaws.com/limbuai/ad-images/ai/classic_lens_aa803764.png",
  "https://s3.ap-south-1.amazonaws.com/limbuai/ad-images/ai/tvs_jupiter_showroom_in_bhilai_0bf51e34.png",
  "https://s3.ap-south-1.amazonaws.com/limbuai/ad-images/ai/ac_service_5e8cfd05.png",
  "https://s3.ap-south-1.amazonaws.com/limbuai/ad-images/ai/fabric_supplier_88b83fe5.png",
  "https://s3.ap-south-1.amazonaws.com/limbuai/ad-images/ai/home_care_services_7ec35ed4.png",
  "https://s3.ap-south-1.amazonaws.com/limbuai/ad-images/ai/best_school_for_kids_c0342fed.png",
  "https://s3.ap-south-1.amazonaws.com/limbuai/ad-images/ai/wallpaper_shop_near_me_67af8829.png",
  "https://s3.ap-south-1.amazonaws.com/limbuai/ad-images/ai/fast_fan_services_445170da.jpg",
  "https://s3.ap-south-1.amazonaws.com/limbuai/ad-images/ai/silk_shop_near_me_d50ad0dc.png",
];

export default function ExamplesSection() {
  return (
    <section
      id="examples"
      className="relative w-full overflow-hidden py-12 border-t border-black/5"
      style={{ backgroundColor: "var(--background)" }}
    >
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
        {/* HEADER */}
        <div className="text-center mb-12 sm:mb-16">
          <h2
            className="font-bold uppercase leading-[0.95] tracking-tight mb-4"
            style={{
              fontFamily: "var(--font-heading)",
              color: "var(--foreground)",
              fontSize: "clamp(1.75rem, 4.5vw, 2.5rem)",
            }}
          >
            Limbu AI Generated{" "}
            <span style={{ color: "var(--lemon-hover)" }}>Post Examples</span>
          </h2>
        </div>

        {/* CLIENT GALLERY */}
        <ImageGallery images={postImages} />
      </div>
    </section>
  );
}
