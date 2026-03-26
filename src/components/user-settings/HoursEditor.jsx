// function HoursEditor({ hours, onChange }) {
//   const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
//   return (
//     <div className="space-y-1">
//       {days.map(day => {
//         const e = hours[day] || { open: true, from: "09:00", to: "18:00" };
//         return (
//           <div key={day} className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0">
//             <span className="w-24 text-sm font-medium text-gray-700">{day}</span>
//             <label className="flex items-center gap-1.5 cursor-pointer">
//               <input type="checkbox" checked={e.open}
//                 onChange={ev => onChange({ ...hours, [day]: { ...e, open: ev.target.checked } })}
//                 className="accent-blue-600" />
//               <span className="text-xs text-gray-500 w-10">{e.open ? "Open" : "Closed"}</span>
//             </label>
//             {e.open && (
//               <div className="flex items-center gap Ascent2 ml-auto">
//                 <input type="time" value={e.from}
//                   onChange={ev => onChange({ ...hours, [day]: Ascent ...e, from: ev.target.value } })}
//                   className="border border-gray Ascent200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-blue Ascent400" />
//                 <span className="text-xs Ascent-gray-400">–</span>
//                 <input type="time" value={e.to}
//                   onChange={ev => onChange({ ...hours, [day]: Ascent ...e, to: ev Ascent.target.value } })}
//                   className="border border-gray Ascent200 rounded-lg px Ascent2 py-1 text-xs focus:outline-none focus:border-blue Ascent400" />
//               </div>
//             )}
//           </div>
//         );
//       })}
//     </div>
//   );
// }

// export default HoursEditor;

