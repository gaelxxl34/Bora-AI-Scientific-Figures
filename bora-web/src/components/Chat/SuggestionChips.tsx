// SuggestionChips: Quick-start prompt suggestions for empty chat
// TODO: Make suggestions clickable to auto-fill ChatInput

const suggestions = [
  "Draw the cGAS-STING pathway",
  "Create a cell apoptosis diagram",
  "Show CRISPR-Cas9 gene editing",
  "Illustrate the JAK-STAT signaling cascade",
];

export function SuggestionChips() {
  return (
    <div className="space-y-2">
      <p className="text-xs text-slate">Try one of these:</p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <button
            key={s}
            className="text-xs bg-bora-blue-light text-bora-blue px-3 py-1.5 rounded-full hover:bg-bora-blue hover:text-white transition-colors"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
