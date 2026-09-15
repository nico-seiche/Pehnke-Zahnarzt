import { defineField, PatchEvent, type StringInputProps, set, unset } from "sanity";

function ColorInput({ onChange, value }: StringInputProps) {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    const changeSet = newValue ? set(newValue) : unset();
    onChange(PatchEvent.from(changeSet));
  };

  return (
    <input
      type="color"
      value={value || "#000000"}
      onChange={handleChange}
      style={{
        width: "100%",
        height: "40px",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        padding: 0,
        background: "none",
      }}
    />
  );
}

export const appColor = defineField({
  name: "appColor",
  title: "Color",
  description: "Click to select a color.",
  type: "string",
  icon: () => <>🎨</>,
  components: {
    input: ColorInput,
  },
});
