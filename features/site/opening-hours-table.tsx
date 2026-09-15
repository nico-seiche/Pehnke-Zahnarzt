import { Badge } from "~/components/badge";
import { findTodayIndex } from "~/features/site/opening-hours";
import { cx } from "~/features/style/utils";

export type OpeningHoursRow = {
  day?: string | null;
  hours?: string | null;
};

export function OpeningHoursTable({
  rows,
  note,
  className,
}: {
  rows: OpeningHoursRow[] | null | undefined;
  note?: string | null;
  className?: string;
}) {
  if (!rows?.length) {
    return null;
  }

  const todayIndex = findTodayIndex(rows);

  return (
    <div className={cx("flex flex-col gap-12", className)}>
      <table className="w-full border-collapse font-sans text-small">
        <tbody>
          {rows.map((row, i) => {
            const today = i === todayIndex;

            return (
              <tr key={row.day} className={today ? "bg-surface-tint" : undefined}>
                <th
                  scope="row"
                  className={cx(
                    "border-border-subtle border-b px-16 py-12 text-left font-medium text-text-heading",
                    today && "rounded-l-sm font-semibold"
                  )}
                >
                  {row.day}
                  {today && (
                    <Badge tone="success" className="ml-12">
                      heute
                    </Badge>
                  )}
                </th>
                <td
                  className={cx(
                    "whitespace-nowrap border-border-subtle border-b px-16 py-12 text-right tabular-nums",
                    row.hours ? "text-text-body" : "text-text-subtle",
                    today && "rounded-r-sm"
                  )}
                >
                  {row.hours || "geschlossen"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {note && <p className="font-sans text-caption text-text-muted">{note}</p>}
    </div>
  );
}
