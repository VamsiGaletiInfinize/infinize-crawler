'use client';

interface OutputFormatSelectorProps {
    selected: string[];
    onChange: (formats: string[]) => void;
    disabled?: boolean;
}

const formats = [
    {
        id: 'markdown',
        label: 'Markdown',
        description: 'Single consolidated .md file',
    },
    {
        id: 'json',
        label: 'JSON',
        description: 'Structured data per page',
    },
    {
        id: 'html',
        label: 'HTML',
        description: 'Styled report per page',
    },
    {
        id: 'links',
        label: 'Links',
        description: 'Aggregated link inventory',
    },
];

export default function OutputFormatSelector({
    selected,
    onChange,
    disabled,
}: OutputFormatSelectorProps) {
    const handleToggle = (formatId: string) => {
        if (disabled) return;

        if (selected.includes(formatId)) {
            // Don't allow deselecting if it's the only one
            if (selected.length > 1) {
                onChange(selected.filter((f) => f !== formatId));
            }
        } else {
            onChange([...selected, formatId]);
        }
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
                Output Formats
            </label>
            <div className="grid grid-cols-2 gap-3">
                {formats.map((format) => (
                    <label
                        key={format.id}
                        className={`flex items-start p-4 border rounded-lg cursor-pointer
                                  transition-all duration-200
                                  ${
                                      selected.includes(format.id)
                                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                  }
                                  ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <input
                            type="checkbox"
                            checked={selected.includes(format.id)}
                            onChange={() => handleToggle(format.id)}
                            disabled={disabled}
                            className="mt-1 h-4 w-4 text-blue-600 rounded
                                     focus:ring-blue-500 border-gray-300"
                        />
                        <div className="ml-3">
                            <p className="font-medium text-gray-900">{format.label}</p>
                            <p className="text-sm text-gray-500">{format.description}</p>
                        </div>
                    </label>
                ))}
            </div>
        </div>
    );
}
