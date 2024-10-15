// app/buy-tokens/layout.js
import Header from "@/components/Header";

export default function BuyTokensLayout({ children }) {
  return (
    <>
      <Header />
      <main>{children}</main>
    </>
  );
}
