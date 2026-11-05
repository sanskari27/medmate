import { matchRx } from "@/screens/Orders/components/matchRx";
import { OrderDetail } from "@/screens/Orders/components/OrderDetail";

export { matchRx, OrderDetail };
import { useState } from "react";
import { usePharma } from "@/store/slices/session";
import { inr, computeInvoice, timeAgo, PAY_LABEL, Sale } from "@/utils";
import { StatusPill, ChannelPill } from "@/components/bits";
import {
  IconSearch,
  IconPrint,
  IconRx,
  IconClock,
  IconShare,
  IconCash,
  IconGlobe,
  IconStore,
  IconBolt,
  IconBox,
  IconTruck,
  IconInbox,
} from "@/components/Icon";
import ShareSheet from "@/components/ShareSheet";
import PackOrder from "@/screens/Orders/components/PackOrder";

type Filter = "all" | "online" | "offline" | "action" | "unpaid";

export default function OrdersScreen() {
  const { sales, prescriptions, profile, advanceOrder, cancelOrder, markPaid, now, go } =
    usePharma();
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [view, setView] = useState<Sale | null>(null);
  const [viewTab, setViewTab] = useState<"history" | "invoice">("history");
  const [shareSale, setShareSale] = useState<Sale | null>(null);
  const [packId, setPackId] = useState<string | null>(null);
  const openOrder = (s: Sale, tab: "history" | "invoice" = "history") => {
    setViewTab(tab);
    setView(s);
  };

  const total = (s: Sale) => computeInvoice(s.items, s.discount).payable;

  const list = [...sales]
    .sort((a, b) => b.createdAt - a.createdAt)
    .filter((s) => {
      if (filter === "online" && s.channel !== "online") return false;
      if (filter === "offline" && s.channel !== "offline") return false;
      if (
        filter === "action" &&
        !(
          s.channel === "online" &&
          (s.status === "new" || s.status === "accepted" || s.status === "packed")
        )
      )
        return false;
      if (filter === "unpaid" && !(s.paid === false && s.status !== "cancelled")) return false;
      if (
        q &&
        !`${s.id} ${s.customer.name} ${s.customer.phone ?? ""}`
          .toLowerCase()
          .includes(q.toLowerCase())
      )
        return false;
      return true;
    });

  const counts = {
    all: sales.length,
    online: sales.filter((s) => s.channel === "online").length,
    offline: sales.filter((s) => s.channel === "offline").length,
    action: sales.filter(
      (s) => s.channel === "online" && ["new", "accepted", "packed"].includes(s.status),
    ).length,
    unpaid: sales.filter((s) => s.paid === false && s.status !== "cancelled").length,
  };

  return (
    <div className="pd-canvas-wide">
      <div className="pd-toolbar">
        <div className="pd-seg">
          {(["all", "online", "offline", "action", "unpaid"] as Filter[]).map((f) => (
            <button key={f} className={filter === f ? "on" : ""} onClick={() => setFilter(f)}>
              {f === "all" ? (
                "All"
              ) : f === "online" ? (
                <>
                  <IconGlobe size={13} /> Online
                </>
              ) : f === "offline" ? (
                <>
                  <IconStore size={13} /> Counter
                </>
              ) : f === "action" ? (
                <>
                  <IconBolt size={13} /> Needs action
                </>
              ) : (
                <>
                  <IconCash size={13} /> Unpaid
                </>
              )}{" "}
              ({counts[f]})
            </button>
          ))}
        </div>
        <div className="pd-spacer" />
        <div className="pd-search-inline">
          <span className="ic">
            <IconSearch size={17} />
          </span>
          <input
            placeholder="Search invoice, customer, phone…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      <div className="pd-card">
        <div className="pd-tbl-wrap">
          <table className="pd-tbl">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Channel</th>
                <th>Payment</th>
                <th>Status</th>
                <th className="num">Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.map((s) => {
                return (
                  <tr key={s.id} style={{ cursor: "pointer" }} onClick={() => openOrder(s)}>
                    <td className="pd-mono" style={{ fontWeight: 700 }}>
                      {s.id}
                      {s.rx && (
                        <span className="pd-tag rx" style={{ marginLeft: 6 }}>
                          <IconRx size={11} /> Rx
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{s.customer.name}</div>
                      <div style={{ fontSize: 11.5, color: "var(--muted)" }}>
                        {timeAgo(s.createdAt, now)}
                        {s.customer.phone ? ` · ${s.customer.phone}` : ""}
                      </div>
                    </td>
                    <td>
                      {s.items.reduce((a, i) => a + i.qty, 0)} units
                      <div
                        style={{
                          fontSize: 11.5,
                          color: "var(--muted)",
                          maxWidth: 200,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {s.items.map((i) => i.name).join(", ")}
                      </div>
                    </td>
                    <td>
                      <ChannelPill channel={s.channel} />
                    </td>
                    <td>
                      {s.paid === false ? (
                        <span className="pd-pill pill-rose">
                          <i className="d" />
                          Unpaid
                        </span>
                      ) : (
                        PAY_LABEL[s.payMode]
                      )}
                    </td>
                    <td>
                      <StatusPill status={s.status} />
                    </td>
                    <td className="num" style={{ fontWeight: 800 }}>
                      {inr(total(s))}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="pd-flex pd-gap6" style={{ justifyContent: "flex-end" }}>
                        {s.paid === false && (
                          <button
                            className="pd-btn pd-btn-sm pd-btn-gold"
                            onClick={() => markPaid(s.id, s.payMode)}
                          >
                            <IconCash size={14} /> Mark paid
                          </button>
                        )}
                        {s.channel === "online" && s.status === "new" && (
                          <>
                            <button
                              className="pd-btn pd-btn-sm pd-btn-primary"
                              onClick={() => advanceOrder(s.id)}
                            >
                              Accept
                            </button>
                            <button
                              className="pd-btn pd-btn-sm pd-btn-rose"
                              onClick={() => cancelOrder(s.id)}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {s.channel === "online" && s.status === "accepted" && (
                          <button
                            className="pd-btn pd-btn-sm pd-btn-primary"
                            onClick={() => setPackId(s.id)}
                          >
                            <IconBox size={14} /> Pack order
                          </button>
                        )}
                        {s.channel === "online" && s.status === "packed" && (
                          <button
                            className="pd-btn pd-btn-sm pd-btn-primary"
                            onClick={() => setPackId(s.id)}
                          >
                            <IconTruck size={14} /> Hand to delivery
                          </button>
                        )}
                        {s.channel === "online" && s.status === "out" && (
                          <button
                            className="pd-btn pd-btn-sm pd-btn-gold"
                            onClick={() => advanceOrder(s.id)}
                          >
                            Mark delivered
                          </button>
                        )}
                        <button
                          className="pd-btn pd-btn-ghost pd-btn-sm"
                          title="View order history"
                          onClick={() => openOrder(s, "history")}
                        >
                          <IconClock size={14} /> History
                        </button>
                        <button
                          className="pd-iconbtn"
                          title="Share bill"
                          onClick={() => setShareSale(s)}
                        >
                          <IconShare size={16} />
                        </button>
                        <button
                          className="pd-iconbtn"
                          title="View &amp; print invoice"
                          onClick={() => openOrder(s, "invoice")}
                        >
                          <IconPrint size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {list.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <div className="pd-empty">
                      <div className="em">
                        <IconInbox size={28} />
                      </div>
                      <p>No orders in this view.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {view && (
        <OrderDetail
          key={view.id + viewTab}
          initialTab={viewTab}
          sale={sales.find((x) => x.id === view.id) ?? view}
          rx={
            prescriptions.find(
              (r) => r.id === (sales.find((x) => x.id === view.id) ?? view).rxId,
            ) ?? matchRx(prescriptions, view)
          }
          profile={profile}
          onClose={() => setView(null)}
          onAdvance={() => advanceOrder(view.id)}
          onCancel={() => cancelOrder(view.id)}
          onMarkPaid={(m) => markPaid(view.id, m)}
          onShare={() => setShareSale(view)}
          onOpenRx={() => {
            setView(null);
            go("prescriptions");
          }}
          onPack={() => {
            setView(null);
            setPackId(view.id);
          }}
          now={now}
        />
      )}

      {packId && <PackOrder saleId={packId} onClose={() => setPackId(null)} />}
      {shareSale && (
        <ShareSheet
          sale={sales.find((x) => x.id === shareSale.id) ?? shareSale}
          profile={profile}
          onClose={() => setShareSale(null)}
        />
      )}
    </div>
  );
}

// link an order to a prescription by rxId, else best-effort by customer name
