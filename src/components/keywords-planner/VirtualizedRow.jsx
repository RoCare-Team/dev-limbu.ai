import React from "react";
import KeywordSuggestionRow from "./KeywordSuggestionRow";

const VirtualizedRow = React.memo(({ index, style, suggestions, savedKeywordsSet, isSaving, addKeyword }) => {
  const item = suggestions[index];
  if (!item) return null;
  return (
    <KeywordSuggestionRow
      style={style}
      item={item}
      isAdded={savedKeywordsSet.has(item.keyword)}
      isSaving={isSaving}
      onAdd={addKeyword}
    />
  );
});

VirtualizedRow.displayName = "VirtualizedRow";
export default VirtualizedRow;
