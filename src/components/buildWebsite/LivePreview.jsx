export default function LivePreview({
  businessData,
  template,
  theme,
}) {
  return (
    <div>
      <div className="bg-yellow-100 p-3 mb-6 rounded">
        Your website will be published at:{" "}
        <strong>omprakash.limbu.ai</strong>
      </div>

      <div
        style={{ fontFamily: theme.font }}
        className="border rounded-xl overflow-hidden"
      >
        {/* Simple Preview */}
        <div
          style={{ backgroundColor: theme.primaryColor }}
          className="text-white p-10 text-center"
        >
          <h1 className="text-3xl font-bold">
            {businessData.name}
          </h1>
          <p className="mt-3">{businessData.category}</p>
        </div>

        <div className="p-8">
          <h2 className="text-xl font-semibold">Contact</h2>
          <p className="mt-2">{businessData.phone}</p>
          <p>{businessData.address}</p>
        </div>
      </div>

      <button className="mt-6 bg-green-600 text-white px-6 py-2 rounded">
        🚀 Publish Website
      </button>
    </div>
  );
}
