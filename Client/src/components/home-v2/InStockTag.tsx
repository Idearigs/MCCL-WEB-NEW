import React from "react";
import { T } from "./tokens";

/**
 * "In stock" line under the price on Ready to ship product cards (live stock). Same look as the
 * product page's status line. Google Merchant Center checks that the page shows the availability
 * the feed gives, so stock pieces say "In stock" in plain words; made-to-order cards show nothing.
 */
const InStockTag = (): JSX.Element => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 7, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: T.text }}>
    <i aria-hidden="true" style={{ width: 6, height: 6, borderRadius: "50%", background: T.gold, flex: "none" }} />
    In stock
  </div>
);

export default InStockTag;
