/**
 * Server component – renders one or more JSON-LD <script> tags.
 * Pass an array of schema objects; each becomes its own <script> block.
 */
export default function SchemaMarkup({ schemas = [] }) {
  if (!schemas.length) return null;
  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
