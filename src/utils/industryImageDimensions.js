/**
 * Industry landing pages apna hero image ek *string prop* ke roop me bhejte hain
 * (`heroImage="/images/category/jim.png"`), isliye static import ka aspect-ratio
 * wala fayda nahi milta — aur `next/image` ko width/height chahiye hi chahiye.
 *
 * Category images ka ratio har page par alag hai (0.79 se 1.57 tak), to ek
 * hardcoded ratio nahi chal sakta — warna `object-contain` letterbox karke
 * layout shift dega. Isliye asli intrinsic dimensions ka lookup yahan hai.
 *
 * Nayi image add karo to yahan entry bhi add karni hai; miss hone par
 * `getImageDimensions` DEFAULT_DIMENSIONS de deta hai (page toot-ta nahi,
 * bas ratio approximate ho jata hai).
 */
const IMAGE_DIMENSIONS = {
  "/images/category/cake.png": { width: 520, height: 600 },
  "/images/category/car.png": { width: 950, height: 916 },
  "/images/category/doctor.png": { width: 1118, height: 1126 },
  "/images/category/education.png": { width: 900, height: 900 },
  "/images/category/handyman.png": { width: 1024, height: 1164 },
  "/images/category/handyman2.png": { width: 635, height: 393 },
  "/images/category/handyman3.png": { width: 443, height: 564 },
  "/images/category/jim.jpg": { width: 5760, height: 3840 },
  "/images/category/jim.png": { width: 2000, height: 1333 },
  "/images/category/pest.png": { width: 698, height: 800 },
  "/images/category/realestate.png": { width: 935, height: 597 },
  "/images/category/restorent.png": { width: 636, height: 800 },
  "/images/category/salon.png": { width: 827, height: 827 },
  "/images/category/tour.png": { width: 800, height: 675 },
  "/images/category/yoga.png": { width: 1082, height: 1162 },
  "/images/bussiness/cake.png": { width: 1024, height: 572 },
  "/images/bussiness/coaching.png": { width: 1024, height: 572 },
  "/images/bussiness/engine.png": { width: 1024, height: 572 },
  "/images/bussiness/gym.png": { width: 1024, height: 572 },
  "/images/bussiness/handman1.png": { width: 1024, height: 572 },
  "/images/bussiness/hospital.png": { width: 1024, height: 572 },
  "/images/bussiness/mannubhai.jpeg": { width: 1024, height: 572 },
  "/images/bussiness/pest.png": { width: 1024, height: 572 },
  "/images/bussiness/real.png": { width: 1024, height: 572 },
  "/images/bussiness/resto.png": { width: 1024, height: 572 },
  "/images/bussiness/salon.png": { width: 1024, height: 572 },
  "/images/bussiness/tour.png": { width: 1024, height: 572 },
  "/images/bussiness/yoga.png": { width: 1024, height: 572 },
};

const DEFAULT_DIMENSIONS = { width: 1024, height: 1024 };

export function getImageDimensions(src, fallback = DEFAULT_DIMENSIONS) {
  if (!src) return fallback;
  // Query string ya leading slash ke bina diye gaye path dono handle ho jayein.
  const clean = src.split("?")[0];
  return (
    IMAGE_DIMENSIONS[clean] ||
    IMAGE_DIMENSIONS[clean.startsWith("/") ? clean : `/${clean}`] ||
    fallback
  );
}

export default IMAGE_DIMENSIONS;
