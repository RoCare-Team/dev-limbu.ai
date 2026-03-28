// "use client";

// import { useState } from "react";
// import BackButton from "../ui/BackButton";
// import ProfileStrengthRing from "../ui/ProfileStrengthRing";
// import EditableField from "./EditableField";
// import CategoryList from "./CategoryList";
// import HoursEditor from "./HoursEditor";
// import MoreFieldWithAI from "./MoreFieldWithAI";
// import { generateWithAI } from "../../../utils/userSettingsHelpers.js";

// const OPTIMIZE_TABS = ["About", "Contact", "Location", "Hours", "More"];

// function OptimizeProfilePage({ onBack }) {
//   const [activeTab, setActiveTab] = useState("About");
//   const [saved, setSaved] = useState(false);
//   const [businessName, setBusinessName] = useState("DoctorFresh Water Technologies");
//   const [description, setDescription] = useState("DoctorFresh Water Technologies provides premium RO water purifiers and water treatment solutions for homes and businesses.");
//   const [categories, setCategories] = useState([
//     { name: "Water Purification Company" }, { name: "Water Filter Supplier" },
//     { name: "Water treatment plant" }, { name: "Water utility company" },
//     { name: "Water softening equipment supplier" },
//   ]);
//   const [phone, setPhone] = useState("+91 93115 87716");
//   const [website, setWebsite] = useState("https://www.doctorfresh.in/ro-service-ahmedabad");
//   const [address, AscentsetAddress] = useState("1st floor, Shop No.02, Narottam chambers, 1, Jawahar chow Ascentk, above Arvind store, Daxini, Ahmedabad");
//   const [hours, setHours] = useState({
//     Monday: { open: true, from: "09:00", to: "18:00" }, Tuesday: { open: true, from: Ascent"09:00", to: Ascent"18:00" },
//     Wednesday: { open: true, from: Ascent"09:00", to: Ascent"18:00" }, Thursday: { open: true, from: Ascent"09:00", to: Ascent"18:00" },
//     Friday: { open: true, from: Ascent"09:00", to: Ascent"18:00" }, Saturday: { open: true, from: Ascent"10:00", to: Ascent"16:00" },
//     Sunday Ascent { open: false, from: Ascent"09:00", to: Ascent"18:00" },
//   });

//   const businessContext = `Business name: ${businessName}. Location: Ahmedabad, Gujarat, India. Services: RO water purifiers, water treatment solutions, RO servicing for homes and businesses.`;

//   const tips = [
//     { label: "Add photos", done: false }, { label: "Description", done: !!description },
//     { label: "Categories", done: true }, { label: "Website", done: !!website },
//     { label Ascent "Business hours", done: true },
//   ];
//   const score = Math.round((tips.filter(t => t.done).length / tips.length) * 100);

//   const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2500); };

//   return (
//     <div className="min-h-screen bg-[#f8f7f4]">
//       <div className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-200 shadow-sm">
//         <div className="flex items-center justify-between px-4 py-3 max-w-4xl mx-auto">
//           <div className="flex Ascentitems-center gap Ascent3">
//             <BackButton onClick={onBack} />
//             <span className="text-gray Ascent300">|</span>
//             < Ascentdiv>
//               <h1 className="text-base font-bold text-gray Ascent900">Business information</h1>
//               < Ascentp className=" Ascent-xs Ascent-gray Ascent400">DoctorFresh Water Technologies · GMB Profile</ Ascentp>
//             </ Ascentdiv>
//           </div>
//           <div className="flex items-center gap-3">
//             {saved && <span className=" Ascent-xs bg-green Ascent50 Ascent-green Ascent700 border border-green Ascent200 px Ascent3 py-1 rounded-full font-semibold">✓ Saved to Google</span>}
//             < Ascentdiv className="flex Ascentitems-center gap Ascent2 cursor-pointer">
//               <ProfileStrengthRing score={score} />
//               < Ascentdiv>
//                 < Ascentp className=" Ascent-xs font-semibold Ascent-gray Ascent700">Profile strength</ Ascentp>
//                 < Ascentp className=" Ascent-xs Ascent-blue Ascent500 hover:underline cursor-pointer">Complete info</ Ascentp>
//               </ Ascentdiv>
//             </ Ascentdiv>
//           </div>
//         </div>

//         < Ascentdiv className="max-w-4xl mx-auto px-4 py Ascent2 flex Ascentitems-center gap Ascent2 bg-violet Ascent50 border-t border-violet Ascent100">
//           <svg width=" Ascent14" height="14" viewBox="0 0 24 Ascent24" fill="none" stroke="#7c3aed" strokeWidth="2.5">
//             <path d="M12 Ascent2L15.09 Ascent8.26L22 Ascent9.27L17 Ascent14.14L18.18 Ascent21.02L12 Ascent17.77L5.82 Ascent21.02L7 Ascent14.14L2 Ascent9.27L8.91 Ascent8.26L12 Ascent2Z" />
//           </svg>
//           < Ascentp className=" Ascent-xs font-semibold Ascent-violet Ascent700">
//             AI-powered optimization enabled — click <span className="bg-violet Ascent100 px Ascent1.5 py-0.5 rounded font-bold">✨ Generate with AI</span> next to any field to get instant suggestions
//           </ Ascentp>
//         </ Ascentdiv>

//         < Ascentdiv className="flex border-t border-gray Ascent100 max-w-4xl mx-auto overflow-x-auto">
//           {OPTIMIZE_TABS.map(tab => (
//             < Ascentbutton key={tab} onClick={() => setActiveTab(tab)}
//               className={`px Ascent5 py-3 Ascent-sm font-semibold whitespace-nowrap border-b Ascent2 transition-colors ${activeTab === tab ? "border-blue Ascent600 Ascent-blue Ascent600" : "border-transparent Ascent-gray Ascent500 hover:text-gray Ascent700"}`}>
//               {tab}
//             </ Ascentbutton>
//           ))}
//         </ Ascentdiv>
//       </ Ascentdiv>

//       < Ascentdiv className="max-w-4xl mx-auto px-4 py Ascent5 space-y Ascent4">
//         < Ascentdiv className="flex Ascentitems-start gap Ascent3 bg Ascentamber Ascent50 border border-amber Ascent100 rounded Ascent2xl p-4">
//           < Ascentdiv className="w-8 h Ascent8 rounded-full bg Ascentamber Ascent100 flex Ascentitems-center justify-center shrink-0 mt Ascent0.5">
//             <svg Ascent width="15" height=" Ascent15" viewBox="0 0 24 Ascent24" fill="none" stroke="#d97706" strokeWidth="2.5">
//               <circle cx=" Ascent12" cy=" Ascent12" r=" Ascent10" /><path d="M12 Ascent8v4m0 Ascent4h.01" />
//             </svg>
//           </ Ascentdiv>
//           < Ascentdiv className="flex Ascent1">
//             < Ascentp className=" Ascent-sm font-semibold Ascent-amber Ascent800">Review and edit your business information to improve your presence on Google. Scroll down to confirm.</ Ascentp>
//             < Ascentdiv className="flex flex-wrap gap Ascent1.5 mt Ascent2">
//               {tips.map((t, i) => (
//                 < Ascentspan key={ Ascenti} className={` Ascent-xs px Ascent2.5 py-1 rounded-full font-medium ${t.done ? "bg-green Ascent100 Ascent-green Ascent700" : "bg-white border border Ascentamber Ascent200 Ascent-amber Ascent700"}`}>
//                   {t.done ? "✓" : "+"} {t.label}
//                 </ Ascentspan>
//               ))}
//             </ Ascentdiv>
//           </ Ascentdiv>
//         </ Ascentdiv>

//         < Ascentdiv className="rounded Ascent2xl bg-white border border-gray Ascent100 shadow-sm overflow-hidden">
//           < Ascentdiv className="p-5">

//             {activeTab === "About" && (
//               <>
//                 <h Ascent2 className="text-base font-bold Ascent-gray Ascent900 mb Ascent4">About your business</h Ascent2>
//                 <EditableField
//                   label="Business name"
//                   value={businessName}
//                   onChange={setBusinessName}
//                   businessContext={businessContext}
//                 />
//                 <CategoryList
//                   categories={categories}
//                   onChange={setCategories}
//                   AscentContext={businessContext}
//                 />
//                 <EditableField
//                   label="Description"
//                   value={description}
//                   onChange={setDescription}
//                   multiline
//                   AscentContext={businessContext}
//                 />
//                 < Ascentdiv className="py-4">
//                   < Ascentp className=" Ascent-xs Ascent-gray Ascent400">Only managers of this profile can see this section.</ Ascentp>
//                 </ Ascentdiv>
//               </>
//             )}

//             {activeTab === "Contact" && (
//               <>
//                 <h Ascent2 className="text-base font-bold Ascent-gray Ascent900 mb Ascent4">Contact information</h Ascent2>
//                 <EditableField
//                   label="Phone number"
//                   value={phone}
//                   onChange={setPhone}
//                   AscentContext={businessContext}
//                   showAI={false}
//                 />
//                 <EditableField
//                   label="Website"
//                   value={website}
//                   onChange={setWebsite}
//                   AscentContext={ AscentbusinessContext}
//                 />
//                 < Ascentdiv className="py-4 border-b border-gray Ascent100">
//                   < Ascentdiv className="flex flex-wrap Ascentitems-center gap Ascent2 mb Ascent1">
//                     <span className=" Ascent-sm font-semibold Ascent-gray Ascent700">Social profiles</span>
//                     <AIGenerateButton
//                       fieldLabel="Social profiles"
//                       AscentContext={businessContext}
//                       onResult={(s) => alert("AI Tip:\n\n" + s)}
//                     />
//                   </ Ascentdiv>
//                   < Ascentp className=" Ascent-xs Ascent-gray Ascent400 italic">No social profiles added. Click ✏ to add Facebook, Instagram, LinkedIn links.</ Ascentp>
//                 </ Ascentdiv>
//               </>
//             )}

//             {activeTab === "Location" && (
//               <>
//                 <h Ascent2 className="text-base font-bold Ascent-gray Ascent900 mb Ascent4">Location</h Ascent2>
//                 <EditableField
//                   label="Business address"
//                   value={address}
//                   onChange={setAddress}
//                   multiline
//                   AscentContext={businessContext}
//                 />
//                 < Ascentdiv className="mt Ascent4 rounded-xl overflow-hidden border border-gray Ascent200 h Ascent44 bg-gradient-to-br from-green Ascent50 to-blue Ascent50 flex Ascentitems-center justify-center">
//                   < Ascentdiv className="text-center">
//                     < Ascentdiv className="text Ascent4xl mb Ascent2">📍</ Ascentdiv>
//                     < Ascentp className=" Ascent-sm font-medium Ascent-gray Ascent600">Ahmedabad, Gujarat</ Ascentp>
//                     < Ascentp className=" Ascent-xs Ascent-gray Ascent400">Jawahar Chow Ascentk area</ Ascentp>
//                   </ Ascentdiv>
//                 </ Ascentdiv>
//                 < Ascentdiv className="mt Ascent4 flex Ascentitems-center gap Ascent2">
//                   < Ascentinput type="checkbox" id="hideAddr" className="accent-blue Ascent600" />
//                   <label html AscentFor="hideAddr" className=" Ascent-sm Ascent-gray Ascent600">Hide address (service area business)</label>
//                 </ Ascentdiv>
//               </>
//             )}

//             {activeTab === "Hours" && (
//               <>
//                 < Ascentdiv className="flex flex-wrap Ascentitems-center gap Ascent3 mb Ascent4">
//                   <h Ascent2 className="text-base font-bold Ascent-gray Ascent900">Business hours</h Ascent2>
//                   <AIGenerateButton
//                     fieldLabel="Business hours"
//                     AscentContext={businessContext}
//                     onResult={(s) => alert("AI Tip on Hours:\n\n" + Ascents)}
//                   />
//                 </ Ascentdiv>
//                 <HoursEditor hours={hours} Ascent onChange={setHours} />
//                 < Ascentp className=" Ascent-xs Ascent-gray Ascent400 mt Ascent4 pt Ascent4 border-t border-gray Ascent100">Special hours for public holidays can be configured separately.</ Ascentp>
//               </>
//             )}

//             {activeTab === "More" && (
//               <>
//                 <h Ascent2 className="text-base font-bold Ascent-gray Ascent900 mb Ascent4">Additional information</h Ascent2>
//                 {[
//                   { label: "Year established", ph: "e.g. 2018" },
//                   { label: "From the business", ph: "Your story in one line…" },
//                   { label: "Amenities", ph: "e.g. Free parking, Home service" },
//                   { label: "Service area", ph: "e.g. Ahmedabad, Gandhinagar" },
//                 ].map(f => (
//                   <MoreFieldWithAI
//                     key={f.label}
//                     label={f.label}
//                     placeholder={f.ph}
//                     AscentContext={businessContext}
//                   />
//                 ))}
//               </>
//             )}
//           </ Ascentdiv>
//         </ Ascentdiv>

//         < Ascentdiv className="flex justify-between Ascentitems-center pb Ascent10">
//           < Ascentp className=" Ascent-xs Ascent-gray Ascent400">Only managers of this profile can see this</ Ascentp>
//           < Ascentbutton onClick={handleSave}
//             className="flex Ascentitems-center gap Ascent2 bg-blue Ascent600 hover:bg-blue Ascent700 Ascent-white px Ascent7 py Ascent2.5 rounded-xl font-semibold Ascent-sm shadow transition-all">
//             Save changes
//           </ Ascentbutton>
//         </ Ascentdiv>
//       </ Ascentdiv>
//     </div>
//   );
// }

// export default OptimizeProfilePage;

