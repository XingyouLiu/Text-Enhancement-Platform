// app/input/layout.js
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function InputLayout({ children }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}