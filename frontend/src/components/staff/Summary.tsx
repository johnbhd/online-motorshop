export type SummaryItem = [value: string, label: string, detail: string];

type SummaryProps = {
  items: SummaryItem[];
};

export default function Summary({ items }: SummaryProps) {
  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map(([value, label, detail]) => (
        <article
          key={label}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-start justify-between">
            <p className="text-3xl font-bold text-[#0B1930]">{value}</p>
            <FontAwesomeIcon icon={/payment/i.test(label) ? faCreditCard : /customer/i.test(label) ? faUsers : /review/i.test(label) ? faStar : /product/i.test(label) ? faBoxOpen : /delivery|pickup/i.test(label) ? faTruck : /order/i.test(label) ? faClipboardList : faChartColumn} className="text-orange-500" aria-hidden="true" />
          </div>
          <h2 className="mt-1 font-semibold text-[#0B1930]">{label}</h2>
          <p className="mt-1 text-sm text-slate-500">{detail}</p>
        </article>
      ))}
    </section>
  );
}
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBoxOpen, faChartColumn, faClipboardList, faCreditCard, faStar, faTruck, faUsers } from "@fortawesome/free-solid-svg-icons";
