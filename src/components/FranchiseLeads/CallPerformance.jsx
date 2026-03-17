
"use client";

export default function CallPerformance() {

const calls = [
  {
    title: "Total Calls Today",
    value: 23,
    bg: "bg-blue-100",
    text: "text-blue-700",
    border: "border-blue-300"
  },
  {
    title: "Vikas nagar",
    value: 12,
    bg: "bg-white",
    text: "text-gray-800",
    border: "border-gray-200"
  },
  {
    title: "Aman",
    value: 11,
    bg: "bg-white",
    text: "text-gray-800",
    border: "border-gray-200"
  }
];

return (

<div className="mt-6">

<h2 className="text-lg font-semibold mb-4">
Call Performance
</h2>

<div className="flex gap-4 flex-wrap">

{calls.map((item,index)=>(

<div
key={index}
className={`px-6 py-4 rounded-xl border shadow-sm min-w-[180px] ${item.bg} ${item.border}`}
>

<p className={`text-sm ${item.text}`}>
{item.title}
</p>

<h3 className={`text-xl font-bold ${item.text}`}>
{item.value}
</h3>

</div>

))}

</div>

</div>

)

}