// app/login/layout.js
import Header from "@/components/Header";

export default function LoginLayout({ children }) {
  return (
    <>
      <Header />
      <main>{children}</main>
    </>
  );
}
