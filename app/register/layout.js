// app/register/layout.js
import Header from "@/components/Header";

export default function RegisterLayout({ children }) {
  return (
    <>
      <Header />
      <main>{children}</main>
    </>
  );
}
