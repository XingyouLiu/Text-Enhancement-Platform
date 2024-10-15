// app/input/layout.js
import Header from "@/components/Header";

export default function InputLayout({ children }) {
  return (
    <>
      <Header />
      <main>{children}</main>
    </>
  );
}
